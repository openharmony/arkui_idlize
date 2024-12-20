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
#include "%NATIVE_API_HEADER_PATH%"

#include <cstdint>
#include <cassert>
#include <cstring>
#include <string>
#include <vector>


// callbacks.h

void holdManagedCallbackResource(OH_Int32 resourceId);
void releaseManagedCallbackResource(OH_Int32 resourceId);

// ---------

inline const char *tagName(OH_Tag tag)
{
  switch (tag)
  {
  case OH_Tag::OH_TAG_UNDEFINED:
    return "UNDEFINED";
  case OH_Tag::OH_TAG_INT32:
    return "INT32";
  case OH_Tag::OH_TAG_FLOAT32:
    return "FLOAT32";
  case OH_Tag::OH_TAG_LENGTH:
    return "LENGTH";
  case OH_Tag::OH_TAG_RESOURCE:
    return "RESOURCE";
  case OH_Tag::OH_TAG_STRING:
    return "STRING";
  case OH_Tag::OH_TAG_OBJECT:
    return "OBJECT";
  }
  fprintf(stderr, "tag name %d is wrong\n", tag);
  throw "Error";
}

inline const char *tagNameExact(OH_Tag tag)
{
  switch (tag)
  {
  case OH_Tag::OH_TAG_UNDEFINED:
    return "OH_TAG_UNDEFINED";
  case OH_Tag::OH_TAG_INT32:
    return "OH_TAG_INT32";
  case OH_Tag::OH_TAG_FLOAT32:
    return "OH_TAG_FLOAT32";
  case OH_Tag::OH_TAG_LENGTH:
    return "OH_TAG_LENGTH";
  case OH_Tag::OH_TAG_RESOURCE:
    return "OH_TAG_RESOURCE";
  case OH_Tag::OH_TAG_STRING:
    return "OH_TAG_STRING";
  case OH_Tag::OH_TAG_OBJECT:
    return "OH_TAG_OBJECT";
  }
  fprintf(stderr, "tag name %d is wrong\n", tag);
  throw "Error";
}

// TODO check if this is required
// inline OH_Function makeOhosFunctionFromId(OH_Int32 id) {
//   OH_Function result;
//   result.id = id;
//   return result;
// }

inline const char *getUnitName(int value)
{
  switch (value)
  {
  case 0:
    return "px";
  case 1:
    return "vp";
  case 2:
    return "fp";
  case 3:
    return "%";
  case 4:
    return "lpx";
  default:
    return "<unknown>";
  }
}

template <typename T>
inline void convertor(T value) = delete;

// TODO: restore full printing!
template <typename T>
inline void WriteToString(std::string *result, const T value) = delete;

template <typename T>
void WriteToString(std::string *result, const T *const value)
{
  result->append("0x" + std::to_string(reinterpret_cast<std::uintptr_t>(value)));
}

struct Error
{
  std::string message;
  Error(const std::string &message) : message(message) {}
};

template <>
inline void WriteToString(std::string *result, const OH_Number *value)
{
  result->append("{.tag=" + std::to_string(value->tag) + ", ");

  if (value->tag == OH_TAG_FLOAT32)
  {
    // print with precision 2 digits after dot
    std::string fv = std::to_string(value->f32);
    size_t i = fv.find(".");
    fv = (i != std::string::npos && (i + 3) < fv.length()) ? fv.substr(0, i + 3) : fv;
    result->append(".f32=" + fv);
  } else {
    result->append(".i32=" + std::to_string(value->i32));
  }

  result->append("}");
}

template <>
inline void WriteToString(std::string *result, OH_Tag value)
{
  result->append(".tag=");
  result->append(tagName(value));
}

/*
template <>
inline void WriteToString(std::string *result, OH_ObjectHandle value)
{
  result->append("0x" + std::to_string((uint64_t)value));
}

template <>
inline void WriteToString(std::string *result, OH_Function value)
{
  result->append("{");
  result->append(".id=" + std::to_string(value.id));
  result->append("}");
}

template <>
inline void WriteToString(std::string *result, const OH_Function* value)
{
  result->append("{");
  result->append(".id=" + std::to_string(value->id));
  result->append("}");
}
*/

