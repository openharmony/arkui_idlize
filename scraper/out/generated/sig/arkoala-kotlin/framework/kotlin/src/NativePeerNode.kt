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
package idlize

import koalaui.interop.*

public open class NativePeerNode(ptr: KPointer, finalizer: KPointer): Finalizable(ptr, finalizer) {
    companion object {
        public fun create(peerPtr: KPointer): NativePeerNode {
            return NativePeerNode(peerPtr, 0L) // ArkUINativeModule._GetNodeFinalizer())
        }
    }

    public fun dispose() {
        // ArkUINativeModule._DisposeNode(this.ptr)
    }

    public fun addChild(node: NativePeerNode) {
        // ArkUINativeModule._AddChild(this.ptr, node.ptr)
    }
    public fun removeChild(node: NativePeerNode) {
        // ArkUINativeModule._RemoveChild(this.ptr, node.ptr)
    }
    public fun insertChildBefore(node: NativePeerNode, sibling: NativePeerNode) {
        // NativeModule._InsertChildBefore(this.ptr, node.ptr, sibling == null ? 0 : sibling.ptr)
    }
    public fun insertChildAfter(node: NativePeerNode, sibling: NativePeerNode) {
        // NativeModule._InsertChildAfter(this.ptr, node.ptr, sibling == null ? 0 : sibling.ptr)
    }
    public fun insertChildAt(node: NativePeerNode, position: Int) {
        // ArkUINativeModule._InsertChildAt(this.ptr, node.ptr, position)
    }

    public fun dumpTree() {
        // ArkUINativeModule._DumpTreeNode(this.ptr)
    }
}
