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

import koalaui.arkoala.BusinessErrorInterface
import koalaui.arkoala.CustomNodeBuilder
import koalaui.arkoala.PageMapBuilder
import koalaui.arkoala.PageMapNodeBuilder
import koalaui.interop.KPointer
import ohos.base.BusinessError
import ohos.multimedia.image.image

interface LifeCycle {
    fun build(): Unit
}
abstract class ExtendableComponent: LifeCycle {}

internal class ExtendableComponentImpl: ExtendableComponent() {
    override fun build(): Unit {}
}

class extractors { companion object {

    fun toImagePixelMapPtr(value: image.PixelMap): KPointer {
        return 123
    }

    fun fromImagePixelMapPtr(ptr: KPointer): image.PixelMap {
        return image.PixelMapImpl(ptr)
    }

    fun transform_Ark_BusinessError_Void_to_Ark_BusinessErrorInterface_Void(from: BusinessError<Unit>): BusinessErrorInterface<Unit> {
        return object: BusinessErrorInterface<Unit> {
            override var name = from.name
            override var message = from.message
            override var stack = from.stack
            override var code = from.code
            override var data = Unit
        }
    }

    fun transform_Ark_BusinessErrorInterface_Void_to_Ark_BusinessError_Void(from: BusinessErrorInterface<Unit>): BusinessError<Unit> {
        return object: BusinessError<Unit> {
            override var name = from.name
            override var message = from.message
            override var stack = from.stack
            override var code = from.code
            override var data = Unit
        }
    }

    fun transform_PageMapBuilder_to_PageMapNodeBuilder(from: PageMapBuilder): PageMapNodeBuilder {
        error("Not implemented")
    }

    fun transform_Ark_ExtendableComponent_to_CustomNodeBuilder(comp: ExtendableComponent): CustomNodeBuilder {
        return { parentNode -> 123 }
    }

    fun transform_CustomNodeBuilder_to_Ark_ExtendableComponent(builder: CustomNodeBuilder): ExtendableComponent {
        return ExtendableComponentImpl()
    }
} }
