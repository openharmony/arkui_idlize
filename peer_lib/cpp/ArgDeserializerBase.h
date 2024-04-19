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
#include <stdint.h>

#include <cassert>
#include <cstring>
#include <string>
#include <vector>

#include "common-interop.h"
#include "arkoala_api.h"

using namespace std;

// Must be synced with "enum RuntimeType" in TS.
enum RuntimeType
{
  RUNTIME_UNEXPECTED = -1,
  RUNTIME_NUMBER = 1,
  RUNTIME_STRING = 2,
  RUNTIME_OBJECT = 3,
  RUNTIME_BOOLEAN = 4,
  RUNTIME_UNDEFINED = 5,
  RUNTIME_BIGINT = 6,
  RUNTIME_FUNCTION = 7,
  RUNTIME_SYMBOL = 8
};

inline const char* tagName(Tags tag) {
  switch (tag) {
    case Tags::TAG_UNDEFINED: return "UNDEFINED";
    case Tags::TAG_INT32: return "INT32";
    case Tags::TAG_FLOAT32: return "FLOAT32";
    case Tags::TAG_LENGTH: return "LENGTH";
    case Tags::TAG_RESOURCE: return "RESOURCE";
    case Tags::TAG_STRING: return "STRING";
    case Tags::TAG_OBJECT: return "OBJECT";
  }
  fprintf(stderr, "tag name %d is wrong\n", tag);
  throw "Error";
}

inline const char* getUnitName(int value) {
  switch (value) {
    case 0: return "px";
    case 1: return "vp";
    case 3: return "%";
    case 4: return "lpx";
    default: return "<unknown>";
  }
}

template <typename T>
inline void WriteToString(string* result, T value) = delete;

inline void WriteToString(string* result, const Empty& value) {
}

struct Error {
  std::string message;
  Error(const std::string &message) : message(message) {}
};

template <>
inline void WriteToString(string* result, Number value) {
  if (value.tag == TAG_FLOAT32)
    result->append(std::to_string(value.f32));
  else
    result->append(std::to_string(value.i32));
}

template <>
inline void WriteToString(string* result, Tags value) {
  result->append(tagName(value));
}

// TODO: generate!
template <>
inline void WriteToString(string* result, const Length* value) {
  result->append("Length {");
  result->append("value=");
  result->append(std::to_string(value->value));
  result->append(", unit=" + string(getUnitName(value->unit)));
  result->append(", resource=" + std::to_string(value->resource));
  result->append("}");
}

inline Length Length_from_array(int32_t *array) {
  Length result;
  result.value = *(float32_t *)array;
  result.unit = array[1];
  result.resource = array[2];
  return result;
}

class ArgDeserializerBase;

inline void WriteToString(string* result, Undefined value) {
  result->append("undefined");
}

inline void WriteToString(string* result, const Undefined* value) {
  result->append("undefined");
}

inline void WriteToString(string* result, const CustomObject* value) {
  if (strcmp(value->kind, "NativeErrorFunction") == 0) {
    result->append("() => {} /* TBD: Function*/");
    return;
  }
  result->append("Custom kind=");
  result->append(value->kind);
  result->append(" id=");
  result->append(std::to_string(value->id));
}

inline void WriteToString(string* result, const Optional_CustomObject* value) {
  result->append("Optional_CustomObject {");
  result->append("tag=");
  result->append(tagName((Tags)value->tag));
  if (value->tag != TAG_UNDEFINED) {
    result->append(" value=");
    WriteToString(result, &value->value);
  }
  result->append("}");
}

struct CustomDeserializer {
  virtual bool supports(const string& kind) { return false; }
  virtual CustomObject deserialize(ArgDeserializerBase* deserializer, const string& kind) {
    CustomObject result;
    strcpy(result.kind, "error");
    return result;
  }
  CustomDeserializer* next = nullptr;
};

struct AnimationRange {
  Number value0;
  Number value1;
};

class ArgDeserializerBase
{
protected:
  uint8_t *data;
  int32_t length;
  int32_t position;
  std::vector<void*> toClean;

