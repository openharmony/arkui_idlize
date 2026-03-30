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

void* IdlizeRuntimeRawMemoryAllocate();
int32_t IdlizeRuntimeRawMemoryGetLength(void*);
void IdlizeRuntimeRawMemoryFree(void*);

void IdlizeRuntimeSerializerBaseWriteUInt8(void*, uint8_t);
void IdlizeRuntimeSerializerBaseWriteInt32(void*, int32_t);
void IdlizeRuntimeSerializerBaseWriteString(void*, String);
void IdlizeRuntimeSerializerBaseWritePointer(void*, NativePointer);
void* IdlizeRuntimeSerializerBaseSwap(void*);
void* IdlizeRuntimeSerializerBaseUse(void*);

UInt8 IdlizeRuntimeDeserializerBaseReadUInt8(void*);
Int32 IdlizeRuntimeDeserializerBaseReadInt32(void*);
String IdlizeRuntimeDeserializerBaseReadString(void*);
NativePointer IdlizeRuntimeDeserializerBaseReadPointer(void*);
void* IdlizeRuntimeDeserializerBaseSwap(void*);
void* IdlizeRuntimeDeserializerBaseUse(void*);

typedef struct IdlizerRuntimeNativeEvent {
    Int32 eventKind;
    Int32 resourceId;
    NativePointer memory;
} IdlizerRuntimeNativeEvent;

typedef struct idlize_runtime_api {
    NativePointer (*RawMemoryAllocate)();
    int32_t (*RawMemoryGetLength)(NativePointer);
    void (*RawMemoryFree)(NativePointer);
    void (*SerializerBaseWriteUInt8)(NativePointer, UInt8);
    void (*SerializerBaseWriteInt32)(NativePointer, Int32);
    void (*SerializerBaseWriteString)(NativePointer, String);
    void (*SerializerBaseWritePointer)(NativePointer, NativePointer);
    NativePointer (*SerializerBaseSwap)(NativePointer);
    NativePointer (*SerializerBaseUse)(NativePointer);
    UInt8 (*DeserializerBaseReadUInt8)(NativePointer);
    Int32 (*DeserializerBaseReadInt32)(NativePointer);
    String (*DeserializerBaseReadString)(NativePointer);
    NativePointer (*DeserializerBaseReadPointer)(NativePointer);
    NativePointer (*DeserializerBaseSwap)(NativePointer);
    NativePointer (*DeserializerBaseUse)(NativePointer);
    IdlizerRuntimeNativeEvent (*Poll)();
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
    RawMemory(NativePointer idx) : _idx(idx) {}
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
    DeserializerBase(NativePointer idx) : _idx(idx) {}
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
    SerializerBase(NativePointer idx) : _idx(idx) {}
    NativePointer _idx;

    friend class RawMemory;
    friend class DeserializerBase;
};

/// ADDONS

void enqueueCallback(Int32, RawMemory);
