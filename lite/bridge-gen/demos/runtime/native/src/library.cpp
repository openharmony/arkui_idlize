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

#include <idlizer/runtime.h>
#include <queue>
#include <cstdint>
#include <cstdio>
#include <string>
#include <unordered_map>

#define INTEROP_BUFFER_COUNT 16
#define INTEROP_BUFFER_SIZE 2048

typedef struct interop_buffer {
    Int32 id;
    uint16_t top;
    char memory[INTEROP_BUFFER_SIZE];
} interop_buffer;

static interop_buffer g_cachedBuffers[INTEROP_BUFFER_COUNT];
static Int32 g_freeBufferStackTop = INTEROP_BUFFER_COUNT;
static bool g_freeBufferInitialized = false;
static Int32 g_freeBufferStack[INTEROP_BUFFER_COUNT];

interop_buffer* GetBuffer(void* ptr)
{
    return g_cachedBuffers + (Int32)(uintptr_t)ptr;
}

void InitializeBuffers()
{
    if (g_freeBufferInitialized) {
        return;
    }
    g_freeBufferInitialized = true;
    for (int i = 0; i < INTEROP_BUFFER_COUNT; ++i) {
        g_freeBufferStack[i] = INTEROP_BUFFER_COUNT - 1 - i;
    }
}

static Int32 g_stringPoolIndex = 0;
static std::unordered_map<UInt64, std::string> g_stringPool;

UInt64 IdlizeRuntimeStringPoolAdd(const char* string)
{
    std::string allocated = string;
    UInt64 hash = std::hash<std::string> {}(allocated);
    if (g_stringPool.find(hash) != g_stringPool.end()) {
        return hash;
    }
    g_stringPool[hash] = std::move(allocated);
    return hash;
}
const char* IdlizeRuntimeStringPoolGet(UInt64 hash)
{
    return g_stringPool[hash].c_str();
}

void* IdlizeRuntimeRawMemoryAllocate()
{
    InitializeBuffers();
    --g_freeBufferStackTop;
    Int32 last = g_freeBufferStack[g_freeBufferStackTop];
    return (void*)(uintptr_t)(last);
}
int32_t IdlizeRuntimeRawMemoryGetLength(void* self)
{
    interop_buffer* buffer = GetBuffer(self);
    return static_cast<int32_t>(buffer->top);
}
void IdlizeRuntimeRawMemoryFree(void* self)
{
    interop_buffer* buffer = GetBuffer(self);
    buffer->top = 0;
    Int32 idx = (Int32)(uintptr_t)self;
    g_freeBufferStack[g_freeBufferStackTop++] = idx;
}

template<typename T>
void IdlizeRuntimeWriteT(void* self, T val)
{
    interop_buffer* buffer = GetBuffer(self);
    T* mem = reinterpret_cast<T*>(buffer->memory + buffer->top);
    *mem = val;
    buffer->top += sizeof(T);
}

void IdlizeRuntimeSerializerBaseWriteUInt8(void* self, UInt8 val)
{
    IdlizeRuntimeWriteT<UInt8>(self, val);
}
void IdlizeRuntimeSerializerBaseWriteInt32(void* self, Int32 val)
{
    IdlizeRuntimeWriteT<Int32>(self, val);
}
void IdlizeRuntimeSerializerBaseWriteUInt64(void* self, UInt64 val)
{
    IdlizeRuntimeWriteT<UInt64>(self, val);
}
void IdlizeRuntimeSerializerBaseWriteString(void* self, String val)
{
    UInt64 hash = IdlizeRuntimeStringPoolAdd(val);
    IdlizeRuntimeSerializerBaseWriteUInt64(self, hash);
}
void IdlizeRuntimeSerializerBaseWritePointer(void* self, NativePointer val)
{
    IdlizeRuntimeWriteT<NativePointer>(self, val);
}
void* IdlizeRuntimeSerializerBaseSwap(void* self)
{
    interop_buffer* buffer = GetBuffer(self);
    buffer->top = 0;
    return self;
}
void* IdlizeRuntimeSerializerBaseUse(void* self)
{
    return self;
}

template<typename T>
T IdlizeRuntimeReadT(void* self)
{
    interop_buffer* buffer = GetBuffer(self);
    T* mem = reinterpret_cast<T*>(buffer->memory + buffer->top);
    T result = *mem;
    buffer->top += sizeof(T);
    return result;
}

