#include <stdint.h>

#include <cassert>
#include <cstring>
#include <string>
#include <vector>

using namespace std;

enum RuntimeType
{
  RUNTIME_UNEXPECTED = -1,
  RUNTIME_NUMBER,
  RUNTIME_STRING,
  RUNTIME_OBJECT,
  RUNTIME_BOOLEAN,
  RUNTIME_UNDEFINED
};

enum Tags
{
  TAG_UNDEFINED = 1,
  TAG_INT32 = 2,
  TAG_FLOAT32 = 3,
  TAG_STRING = 4,
  TAG_LENGTH = 5,
  TAG_RESOURCE = 6,
};

typedef float float32_t;

template <typename T>
inline void WriteToString(string* result, const T& value) = delete;

template <typename T>
struct Tagged
{
  Tags tag;
  T value;
};

template <typename T>
inline void WriteToString(string* result, const Tagged<T>& value) {
    result->append("tagged {");
    result->append(std::to_string((int)value.tag));
    if (value.tag != TAG_UNDEFINED) {
      WriteToString(result, value.value);
    }
    result->append("}");
}

template <typename T>
inline void addToString(string* result, const T& value, bool needComma = false) {
  WriteToString(result, value);
  if (needComma) result->append(", ");
}

template <>
inline void WriteToString(string* result, const KBoolean& value) {
  result->append(std::to_string(value));
}

template <>
inline void WriteToString(string* result, const KInt& value) {
  result->append(std::to_string(value));
}


struct Empty
{
};

inline void WriteToString(string* result, const Empty& value) {
}

template <>
inline void addToString(string* result, const Empty& value, bool needComma) {
}

struct Error
{
  std::string message;
  Error(const std::string &message) : message(message) {}
};

template <typename T0, typename T1 = Empty, typename T2 = Empty, typename T3 = Empty, typename T4 = Empty, typename T5 = Empty, typename T6 = Empty>
struct Union
{
  Union() : selector(-1) {}
  Union(int32_t selector) : selector(selector) {}
  Union& operator=(const Union& other) {
    this->selector = other.selector;
    switch (selector)
    {
    case 0:
      this->value0 = other.value0;
      break;
    case 1:
      this->value1 = other.value1;
      break;
    case 2:
      this->value2 = other.value2;
      break;
    case 3:
      this->value3 = other.value3;
      break;
    case 4:
      this->value4 = other.value4;
      break;
    case 5:
      this->value5 = other.value5;
      break;
    case 6:
      this->value6 = other.value6;
      break;
    }
    return *this;
  }
  Union(const Union<T0, T1, T2, T3, T4, T5, T6> &other)
  {
    this->selector = other.selector;
    switch (selector)
    {
    case 0:
      this->value0 = other.value0;
      break;
    case 1:
      this->value1 = other.value1;
      break;
    case 2:
      this->value2 = other.value2;
      break;
    case 3:
      this->value3 = other.value3;
      break;
    case 4:
      this->value4 = other.value4;
      break;
    case 5:
      this->value5 = other.value5;
      break;
    case 6:
      this->value6 = other.value6;
      break;
    }
  }
  ~Union() {
    switch (selector)
    {
    case 0:
      this->value0.~T0();
      break;
    case 1:
      this->value1.~T1();
      break;
    case 2:
      this->value2.~T2();
      break;
    case 3:
      this->value3.~T3();
      break;
    case 4:
      this->value4.~T4();
      break;
    case 5:
      this->value5.~T5();
      break;
    case 6:
      this->value6.~T6();
      break;
    }
  }
  int32_t selector;
  union
  {
    T0 value0;
    T1 value1;
    T2 value2;
    T3 value3;
    T4 value4;
    T5 value5;
    T6 value6;
  };
};

template <typename T0, typename T1, typename T2, typename T3, typename T4, typename T5, typename T6>
inline void WriteToString(string* result, const Union<T0, T1, T2, T3, T4, T5, T6>& value) {
    result->append("union[");
    result->append(std::to_string(value.selector) + "] {");
    switch (value.selector)
    {
    case 0:
      addToString(result, value.value0);
      break;
    case 1:
      addToString(result, value.value1);
      break;
    case 2:
      addToString(result, value.value2);
      break;
    case 3:
      addToString(result, value.value3);
      break;
    case 4:
      addToString(result, value.value4);
      break;
    case 5:
      addToString(result, value.value5);
      break;
    case 6:
      addToString(result, value.value6);
      break;
    }
    result->append("}");
}

template <typename T0 = Empty, typename T1 = Empty, typename T2 = Empty, typename T3 = Empty, typename T4 = Empty, typename T5 = Empty>
struct Compound
{
  Compound() {}
  Compound(const Compound<T0, T1, T2, T3, T4, T5> &other)
  {
    this->value0 = other.value0;
    this->value1 = other.value1;
    this->value2 = other.value2;
    this->value3 = other.value3;
    this->value4 = other.value4;
    this->value5 = other.value5;
  }

  ~Compound() {}
  T0 value0;
  T1 value1;
  T2 value2;
  T3 value3;
  T4 value4;
  T5 value5;
};

