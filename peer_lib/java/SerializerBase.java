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

class ByteBufferCache {
    private final ArrayList<ByteBuffer> cache = new ArrayList<>();
    public ByteBufferCache() {}
    public ByteBuffer get(int size) {
        for (int i = 0; i < cache.size(); i++) {
            var buf = cache.get(i);
            if (buf != null && buf.capacity() >= size) {
                cache.set(i, null);
                return buf;
            }
        }
        return ByteBuffer.allocate(size).order(ByteOrder.LITTLE_ENDIAN);
    }
    public void release(ByteBuffer buffer) {
        buffer.position(0);
        for (int i = 0; i < cache.size(); i++) {
            if (cache.get(i) == null) {
                cache.set(i, buffer);
                return;
            }
        }
        cache.add(buffer);
    }
}

public class SerializerBase {

    public static final ByteBufferCache bufferCache = new ByteBufferCache();
    private ByteBuffer buffer;

    public SerializerBase(int size) {
        buffer = SerializerBase.bufferCache.get(size).order(ByteOrder.LITTLE_ENDIAN);
    }
    public void close() throws IOException {
        SerializerBase.bufferCache.release(buffer);
    }
    public byte[] asArray() {
        byte[] array = new byte[buffer.position()];
        buffer.get(0, array, 0, buffer.position());
        return array;
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
                var resizedBuffer = SerializerBase.bufferCache.get(resizedSize);
                resizedBuffer.put(0, buffer.array(), 0, buffPosition);
                resizedBuffer.position(buffPosition);
                SerializerBase.bufferCache.release(buffer);
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
    @FunctionalInterface
    public interface TriFunction<T, U, V, R> {
        R apply(T t, U u, V v);
    }
    private void withLength(Object valueLength, TriFunction<Float, Integer, Integer, Void> body) {
        var type = runtimeType(valueLength);
        var value = 0.0F;
        var unit = 1;
        var resource = 0;
        switch (type) {
            case UNDEFINED -> {
                value = 0;
                unit = 0;
            }
            case NUMBER -> {
                value = (float) valueLength;
            }
            case STRING -> {
                var valueStr = (String) valueLength;
                if (valueStr.endsWith("vp")) {
                    unit = 1;
                    value = Float.parseFloat(valueStr.substring(0, valueStr.length() - 2));
                } else if (valueStr.endsWith("%")) {
                    unit = 3;
                    value = Float.parseFloat(valueStr.substring(0, valueStr.length() - 1));
                } else if (valueStr.endsWith("lpx")) {
                    unit = 4;
                    value = Float.parseFloat(valueStr.substring(0, valueStr.length() - 3));
                } else if (valueStr.endsWith("px")) {
                    unit = 0;
                    value = Float.parseFloat(valueStr.substring(0, valueStr.length() - 2));
                }
            }
            case OBJECT -> {
                // resource = ???
            }
        }
        body.apply(value, unit, resource);
    }
    public void writeLength(Object value) {
        this.checkCapacity(1);
        var valueType = runtimeType(value);
        if (valueType != RuntimeType.UNDEFINED) {
            this.writeInt8(Tags.LENGTH.value);
            withLength(value, (Float v, Integer unit, Integer resource) -> {
                this.writeFloat32(v);
                this.writeInt32(unit);
                this.writeInt32(resource);
                return null;
            });
        } else {
            this.writeInt8(Tags.UNDEFINED.value);
        }
    }
}
