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

import java.util.Map;

public class PeerNode extends IncrementalNode {
    private static final int PEER_NODE_TYPE = 11;
    private static final int INITIAL_ID = 999;
    protected static int currentId = PeerNode.INITIAL_ID;
    public static int nextId() { return ++PeerNode.currentId; }
    private int id = 0;

    public NativePeerNode peer;
    public PeerNode(long peerPtr, int id, String name, int flags) {
        super(PEER_NODE_TYPE);
        this.id = id;
        peer = NativePeerNode.create(peerPtr);
    }

    void applyAttributes(Map<String, Object> attrs) {}
}
