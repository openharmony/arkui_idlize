/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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

#ifndef _CONVERTORS_NODE_H_
#define _CONVERTORS_NODE_H_

#ifdef KOALA_NAPI

#include <math.h>

#include "napi.h"

#include "interop-types.h"

#if defined(KOALA_USE_ARK_VM) && defined(KOALA_OHOS)
#include "oh_sk_log.h"
#define LOG(msg) OH_SK_LOG_INFO(msg);
#else
#define LOG(msg) fprintf(stderr, msg);
#endif

// TODO: switch to more generic convertors eventually.
template<class T>
struct InteropTypeConverter {
    using InteropType = T;
    static T convertFrom(Napi::Env env, InteropType value) { return value; }
    static InteropType convertTo(Napi::Env env, T value) { return value; }
    static void release(Napi::Env env, InteropType value, T converted) {}
};

template <typename Type>
inline typename InteropTypeConverter<Type>::InteropType makeResult(Napi::Env env, Type value) {
  return InteropTypeConverter<Type>::convertTo(env, value);
}

template <typename Type>
inline Type getArgument(Napi::Env env, typename InteropTypeConverter<Type>::InteropType arg) {
  return InteropTypeConverter<Type>::convertFrom(env, arg);
}

template <typename Type>
inline void releaseArgument(Napi::Env env, typename InteropTypeConverter<Type>::InteropType arg, Type data) {
  InteropTypeConverter<Type>::release(env, arg, data);
}

#define NAPI_ASSERT_INDEX(info, index, result)              \
    do {                                                    \
        if (static_cast<size_t>(index) >= info.Length()) {  \
            Napi::Error::New(info.Env(), "No such element") \
                .ThrowAsJavaScriptException();              \
            return result;                                  \
        }                                                   \
    } while (0)

template <typename ElemType>
inline napi_typedarray_type getNapiType() = delete;

template <>
inline napi_typedarray_type getNapiType<float>() {
  return napi_float32_array;
}

template <>
inline napi_typedarray_type getNapiType<int8_t>() {
  return napi_int8_array;
}

template <>
inline napi_typedarray_type getNapiType<uint8_t>() {
  return napi_uint8_array;
}

template <>
inline napi_typedarray_type getNapiType<int16_t>() {
  return napi_int16_array;
}

template <>
inline napi_typedarray_type getNapiType<uint16_t>() {
  return napi_uint16_array;
}

template <>
inline napi_typedarray_type getNapiType<int32_t>() {
  return napi_int32_array;
}

template <>
inline napi_typedarray_type getNapiType<uint32_t>() {
  return napi_uint32_array;
}

template <>
inline napi_typedarray_type getNapiType<KNativePointer>() {
  return napi_biguint64_array;
}

template <typename ElemType>
inline ElemType* getTypedElements(Napi::Env env, Napi::Value value) {
  if (value.IsNull()) {
    return nullptr;
  }
  if (!value.IsTypedArray()) {
    Napi::Error::New(env, "Expected TypedArray")
        .ThrowAsJavaScriptException();
    return nullptr;
  }
  Napi::TypedArray array = value.As<Napi::TypedArray>();

  if (array.TypedArrayType() != getNapiType<ElemType>()) {
    printf("Array type mismatch. Expected %d got %d\n", getNapiType<ElemType>(), array.TypedArrayType());
    Napi::Error::New(env, "Array type mismatch")
        .ThrowAsJavaScriptException();
    return nullptr;
  }
  Napi::ArrayBuffer buffer = array.ArrayBuffer();

  return reinterpret_cast<ElemType*>(buffer.Data());
}

template <typename ElemType>
inline ElemType* getTypedElements(const Napi::CallbackInfo& info, int index) {
    NAPI_ASSERT_INDEX(info, index, nullptr);
    return getTypedElements<ElemType>(info.Env(), info[index]);
}

inline uint8_t* getUInt8Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<uint8_t>(info, index);
}

inline int8_t* getInt8Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<int8_t>(info, index);
}

inline uint16_t* getUInt16Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<uint16_t>(info, index);
}

inline int16_t* getInt16Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<int16_t>(info, index);
}

inline uint32_t* getUInt32Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<uint32_t>(info, index);
}

inline uint32_t* getUInt32Elements(Napi::Env env, Napi::Value value) {
    return getTypedElements<uint32_t>(env, value);
}

