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

#ifndef _ARG_SERIALIZER_BASE_H
#define _ARG_SERIALIZER_BASE_H

#include <stdint.h>

#include "common-interop.h"
#include "arkoala_api.h"

class ArgSerializerBase {
private:
    uint8_t* data;
    int position;
public:
    ArgSerializerBase(uint8_t* data): data(data), position(0) {}

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
};

#endif