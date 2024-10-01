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


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

package org.koalaui.arkoala;

import java.time.Duration;

import org.koalaui.interop.Finalizable;

public class NativePeerNode extends Finalizable {
    public NativePeerNode(long ptr, long finalizer) {
        super(ptr, finalizer);
    }

    public static NativePeerNode create(ArkUINodeType type, int id, int flags) {
        long ptr = NativeModule._CreateNode(type.value, id, flags);
        return new NativePeerNode(ptr, NativeModule._GetNodeFinalizer());
    }

    public void dispose() {
        NativeModule._DisposeNode(ptr);
    }

    public void addChild(NativePeerNode node) {
        NativeModule._AddChild(ptr, node.ptr);
    }
    public void removeChild(NativePeerNode node) {
        NativeModule._RemoveChild(ptr, node.ptr);
    }
    public void insertChildBefore(NativePeerNode node, NativePeerNode sibling) {
        NativeModule._InsertChildBefore(ptr, node.ptr, sibling == null ? 0 : sibling.ptr);
    }
    public void insertChildAfter(NativePeerNode node, NativePeerNode sibling) {
        NativeModule._InsertChildAfter(ptr, node.ptr, sibling == null ? 0 : sibling.ptr);
    }
    public void insertChildAt(NativePeerNode node, int position) {
        NativeModule._InsertChildAt(ptr, node.ptr, position);
    }

    public void dumpTree() {
        NativeModule._DumpTreeNode(ptr);
    }

    public static void setCreateNodeDelay(ArkUINodeType type, Duration delay) {
        NativeModule._SetCreateNodeDelay(type.value, delay.toNanos());
    }
    public static void setMeasureNodeDelay(ArkUINodeType type, Duration delay) {
        NativeModule._SetMeasureNodeDelay(type.value, delay.toNanos());
    }
    public static void setLayoutNodeDelay(ArkUINodeType type, Duration delay) {
        NativeModule._SetLayoutNodeDelay(type.value, delay.toNanos());
    }
    public static void setDrawNodeDelay(ArkUINodeType type, Duration delay) {
        NativeModule._SetDrawNodeDelay(type.value, delay.toNanos());
    }
}
