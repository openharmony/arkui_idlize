/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

public open class ComponentBase {
    public val children = arrayListOf<ComponentBase>()
    protected var peer: PeerNode? = null
    public open fun getPeer(): PeerNode {
        return peer as PeerNode
    }
    public fun setPeer(peer: PeerNode): Unit {
        this.peer = peer
    }
    protected open fun applyAttributesFinish(): Unit {
        ArkUINativeModule._ApplyModifierFinish(peer!!.peer.ptr)
    }
    protected open fun applyAttributes(attrs: Any): Unit {
        applyAttributesFinish()
    }
}
