#include <stdint.h>

#include <string>
#include <cassert>

enum RuntimeType
{
  UNEXPECTED = -1,
  NUMBER,
  STRING,
  OBJECT,
  BOOLEAN,
  UNDEFINED
};

enum Tags
{
  UNDEFINED = 1,
  INT32 = 2,
  FLOAT32 = 3,
  STRING = 4,
  LENGTH = 5,
  RESOURCE = 6,
};

typedef float float32_t;

template <typename T>
struct Tagged {
  Tags tag;
  T value;
};

template <typename T>
struct Tagged {
  Tags tag;
  T value;
};

template <typename T0, typename T2>
struct Union {
  union {
    T0 value0;
    T1 value1;
  };
};

template <typename T0, typename T1, typename T2>
struct Union {
  union {
    T0 value0;
    T1 value1;
    T2 value2;
  };
};

template <typename T0, typename T1, typename T2, typename T3>
struct Union {
  union {
    T0 value0;
    T1 value1;
    T2 value2;
    T3 value3;
  };
};

template <typename T0, typename T1>
struct Compound {
  T0 value0;
  T1 value1;
};

template <typename T0, typename T1, typename T2>
struct Compound {
  T0 value0;
  T1 value1;
  T2 value2;
};

template <typename T0, typename T1, typename T2, typename T3>
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
    if (result.tag == Tags::INT32) {
      result.value.i32 = readInt32();
    } else if (result.tag == Tags::FLOAT32) {
      result.value.f32 = readFloat32();
    }
  }

  Tagged<Length> readLength() {
    Tagged<Length> result;
    result.tag = (Tags)readInt8();
    if (result.tag == Tags::LENGTH) {
      result.value.value = readFloat32();
      result.value.unit = readInt32();
      result.value.resource = readInt32();
    }
  }

  Undefined readUndefined() {
  }

  std::string readString() {
    int32_t length = readInt32();
    check(length);
    auto result = std::string((char*)(data + position), length);
    result += length;
    return result;
  }
};

// TODO: generate me.
class ArgDeserializer : ArgDeserializerBase
{
public:
  ArgDeserializer(uint8_t *data, int32_t length)
      : ArgDeserializerBase(data, length) {}
};
