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

#ifndef _INTEROP_TYPES_H
#define _INTEROP_TYPES_H

#include <stdint.h>
#include <stdlib.h>
#include <string.h>

struct KStringPtrImpl {
    KStringPtrImpl(const char* str) : _value(nullptr) {
        int len = str ? strlen(str) : 0;
        assign(str, len);
    }
    KStringPtrImpl(const char* str, int len) : _value(nullptr) {
        assign(str, len);
    }
    KStringPtrImpl() : _value(nullptr), _length(0)  {}

    // TODO: shall be `delete` as well.
    KStringPtrImpl(KStringPtrImpl& other) {
        this->_value = other.release();
    }
    KStringPtrImpl& operator=(KStringPtrImpl& other) = delete;

    ~KStringPtrImpl() { if (_value) free(_value); }

    bool isNull() const { return _value == nullptr; }
    const char* c_str() const { return _value; }
    char* data() const { return _value; }
    int length() const { return _length; }

    void resize(int size) {
        // Ignore old content.
        if (_value) free(_value);
        _value = reinterpret_cast<char*>(malloc(size + 1));
        _value[size] = 0;
        _length = size;
    }

    void assign(const char* data) {
        assign(data, data ? strlen(data) : 0);
    }

    void assign(const char* data, int len) {
        if (_value) free(_value);
        if (data) {
            _value = reinterpret_cast<char*>(malloc(len + 1));
            memcpy(_value, data, len);
            _value[len] = 0;
        } else {
            _value = nullptr;
        }
        _length = len;
    }

  protected:
    char* release() {
        char* result = this->_value;
        this->_value = nullptr;
        return result;
    }
  private:
    char* _value;
    int _length;
};

typedef int8_t KBoolean;
typedef uint8_t KByte;
typedef int16_t KChar;
typedef int16_t KShort;
typedef uint16_t KUShort;
typedef int32_t KInt;
typedef uint32_t KUInt;
typedef float KFloat;
typedef int64_t KLong;
typedef double KDouble;
typedef void* KNativePointer;
typedef KStringPtrImpl KStringPtr;
typedef const uint8_t* KStringArray;
typedef void** KNativePointerArray;

struct _KVMContext;
typedef _KVMContext *KVMContext;

#endif /* _INTEROP_TYPES_H */