template <typename T0, typename T1, typename T2, typename T3, typename T4, typename T5>
inline void WriteToString(string* result, const Compound<T0, T1, T2, T3, T4, T5>& value) {
  result->append("compound: {");
  addToString(result, value.value0, true);
  addToString(result, value.value1, true);
  addToString(result, value.value2, true);
  addToString(result, value.value3, true);
  addToString(result, value.value4, true);
  addToString(result, value.value5, false);
  result->append("}");
}

struct Number
{
  // TODO: shall we keep a tag here?
  Number() {}
  Number(const Tagged<Number> &other)
  {
    // TODO: check tag
    this->i32 = other.value.i32;
  }
  Number(const Number &other)
  {
    this->i32 = other.i32;
  }

  ~Number() {}
  union
  {
    float32_t f32;
    int32_t i32;
  };

};

template <>
inline void WriteToString(string* result, const Number& value) {
  *result += std::to_string(value.i32);
}

struct Any
{
  Any() {}
  ~Any() {}
};

template <>
inline void WriteToString(string* result, const Any& value) {
  result->append("any");
}

struct Function
{
  int32_t id;
  Function() : id(0) {}
  ~Function() {}
  string toString() {
    return "function id=" + std::to_string(id);
  }
};

template <>
inline void WriteToString(string* result, const Function& value) {
  *result += "function id=" + std::to_string(value.id);
}

typedef Function Callback;
typedef Function ErrorCallback;

struct String
{
  String() {}
  String(const std::string &value) : value(value) {}
  String(const String &other)
  {
    this->value = other.value;
  }
  ~String() {}
  std::string value;
  string toString() {
    return "\"" + value + "\"";
  }
};

template <>
inline void WriteToString(string* result, const String& value) {
  *result += "\"";
  *result += value.value;
  *result += "\"";
}

template <typename T>
struct Array
{
  std::vector<T> array;
  size_t size() const { return array.size(); }
  const T& operator[](size_t pos ) const { return array[pos]; }
};

template <typename T>
inline void WriteToString(string* result, const Array<T>& value) {
  result->append("[");
  for (int i = 0; i < value.size(); i++) {
        addToString(result, value[i], i != value.size() - 1);
  }
  result->append("]");
}

struct Length
{
  float32_t value;
  int32_t unit;
  int32_t resource;
  Length() : value(0), unit(0), resource(0) {}
  Length(const Length &other) : value(other.value), unit(other.unit), resource(other.resource) {}
  Length(const Tagged<Length> &other)
  {
    // TODO: check tag
    this->value = other.value.value;
    this->unit = other.value.unit;
    this->resource = other.value.resource;
  }
  Length(const int32_t *array)
  {
    this->value = *(float32_t *)array;
    this->unit = array[1];
    this->resource = array[2];
  }

  ~Length() {}

  static Length fromArray(int32_t *array)
  {
    Length result;
    result.value = *(float32_t *)array;
    result.unit = array[1];
    result.resource = array[2];
    return result;
  }
};

template <>
inline void WriteToString(string* result, const Length& value) {
  result->append("Length {");
  result->append("value=");
  result->append(std::to_string(value.value));
  result->append(", unit=" + std::to_string(value.unit));
  result->append(", resource=" + std::to_string(value.resource));
  result->append("}");
}

struct Resource
{
  int32_t id;
};

template <>
inline void WriteToString(string* result, const Resource& value) {
  *result += "Resource {";
  *result += "id=" + std::to_string(value.id);
  *result += "}";
}

struct Undefined
{
  int8_t bogus;
  string toString() {
    return "undefined";
  }
};
template <>
inline void WriteToString(string* result, const Undefined& value) {
  *result += "undefined";
}

class ArgDeserializerBase
{
protected:
  uint8_t *data;
  int32_t length;
  int32_t position;

public:
  ArgDeserializerBase(uint8_t *data, int32_t length)
      : data(data), length(length), position(0) {}

  void check(int32_t count)
  {
    if (position + count > length)
    {
      assert(false);
    }
  }

  int8_t readInt8()
  {
    check(1);
    auto value = *(data + position);
    position += 1;
    return value;
  }
  bool readBoolean()
  {
    check(1);
    auto value = *(data + position);
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
  Any readAny()
  {
    throw new Error("Cannot deserialize `any`");
  }
  Tagged<Number> readNumber()
  {
    check(5);
    Tagged<Number> result;
    result.tag = (Tags)readInt8();
    if (result.tag == Tags::TAG_INT32)
    {
      result.value.i32 = readInt32();
    }
    else if (result.tag == Tags::TAG_FLOAT32)
    {
      result.value.f32 = readFloat32();
    }
    return result;
  }

  Tagged<Length> readLength()
  {
    Tagged<Length> result;
    result.tag = (Tags)readInt8();
    if (result.tag == Tags::TAG_LENGTH)
    {
      result.value.value = readFloat32();
      result.value.unit = readInt32();
      result.value.resource = readInt32();
    }
    return result;
  }

  Resource readResource()
  {
    Resource result;
    result.id = readInt32();
    return result;
  }

  Undefined readUndefined()
  {
    return Undefined();
  }

  std::string readString()
  {
    int32_t length = readInt32();
    check(length);
    auto result = std::string((char *)(data + position), length);
    result += length;
    return result;
  }

  Function readFunction()
  {
    throw std::string("no readFunction");
  }

  Callback readCallback()
  {
    return readFunction();
  }

  ErrorCallback readErrorCallback()
  {
    return readFunction();
  }

};

// TODO: a stub
struct ImageModifier {};