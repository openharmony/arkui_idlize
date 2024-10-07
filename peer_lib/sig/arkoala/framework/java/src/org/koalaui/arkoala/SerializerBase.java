/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

package org.koalaui.arkoala;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.LinkedList;
import java.util.List;
import java.util.function.Supplier;

class SerializersCache {
    SerializerBase[] cache;

    SerializersCache(int maxCount) {
        cache = new SerializerBase[22];
    }
    @SuppressWarnings("unchecked")
    <T extends SerializerBase> T getCached(Supplier<T> factory, int index) {
        var result = this.cache[index];
        if (result != null) {
            result.resetCurrentPosition();
            return (T)result;
        }
        result = factory.get();
        this.cache[index] = result;
        return (T)result;
    }
}

public class SerializerBase {

    private static List<CustomSerializer> customSerializers = new LinkedList<CustomSerializer>();
    public static void registerCustomSerializer(CustomSerializer serializer) {
        customSerializers.add(serializer);
    }

    // TODO: use allocateDirect
    private ByteBuffer buffer = ByteBuffer.allocate(96).order(ByteOrder.LITTLE_ENDIAN);

    private static SerializersCache cache = new SerializersCache(22);

    static <T extends SerializerBase> T get(Supplier<T> factory, int index) {
        return SerializerBase.cache.getCached(factory, index);
    }

    public SerializerBase() {}

    void resetCurrentPosition() {
        this.buffer.position(0);
    }
    public byte[] asArray() {
        return buffer.array();
    }
    public int length() {
        return buffer.position();
    }
    public int currentPosition() {
        return buffer.position();
    }
    private void checkCapacity(int value) {
        if (value < 1) {
            throw new Error(value + " is less than 1");
        } else {
            var buffPosition = buffer.position();
            var buffLimit = buffer.limit();
            if (buffLimit < buffPosition + value) {
                var minSize = buffPosition + value;
                var resizedSize = Math.max(minSize, Math.round((float) (3 * buffPosition) / 2));
                var resizedBuffer = ByteBuffer.allocate(resizedSize).order(ByteOrder.LITTLE_ENDIAN);
                resizedBuffer.put(buffer.array(), 0, buffPosition);
                resizedBuffer.position(buffPosition);
                buffer = resizedBuffer;
            }
        }
    }
    public void writeNumber(int value) {
        this.checkCapacity(5);
        this.buffer.put(Tag.INT32.value);
        this.buffer.putInt(value);
    }
    public void writeNumber(float value) {
        this.checkCapacity(5);
        this.buffer.put(Tag.FLOAT32.value);
        this.buffer.putFloat(value);
    }
    public void writeNumber(double value) {
        if (Math.floor(value) == value) {
            this.writeNumber((int)value);
        }
        else {
            this.writeNumber((float)value);
        }
    }
    public void writeNumber(Opt_Number value) {
        this.writeNumber(value.value);
    }
    public void writeInt8(byte value) {
        this.checkCapacity(1);
        buffer.put(value);
    }
    public void writeInt8(int value) {
        this.checkCapacity(1);
        buffer.put((byte)value);
    }
    public void writeInt8(RuntimeType value) {
        this.checkCapacity(1);
        buffer.put(value.value);
    }
    public void writeInt32(int value) {
        this.checkCapacity(4);
        buffer.putInt(value);
    }
    public void writeInt32(IntValueGetter value) {
        this.writeInt32(value.getIntValue());
    }
    public void writeFloat32(float value) {
        this.checkCapacity(4);
        buffer.putFloat(value);
    }
    public void writePointer(long value) {
        this.checkCapacity(8);
        buffer.putLong(value);
    }
    public void writeBoolean(boolean value) {
        this.checkCapacity(1);
        buffer.put(value ? (byte) 1 : (byte) 0);
    }
    public void writeBoolean(Opt_Boolean value) {
        this.writeBoolean(value.value);
    }
    public void writeString(String value) {
        var encoded = value.getBytes();
        int length = encoded.length + 1;
        this.checkCapacity(4 + length);
        buffer.putInt(length);
        buffer.put(encoded);
        buffer.put((byte) 0);
    }
    public void writeString1(String value) {
        this.checkCapacity(4 + value.length() * 4 + 1);
        int encodedLength =
            NativeModule._ManagedStringWrite(value, this.buffer.array(), this.buffer.position() + 4);
        buffer.putInt(encodedLength);
        buffer.position(buffer.position() + encodedLength);
    }
    public void writeLength(Ark_Length value) {
        this.buffer.put(RuntimeType.STRING.value);
        this.writeString(value.value);
    }
    public void writeCustomObject(String kind, Ark_CustomObject value) {
        for (var serializer: customSerializers) {
            if (serializer.supports(kind)) {
                serializer.serialize(this, value, kind);
                return;
            }
        }
        System.out.println(String.format("Unsupported custom serialization for %s, write undefined", kind));
        this.writeInt8(Tag.UNDEFINED.value);
    }

    void writeMaterialized(Ark_MaterializedBase value) {
        this.writePointer(value != null ? value.peer.ptr : 0);
    }
}
