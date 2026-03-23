/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

#pragma once
#include <types.h>

/// C API

void* idlize_runtime_RawMemory_allocate();
int32_t idlize_runtime_RawMemory_getLength(void*);
void idlize_runtime_RawMemory_free(void*);

void idlize_runtime_SerializerBase_writeUInt8(void*, uint8_t);
void idlize_runtime_SerializerBase_writeInt32(void*, int32_t);
void idlize_runtime_SerializerBase_writeString(void*, String);
void idlize_runtime_SerializerBase_writePointer(void*, NativePointer);
void* idlize_runtime_SerializerBase_swap(void*);
void* idlize_runtime_SerializerBase_use(void*);

UInt8 idlize_runtime_DeserializerBase_readUInt8(void*);
Int32 idlize_runtime_DeserializerBase_readInt32(void*);
String idlize_runtime_DeserializerBase_readString(void*);
NativePointer idlize_runtime_DeserializerBase_readPointer(void*);
void* idlize_runtime_DeserializerBase_swap(void*);
void* idlize_runtime_DeserializerBase_use(void*);

typedef struct _idlizer_runtime_native_Event {
    Int32 eventKind;
    Int32 resourceId;
    NativePointer memory;
} _idlizer_runtime_native_Event;

typedef struct idlize_runtime_api {
    NativePointer (*RawMemory_allocate)();
    int32_t (*RawMemory_getLength)(NativePointer);
    void (*RawMemory_free)(NativePointer);
    void (*SerializerBase_writeUInt8)(NativePointer, UInt8);
    void (*SerializerBase_writeInt32)(NativePointer, Int32);
    void (*SerializerBase_writeString)(NativePointer, String);
    void (*SerializerBase_writePointer)(NativePointer, NativePointer);
    NativePointer (*SerializerBase_swap)(NativePointer);
    NativePointer (*SerializerBase_use)(NativePointer);
    UInt8 (*DeserializerBase_readUInt8)(NativePointer);
    Int32 (*DeserializerBase_readInt32)(NativePointer);
    String (*DeserializerBase_readString)(NativePointer);
    NativePointer (*DeserializerBase_readPointer)(NativePointer);
    NativePointer (*DeserializerBase_swap)(NativePointer);
    NativePointer (*DeserializerBase_use)(NativePointer);
    _idlizer_runtime_native_Event (*poll)();
} idlize_runtime_api;

idlize_runtime_api* getAPI();

/// CPP API

class DeserializerBase;
class SerializerBase;
class RawMemory;

class RawMemory {
public:
    static RawMemory allocate();
    Int32 getLength();
    NativePointer getPointer();
    void free();
private:
    RawMemory(NativePointer idx): _idx(idx) {}
    NativePointer _idx;
    bool taken = false;

    friend class SerializerBase;
    friend class DeserializerBase;
};

class DeserializerBase {
public:
    static DeserializerBase fromPointer(NativePointer, Int32);
    UInt8 readUInt8();
    Int32 readInt32();
    String readString();
    NativePointer readPointer();
    SerializerBase swap();
private:
    DeserializerBase(NativePointer idx): _idx(idx) {}
    NativePointer _idx;

    friend class RawMemory;
    friend class SerializerBase;
};

class SerializerBase {
public:
    static SerializerBase use(RawMemory);

    void writeUInt8(UInt8);
    void writeInt32(Int32);
    void writeString(String);
    void writePointer(NativePointer);
    DeserializerBase swap();

private:
    SerializerBase(NativePointer idx): _idx(idx) {}
    NativePointer _idx;

    friend class RawMemory;
    friend class DeserializerBase;
};

/// ADDONS

void enqueueCallback(Int32, RawMemory);
