package org.koalaui.arkoala;

import java.util.Map;

public class PeerNode {
    public NativePeerNode peer;
    public PeerNode(ArkUINodeType type, int flags) {
        // TODO: use NativeModule._GetNodeFinalizer()
        this.peer = new NativePeerNode(42, 0);
    }
    void applyAttributes(Map<String, Object> attrs) {}
}
