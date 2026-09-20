package com.myapp.location

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * The JS handle on [TaskTrackingService].
 *
 * Start it when a task begins, stop it when the task ends or is cancelled. Both
 * calls resolve rather than reject on failure: losing the foreground service
 * degrades tracking to foreground-only, which is how the app behaved before it
 * existed — bad, but not a reason to fail the office boy's "End task" and
 * strand a real errand with no settlement.
 */
class TaskTrackingModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName() = NAME

  companion object {
    const val NAME = "TaskTracking"
  }

  @ReactMethod
  fun start(taskLabel: String?, promise: Promise) {
    try {
      TaskTrackingService.start(reactContext, taskLabel)
      promise.resolve(true)
    } catch (error: Exception) {
      // Most likely cause: location permission was revoked between the task
      // starting and this call, which makes a `location`-typed foreground
      // service illegal to start on Android 14+.
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun stop(promise: Promise) {
    try {
      TaskTrackingService.stop(reactContext)
      promise.resolve(true)
    } catch (error: Exception) {
      promise.resolve(false)
    }
  }
}
