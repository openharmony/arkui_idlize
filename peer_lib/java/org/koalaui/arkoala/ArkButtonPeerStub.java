package org.koalaui.arkoala;

class ArkCommonMethodPeerStub extends PeerNode {
    ArkCommonMethodPeerStub(ArkUINodeType type, ComponentBase component, int flags) {
        super(type, flags);
        if (component != null) component.setPeer(this);
    }

    void widthAttribute(String value) {
        NativeModule._CommonMethod_width(this.peer.ptr, value);
    }

    void backdropBlurAttribute(double value, BlurOptions options) {
        Serializer optionsSerializer = SerializerBase.get(Serializer::createSerializer, 0);
        var options_type = options == null ? RuntimeType.UNDEFINED : RuntimeType.OBJECT;
        optionsSerializer.writeInt8(options_type);
        if ((RuntimeType.UNDEFINED) != (options_type)) {
            var options_value = options;
            optionsSerializer.writeBlurOptions(options_value);
        }
        NativeModule._CommonMethod_backdropBlur(this.peer.ptr, value, optionsSerializer.asArray(), optionsSerializer.length());
    }
}

public class ArkButtonPeerStub extends ArkCommonMethodPeerStub {
    ArkButtonPeerStub() {
        super(ArkUINodeType.Root, null, 0);
    }
}
