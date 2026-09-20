import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

/**
 * Keeps location tracking alive while the phone is pocketed.
 *
 * `watchPosition` alone only runs while the app is on screen: Android throttles
 * background location for an app with no foreground service, and freezes the
 * process once it is cached. Starting this service for the duration of a task
 * is what lets an office boy put the phone away and still have a route at the
 * end of the errand.
 *
 * Every function here is best-effort and never throws. Losing the service
 * degrades tracking to foreground-only — which is exactly how the app behaved
 * before it existed. That is worth a warning, not a failed errand.
 */

type TaskTrackingNative = {
  start(taskLabel: string | null): Promise<boolean>;
  stop(): Promise<boolean>;
};

const native: TaskTrackingNative | undefined = (
  NativeModules as { TaskTracking?: TaskTrackingNative }
).TaskTracking;

/**
 * Asks for notification permission (Android 13+).
 *
 * Deliberately not gating the service on the answer: a denied notification
 * permission means Android hides the notification, not that the service is
 * refused. Tracking still works, so a "no" must not stop the task.
 */
async function requestNotificationPermission(): Promise<void> {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return;
  }
  try {
    await PermissionsAndroid.request(
      'android.permission.POST_NOTIFICATIONS' as never,
    );
  } catch {
    // Ignored on purpose — see the note above.
  }
}

/** Starts the tracking service. Resolves false if it could not be started. */
export async function startTracking(taskLabel?: string | null): Promise<boolean> {
  if (Platform.OS !== 'android' || !native) {
    return false;
  }
  await requestNotificationPermission();
  try {
    return await native.start(taskLabel ?? null);
  } catch {
    return false;
  }
}

/** Stops the tracking service. Safe to call when it was never started. */
export async function stopTracking(): Promise<void> {
  if (Platform.OS !== 'android' || !native) {
    return;
  }
  try {
    await native.stop();
  } catch {
    // Nothing useful to do: the service stops with the process anyway.
  }
}