template <>
inline void WriteToString(std::string *result, const OH_Materialized *value)
{
  char hex[20];
  std::snprintf(hex, sizeof(hex), "0x%llx", (long long)value->ptr);
  result->append("\"");
  result->append("Materialized ");
  result->append(hex);
  result->append("\"");
}

class DeserializerBase;

template <>
inline void WriteToString(std::string *result, OH_Undefined value)
{
  result->append("{}");
}

template <>
inline void WriteToString(std::string *result, const OH_Undefined *value)
{
  result->append("{}");
}

template <>
inline void WriteToString(std::string *result, const OH_CustomObject *value)
{
  if (strcmp(value->kind, "NativeErrorFunction") == 0)
  {
    result->append("() => {} /* TBD: Function*/");
    return;
  }
  result->append("{");
  result->append(".kind=\"");
  result->append(value->kind);
  result->append("\", .id=" + std::to_string(value->id));
  result->append("}");
}

template<>
inline void WriteToString(std::string *result, const OH_CallbackResource *value)
{
  result->append("{");
  result->append(".resourceId=" + std::to_string(value->resourceId));
  result->append(", .hold=0");
  result->append(", .release=0");
  result->append("}");
}

// TODO Implement CustomObject
struct CustomDeserializer
{
  virtual ~CustomDeserializer() {}
  virtual bool supports(const std::string &kind) { return false; }
  virtual OH_CustomObject deserialize(DeserializerBase *deserializer, const std::string &kind)
  {
    OH_CustomObject result;
    strcpy(result.kind, "error");
    return result;
  }
  CustomDeserializer *next = nullptr;
};

class DeserializerBase
{
protected:
  uint8_t *data;
  int32_t length;
  int32_t position;
  std::vector<void *> toClean;

  static CustomDeserializer *customDeserializers;

public:
  DeserializerBase(uint8_t *data, int32_t length)
      : data(data), length(length), position(0) {}

  ~DeserializerBase()
  {
    for (auto data : toClean)
    {
      free(data);
    }
  }

  static void registerCustomDeserializer(CustomDeserializer *deserializer)
  {
    if (DeserializerBase::customDeserializers == nullptr)
    {
      DeserializerBase::customDeserializers = deserializer;
    }
    else
    {
      auto *current = DeserializerBase::customDeserializers;
      while (current->next != nullptr)
        current = current->next;
      current->next = deserializer;
    }
  }

  template <typename T, typename E>
  void resizeArray(T *array, int32_t length)
  {
    void *value = nullptr;
    if (length > 0)
    {
      value = malloc(length * sizeof(E));
      memset(value, 0, length * sizeof(E));
      toClean.push_back(value);
    }
    array->length = length;
    array->array = reinterpret_cast<E *>(value);
  }

  template <typename T, typename K, typename V>
  void resizeMap(T *map, int32_t length)
  {
    void *keys = nullptr;
    void *values = nullptr;
    if (length > 0)
    {
      keys = malloc(length * sizeof(K));
      memset(keys, 0, length * sizeof(K));
      toClean.push_back(keys);

      values = malloc(length * sizeof(V));
      memset(values, 0, length * sizeof(V));
      toClean.push_back(values);
    }
    map->size = length;
    map->keys = reinterpret_cast<K *>(keys);
    map->values = reinterpret_cast<V *>(values);
  }

  int32_t currentPosition() const { return this->position; }

  void check(int32_t count)
  {
    if (position + count > length)
    {
      assert(false);
    }
  }

  OH_CustomObject readCustomObject(std::string kind)
  {
    auto *current = DeserializerBase::customDeserializers;
    while (current)
    {
      if (current->supports(kind))
      {
        return current->deserialize(this, kind);
      }
      current = current->next;
    }
    fprintf(stderr, "Unsupported custom deserialization for %s\n", kind.c_str());
    auto tag = readTag();
    assert(tag == OH_TAG_UNDEFINED);
    // Skip updefined tag!.
    OH_CustomObject result;
    strcpy(result.kind, "Error");
    strcat(result.kind, kind.c_str());
    return result;
  }

