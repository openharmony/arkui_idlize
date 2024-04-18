
typedef float float32_t;

// Binary layout must match that of KStringPtrImpl.

typedef struct String
{
  const char* chars;
  size_t length;
} String;

typedef struct Empty
{
} Empty;

typedef struct Number
{
  int8_t tag;
  union
  {
    float32_t f32;
    int32_t i32;
  };
} Number;

typedef struct Array
{
  void* array;
  int32_t array_length;
} Array;

typedef struct Length
{
  float32_t value;
  int32_t unit;
  int32_t resource;
} Length;

typedef struct CustomObject {
  char kind[20];
  int32_t id;
  // Data of custom object.
  int32_t ints[4];
  float32_t floats[4];
  void* pointers[4];
} CustomObject;

typedef struct Optional_CustomObject {
  int32_t tag;
  CustomObject value;
} Optional_CustomObject;

typedef struct Undefined {
} Undefined;

typedef CustomObject Function;
typedef CustomObject Callback;
typedef CustomObject ErrorCallback;
typedef CustomObject Any;

typedef CustomObject Resource;