inline int32_t* getInt32Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<int32_t>(info, index);
}

inline float* getFloat32Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<float>(info, index);
}

inline KNativePointer* getPointerElements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<KNativePointer>(info, index);
}

KInt getInt32(Napi::Env env, Napi::Value value);
inline int32_t getInt32(const Napi::CallbackInfo& info, int index) {
  NAPI_ASSERT_INDEX(info, index, 0);
  return getInt32(info.Env(), info[index]);
}
KUInt getUInt32(Napi::Env env, Napi::Value value);
inline uint32_t getUInt32(const Napi::CallbackInfo& info, int index) {
  NAPI_ASSERT_INDEX(info, index, 0);
  return getUInt32(info.Env(), info[index]);
}
KFloat getFloat32(Napi::Env env, Napi::Value value);
inline float getFloat32(const Napi::CallbackInfo& info, int index) {
  NAPI_ASSERT_INDEX(info, index, 0.0f);
  return getFloat32(info.Env(), info[index]);
}
KDouble getFloat64(Napi::Env env, Napi::Value value);
inline KDouble getFloat64(const Napi::CallbackInfo& info, int index) {
  NAPI_ASSERT_INDEX(info, index, 0.0);
  return getFloat64(info.Env(), info[index]);
}
KStringPtr getString(Napi::Env env, Napi::Value value);
inline KStringPtr getString(const Napi::CallbackInfo& info, int index) {
  NAPI_ASSERT_INDEX(info, index, KStringPtr());
  return getString(info.Env(), info[index]);
}
void* getPointer(Napi::Env env, Napi::Value value);
inline void* getPointer(const Napi::CallbackInfo& info, int index) {
    NAPI_ASSERT_INDEX(info, index, nullptr);
    return getPointer(info.Env(), info[index]);
}
KBoolean getBoolean(Napi::Env env, Napi::Value value);
inline KBoolean getBoolean(const Napi::CallbackInfo& info, int index) {
  NAPI_ASSERT_INDEX(info, index, false);
  return getBoolean(info.Env(), info[index]);
}
Napi::Object getObject(Napi::Env env, Napi::Value value);
inline Napi::Object getObject(const Napi::CallbackInfo& info, int index) {
  NAPI_ASSERT_INDEX(info, index, info.Env().Global());
  return getObject(info.Env(), info[index]);
}

template <typename Type>
inline Type getArgument(const Napi::CallbackInfo& info, int index) = delete;

template <>
inline KBoolean getArgument<KBoolean>(const Napi::CallbackInfo& info, int index) {
  return getBoolean(info, index);
}

template <>
inline KUInt getArgument<uint32_t>(const Napi::CallbackInfo& info, int index) {
  return getUInt32(info, index);
}

template <>
inline KInt getArgument<int32_t>(const Napi::CallbackInfo& info, int index) {
  return getInt32(info, index);
}

template <>
inline KInteropNumber getArgument<KInteropNumber>(const Napi::CallbackInfo& info, int index) {
  KInteropNumber result;
  double value = info[index].As<Napi::Number>().DoubleValue();
  // TODO: boundary check
  if (value == floor(value)) {
    result.tag = 102; // ARK_TAG_INT32
    result.i32 = (int)value;
  } else {
    result.tag = 103; // ARK_TAG_FLOAT32
    result.f32 = (float)value;
  }
  return result;
}

template <>
inline KFloat getArgument<KFloat>(const Napi::CallbackInfo& info, int index) {
  return getFloat32(info, index);
}

template <>
inline KDouble getArgument<KDouble>(const Napi::CallbackInfo& info, int index) {
  return getFloat64(info, index);
}

template <>
inline KNativePointer getArgument<KNativePointer>(const Napi::CallbackInfo& info, int index) {
  return getPointer(info, index);
}

template <>
inline KNativePointerArray getArgument<KNativePointerArray>(const Napi::CallbackInfo& info, int index) {
  return getPointerElements(info, index);
}

template <>
inline Napi::Object getArgument<Napi::Object>(const Napi::CallbackInfo& info, int index) {
  return getObject(info, index);
}

template <>
inline uint8_t* getArgument<uint8_t*>(const Napi::CallbackInfo& info, int index) {
  return getUInt8Elements(info, index);
}