  int8_t readInt8()
  {
    check(1);
    int8_t value = *(data + position);
    position += 1;
    return value;
  }
  OH_Tag readTag()
  {
    return (OH_Tag)readInt8();
  }
  OH_Boolean readBoolean()
  {
    check(1);
    int8_t value = *(data + position);
    position += 1;
    return value;
  }
  OH_Int32 readInt32()
  {
    check(4);
    auto value = *(OH_Int32 *)(data + position);
    position += 4;
    return value;
  }
  OH_Int64 readInt64()
  {
    check(8);
    auto value = *(OH_Int64 *)(data + position);
    position += 8;
    return value;
  }
  OH_Float32 readFloat32()
  {
    check(4);
    auto value = *(OH_Float32 *)(data + position);
    position += 4;
    return value;
  }
  OH_NativePointer readPointer()
  {
    check(8);
    int64_t value = *(int64_t *)(data + position);
    position += 8;
    return reinterpret_cast<OH_NativePointer>(value);
  }

  OH_NativePointer readPointerOrDefault(OH_NativePointer defaultValue)
  {
    const OH_NativePointer value = this->readPointer();
    return value ? value : defaultValue;
  }

  OH_String readString()
  {
    OH_String result = "TODO";
    // TODO implement string
    // OH_Int32 length = readInt32();
    // check(length);
    // // We refer to string data in-place.
    // result.chars = (const char *)(data + position);
    // result.length = length - 1;
    // this->position += length;
    return result;
  }

  OH_Number readNumber()
  {
    check(5);
    OH_Number result;
    result.tag = readTag();
    if (result.tag == OH_Tag::OH_TAG_INT32)
    {
      result.i32 = readInt32();
    }
    else if (result.tag == OH_Tag::OH_TAG_FLOAT32)
    {
      result.f32 = readFloat32();
    }
    else
    {
      fprintf(stderr, "Bad number tag %d\n", result.tag);
      throw "Unknown number tag";
    }
    return result;
  }
  OH_Buffer readBuffer()
  {
    OH_Int64 data = readInt64();
    OH_Int64 length = readInt64();
    return OH_Buffer { (void*)data, length };
  }
  OH_Undefined readUndefined()
  {
    return OH_Undefined();
  }

  OH_Materialized readMaterialized()
  {
    OH_Materialized result;
    result.ptr = readPointer();
    return result;
  }

  OH_CallbackResource readCallbackResource()
  {
    OH_CallbackResource result = {};
    result.resourceId = readInt32();
    result.hold = reinterpret_cast<void(*)(OH_Int32)>(readPointerOrDefault(reinterpret_cast<void*>(holdManagedCallbackResource)));
    result.release = reinterpret_cast<void(*)(OH_Int32)>(readPointerOrDefault(reinterpret_cast<void*>(releaseManagedCallbackResource)));
    return result;
  }
};

inline void WriteToString(std::string *result, OH_Boolean value)
{
  result->append(value ? "true" : "false");
}

inline void WriteToString(std::string *result, OH_Int32 value)
{
  result->append(std::to_string(value));
}

inline void WriteToString(std::string *result, OH_UInt32 value)
{
  result->append(std::to_string(value));
}

inline void WriteToString(std::string *result, OH_Float32 value)
{
  result->append(std::to_string(value));
}

inline void WriteToString(std::string* result, OH_Buffer value) {
  result->append("{.data=nullptr, .length=0}");
}

inline void WriteToString(std::string *result, const OH_String *value)
{
//   result->append("{");
//   if (value->chars) {
//     result->append(".chars=\"");
//     result->append(value->chars);
//     result->append("\"");
//   } else {
//     result->append(".chars=\"\"");
//   }
//   result->append(", .length=");
//   WriteToString(result, value->length);
//   result->append("}");
}
