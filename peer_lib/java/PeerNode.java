package org.koalaui.arkoala;

import java.util.Map;

public class PeerNode {
    public NativePeerNode peer;
    public PeerNode(ArkUINodeType type, int flags) {
        // TODO: rework ptr
        this.peer = new NativePeerNode(42, NativeModule._GetNodeFinalizer());
    }
    void applyAttributes(Map<String, Object> attrs) {}
}