template <>
inline const uint8_t* getArgument<const uint8_t*>(const Napi::CallbackInfo& info, int index) {
  return getUInt8Elements(info, index);
}

template <>
inline int8_t* getArgument<int8_t*>(const Napi::CallbackInfo& info, int index) {
  return getInt8Elements(info, index);
}

template <>
inline int16_t* getArgument<int16_t*>(const Napi::CallbackInfo& info, int index) {
  return getInt16Elements(info, index);
}

template <>
inline uint16_t* getArgument<uint16_t*>(const Napi::CallbackInfo& info, int index) {
  return getUInt16Elements(info, index);
}

template <>
inline int32_t* getArgument<int32_t*>(const Napi::CallbackInfo& info, int index) {
  return getInt32Elements(info, index);
}

template <>
inline uint32_t* getArgument<uint32_t*>(const Napi::CallbackInfo& info, int index) {
  return getUInt32Elements(info, index);
}

template <>
inline float* getArgument<float*>(const Napi::CallbackInfo& info, int index) {
  return getFloat32Elements(info, index);
}

template <>
inline KStringPtr getArgument<KStringPtr>(const Napi::CallbackInfo& info, int index) {
  return getString(info, index);
}

Napi::Value makeString(const Napi::CallbackInfo& info, KStringPtr value);
Napi::Value makeString(const Napi::CallbackInfo& info, const std::string& value);
Napi::Value makeBoolean(const Napi::CallbackInfo& info, KBoolean value);
Napi::Value makeInt32(const Napi::CallbackInfo& info, int32_t value);
Napi::Value makeUInt32(const Napi::CallbackInfo& info, uint32_t value);
Napi::Value makeFloat32(const Napi::CallbackInfo& info, float value);
Napi::Value makePointer(const Napi::CallbackInfo& info, void* value);
Napi::Value makePointer(Napi::Env env, void* value);
Napi::Value makeVoid(const Napi::CallbackInfo& info);
Napi::Object makeObject(const Napi::CallbackInfo& info, napi_value object);

template <typename Type>
inline Napi::Value makeResult(const Napi::CallbackInfo& info, Type value) = delete;

template <>
inline Napi::Value makeResult<KBoolean>(const Napi::CallbackInfo& info, KBoolean value) {
  return makeBoolean(info, value);
}

template <>
inline Napi::Value makeResult<int32_t>(const Napi::CallbackInfo& info, int32_t value) {
  return makeInt32(info, value);
}

template <>
inline Napi::Value makeResult<uint32_t>(const Napi::CallbackInfo& info, uint32_t value) {
  return makeUInt32(info, value);
}

template <>
inline Napi::Value makeResult<float>(const Napi::CallbackInfo& info, float value) {
  return makeFloat32(info, value);
}

template <>
inline Napi::Value makeResult<KNativePointer>(const Napi::CallbackInfo& info, KNativePointer value) {
  return makePointer(info, value);
}

template <>
inline Napi::Value makeResult<Napi::Object>(const Napi::CallbackInfo& info, Napi::Object value) {
  return value;
}

template <>
inline Napi::Value makeResult<napi_value>(const Napi::CallbackInfo& info, napi_value value) {
  return makeObject(info, value);
}

typedef Napi::Value (*napi_type_t)(const Napi::CallbackInfo&);

class Exports {
    std::vector<std::pair<std::string, napi_type_t>> implementations;

public:
    static Exports* getInstance();

    void addImpl(const char* name, napi_type_t impl) {
        implementations.push_back(std::make_pair(name, impl));
    }

    const std::vector<std::pair<std::string, napi_type_t>>& getImpls() {
        return implementations;
    }
};

Napi::ModuleRegisterCallback ProvideModuleRegisterCallback(Napi::ModuleRegisterCallback value);

#define __QUOTE(x) #x
#define QUOTE(x) __QUOTE(x)

#ifdef _MSC_VER
#define MAKE_NODE_EXPORT(name)                                  \
    static void __init_##name() {                               \
        Exports::getInstance()->addImpl("_"#name, Node_##name); \
    }                                                           \
    namespace {                                                 \
      struct __Init_##name {                                    \
        __Init_##name() {  __init_##name(); }                   \
      } __Init_##name##_v;                                      \
    }
#else
#define MAKE_NODE_EXPORT(name) \
    __attribute__((constructor)) \
    static void __init_##name() { \
        Exports::getInstance()->addImpl("_"#name, Node_##name); \
    }
