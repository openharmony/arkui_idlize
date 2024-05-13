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

inline const char* tagName(Ark_Tag tag) {
  switch (tag) {
    case Ark_Tag::ARK_TAG_UNDEFINED: return "UNDEFINED";
    case Ark_Tag::ARK_TAG_INT32: return "INT32";
    case Ark_Tag::ARK_TAG_FLOAT32: return "FLOAT32";
    case Ark_Tag::ARK_TAG_LENGTH: return "LENGTH";
    case Ark_Tag::ARK_TAG_RESOURCE: return "RESOURCE";
    case Ark_Tag::ARK_TAG_STRING: return "STRING";
    case Ark_Tag::ARK_TAG_OBJECT: return "OBJECT";
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

// TODO: restore full printing!
template <typename T>
inline void WriteToString(string* result, T value) = delete;

inline void WriteToString(string* result, const Ark_Empty& value) {
}

struct Error {
  std::string message;
  Error(const std::string &message) : message(message) {}
};

template <>
inline void WriteToString(string* result, const Ark_Number* value) {
  if (value->tag == ARK_TAG_FLOAT32) {
    // print with precision 2 digits after dot
    std::string fv = std::to_string(value->f32);
    size_t i = fv.find(".");
    fv = (i != std::string::npos && (i + 3) < fv.length()) ? fv.substr(0, i + 3) : fv;
    result->append(fv);
  } else
    result->append(std::to_string(value->i32));
}

template <>
inline void WriteToString(string* result, Ark_Tag value) {
  result->append(tagName(value));
}

template <>
inline void WriteToString(string* result, const Ark_Function* value) {
   result->append("\"");
   result->append("Function ");
   result->append(std::to_string(value->id));
   result->append("\"");
}

template <>
inline void WriteToString(string* result, const Ark_Materialized* value) {
  char hex[20];
  std::snprintf(hex, sizeof(hex), "%p", value->ptr);
   result->append("\"");
   result->append("Materialized ");
   result->append(hex);
   result->append("\"");
}

// TODO: generate!
template <>
inline void WriteToString(string* result, const Ark_Length* value) {
  result->append("Length {");
  result->append("value=");
  result->append(std::to_string(value->value));
  result->append(", unit=" + string(getUnitName(value->unit)));
  result->append(", resource=" + std::to_string(value->resource));
  result->append("}");
}

inline Ark_Length Length_from_array(Ark_Int32* array) {
  Ark_Length result;
  result.value = *(Ark_Float32*)array;
  result.unit = array[1];
  result.resource = array[2];
  return result;
}

class ArgDeserializerBase;

inline void WriteToString(string* result, Ark_Undefined value) {
  result->append("undefined");
}

inline void WriteToString(string* result, const Ark_Undefined* value) {
  result->append("undefined");
}

inline void WriteToString(string* result, const Ark_CustomObject* value) {
  if (strcmp(value->kind, "NativeErrorFunction") == 0) {
    result->append("() => {} /* TBD: Function*/");
    return;
  }
  result->append("Custom kind=");
  result->append(value->kind);
  result->append(" id=");
  result->append(std::to_string(value->id));
}

struct CustomDeserializer {
  virtual ~CustomDeserializer() {}
  virtual bool supports(const string& kind) { return false; }
  virtual Ark_CustomObject deserialize(ArgDeserializerBase* deserializer, const string& kind) {
    Ark_CustomObject result;
    strcpy(result.kind, "error");
    return result;
  }
  CustomDeserializer* next = nullptr;
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
  void resizeArray(T* array, int32_t length) {
    void* value = nullptr;
    if (length > 0) {
      value = malloc(length * sizeof(E));
      memset(value, 0, length * sizeof(E));
      toClean.push_back(value);
    }
    array->array_length = length;
    array->array = reinterpret_cast<E*>(value);
  }

  int32_t currentPosition() const { return this->position; }

  void check(int32_t count)
  {
    if (position + count > length)
    {
      assert(false);
    }
  }

  Ark_CustomObject readCustomObject(string kind) {
      auto* current = ArgDeserializerBase::customDeserializers;
      while (current) {
        if (current->supports(kind)) {
          return current->deserialize(this, kind);
        }
      }
      fprintf(stderr, "Unsupported custom deserialization for %s\n", kind.c_str());
      auto tag = readTag();
      assert(tag == ARK_TAG_UNDEFINED);
      // Skip updefined tag!.
      Ark_CustomObject result;
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
  Ark_Tag readTag() {
    return (Ark_Tag)readInt8();
  }
  Ark_Boolean readBoolean()
  {
    check(1);
    int8_t value = *(data + position);
    position += 1;
    return value;
  }
  Ark_Int32 readInt32()
  {
    check(4);
    auto value = *(Ark_Int32 *)(data + position);
    position += 4;
    return value;
  }
  Ark_Float32 readFloat32()
  {
    check(4);
    auto value = *(Ark_Float32 *)(data + position);
    position += 4;
    return value;
  }
  Ark_NativePointer readPointer()
  {
    check(8);
    int64_t value = *(int64_t*)(data + position);
    position += 8;
    return reinterpret_cast<Ark_NativePointer>(value);
  }
  Ark_Number readNumber()
  {
    check(5);
    Ark_Number result;
    result.tag = readTag();
    if (result.tag == Ark_Tag::ARK_TAG_INT32)
    {
      result.i32 = readInt32();
    }
    else if (result.tag == Ark_Tag::ARK_TAG_FLOAT32)
    {
      result.f32 = readFloat32();
    } else {
      fprintf(stderr, "Bad number tag %d\n", result.tag);
      throw "Unknown number tag";
    }
    return result;
  }

  Ark_Length readLength()
  {
    Ark_Length result;
    Ark_Tag tag = readTag();
    if (tag == Ark_Tag::ARK_TAG_LENGTH) {
      result.value = readFloat32();
      result.unit = readInt32();
      result.resource = readInt32();
    } else {
      fprintf(stderr, "Bad length tag %d\n", tag);
      throw "Error";
    }
    return result;
  }

  Ark_String readString()
  {
    Ark_String result;
    Ark_Int32 length = readInt32();
    check(length);
    // We refer to string data in-place.
    result.chars = (const char*)(data + position);
    result.length = length;
    this->position += length;
    return result;
  }

  Ark_Function readFunction() {
    Ark_Function result;
    result.id = readInt32();
    return result;
  }

  Ark_Materialized readMaterialized() {
    Ark_Materialized result;
    result.ptr = readPointer();
    return result;
  }

  Ark_Undefined readUndefined() {
    return Ark_Undefined();
  }
};

inline void WriteToString(string* result, Ark_Boolean value) {
    result->append(value ? "true" : "false");
}

template <>
inline void WriteToString(string* result, Ark_Int32 value) {
  result->append(std::to_string(value));
}

inline void WriteToString(string* result, const Ark_String* value) {
    result->append("\"");
    if (value->chars)
      result->append(value->chars);
    else
      result->append("<null>");
    result->append("\"");
}
