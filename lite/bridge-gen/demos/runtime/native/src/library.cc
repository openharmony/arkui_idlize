#include <stdint.h>
#include <stdio.h>
#include <idlizer/runtime.h>
#include <unordered_map>
#include <queue>
#include <string>

#define INTEROP_BUFFER_COUNT 16
#define INTEROP_BUFFER_SIZE 2048

typedef struct interop_buffer {
    Int32 id;
    uint16_t top;
    char memory[INTEROP_BUFFER_SIZE];
} interop_buffer;

static interop_buffer cached_buffers[INTEROP_BUFFER_COUNT];
static Int32 free_buffer_stack_top = INTEROP_BUFFER_COUNT;
static bool free_buffer_initialized = false;
static Int32 free_buffer_stack[INTEROP_BUFFER_COUNT];

interop_buffer* get_buffer(void* ptr) {
    return cached_buffers + (Int32)(uintptr_t)ptr;
}

void initialize_buffers() {
    if (free_buffer_initialized) {
        return;
    }
    free_buffer_initialized = true;
    for (int i = 0; i < INTEROP_BUFFER_COUNT; ++i) {
        free_buffer_stack[i] = INTEROP_BUFFER_COUNT - 1 - i;
    }
}

///

static Int32 string_pool_index = 0;
static std::unordered_map<UInt64, std::string> string_pool;

UInt64 idlize_runtime_StringPool_add(const char* string) {
    std::string allocated = string;
    UInt64 hash = std::hash<std::string>{}(allocated);
    if (string_pool.find(hash) != string_pool.end()) {
        return hash;
    }
    string_pool[hash] = std::move(allocated);
    return hash;
}
const char* idlize_runtime_StringPool_get(UInt64 hash) {
    return string_pool[hash].c_str();
}

//////////////////////////////////

void* idlize_runtime_RawMemory_allocate() {
    initialize_buffers();
    --free_buffer_stack_top;
    Int32 last = free_buffer_stack[free_buffer_stack_top];
    return (void*)(uintptr_t)(last);
}
int32_t idlize_runtime_RawMemory_getLength(void* self) {
    interop_buffer* buffer = get_buffer(self);
    return (int32_t)buffer->top;
}
void idlize_runtime_RawMemory_free(void* self) {
    interop_buffer* buffer = get_buffer(self);
    buffer->top = 0;
    Int32 idx = (Int32)(uintptr_t)self;
    free_buffer_stack[free_buffer_stack_top++] = idx;
}

///

template <typename T>
void idlize_runtime_WriteT(void* self, T val) {
    interop_buffer* buffer = get_buffer(self);
    T* mem = (T*)(buffer->memory + buffer->top);
    *mem = val;
    buffer->top += sizeof(T);
}

void idlize_runtime_SerializerBase_writeUInt8(void* self, UInt8 val) {
    idlize_runtime_WriteT<UInt8>(self, val);
}
void idlize_runtime_SerializerBase_writeInt32(void* self, Int32 val) {
    idlize_runtime_WriteT<Int32>(self, val);
}
void idlize_runtime_SerializerBase_writeUInt64(void* self, UInt64 val) {
    idlize_runtime_WriteT<UInt64>(self, val);
}
void idlize_runtime_SerializerBase_writeString(void* self, String val) {
    UInt64 hash = idlize_runtime_StringPool_add(val);
    idlize_runtime_SerializerBase_writeUInt64(self, hash);
}
void idlize_runtime_SerializerBase_writePointer(void* self, NativePointer val) {
    idlize_runtime_WriteT<NativePointer>(self, val);
}
void* idlize_runtime_SerializerBase_swap(void* self) {
    interop_buffer* buffer = get_buffer(self);
    buffer->top = 0;
    return self;
}
void* idlize_runtime_SerializerBase_use(void* self) {
    return self;
}

///

template <typename T>
T idlize_runtime_ReadT(void* self) {
    interop_buffer* buffer = get_buffer(self);
    T* mem = (T*)(buffer->memory + buffer->top);
    T result = *mem;
    buffer->top += sizeof(T);
    return result;
}

