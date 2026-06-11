/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package koalaui.arkoala

import koalaui.interop.*

import arkui.component.common.ClickEvent
import arkui.component.common.ClickEventInternal
import arkui.component.idlize.ArkRoutedPagePeer
import arkui.component.idlize.EventEmulator
import arkui.component.idlize.StageExtender

typealias UserViewFactory = (appUrl: String) -> UserView

enum class EventType(val value: Int) {
    Click(0),
    Text(1),
    ExitApp(2),
    StartLog(3),
    StopLog(4),
    GetLog(5),
    SyncNeeded(6),
}

val TEST_LOG_NUMBER: Int = 4

class Application(
    private val userView: UserView,
    private val appParams: String,
    private val useNativeLog: Boolean,
): UserApplicationControl {
    companion object {
        private var _userViewFactory: UserViewFactory = { appUrl ->
            error("No UserView factory, use Application.setUserViewFactory to set")
        }
        fun setUserViewFactory(factory: UserViewFactory) {
            _userViewFactory = factory
        }

        fun create(appUrl: String, params: String, useNativeLog: Boolean): Application {
            registerSyncCallbackProcessor()
            val userView = Application._userViewFactory(appUrl)
            val app = Application(userView, params, useNativeLog)
            userView.provideControl(app)
            return app
        }

        private fun registerSyncCallbackProcessor(): Unit {
            wrapSystemApiHandlerCallback()
            registerArkuiApiHandler()
        }

        private fun createMemoRootState(builder: UserViewBuilder): PeerNode {
            val page = ArkRoutedPagePeer.create(null)
            val appView = builder()
            page.peer.addChild(appView.getPeer().peer)
            StageExtender.PushPage(page.getPeerPtr())
            return page
        }
    }

    private var rootState: PeerNode? = null
    private var rootPointer: pointer = nullptr
    private var exitApp: Boolean = false
    private var useOwnLoop: Boolean = false
    private var withLog: Boolean = false

    fun start(loopIterations: Int): pointer {
        startNativeLog()
        try {
            val builder = userView.getBuilder()
            rootState = createMemoRootState(builder)
            rootPointer = rootState!!.peer.ptr
        }
        catch (error: Exception) {
            InteropNativeModule._NativeLog("Application.start() error: ${error.stackTraceToString()}")
            return nullptr
        }
        stopNativeLog()

        if (useOwnLoop) {
            runEventLoop(loopIterations)
        }

        return rootPointer
    }

    fun enter(): Boolean {
        try {
            startNativeLog()
            if (currentCrash != null) {
                drawCurrentCrash()
            }
            else {
                try {
                    loopIteration()
                }
                catch (error: Exception) {
                    val crash = error.stackTraceToString()
                    InteropNativeModule._NativeLog("Application.enter() error: ${crash}")
                    currentCrash = crash
                    return true
                }
            }
            stopNativeLog()
        }
        catch (error: Exception) {
            val crash = error.stackTraceToString()
            println("Application.enter() stack trace: ${crash}")
            exitApp = true
        }
        return exitApp
    }

    fun emitEvent(type: Int, target: Int, arg0: Int, arg1: Int): String {
        val node = PeerNode.findPeerByNativeId(target)
        when (type) {
            EventType.Click.value -> {
                println("Emit click event for target: $target ${node != null}")
                if (node != null) {
                    EventEmulator.emitClickEvent(node.peer.ptr, makeClickEvent(arg0, arg1))
                }
            }
            EventType.Text.value -> InteropNativeModule._NativeLog("Kotlin: [emitEvent] EventType.Text is not implemented.")
            EventType.StartLog.value -> NativeLog.startNativeLog(0)
            EventType.StopLog.value -> NativeLog.stopNativeLog(0)
            EventType.GetLog.value -> return NativeLog.getNativeLog(0)
            EventType.ExitApp.value -> {
                exitApp = true
                return if (currentCrash == null) "" else currentCrash!!
            }
            EventType.SyncNeeded.value -> InteropNativeModule._NativeLog("Kotlin: [emitEvent] EventType.SyncNeeded is not implemented.")
            else -> InteropNativeModule._NativeLog("Kotlin: [emitEvent] type = $type is unknown")
        }
        return "0"
    }

    fun checkCallbacks(): Unit {
        if (withLog) {
            InteropNativeModule._NativeLog("Kotlin: checkCallbacks")
        }
        checkEvents()
    }

    override fun params(): String {
        return appParams
    }
    override fun startLog(): UserApplicationControl {
        NativeLog.startNativeLog(TEST_LOG_NUMBER)
        return this
    }
    override fun getLog(): String {
        return NativeLog.getNativeLog(TEST_LOG_NUMBER)
    }
    override fun stopLog(): UserApplicationControl {
        NativeLog.stopNativeLog(TEST_LOG_NUMBER)
        return this
    }
    override fun emitTask(type: Int, target: String, arg0: Int?, arg1: Int?): UserApplicationControl {
        error("Application.emitTask not implemented")
    }
    //override fun nextFrame(): Promise<UserApplicationControl> {}
    override fun reloadView(): UserApplicationControl {
        error("Application.reloadView not implemented")
    }
    override fun requestStopApp(crash: String?): Unit {
        if (crash != null) {
            currentCrash = crash
        }
        exitApp = true
    }

    private fun runEventLoop(loopIterations: Int) {
        println("runEventLoop ${loopIterations}")
        var iterations = loopIterations
        while (!this.exitApp && iterations > 0) {
            try {
                loopIteration()
                iterations -= 1
            }
            catch (error: Exception) {
                val crash = error.stackTraceToString()
                println("Application.runEventLoop() error: ${crash}")
                currentCrash = crash
                drawCurrentCrash()
                exitApp = true
            }
        }
    }

    private fun loopIteration(): Unit {
        if (withLog) {
            InteropNativeModule._NativeLog("Kotlin: loopIteration")
        }
        checkAppEvents()
        render()
    }

    private fun checkAppEvents(): Unit {
        checkEvents()
    }

    private fun render(): Unit {
        if (withLog) {
            InteropNativeModule._NativeLog("Kotlin: render")
        }
        ArkUINativeModule._MeasureLayoutAndDraw(rootPointer)
    }

    private var currentCrash: String? = null
    private var crashDumped: Boolean = false
    private fun drawCurrentCrash() {
        if (!this.crashDumped) {
            InteropNativeModule._NativeLog(currentCrash!!)
            this.crashDumped = true
        }
    }

    private fun startNativeLog(): Unit {
        if (withLog) {
            NativeLog.startNativeLog(1)
        }
    }
    private fun stopNativeLog(): Unit {
        if (withLog) {
            NativeLog.stopNativeLog(1)
            if (useNativeLog) {
                InteropNativeModule._PrintGroupedLog(1)
            }
            else {
                val log = NativeLog.getNativeLog(1)
                if (log.length > 0) {
                    InteropNativeModule._NativeLog(log)
                }
            }
        }
    }
}

fun makeClickEvent(x: Int, y: Int): ClickEvent {
    val result = ClickEventInternal()
    result.x = x.toDouble()
    result.y = y.toDouble()
    return result
}
