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
package org.koalaui.arkoala;

import java.util.Map;

public class PeerNode extends IncrementalNode {
    private static final int PEER_NODE_TYPE = 11;
    public NativePeerNode peer;
    public PeerNode(ArkUINodeType type, ComponentBase component, int flags) {
        super(PEER_NODE_TYPE);
        int id = 0; // TODO: use id
        long ptr = NativeModule._CreateNode(type.value, id, flags);
        this.peer = new NativePeerNode(ptr, NativeModule._GetNodeFinalizer());
    }
    void applyAttributes(Map<String, Object> attrs) {}
}
