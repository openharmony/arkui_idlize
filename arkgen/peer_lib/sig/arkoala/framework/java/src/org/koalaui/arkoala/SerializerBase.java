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

import java.util.ArrayList;
import java.util.List;

public class SerializerBase {

    private static List<CustomSerializer> customSerializers = new ArrayList<CustomSerializer>();
    public static void registerCustomSerializer(CustomSerializer serializer) {
        customSerializers.add(serializer);
    }

    private long buffer;
    private int length;
    private int position;
    protected boolean isHolding = false;

    public SerializerBase() {
        var len = 96;
        buffer = InteropNativeModule._Malloc(len);
        length = len;
        position = 0;
    }
    public void release() {
        isHolding = false;
        // todo handle release resources
        position = 0;
    }
    public final long asBuffer() {
        return buffer;
    }
    public final int length() {
        return length;
    }
    public final int currentPosition() {
        return position;
    }
    // TODO: get rid of length.
    private static void writeu8(long buffer, int offset, int length, int value) {
        InteropNativeModule._WriteByte(buffer, offset, length, value);
    }
    // TODO: get rid of length.
    private static int readu8(long buffer, int offset, int length) {
        return InteropNativeModule._ReadByte(buffer, offset, length);
    }
    private static void writeu32(long buffer, int offset, int length, int value) {
        InteropNativeModule._WriteByte(buffer, offset,     length, (value     ) & 0xff);
        InteropNativeModule._WriteByte(buffer, offset + 1, length, (value >> 8) & 0xff);
        InteropNativeModule._WriteByte(buffer, offset + 2, length, (value >> 16) & 0xff);
        InteropNativeModule._WriteByte(buffer, offset + 3, length, (value >> 24) & 0xff);
    }
    private void writeu8(int position, int value) {
        writeu8(buffer, position, length, value);
    }
    private void writeu32(int position, int value) {
        writeu8(buffer, position + 0, length, (value      ) & 0xff);
        writeu8(buffer, position + 1, length, (value >>  8) & 0xff);
        writeu8(buffer, position + 2, length, (value >> 16) & 0xff);
        writeu8(buffer, position + 3, length, (value >> 24) & 0xff);
    }
    // TODO: get rid of length.
    private static int readu32(long buffer, int offset, int length) {
        return InteropNativeModule._ReadByte(buffer, offset, length);
    }

    public final byte getByte(int offset) {
        return (byte)readu8(buffer, offset, length);
    }
    public final byte[] toArray() {
        var result = new byte[currentPosition()];
        for (var i = 0; i < currentPosition(); i++) {
            result[i] = getByte(i);
        }
        return result;
    }
    private void checkCapacity(int value) {
        if (value < 1) {
            throw new Error(value + " is less than 1");
        }
        var buffSize = length;
        if (position > buffSize - value) {
            var minSize = position + value;
            var resizedSize = Math.max(minSize, Math.round((float) (3 * buffSize) / 2));
            var resizedBuffer = InteropNativeModule._Malloc(resizedSize);
            var oldBuffer = buffer;
            for (var i = 0; i < position; i++) {
                writeu8(resizedBuffer, i, resizedSize, readu8(oldBuffer, i, position));
            }
            buffer = resizedBuffer;
            length = resizedSize;
            InteropNativeModule._Free(oldBuffer);
        }
    }
    public void writeTag(Tag tag) {
        checkCapacity(1);
        writeu8(position, tag.value);
        position += 1;
    }
    public void writeNumber(int value) {
        writeTag(Tag.INT32);
        writeInt32(value);
    }
    public void writeNumber(float value) {
        writeTag(Tag.FLOAT32);
        writeFloat32(value);
    }
    public void writeNumber(double value) {
        if (Math.floor(value) == value) {
            writeNumber((int)value);
        }
        else {
            writeNumber((float)value);
        }
    }
    public void writeNumber(Opt_Number value) {
        writeNumber(value.value);
    }
    public void writeInt8(byte value) {
        checkCapacity(1);
        writeu8(position, value);
        position += 1;
    }
    public void writeInt8(int value) {
        writeInt8((byte)value);
    }
    public void writeInt8(RuntimeType value) {
        writeInt8(value.value);
    }
    private void setInt32(int position, int value) {
        writeu32(buffer, position, length, value);
    }
    public void writeInt32(int value) {
        checkCapacity(4);
        setInt32(position, value);
        position += 4;
    }
    public void writeInt64(long value) {
        checkCapacity(8);
        writeu8(position + 0, (int)((value      ) & 0xff));
        writeu8(position + 1, (int)((value >>  8) & 0xff));
        writeu8(position + 2, (int)((value >> 16) & 0xff));
        writeu8(position + 3, (int)((value >> 24) & 0xff));
        writeu8(position + 4, (int)((value >> 32) & 0xff));
        writeu8(position + 5, (int)((value >> 40) & 0xff));
        writeu8(position + 6, (int)((value >> 48) & 0xff));
        writeu8(position + 7, (int)((value >> 56) & 0xff));
        position += 8;
    }
    public void writeFloat32(float value) {
        writeInt32(Float.floatToIntBits(value));
    }
    public void writePointer(long value) {
        writeInt64(value);
    }
    public void writeBoolean(boolean value) {
        checkCapacity(1);
        writeu8(position, value ? (byte) 1 : (byte) 0);
        position += 1;
    }
    public void writeBoolean(Opt_Boolean value) {
        writeBoolean(value.value);
    }
    // public void writeString1(String value) {
    //     var encoded = value.getBytes();
    //     int length = encoded.length + 1;
    //     checkCapacity(4 + length);
    //     buffer.putInt(length);
    //     buffer.put(encoded);
    //     buffer.put((byte) 0);
    // }
    public void writeString(String value) {
        checkCapacity(4 + value.length() * 4 + 1);
        int encodedLength =
            InteropNativeModule._ManagedStringWrite(value, buffer, position + 4);
        setInt32(position, encodedLength);
        position += encodedLength + 4;
    }
    public void writeBuffer(byte[] value) {
        writeInt64(42);
        writeInt64(value.length);
    }
    public void writeCustomObject(String kind, Object value) {
        for (var serializer: customSerializers) {
            if (serializer.supports(kind)) {
                serializer.serialize(this, value, kind);
                return;
            }
        }
        System.out.println(String.format("Unsupported custom serialization for %s, write undefined", kind));
        writeTag(Tag.UNDEFINED);
    }
    private ArrayList<Integer> heldResources = new ArrayList<Integer>();
    void holdAndWriteCallback(Object callback) {
        int resourceId = ResourceHolder.instance().registerAndHold(callback);
        heldResources.add(resourceId);
        writeInt32(resourceId);
        writePointer(0);
        writePointer(0);
        writePointer(0);
    }

    public int holdAndWriteObject(Object obj) {
        return holdAndWriteObject(obj, 0, 0);
    }
    public int holdAndWriteObject(Object obj, long hold) {
        return holdAndWriteObject(obj, hold, 0);
    }
    public int holdAndWriteObject(Object obj, long hold, long release) {
        int resourceId = ResourceHolder.instance().registerAndHold(obj);
        heldResources.add(resourceId);
        writeInt32(resourceId);
        writePointer(hold);
        writePointer(release);
        return resourceId;
    }
}
