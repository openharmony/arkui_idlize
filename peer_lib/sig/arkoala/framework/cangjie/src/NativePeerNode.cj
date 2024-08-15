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
package peers

public open class NativePeerNode <: Finalizable {
    public NativePeerNode(ptr: Int64, finalizer: Int64) {
        super(ptr, finalizer)
    }

    public static func create(type: ArkUINodeType, id: Int32, flags: Int32): NativePeerNode {
        var ptr = NativeModule._CreateNode(Int32(type), id, flags)
        return NativePeerNode(ptr, NativeModule._GetNodeFinalizer())
    }

    public func dispose() {
        NativeModule._DisposeNode(this.ptr)
    }

    public func addChild(node: NativePeerNode) {
        NativeModule._AddChild(this.ptr, node.ptr)
    }
    public func removeChild(node: NativePeerNode) {
        NativeModule._RemoveChild(this.ptr, node.ptr)
    }
    public func insertChildBefore(node: NativePeerNode, sibling: NativePeerNode) {
        NativeModule._InsertChildBefore(this.ptr, node.ptr, sibling == null ? 0 : sibling.ptr)
    }
    public func insertChildAfter(node: NativePeerNode, sibling: NativePeerNode) {
        NativeModule._InsertChildAfter(this.ptr, node.ptr, sibling == null ? 0 : sibling.ptr)
    }
    public func insertChildAt(node: NativePeerNode, position: Int32) {
        NativeModule._InsertChildAt(this.ptr, node.ptr, position)
    }

    public func dumpTree() {
        NativeModule._DumpTreeNode(this.ptr)
    }
}