UInt8 idlize_runtime_DeserializerBase_readUInt8(void* self) {
    return idlize_runtime_ReadT<UInt8>(self);
}
Int32 idlize_runtime_DeserializerBase_readInt32(void* self) {
    return idlize_runtime_ReadT<Int32>(self);
}
UInt64 idlize_runtime_DeserializerBase_readUInt64(void* self) {
    return idlize_runtime_ReadT<UInt64>(self);
}
String idlize_runtime_DeserializerBase_readString(void* self) {
    UInt64 hash = idlize_runtime_DeserializerBase_readUInt64(self);
    return idlize_runtime_StringPool_get(hash);
}
NativePointer idlize_runtime_DeserializerBase_readPointer(void* self) {
    return idlize_runtime_ReadT<NativePointer>(self);
}
void* idlize_runtime_DeserializerBase_swap(void* self) {
    interop_buffer* buffer = get_buffer(self);
    buffer->top = 0;
    return self;
}
void* idlize_runtime_DeserializerBase_use(void* self) {
    return self;
}

//////////////////////////////////

static std::queue<_idlizer_runtime_native_Event> queuedEvents;

void enqueueCallback(Int32 resourceId, RawMemory memory) {
    queuedEvents.push(
        (_idlizer_runtime_native_Event) {
            .eventKind = 1,
            .resourceId = resourceId,
            .memory = memory.getPointer()
        }
    );
}

_idlizer_runtime_native_Event idlize_runtime_poll() {
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

//////////////////////////////////

idlize_runtime_api* getAPI() {
    static idlize_runtime_api api = (idlize_runtime_api) {
        idlize_runtime_RawMemory_allocate,
        idlize_runtime_RawMemory_getLength,
        idlize_runtime_RawMemory_free,
        idlize_runtime_SerializerBase_writeUInt8,
        idlize_runtime_SerializerBase_writeInt32,
        idlize_runtime_SerializerBase_writeString,
        idlize_runtime_SerializerBase_writePointer,
        idlize_runtime_SerializerBase_swap,
        idlize_runtime_SerializerBase_use,
        idlize_runtime_DeserializerBase_readUInt8,
        idlize_runtime_DeserializerBase_readInt32,
        idlize_runtime_DeserializerBase_readString,
        idlize_runtime_DeserializerBase_readPointer,
        idlize_runtime_DeserializerBase_swap,
        idlize_runtime_DeserializerBase_use,
        idlize_runtime_poll,
    };
    return &api;
}

//////////////////////////////////

RawMemory RawMemory::allocate() {
    return RawMemory { idlize_runtime_RawMemory_allocate() };
}
void RawMemory::free() {
    return idlize_runtime_RawMemory_free(this->_idx);
}
Int32 RawMemory::getLength() {
    return idlize_runtime_RawMemory_getLength(this->_idx);
}
NativePointer RawMemory::getPointer() {
    return (NativePointer)(uintptr_t)this->_idx;
}

DeserializerBase DeserializerBase::fromPointer(NativePointer ptr, Int32 length) {
    return DeserializerBase { idlize_runtime_SerializerBase_swap(ptr) };
}
UInt8 DeserializerBase::readUInt8() {
    return idlize_runtime_DeserializerBase_readUInt8(this->_idx);
}
Int32 DeserializerBase::readInt32() {
    return idlize_runtime_DeserializerBase_readInt32(this->_idx);
}
String DeserializerBase::readString() {
    return idlize_runtime_DeserializerBase_readString(this->_idx);
}
NativePointer DeserializerBase::readPointer() {
    return idlize_runtime_DeserializerBase_readPointer(this->_idx);
}
SerializerBase DeserializerBase::swap() {
    return SerializerBase { idlize_runtime_DeserializerBase_swap(this->_idx) };
}

SerializerBase SerializerBase::use(RawMemory memory) {
    return SerializerBase { idlize_runtime_SerializerBase_use(memory._idx) };
}
void SerializerBase::writeUInt8(UInt8 val) {
    idlize_runtime_SerializerBase_writeUInt8(this->_idx, val);
}
void SerializerBase::writeInt32(Int32 val) {
    idlize_runtime_SerializerBase_writeInt32(this->_idx, val);
}
void SerializerBase::writeString(String val) {
    idlize_runtime_SerializerBase_writeString(this->_idx, val);
}
void SerializerBase::writePointer(NativePointer val) {
    idlize_runtime_SerializerBase_writePointer(this->_idx, val);
}
DeserializerBase SerializerBase::swap() {
    return DeserializerBase { idlize_runtime_SerializerBase_swap(this->_idx) };
}
