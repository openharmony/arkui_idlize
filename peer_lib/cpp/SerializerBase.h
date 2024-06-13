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

#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <string>
#include "arkoala_api_generated.h"

template <typename T>
inline Ark_RuntimeType runtimeType(const T& value) = delete;

template <>
inline Ark_RuntimeType runtimeType(const Ark_CustomObject& value) {
  return ARK_RUNTIME_OBJECT;
}

template <>
inline Ark_RuntimeType runtimeType(const Ark_Materialized& value) {
  return ARK_RUNTIME_OBJECT;
}

class SerializerBase {
private:
    uint8_t* data;
    int position;
public:
    SerializerBase(uint8_t* data): data(data), position(0) {}

    void writeInt8(Ark_Int8 value) {
        *((Ark_Int8*)(data + position)) = value;
        position += 1;
    }

    void writeInt32(Ark_Int32 value) {
        *((Ark_Int32*)(data + position)) = value;
        position += 4;
    }

    void writeFloat32(Ark_Float32 value) {
        *((Ark_Float32*)(data + position)) = value;
        position += 4;
    }

    void writeNumber(Ark_Number value) {
        writeInt8(value.tag);
        if (value.tag == Ark_Tag::ARK_TAG_INT32) {
            writeInt32(value.i32);
        } else if (value.tag == Ark_Tag::ARK_TAG_FLOAT32) {
            writeFloat32(value.f32);
        } else {
            fprintf(stderr, "Bad number tag %d\n", value.tag);
            throw "Unknown number tag";
        }
    }

    void writeString(Ark_String value) {
        writeInt32(value.length + 1);
        strcpy((char*)(data + position), value.chars);
        position += value.length + 1;
    }

    void writeBoolean(Ark_Boolean value) {
        writeInt8(value);
    }

    void writeLength(Ark_Length value) {
        Ark_RuntimeType tag = (Ark_RuntimeType) value.type;
        writeInt8(tag);
        switch (tag) {
            case ARK_RUNTIME_NUMBER:
                writeFloat32(value.value);
                break;
            case ARK_RUNTIME_OBJECT:
                writeInt32(value.resource);
                break;
            case ARK_RUNTIME_STRING: {
                char buf[64];
                std::string suffix;
                switch (value.unit) {
                    case 0: suffix = "px"; break;
                    case 1: suffix = "vp"; break;
                    case 2: suffix = "fp"; break;
                    case 3: suffix = "%"; break;
                    case 4: suffix = "lpx"; break;
                }
                snprintf(buf, 64, "%.8f%s", value.value, suffix.c_str());
                Ark_String str =  { buf, (Ark_Int32) strlen(buf) };
                writeString(str);
                break;
            }
            default:
                break;
        }
    }

    void writeFunction(Ark_Function value) {
        writeInt32(registerCallback(value));
    }

    Ark_Int32 registerCallback(Ark_Function callback) {
        // TODO: fix me!
        return 42;
    }

    void writeCustomObject(std::string type, Ark_CustomObject value) {
        // TODO implement
    }

    void writeMaterialized(Ark_Materialized value) {
        // There should be no need to pass accessors back from native code
        throw "Trying to pass materialized class back from native code -- is that really needed?";
    }
};

#endif // _SERIALIZER_BASE_H