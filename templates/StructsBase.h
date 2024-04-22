enum Ark_Tag
{
  ARK_TAG_UNDEFINED = 101,
  ARK_TAG_INT32 = 102,
  ARK_TAG_FLOAT32 = 103,
  ARK_TAG_STRING = 104,
  ARK_TAG_LENGTH = 105,
  ARK_TAG_RESOURCE = 106,
  ARK_TAG_OBJECT = 107,
};

enum Ark_RuntimeType
{
  ARK_RUNTIME_UNEXPECTED = -1,
  ARK_RUNTIME_NUMBER = 1,
  ARK_RUNTIME_STRING = 2,
  ARK_RUNTIME_OBJECT = 3,
  ARK_RUNTIME_BOOLEAN = 4,
  ARK_RUNTIME_UNDEFINED = 5,
  ARK_RUNTIME_BIGINT = 6,
  ARK_RUNTIME_FUNCTION = 7,
  ARK_RUNTIME_SYMBOL = 8
};

typedef float Ark_Float32;
typedef int32_t Ark_Int32;
typedef int8_t Ark_Boolean;
typedef void* Ark_NativePointer;
typedef void* ArkUINodeHandle;

// Binary layout of Ark_String must match that of KStringPtrImpl.
typedef struct Ark_String {
  const char* chars;
  Ark_Int32 length;
} Ark_String;

typedef struct Ark_Empty {
  Ark_Int32 dummy; // Empty structs are forbidden in C.
} Ark_Empty;

typedef struct Ark_Number {
  enum Ark_Tag tag;
  union
  {
    Ark_Float32 f32;
    Ark_Int32 i32;
  };
} Ark_Number;

typedef struct ArkUILength
{
  Ark_Float32 value;
  Ark_Int32 unit;
  Ark_Int32 resource;
} Ark_Length;

typedef struct Ark_CustomObject {
  char kind[20];
  Ark_Int32 id;
  // Data of custom object.
  union {
    Ark_Int32 ints[4];
    Ark_Float32 floats[4];
    void* pointers[4];
  };
} Ark_CustomObject;

typedef struct Ark_Undefined {
  Ark_Int32 dummy; // Empty structs are forbidden in C.
} Ark_Undefined;

typedef Ark_CustomObject Ark_Function;
typedef Ark_CustomObject Ark_Callback;
typedef Ark_CustomObject Ark_ErrorCallback;
typedef Ark_CustomObject Ark_Resource;

// TODO: generate!
typedef struct Opt_Ark_Callback {
  enum Ark_Tag tag;
  Ark_CustomObject value;
} Opt_Ark_Callback;