package org.koalaui.arkoala;

import java.util.Set;

class DateCustomSerializer extends CustomSerializer {
    public DateCustomSerializer() {
        super(Set.of("Date"));
    }
    public void serialize(SerializerBase serializer, Ark_CustomObject value, String kind) {
        serializer.writeString("{}");
    }
}

public class Ark_CustomObject extends Ark_ObjectBase {
    static {
        SerializerBase.registerCustomSerializer(new DateCustomSerializer());        
    }
}
