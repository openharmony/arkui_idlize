#include <stdint.h>

/* clang-format off */

#ifdef __cplusplus
extern "C" {
#endif

enum OH_Tag
{
  OH_TAG_UNDEFINED = 101,
  OH_TAG_INT32 = 102,
  OH_TAG_FLOAT32 = 103,
  OH_TAG_STRING = 104,
  OH_TAG_LENGTH = 105,
  OH_TAG_RESOURCE = 106,
  OH_TAG_OBJECT = 107,
};

enum OH_RuntimeType
{
  OH_RUNTIME_UNEXPECTED = -1,
  OH_RUNTIME_NUMBER = 1,
  OH_RUNTIME_STRING = 2,
  OH_RUNTIME_OBJECT = 3,
  OH_RUNTIME_BOOLEAN = 4,
  OH_RUNTIME_UNDEFINED = 5,
  OH_RUNTIME_BIGINT = 6,
  OH_RUNTIME_FUNCTION = 7,
  OH_RUNTIME_SYMBOL = 8,
  OH_RUNTIME_MATERIALIZED = 9,
};

typedef float OH_Float32;
typedef double OH_Float64;
typedef int32_t OH_Int32;
typedef unsigned int OH_UInt32;
typedef int64_t OH_Int64;
typedef int8_t OH_Int8;
typedef int8_t OH_Boolean;
typedef const char* OH_CharPtr;
typedef void* OH_NativePointer;
typedef const char* OH_String;

typedef struct OH_AnyAPI {
    OH_Int32 version;
} OH_AnyAPI;
