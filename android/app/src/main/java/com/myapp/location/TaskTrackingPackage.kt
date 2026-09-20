package com.myapp.location

import android.view.View
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ReactShadowNode
import com.facebook.react.uimanager.ViewManager

/** Registers [TaskTrackingModule]. Wired up manually in MainApplication. */
class TaskTrackingPackage : ReactPackage {

  override fun createNativeModules(
    reactContext: ReactApplicationContext,
  ): List<NativeModule> = listOf(TaskTrackingModule(reactContext))

  override fun createViewManagers(
    reactContext: ReactApplicationContext,
  ): List<ViewManager<View, ReactShadowNode<*>>> = emptyList()
}