UInt8 IdlizeRuntimeDeserializerBaseReadUInt8(void* self)
{
    return IdlizeRuntimeReadT<UInt8>(self);
}
Int32 IdlizeRuntimeDeserializerBaseReadInt32(void* self)
{
    return IdlizeRuntimeReadT<Int32>(self);
}
UInt64 IdlizeRuntimeDeserializerBaseReadUInt64(void* self)
{
    return IdlizeRuntimeReadT<UInt64>(self);
}
String IdlizeRuntimeDeserializerBaseReadString(void* self)
{
    UInt64 hash = IdlizeRuntimeDeserializerBaseReadUInt64(self);
    return IdlizeRuntimeStringPoolGet(hash);
}
NativePointer IdlizeRuntimeDeserializerBaseReadPointer(void* self)
{
    return IdlizeRuntimeReadT<NativePointer>(self);
}
void* IdlizeRuntimeDeserializerBaseSwap(void* self)
{
    interop_buffer* buffer = GetBuffer(self);
    buffer->top = 0;
    return self;
}
void* IdlizeRuntimeDeserializerBaseUse(void* self)
{
    return self;
}

static std::queue<_idlizer_runtime_native_Event> queuedEvents;

void EnqueueCallback(Int32 resourceId, RawMemory memory)
{
    queuedEvents.push(
        (_idlizer_runtime_native_Event) {
            .eventKind = 1,
            .resourceId = resourceId,
            .memory = memory.getPointer() });
}

_idlizer_runtime_native_Event IdlizeRuntimePoll()
{
    if (queuedEvents.size()) {
        _idlizer_runtime_native_Event event = queuedEvents.front();
        queuedEvents.pop();
        return event;
    }
    return (_idlizer_runtime_native_Event) {
        .eventKind = 0,
        .resourceId = 0,
        .memory = nullptr,
    };
}

idlize_runtime_api* getAPI()
{
    static idlize_runtime_api api = (idlize_runtime_api) {
        IdlizeRuntimeRawMemoryAllocate,
        IdlizeRuntimeRawMemoryGetLength,
        IdlizeRuntimeRawMemoryFree,
        IdlizeRuntimeSerializerBaseWriteUInt8,
        IdlizeRuntimeSerializerBaseWriteInt32,
        IdlizeRuntimeSerializerBaseWriteString,
        IdlizeRuntimeSerializerBaseWritePointer,
        IdlizeRuntimeSerializerBaseSwap,
        IdlizeRuntimeSerializerBaseUse,
        IdlizeRuntimeDeserializerBaseReadUInt8,
        IdlizeRuntimeDeserializerBaseReadInt32,
        IdlizeRuntimeDeserializerBaseReadString,
        IdlizeRuntimeDeserializerBaseReadPointer,
        IdlizeRuntimeDeserializerBaseSwap,
        IdlizeRuntimeDeserializerBaseUse,
        IdlizeRuntimePoll,
    };
    return &api;
}

RawMemory RawMemory::allocate()
{
    return RawMemory { IdlizeRuntimeRawMemoryAllocate() };
}
void RawMemory::free()
{
    return IdlizeRuntimeRawMemoryFree(this->_idx);
}
Int32 RawMemory::getLength()
{
    return IdlizeRuntimeRawMemoryGetLength(this->_idx);
}
NativePointer RawMemory::getPointer()
{
    return (NativePointer)(uintptr_t)this->_idx;
}

DeserializerBase DeserializerBase::fromPointer(NativePointer ptr, Int32 length)
{
    return DeserializerBase { IdlizeRuntimeSerializerBaseSwap(ptr) };
}
UInt8 DeserializerBase::readUInt8()
{
    return IdlizeRuntimeDeserializerBaseReadUInt8(this->_idx);
}
Int32 DeserializerBase::readInt32()
{
    return IdlizeRuntimeDeserializerBaseReadInt32(this->_idx);
}
String DeserializerBase::readString()
{
    return IdlizeRuntimeDeserializerBaseReadString(this->_idx);
}
NativePointer DeserializerBase::readPointer()
{
    return IdlizeRuntimeDeserializerBaseReadPointer(this->_idx);
}
SerializerBase DeserializerBase::swap()
{
    return SerializerBase { IdlizeRuntimeDeserializerBaseSwap(this->_idx) };
}

SerializerBase SerializerBase::use(RawMemory memory)
{
    return SerializerBase { IdlizeRuntimeSerializerBaseUse(memory._idx) };
}
void SerializerBase::writeUInt8(UInt8 val)
{
    IdlizeRuntimeSerializerBaseWriteUInt8(this->_idx, val);
}
void SerializerBase::writeInt32(Int32 val)
{
    IdlizeRuntimeSerializerBaseWriteInt32(this->_idx, val);
}
void SerializerBase::writeString(String val)
{
    IdlizeRuntimeSerializerBaseWriteString(this->_idx, val);
}
void SerializerBase::writePointer(NativePointer val)
{
    IdlizeRuntimeSerializerBaseWritePointer(this->_idx, val);
}
DeserializerBase SerializerBase::swap()
{
    return DeserializerBase { IdlizeRuntimeSerializerBaseSwap(this->_idx) };
}
