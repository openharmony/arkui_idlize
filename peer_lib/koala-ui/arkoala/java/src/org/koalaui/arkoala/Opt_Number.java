package org.koalaui.arkoala;

public class Opt_Number extends Ark_ObjectBase {
    public double value;
    public Opt_Number(double v) {
        this.value = v;
    }

    public RuntimeType getRuntimeType() {
        return RuntimeType.NUMBER;
    }
}
