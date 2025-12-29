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

package ohos.multimedia.image

import koalaui.interop.KPointer

class image {

    class ResolutionQuality {
        companion object {
            val LOW = ResolutionQuality(1)
            val MEDIUM = ResolutionQuality(2)
            val HIGH = ResolutionQuality(3)
            val values = mapOf(1 to LOW, 2 to MEDIUM, 3 to HIGH)
        }
        public val value: Int?
        private constructor(arg0: Int) {
            value = arg0
        }
    }

    interface PositionArea {
        var offset: Double
        var stride: Double
    }

    interface PixelMap {
        val isEditable: Boolean
        val isStrideAlignment: Boolean

        fun readPixelsSync(area: PositionArea): Unit
    }

    class PixelMapImpl(val ptr: KPointer): PixelMap {
        override val isEditable: Boolean = true
        override val isStrideAlignment: Boolean = true

        override fun readPixelsSync(area: PositionArea): Unit {
        }
    }
}
