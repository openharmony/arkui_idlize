package org.koalaui.arkoala;

public class Opt_Boolean extends Ark_ObjectBase {
    public boolean value;
    public Opt_Boolean(boolean v) {
        this.value = v;
    }

    public RuntimeType getRuntimeType() {
        return RuntimeType.BOOLEAN;
    }
}