  static CustomDeserializer* customDeserializers;
public:
  ArgDeserializerBase(uint8_t *data, int32_t length)
      : data(data), length(length), position(0) {}

  ~ArgDeserializerBase() {
    for (auto data: toClean) {
      free(data);
    }
  }

  static void registerCustomDeserializer(CustomDeserializer* deserializer) {
    if (ArgDeserializerBase::customDeserializers == nullptr) {
      ArgDeserializerBase::customDeserializers = deserializer;
    } else {
      auto* current = ArgDeserializerBase::customDeserializers;
      while (current->next != nullptr) current = current->next;
      current->next = deserializer;
    }
  }

  template <typename T, typename E>
  void resizeArray(T& array, int32_t length) {
    void* value = malloc(length * sizeof(T));
    toClean.push_back(value);
    array.array_length = length;
    array.array = reinterpret_cast<E*>(value);
  }

  int32_t currentPosition() const { return this->position; }

  void check(int32_t count)
  {
    if (position + count > length)
    {
      assert(false);
    }
  }

  CustomObject readCustom(string kind) {
      auto* current = ArgDeserializerBase::customDeserializers;
      while (current) {
        if (current->supports(kind)) {
          return current->deserialize(this, kind);
        }
      }
      fprintf(stderr, "Unsupported custom deserialization for %s\n", kind.c_str());
      int tag = readInt8();
      assert(tag == TAG_UNDEFINED);
      // Skip updefined tag!.
      CustomObject result;
      strcpy(result.kind, "Error");
      strcat(result.kind, kind.c_str());
      return result;
  }

  int8_t readInt8() {
    check(1);
    int8_t value = *(data + position);
    position += 1;
    return value;
  }
  bool readBoolean()
  {
    check(1);
    int8_t value = *(data + position);
    position += 1;
    return value;
  }
  int32_t readInt32()
  {
    check(4);
    auto value = *(int32_t *)(data + position);
    position += 4;
    return value;
  }
  float32_t readFloat32()
  {
    check(4);
    auto value = *(float32_t *)(data + position);
    position += 4;
    return value;
  }
  Number readNumber()
  {
    check(5);
    Number result;
    result.tag = (Tags)readInt8();
    if (result.tag == Tags::TAG_INT32)
    {
      result.i32 = readInt32();
    }
    else if (result.tag == Tags::TAG_FLOAT32)
    {
      result.f32 = readFloat32();
    } else {
      fprintf(stderr, "Bad number tag %d\n", result.tag);
      throw "Unknown number tag";
    }
    return result;
  }

  Length readLength()
  {
    Length result;
    Tags tag = (Tags)readInt8();
    if (tag == Tags::TAG_LENGTH) {
      result.value = readFloat32();
      result.unit = readInt32();
      result.resource = readInt32();
    } else {
      fprintf(stderr, "Bad length tag %d\n", tag);
      throw "Error";
    }
    return result;
  }
  AnimationRange readAnimationRange()
  {
    AnimationRange result;
    result.value0 = readNumber();
    result.value1 = readNumber();
    return result;
  }

  String readString()
  {
    String result;
    int32_t length = readInt32();
    check(length);
    // We refer to string data in-place.
    result.chars = (const char*)(data + position);
    result.length = length;
    this->position += length;
    return result;
  }

  Function readFunction()
  {
    return readCustom("Function");
  }

  Callback readCallback()
  {
    return readFunction();
  }

  ErrorCallback readErrorCallback()
  {
    return readFunction();
  }

  Undefined readUndefined() {
    return Undefined();
  }
};

inline void WriteToString(string* result, Boolean value) {
    result->append(value ? "true" : "false");
}

template <>
inline void WriteToString(string* result, KInt value) {
  result->append(std::to_string(value));
}

inline void WriteToString(string* result, String* value) {
    result->append("\"");
    if (value->chars)
      result->append(value->chars);
    else
      result->append("<null>");
    result->append("\"");
}

inline void WriteToString(string* result, const String* value) {
    result->append("\"");
    if (value->chars)
      result->append(value->chars);
    else
      result->append("<null>");
    result->append("\"");
}
