import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

import type { LocationBatchItem, LocationFix } from '../api/types';
import { uuidv4 } from '../utils/uuid';

/**
 * GPS access for task tracking.
 *
 * The backend requires a real fix to start or end a task (LocationPointDto has
 * no optional fields), so a refused permission has to surface as a clear error
 * rather than a silent (0, 0) — the whole point of the product is the distance
 * figure, and a fabricated coordinate would quietly corrupt it.
 */

export class LocationError extends Error {}

let configured = false;

function configure() {
  if (configured) {
    return;
  }
  Geolocation.setRNConfiguration({
    skipPermissionRequests: false,
    authorizationLevel: 'whenInUse',
    locationProvider: 'auto',
  });
  configured = true;
}

export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'Location permission',
      message:
        'OB Track records the route you take during a task, so your distance ' +
        'and time are logged accurately.',
      buttonPositive: 'Allow',
      buttonNegative: 'Not now',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

type FixOptions = {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
};

function requestFix(options: FixOptions): Promise<LocationFix> {
  configure();

  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          recordedAt: new Date(position.timestamp).toISOString(),
        });
      },
      error => {
        reject(new LocationError(error.message || 'Could not get a GPS fix.'));
      },
      options,
    );
  });
}

/**
 * A single fix, in the shape start/end expect.
 *
 * Tries satellite accuracy first, then falls back to the network provider. The
 * fallback is the difference between a usable app and an unusable one: a task
 * almost always starts indoors, where a high-accuracy lock can take minutes or
 * never arrive, and refusing to start the task at all is far worse than
 * recording a start point that is accurate to a few hundred metres. The end fix
 * is what the distance is measured to, and by then the office boy is usually
 * outside.
 */
export async function getCurrentFix(timeoutMs = 15000): Promise<LocationFix> {
  try {
    return await requestFix({
      enableHighAccuracy: true,
      timeout: timeoutMs,
      maximumAge: 10000,
    });
  } catch {
    try {
      return await requestFix({
        enableHighAccuracy: false,
        timeout: 15000,
        // Accept a recent cached fix — indoors, this is usually the only one
        // the OS has.
        maximumAge: 120000,
      });
    } catch {
      throw new LocationError(
        'Could not get your location. Check that Location is switched on, ' +
          'then try again — moving near a window or outside helps.',
      );
    }
  }
}

/**
 * Streams fixes while a task runs. Returns an unsubscribe function.
 *
 * Each point gets its own clientId up front so a batch that fails to upload can
 * be retried later without the server counting it twice.
 */
export function watchPosition(
  onPoint: (point: LocationBatchItem) => void,
  onError?: (error: Error) => void,
): () => void {
  configure();

  const watchId = Geolocation.watchPosition(
    position => {
      onPoint({
        clientId: uuidv4(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        recordedAt: new Date(position.timestamp).toISOString(),
        accuracyMeters: position.coords.accuracy ?? undefined,
        altitudeMeters: position.coords.altitude ?? undefined,
        speedMetersPerSecond:
          position.coords.speed != null && position.coords.speed >= 0
            ? position.coords.speed
            : undefined,
        headingDegrees:
          position.coords.heading != null && position.coords.heading >= 0
            ? position.coords.heading
            : undefined,
      });
    },
    error => {
      onError?.(new LocationError(error.message || 'Lost GPS signal.'));
    },
    {
      enableHighAccuracy: true,
      distanceFilter: 10, // metres — matches the server's ~10s cadence assumption
      interval: 10000,
      fastestInterval: 5000,
    },
  );

  return () => Geolocation.clearWatch(watchId);
}
