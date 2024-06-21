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
package org.koalaui.arkoala;

import java.io.IOException;
import java.math.BigInteger;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.ArrayList;
import java.util.function.Function;
import java.util.function.Supplier;

enum RuntimeType {
    UNEXPECTED((byte) -1),
    NUMBER((byte) 1),
    STRING((byte) 2),
    OBJECT((byte) 3),
    BOOLEAN((byte) 4),
    UNDEFINED((byte) 5),
    BIGINT((byte) 6),
    FUNCTION((byte) 7),
    SYMBOL((byte) 8);
    public final byte value;
    RuntimeType(byte value) {
        this.value = value;
    }
};

enum Tags {
    UNDEFINED((byte) 101),
    INT32((byte) 102),
    FLOAT32((byte) 103),
    STRING((byte) 104),
    LENGTH((byte) 105),
    RESOURCE((byte) 106),
    OBJECT((byte) 107);
    public final byte value;
    Tags(byte value) {
        this.value = value;
    }
}

class SerializersCache {
    SerializerBase[] cache;

    SerializersCache(int maxCount) {
        cache = new SerializerBase[22];;
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

    // TODO: use allocateDirect
    private ByteBuffer buffer = ByteBuffer.allocate(96).order(ByteOrder.LITTLE_ENDIAN);

    public SerializerBase() {}

    private static SerializersCache cache = new SerializersCache(22);

    static <T extends SerializerBase> T get(Supplier<T> factory, int index) {
        return SerializerBase.cache.getCached(factory, index);
    }

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
                resizedBuffer.put(0, buffer.array(), 0, buffPosition);
                resizedBuffer.position(buffPosition);
                buffer = resizedBuffer;
            }
        }
    }
    public void writeNumber(int value) {
        this.checkCapacity(5);
        this.buffer.put(Tags.INT32.value);
        this.buffer.putInt(value);
    }
    public void writeNumber(float value) {
        this.checkCapacity(5);
        this.buffer.put(Tags.FLOAT32.value);
        this.buffer.putFloat(value);
    }
    public void writeInt8(byte value) {
        this.checkCapacity(1);
        buffer.put(value);
    }
    public void writeInt8(RuntimeType value) {
        this.checkCapacity(1);
        buffer.put(value.value);
    }
    public void writeInt32(int value) {
        this.checkCapacity(4);
        buffer.putInt(value);
    }
    public void writeFloat32(float value) {
        this.checkCapacity(4);
        buffer.putFloat(value);
    }
    public void writePointer(long value) {
        this.checkCapacity(8);
        buffer.putLong(value);
    }
    public void writeBoolean(Boolean value) {
        this.checkCapacity(1);
        buffer.put(value == null ? RuntimeType.UNDEFINED.value : value ? (byte) 1 : (byte) 0);
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

    private RuntimeType runtimeType(Object value) {
        if (value == null) { return RuntimeType.UNDEFINED; }
        if (value instanceof Integer) { return RuntimeType.NUMBER; }
        if (value instanceof Float) { return RuntimeType.NUMBER; }
        if (value instanceof String) { return RuntimeType.STRING; }
        if (value instanceof Boolean) { return RuntimeType.BOOLEAN; }
        if (value instanceof BigInteger) { return RuntimeType.BIGINT; }
        if (value instanceof Function) { return RuntimeType.FUNCTION; }
        return RuntimeType.UNDEFINED;
    }
    public void writeLength(Object value) {
        this.checkCapacity(1);
        var valueType = runtimeType(value);
        this.writeInt8(valueType.value);

        if (valueType == RuntimeType.NUMBER) {
            this.writeFloat32((Float)value);
        } else if (valueType == RuntimeType.STRING) {
            this.writeString((String)value);
        } else if (valueType == RuntimeType.OBJECT) {
            // TODO: write real resource id.
            this.writeInt32(value.hashCode());
        }
    }
}
