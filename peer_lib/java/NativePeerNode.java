package org.koalaui.arkoala;

import org.koalaui.interop.Finalizable;

public class NativePeerNode extends Finalizable {
    public NativePeerNode(long ptr, long finalizer) {
        super(ptr, finalizer);
    }
}
