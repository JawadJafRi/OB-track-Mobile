import { getTokens, saveTokens, clearTokens } from '../auth/tokenStorage';
import { BASE_URL } from '../config/api';

// Point 7: something else (AuthContext) sets this callback once, at app startup.
// The client calls it when refresh genuinely fails — it doesn't navigate itself.
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

// Point 5: shared in-flight refresh promise, so concurrent 401s don't each
// trigger their own refresh call.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  // If a refresh is already happening, piggyback on it instead of starting a new one.
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const tokens = await getTokens();

    if (!tokens) {
      return null;
    }

    try {
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        // Refresh token invalid/expired/reused — session is truly over.
        await clearTokens();
        onSessionExpired?.();
        return null;
      }

      // Point: token rotation — always save the NEW pair, discard the old one.
      await saveTokens({
        accessToken: json.data.accessToken,
        refreshToken: json.data.refreshToken,
      });

      return json.data.accessToken as string;
    } catch {
      await clearTokens();
      onSessionExpired?.();
      return null;
    }
  })();

  const result = await refreshPromise;
  refreshPromise = null; // clear so future 401s can trigger a fresh refresh
  return result;
}

/**
 * Parse a JSON body without letting a non-JSON response explode.
 *
 * Behind nginx a 502 or a gateway timeout arrives as an HTML page; calling
 * .json() on that throws a SyntaxError that no caller is prepared for. Returning
 * an empty envelope instead lets the normal !response.ok path report the real
 * status code.
 */
async function readJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return { success: false, message: `Server error (${response.status}).` };
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  requiresAuth?: boolean;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, requiresAuth = true } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const tokens = await getTokens();
    if (tokens) {
      headers.Authorization = `Bearer ${tokens.accessToken}`;
    }
  }

  const doFetch = () =>
    fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

  let response = await doFetch();
  let json = await readJson(response);

  // Point 4: detect 401, attempt refresh, then retry ONCE.
  if (response.status === 401 && requiresAuth) {
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      // Refresh failed — onSessionExpired already fired inside refreshAccessToken.
      throw new ApiError(json.message ?? 'Session expired', 401);
    }

    headers.Authorization = `Bearer ${newAccessToken}`;
    response = await doFetch();
    json = await readJson(response);
  }

  if (!response.ok || !json.success) {
    throw new ApiError(json.message ?? 'Request failed', response.status);
  }

  // Point 3: unwrap the envelope — callers just get their actual data.
  return json.data as T;
}

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string | string[], statusCode: number) {
    super(Array.isArray(message) ? message.join(', ') : message);
    this.statusCode = statusCode;
  }
}