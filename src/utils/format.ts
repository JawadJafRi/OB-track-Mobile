/**
 * Presentation helpers for the values the API returns in base units.
 *
 * The server speaks metres and seconds; the UI speaks "12.4 km" and "4h 20m".
 * Keeping the conversion here means the two never drift between screens.
 */

export function formatDistance(meters: number | null | undefined): string {
  if (!meters || meters < 0) {
    return '0 km';
  }
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds || seconds < 0) {
    return '0m';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  // Under a minute, show seconds rather than flooring to "0m" — a short errand
  // that reads as zero time looks like the tracking simply failed.
  if (hours === 0 && minutes === 0) {
    return `${Math.floor(seconds)}s`;
  }

  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}

/** HH:MM:SS, for the live timer on the active-task screen. */
export function formatElapsed(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;

  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':');
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) {
    return '--:--';
  }
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }
  return new Date(iso).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * "10:12 AM - 10:47 AM (35 min)" — the subtitle on a task card. Falls back
 * gracefully for tasks that never started or are still running.
 */
export function formatTimeRange(
  startedAt: string | null,
  endedAt: string | null,
  durationSeconds: number | null,
): string {
  if (!startedAt) {
    return 'Not started';
  }
  if (!endedAt) {
    return `Started ${formatTime(startedAt)}`;
  }

  const span = durationSeconds ? ` (${formatDuration(durationSeconds)})` : '';
  return `${formatTime(startedAt)} - ${formatTime(endedAt)}${span}`;
}

export function greetingFor(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) {
    return 'Good Morning';
  }
  if (hour < 17) {
    return 'Good Afternoon';
  }
  return 'Good Evening';
}

/** "Bilal Ahmed" -> "Bilal", for greetings. */
export function firstName(name: string | null | undefined): string {
  if (!name) {
    return 'there';
  }
  return name.trim().split(/\s+/)[0];
}

export function formatCurrency(amount: number | null | undefined): string {
  const value = amount ?? 0;
  return `PKR ${value.toLocaleString(undefined, {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/** PENDING -> "Pending", IN_PROGRESS -> "In progress". */
export function statusLabel(status: string): string {
  const words = status.toLowerCase().split('_');
  return words
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}

/** Seconds elapsed since an ISO timestamp, floored at zero. */
export function secondsSince(iso: string | null | undefined): number {
  if (!iso) {
    return 0;
  }
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
}

/** "Thursday, 11 September" — the date line in the red header. */
export function todayLabel(date = new Date()): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/** "10:12" — 24h clock, for the "Started" stat. */
export function formatClock(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Bare number with thousands separators — the wrap-up screen renders the
 * currency label separately, so it must not be baked into the value.
 */
export function formatAmount(value: number): string {
  return Math.abs(value).toLocaleString('en-PK', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Short status word for the history rows.
 *
 * The canvas uses "Done" / "Cancelled" rather than the full enum name: the
 * status sits in a narrow right-hand column beside the duration, and a long
 * word like "COMPLETED" steals enough width to truncate the task title.
 */
export function shortStatus(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'Done';
    case 'IN_PROGRESS':
      return 'Running';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return 'Pending';
  }
}
