package com.myapp.location

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import com.myapp.MainActivity
import com.myapp.R

/**
 * Keeps the app tracking while a task is running and the phone is in a pocket.
 *
 * ## Why this exists
 *
 * Location was collected from JavaScript with `watchPosition` and nothing else.
 * That works only while the app is on screen: Android 10+ throttles background
 * location for an app with no foreground service to a few updates an hour, and
 * from Android 12 the process itself is frozen once it is cached. The device's
 * own battery stats said it plainly after a real walk —
 *
 *     FgGpsTime = 100883 ms ; BgGpsTime = 0 ms
 *
 * — a hundred seconds of GPS while the screen was on, and not one millisecond
 * after it went dark. An errand-tracking app that only tracks while you stare
 * at it does not track.
 *
 * A foreground service fixes both halves: the process stays out of the cached
 * (freezable) state, so the JS thread keeps running and `watchPosition` keeps
 * delivering, and the `location` service type exempts it from the background
 * location throttle. The persistent notification is not a side effect to be
 * hidden — it is the deal Android offers, and it is also honest: someone whose
 * route is being recorded should be able to see that it is happening.
 *
 * ## What it deliberately does NOT do
 *
 * It does not read location itself. One component owning the GPS subscription
 * (the JS layer, which already buffers, batches, retries and de-duplicates by
 * `clientId`) is far simpler than two, and a native reader would have to
 * reimplement all of that to hand points back across the bridge. This service
 * exists solely to keep the process alive and location-eligible.
 */
class TaskTrackingService : Service() {

  companion object {
    const val ACTION_START = "com.myapp.location.START_TRACKING"
    const val ACTION_STOP = "com.myapp.location.STOP_TRACKING"
    const val EXTRA_TASK_LABEL = "taskLabel"

    private const val CHANNEL_ID = "task_tracking"
    private const val NOTIFICATION_ID = 4711

    fun start(context: Context, taskLabel: String?) {
      val intent = Intent(context, TaskTrackingService::class.java).apply {
        action = ACTION_START
        putExtra(EXTRA_TASK_LABEL, taskLabel)
      }
      // startForegroundService requires the service to call startForeground()
      // within ~5 seconds or Android kills the process with an ANR-style crash.
      // onStartCommand does it as its first act, before any other work.
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
    }

    fun stop(context: Context) {
      context.startService(
        Intent(context, TaskTrackingService::class.java).apply { action = ACTION_STOP },
      )
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopForeground(STOP_FOREGROUND_REMOVE)
      stopSelf()
      return START_NOT_STICKY
    }

    val label = intent?.getStringExtra(EXTRA_TASK_LABEL)
    startForegroundCompat(buildNotification(label))

    // START_STICKY so Android brings the service back if it reclaims memory
    // mid-errand. The JS layer re-subscribes on its own when the app resumes;
    // this only ensures the process is not left silently dead.
    return START_STICKY
  }

  private fun startForegroundCompat(notification: Notification) {
    // From Android 10 a foreground service must declare its type, and from
    // Android 14 the type is enforced against the manifest and the runtime
    // permission. This app targets 36, so the typed overload is the only one
    // that will start.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION,
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun buildNotification(taskLabel: String?): Notification {
    createChannel()

    // Tapping the notification returns to the running task rather than opening
    // a second copy of the app — MainActivity is singleTask, so this resumes
    // the existing instance.
    val contentIntent = PendingIntent.getActivity(
      this,
      0,
      Intent(this, MainActivity::class.java).apply {
        flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_NEW_TASK
      },
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )

    val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      Notification.Builder(this, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(this)
    }

    return builder
      .setContentTitle("Task in progress")
      .setContentText(
        taskLabel?.takeIf { it.isNotBlank() }?.let { "Recording your route — $it" }
          ?: "Recording your route and time.",
      )
      .setSmallIcon(R.mipmap.ic_launcher)
      .setContentIntent(contentIntent)
      .setOngoing(true)
      .build()
  }

  private fun createChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return

    // LOW: the notification has to exist, but it should not make a sound or
    // peek every time an errand starts.
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Task tracking",
      NotificationManager.IMPORTANCE_LOW,
    ).apply {
      description = "Shown while a task is recording your route."
      setShowBadge(false)
    }
    manager.createNotificationChannel(channel)
  }
}
