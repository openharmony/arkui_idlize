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

package handwritten

import arkui.SymbolGlyphModifier.SymbolGlyphModifier
import koalaui.arkoala.RectResult
import koalaui.arkoala.TouchTestStrategy

class initializers {
    class arkui {
        class component {
            class BaseContextNS { companion object {
                val stageMode = false
            } }
            class TouchTestInfoNS { companion object {
                val windowX = 0.0
                val windowY = 0.0
                val parentX = 0.0
                val parentY = 0.0
                val x = 0.0
                val y = 0.0
                val rect: RectResult = object: RectResult {
                    override var x = 0.0
                    override var y = 0.0
                    override var width = 0.0
                    override var height = 0.0
                }
                val id = "id"
            } }
            class TouchResultNS { companion object {
                val strategy = TouchTestStrategy.DEFAULT
            } }
            class ScrollResultNS { companion object {
                val offsetRemain = 0.0
            } }
            class TabBarSymbolNS { companion object {
                val normal = SymbolGlyphModifier()
            } }
            class ClassDTSNS { companion object {
                val valBoolean = true
            } }
            class common {
                class TouchTestInfoNS { companion object {
                    val windowX = 0.0
                    val windowY = 0.0
                    val parentX = 0.0
                    val parentY = 0.0
                    val x = 0.0
                    val y = 0.0
                    val rect: RectResult = object: RectResult {
                        override var x = 0.0
                        override var y = 0.0
                        override var width = 0.0
                        override var height = 0.0
                    }
                    val id = "id"
                } }
                class TouchResultNS { companion object {
                    val strategy = TouchTestStrategy.DEFAULT
                } }
            }
            class waterFlow {
                class SectionOptionsNS { companion object {
                    val itemsCount = 0.0
                } }
            }
            class idlize {
                class LengthMetricsCustomNS { companion object {
                    val unit = 0.0
                    val value = 0.0
                } }
            }
        }
    }
    class waterFlow {
        class SectionOptionsNS { companion object {
            val itemsCount = 0.0
        } }
    }
}
