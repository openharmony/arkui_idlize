package org.koalaui.arkoala;

import java.util.Map;
import org.koalaui.interop.Finalizable;

public class PeerNode {
    public NativePeerNode peer;
    public PeerNode(ArkUINodeType type, int flags) {
        // TODO: rework
        this.peer = new NativePeerNode(42);
    }
    void applyAttributes(Map<String, Object> attrs) {}
}
