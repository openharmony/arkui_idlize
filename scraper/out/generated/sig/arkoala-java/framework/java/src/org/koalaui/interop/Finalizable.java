package org.koalaui.interop;

public class Finalizable {
    public long ptr;
    public long finalizer;

    public Finalizable(long ptr, long finalizer) {
        this.ptr = ptr;
        this.finalizer = finalizer;
    }
}