#endif

#define KOALA_INTEROP_0(name, Ret) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                       \
      return makeResult<Ret>(info, impl_##name()); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_1(name, Ret, P0) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      return makeResult<Ret>(info, impl_##name(p0)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_2(name, Ret, P0, P1) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      return makeResult<Ret>(info, impl_##name(p0, p1)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_3(name, Ret, P0, P1, P2) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      return makeResult<Ret>(info, impl_##name(p0, p1, p2)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_4(name, Ret, P0, P1, P2, P3) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      return makeResult<Ret>(info, impl_##name(p0, p1, p2, p3)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_5(name, Ret, P0, P1, P2, P3, P4) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      return makeResult<Ret>(info, impl_##name(p0, p1, p2, p3, p4)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_6(name, Ret, P0, P1, P2, P3, P4, P5) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      return makeResult<Ret>(info, impl_##name(p0, p1, p2, p3, p4, p5)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_7(name, Ret, P0, P1, P2, P3, P4, P5, P6) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      return makeResult<Ret>(info, impl_##name(p0, p1, p2, p3, p4, p5, p6)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_8(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      return makeResult<Ret>(info, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_9(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      P8 p8 = getArgument<P8>(info, 8); \
      return makeResult<Ret>(info, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_10(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      P8 p8 = getArgument<P8>(info, 8); \
      P9 p9 = getArgument<P9>(info, 9); \
      return makeResult<Ret>(info, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_11(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      P8 p8 = getArgument<P8>(info, 8); \
      P9 p9 = getArgument<P9>(info, 9); \
      P10 p10 = getArgument<P10>(info, 10); \
      return makeResult<Ret>(info, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_12(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      P8 p8 = getArgument<P8>(info, 8); \
      P9 p9 = getArgument<P9>(info, 9); \
      P10 p10 = getArgument<P10>(info, 10); \
      P11 p11 = getArgument<P11>(info, 11); \
      return makeResult<Ret>(info, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_13(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      P8 p8 = getArgument<P8>(info, 8); \
      P9 p9 = getArgument<P9>(info, 9); \
      P10 p10 = getArgument<P10>(info, 10); \
      P11 p11 = getArgument<P11>(info, 11); \
      P12 p12 = getArgument<P12>(info, 12); \
      return makeResult<Ret>(info, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_14(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      P8 p8 = getArgument<P8>(info, 8); \
      P9 p9 = getArgument<P9>(info, 9); \
      P10 p10 = getArgument<P10>(info, 10); \
      P11 p11 = getArgument<P11>(info, 11); \
      P12 p12 = getArgument<P12>(info, 12); \
      P13 p13 = getArgument<P13>(info, 13); \
      return makeResult<Ret>(info, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V0(name) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      impl_##name(); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V1(name, P0) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      impl_##name(p0); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V2(name, P0, P1) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      impl_##name(p0, p1); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V3(name, P0, P1, P2) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      impl_##name(p0, p1, p2); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V4(name, P0, P1, P2, P3) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      impl_##name(p0, p1, p2, p3); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V5(name, P0, P1, P2, P3, P4) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      impl_##name(p0, p1, p2, p3, p4); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V6(name, P0, P1, P2, P3, P4, P5) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      impl_##name(p0, p1, p2, p3, p4, p5); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V7(name, P0, P1, P2, P3, P4, P5, P6) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V8(name, P0, P1, P2, P3, P4, P5, P6, P7) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V9(name, P0, P1, P2, P3, P4, P5, P6, P7, P8) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(impl_##name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      P8 p8 = getArgument<P8>(info, 8); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V10(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      P8 p8 = getArgument<P8>(info, 8); \
      P9 p9 = getArgument<P9>(info, 9); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V11(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(impl_##name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      P8 p8 = getArgument<P8>(info, 8); \
      P9 p9 = getArgument<P9>(info, 9); \
      P10 p10 = getArgument<P10>(info, 10); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V12(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(impl_##name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      P8 p8 = getArgument<P8>(info, 8); \
      P9 p9 = getArgument<P9>(info, 9); \
      P10 p10 = getArgument<P10>(info, 10); \
      P11 p11 = getArgument<P11>(info, 11); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V13(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(impl_##name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      P8 p8 = getArgument<P8>(info, 8); \
      P9 p9 = getArgument<P9>(info, 9); \
      P10 p10 = getArgument<P10>(info, 10); \
      P11 p11 = getArgument<P11>(info, 11); \
      P12 p12 = getArgument<P12>(info, 12); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_V14(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      P3 p3 = getArgument<P3>(info, 3); \
      P4 p4 = getArgument<P4>(info, 4); \
      P5 p5 = getArgument<P5>(info, 5); \
      P6 p6 = getArgument<P6>(info, 6); \
      P7 p7 = getArgument<P7>(info, 7); \
      P8 p8 = getArgument<P8>(info, 8); \
      P9 p9 = getArgument<P9>(info, 9); \
      P10 p10 = getArgument<P10>(info, 10); \
      P11 p11 = getArgument<P11>(info, 11); \
      P12 p12 = getArgument<P12>(info, 12); \
      P13 p13 = getArgument<P13>(info, 13); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13); \
      return makeVoid(info); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_CTX_1(name, Ret, P0) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(impl_##name)                   \
      KVMContext ctx = reinterpret_cast<KVMContext>((napi_env)info.Env()); \
      P0 p0 = getArgument<P0>(info, 0); \
      return makeResult<Ret>(info, impl_##name(ctx, p0)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_CTX_2(name, Ret, P0, P1) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      KVMContext ctx = reinterpret_cast<KVMContext>((napi_env)info.Env()); \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      return makeResult<Ret>(info, impl_##name(ctx, p0, p1)); \
  } \
  MAKE_NODE_EXPORT(name)

#define KOALA_INTEROP_CTX_3(name, Ret, P0, P1, P2) \
  Napi::Value Node_##name(const Napi::CallbackInfo& info) { \
      KOALA_MAYBE_LOG(name)                   \
      KVMContext ctx = reinterpret_cast<KVMContext>((napi_env)info.Env()); \
      P0 p0 = getArgument<P0>(info, 0); \
      P1 p1 = getArgument<P1>(info, 1); \
      P2 p2 = getArgument<P2>(info, 2); \
      return makeResult<Ret>(info, impl_##name(ctx, p0, p1, p2)); \
  } \
  MAKE_NODE_EXPORT(name)


#define NODEJS_GET_AND_THROW_LAST_ERROR(env)                                 \
    do {                                                                     \
        const napi_extended_error_info *error_info;                          \
        napi_get_last_error_info((env), &error_info);                        \
        bool is_pending;                                                     \
        napi_is_exception_pending((env), &is_pending);                       \
        /* If an exception is already pending, don't rethrow it */           \
        if (!is_pending) {                                                   \
            const char* error_message = error_info->error_message != NULL ?  \
            error_info->error_message :                                      \
            "empty error message";                                           \
            napi_throw_error((env), NULL, error_message);                    \
        }                                                                    \
    } while (0)

napi_value getKoalaNapiCallbackDispatcher();

// TODO: can/shall we cache bridge reference?
#define KOALA_INTEROP_CALL_INT(venv, id, argc, args)                                  \
{                                                                                  \
  napi_env env = reinterpret_cast<napi_env>(venv);                                 \
  napi_value bridge = getKoalaNapiCallbackDispatcher(),                            \
     global = nullptr, return_val = nullptr;                                       \
  napi_handle_scope scope = nullptr;                                               \
  napi_open_handle_scope(env, &scope);                                             \
  napi_status status = napi_get_global(env, &global);                              \
  napi_value node_args[2];                                                         \
  napi_create_int32(env, id, &node_args[0]);                                       \
  napi_value buffer = nullptr;                                                     \
  napi_create_external_arraybuffer(env,                                            \
    args, argc * sizeof(int32_t),                                                  \
    [](napi_env, void* data, void* hint) {}, nullptr, &buffer);                    \
  napi_create_typedarray(env, napi_int32_array, argc, buffer, 0, &node_args[1]);   \
  status = napi_call_function(env, global, bridge, 2, node_args, &return_val);     \
  if (status != napi_ok) NODEJS_GET_AND_THROW_LAST_ERROR((env));                   \
  int result;                                                                      \
  status = napi_get_value_int32(env, return_val, &result);                         \
  napi_close_handle_scope(env, scope);                                             \
  return result;                                                                   \
}

#endif // KOALA_NAPI

#endif // _CONVERTORS_NODE_H_