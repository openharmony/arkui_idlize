#include <stdint.h>

#include <cassert>
#include <string>
#include <vector>

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
struct Tagged {
  Tags tag;
  T value;
};

/*
template <typename T0, typename T1>
struct Union {
  union {
    T0 value0;
    T1 value1;
  };
};
*/

struct Empty {
};

template <typename T0, typename T1 = Empty, typename T2 = Empty, typename T3 = Empty>
struct Union {
  union {
    T0 value0;
    T1 value1;
    T2 value2;
  };
};


template <typename T0 = Empty, typename T1 = Empty, typename T2 = Empty, typename T3 = Empty>
struct Compound {
  T0 value0;
  T1 value1;
  T2 value2;
  T3 value3;
};

struct Number {
  union {
    float32_t f32;
    int32_t i32;
  };
};

struct Any {
};

template <typename T>
struct Array {
  std::vector<T> array;
};

struct Length {
  float32_t value;
  int32_t unit;
  int32_t resource;
  static Length fromArray(int32_t* array) {
    Length result;
    result.value = *(float32_t*)array;
    result.unit = array[1];
    result.resource = array[2];
    return result;
  }
};

struct Undefined {
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

  void check(int32_t count) {
    if (position + count > length) {
      assert(false);
    }
  }

  int8_t readInt8() {
    check(1);
    auto value = *(data + position);
    position += 1;
    return value;
  }
  bool readBoolean() {
    check(1);
    auto value = *(data + position);
    position += 1;
    return value;
  }
  int32_t readInt32() {
    check(4);
    auto value = *(int32_t *)(data + position);
    position += 4;
    return value;
  }
  float32_t readFloat32() {
    check(4);
    auto value = *(float32_t *)(data + position);
    position += 4;
    return value;
  }
  Tagged<Number> readNumber() {
    check(5);
    Tagged<Number> result;
    result.tag = (Tags)readInt8();
    if (result.tag == Tags::TAG_INT32) {
      result.value.i32 = readInt32();
    } else if (result.tag == Tags::TAG_FLOAT32) {
      result.value.f32 = readFloat32();
    }
    return result;
  }

  Tagged<Length> readLength() {
    Tagged<Length> result;
    result.tag = (Tags)readInt8();
    if (result.tag == Tags::TAG_LENGTH) {
      result.value.value = readFloat32();
      result.value.unit = readInt32();
      result.value.resource = readInt32();
    }
    return result;
  }

  Undefined readUndefined() {
    return Undefined();
  }

  std::string readString() {
    int32_t length = readInt32();
    check(length);
    auto result = std::string((char*)(data + position), length);
    result += length;
    return result;
  }
};