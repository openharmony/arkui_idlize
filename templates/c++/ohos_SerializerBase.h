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

#ifndef _SERIALIZER_BASE_H
#define _SERIALIZER_BASE_H

#include "%NATIVE_API_HEADER_PATH%"

#include <cstdint>
#include <cstdio>
#include <cstring>
#include <string>
#include <memory>
#include <cassert>
#include <cstddef>

template <typename T>
inline OH_RuntimeType runtimeType(const T& value) = delete;

template <>
inline OH_RuntimeType runtimeType(const OH_CustomObject& value) {
  return OH_RUNTIME_OBJECT;
}

template <>
inline OH_RuntimeType runtimeType(const OH_Materialized& value) {
  return OH_RUNTIME_OBJECT;
}

static const std::size_t buffer_size = 1024 * 1024; // 1 MB
static std::size_t offset = 0;
alignas(std::max_align_t) static char buffer[buffer_size];

template <typename T, std::size_t size>
T* allocArray(const std::array<T, size>& ref) {
  std::size_t space = sizeof(buffer) - offset;
  void* ptr = buffer + offset;
  void* aligned_ptr = std::align(alignof(T), sizeof(T) * size, ptr, space);
  assert(aligned_ptr != nullptr && "Insufficient space or alignment failed!");
  offset = (char*)aligned_ptr + sizeof(T) * size - buffer;
  T* array = reinterpret_cast<T*>(aligned_ptr);
  for (size_t i = 0; i < size; ++i) {
    new (&array[i]) T(ref[i]);
  }
  return array;
}

class SerializerBase {
private:
    uint8_t* data;
    int position;
public:
    SerializerBase(uint8_t* data): data(data), position(0) {}

    void writeInt8(OH_Int8 value) {
        *((OH_Int8*)(data + position)) = value;
        position += 1;
    }

    void writeInt32(OH_Int32 value) {
        *((OH_Int32*)(data + position)) = value;
        position += 4;
    }

    void writeFloat32(OH_Float32 value) {
        *((OH_Float32*)(data + position)) = value;
        position += 4;
    }

    void writeNumber(OH_Number value) {
        writeInt8(value.tag);
        if (value.tag == OH_Tag::OH_TAG_INT32) {
            writeInt32(value.i32);
        } else if (value.tag == OH_Tag::OH_TAG_FLOAT32) {
            writeFloat32(value.f32);
        } else {
            fprintf(stderr, "Bad number tag %d\n", value.tag);
            throw "Unknown number tag";
        }
    }

    void writeString(OH_String value) {
        // TODO implement string
        // writeInt32(value.length + 1);
        // strcpy((char*)(data + position), value.chars);
        // position += value.length + 1;
    }

    void writeBoolean(OH_Boolean value) {
        writeInt8(value);
    }

    void writePointer(OH_NativePointer value) {
        *((int64_t*)(data + position)) = reinterpret_cast<int64_t>(value);
        position += 8;
    }

    void writeCallbackResource(const OH_CallbackResource resource) {
        writeInt32(resource.resourceId);
        writePointer(reinterpret_cast<void*>(resource.hold));
        writePointer(reinterpret_cast<void*>(resource.release));
    }

/*
    void writeFunction(OH_Function value) {
        writeInt32(registerCallback(value));
    }

    OH_Int32 registerCallback(OH_Function callback) {
        // TODO: fix me!
        return 42;
    }

    void writeCustomObject(std::string type, OH_CustomObject value) {
        // TODO implement
    }
*/
    void writeMaterialized(OH_Materialized value) {
        // There should be no need to pass accessors back from native code
        throw "Trying to pass materialized class back from native code -- is that really needed?";
    }
};

#endif // _SERIALIZER_BASE_H