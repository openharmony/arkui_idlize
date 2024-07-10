package org.koalaui.arkoala;

public interface Ark_Object {
    public static RuntimeType getRuntimeType(Ark_Object object) {
        if (object == null) { return RuntimeType.UNDEFINED; }
        return object.getRuntimeType();
    }

    public static RuntimeType getRuntimeType(String object) {
        if (object == null) { return RuntimeType.UNDEFINED; }
        return RuntimeType.STRING;
    }

    public RuntimeType getRuntimeType();
}
