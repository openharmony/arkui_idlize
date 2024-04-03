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
struct Tagged
{
  Tags tag;
  T value;
};

struct Empty
{
};

struct Error
{
  std::string message;
  Error(const std::string &message) : message(message) {}
};

template <typename T0, typename T1 = Empty, typename T2 = Empty, typename T3 = Empty, typename T4 = Empty, typename T5 = Empty>
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
    }
    return *this;
  }
  Union(const Union<T0, T1, T2, T3, T4, T5> &other)
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
    }
  }
  ~Union() {}
  int32_t selector;
  union
  {
    T0 value0;
    T1 value1;
    T2 value2;
    T3 value3;
    T4 value4;
    T5 value5;
  };
};

template <typename T0, typename T1 = Empty, typename T2 = Empty, typename T3 = Empty, typename T4 = Empty, typename T5 = Empty>
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

struct Number
{
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

struct Any
{
  Any() {}
  ~Any() {}
};

struct Function
{
  int32_t id;
  Function() : id(0) {}
  ~Function() {}
};

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
};

struct KStringPtrImpl
{
  KStringPtrImpl(const char *str) : _value(nullptr)
  {
    int len = str ? strlen(str) : 0;
    assign(str, len);
  }
  KStringPtrImpl(const char *str, int len) : _value(nullptr)
  {
    assign(str, len);
  }
  KStringPtrImpl() : _value(nullptr), _length(0) {}

  // TODO: shall be `delete` as well.
  KStringPtrImpl(KStringPtrImpl &other)
  {
    this->_value = other.release();
  }
  KStringPtrImpl &operator=(KStringPtrImpl &other) = delete;
  operator String() const
  {
    return String(string(this->_value, this->_length));
  }

  ~KStringPtrImpl()
  {
    if (_value)
      free(_value);
  }

  bool isNull() const { return _value == nullptr; }
  const char *c_str() const { return _value; }
  char *data() const { return _value; }
  int length() const { return _length; }

  void resize(int size)
  {
    // Ignore old content.
    if (_value)
      free(_value);
    _value = reinterpret_cast<char *>(malloc(size + 1));
    _value[size] = 0;
    _length = size;
  }

  void assign(const char *data)
  {
    assign(data, data ? strlen(data) : 0);
  }

  void assign(const char *data, int len)
  {
    if (_value)
      free(_value);
    if (data)
    {
      _value = reinterpret_cast<char *>(malloc(len + 1));
      memcpy(_value, data, len);
      _value[len] = 0;
    }
    else
    {
      _value = nullptr;
    }
    _length = len;
  }

protected:
  char *release()
  {
    char *result = this->_value;
    this->_value = nullptr;
    return result;
  }

private:
  char *_value;
  int _length;
};

typedef KStringPtrImpl KStringPtr;

template <typename T>
struct Array
{
  std::vector<T> array;
};

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

struct Resource
{
  int32_t id;
};

struct Undefined
{
  int8_t bogus;
};

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
struct FirstNode {};
struct ImageModifier {};