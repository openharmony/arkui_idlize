#include <stdint.h>

#include <string>

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

  int8_t getInt8() {
    auto value = *(data + position);
    position += 1;
    return value;
  }
  int32_t getInt32() {
    auto value = *(int32_t *)(data + position);
    position += 4;
    return value;
  }
  float32_t getFloat32() {
    auto value = *(float32_t *)(data + position);
    position += 4;
    return value;
  }

  Tagged<Number> getNumber() {
    Tagged<Number> result;
    result.tag = (Tags)getInt8();
    if (result.tag == Tags::INT32) {
      result.value.i32 = getInt32();
    } else if (result.tag == Tags::FLOAT32) {
      result.value.f32 = getFloat32();
    }
  }

  Tagged<Length> getLength() {
    Tagged<Length> result;
    result.tag = (Tags)getInt8();
    if (result.tag == Tags::LENGTH) {
      result.value.value = getFloat32();
      result.value.unit = getInt32();
      result.value.resource = getInt32();
    }
  }

  std::string getString() {
    int32_t length = getInt32();
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
