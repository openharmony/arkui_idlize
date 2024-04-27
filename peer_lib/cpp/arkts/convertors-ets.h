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

#pragma once

#ifdef KOALA_ETS_NAPI

#include <assert.h>
#include <memory>
#include <vector>
#include <string>

#include "interop-types.h"

#include "etsapi.h"

uint8_t* getUInt8Elements(EtsEnv *env, ets_byteArray v);
int8_t* getInt8Elements(EtsEnv *env, ets_byteArray v);
uint16_t* getUInt16Elements(EtsEnv *env, ets_charArray v);
int16_t* getInt16Elements(EtsEnv *env, ets_shortArray v);
uint32_t* getUInt32Elements(EtsEnv *env, ets_intArray v);
int32_t* getInt32Elements(EtsEnv *env, ets_intArray v);
float* getFloat32Elements(EtsEnv *env, ets_floatArray v);
int64_t* getLongElements(EtsEnv *env, ets_longArray v);
KStringPtr getString(EtsEnv *env, ets_string v);

template <class T>
struct EtsType {};

template <>
struct EtsType<KBoolean> {
  using type = ets_boolean;
};

template <>
struct EtsType<KStringPtr> {
  using type = ets_string;
};

template <>
struct EtsType<uint32_t> {
  using type = ets_int;
};

template <>
struct EtsType<int32_t> {
  using type = ets_int;
};

template <>
struct EtsType<KLong> {
  using type = ets_long;
};

template <>
struct EtsType<float> {
  using type = ets_float;
};

template <>
struct EtsType<double> {
  using type = ets_double;
};

template <>
struct EtsType<void*> {
  using type = ets_long;
};

template <>
struct EtsType<void**> {
  using type = ets_longArray;
};

template <>
struct EtsType<uint8_t*> {
  using type = ets_byteArray;
};

template <>
struct EtsType<const uint8_t*> {
  using type = ets_byteArray;
};

template <>
struct EtsType<int8_t*> {
  using type = ets_byteArray;
};

template <>
struct EtsType<int16_t*> {
  using type = ets_shortArray;
};

template <>
struct EtsType<uint16_t*> {
  using type = ets_charArray;
};

template <>
struct EtsType<int32_t*> {
  using type = ets_intArray;
};

template <>
struct EtsType<uint32_t*> {
  using type = ets_intArray;
};

template <>
struct EtsType<float*> {
  using type = ets_floatArray;
};

template <class M>
using T = typename EtsType<M>::type;

template <class M>
inline M getArgument(EtsEnv *env, T<M> v);

template <>
inline KBoolean getArgument(EtsEnv *env, ets_boolean v) {
  return v;
}

template <>
inline uint32_t getArgument(EtsEnv *env, ets_int v) {
  return v;
}

template <>
inline int32_t getArgument(EtsEnv *env, ets_int v) {
  return v;
}

template <>
inline float getArgument(EtsEnv *env, ets_float v) {
  return v;
}

template <>
inline double getArgument(EtsEnv *env, ets_double v) {
  return v;
}

template <>
inline void* getArgument(EtsEnv *env, ets_long v) {
  return reinterpret_cast<void*>(v);
}

template <>
inline void** getArgument(EtsEnv *env, ets_longArray v) {
  return reinterpret_cast<void**>(getLongElements(env, v));
}

template <>
inline uint8_t* getArgument(EtsEnv *env, ets_byteArray v) {
  return getUInt8Elements(env, v);
}

template <>
inline const uint8_t* getArgument(EtsEnv *env, ets_byteArray v) {
  return getUInt8Elements(env, v);
}

template <>
inline int8_t* getArgument(EtsEnv *env, ets_byteArray v) {
  return getInt8Elements(env, v);
}

template <>
inline int16_t* getArgument(EtsEnv *env, ets_shortArray v) {
  return getInt16Elements(env, v);
}

template <>
inline uint16_t* getArgument(EtsEnv *env, ets_charArray v) {
  return getUInt16Elements(env, v);
}

template <>
inline int32_t* getArgument(EtsEnv *env, ets_intArray v) {
  return getInt32Elements(env, v);
}

template <>
inline uint32_t* getArgument(EtsEnv *env, ets_intArray v) {
  return getUInt32Elements(env, v);
}

template <>
inline float* getArgument(EtsEnv *env, ets_floatArray v) {
  return getFloat32Elements(env, v);
}

template <>
inline KStringPtr getArgument(EtsEnv *env, ets_string v) {
  return getString(env, v);
}

template <class M>
inline T<M> makeResult(EtsEnv *env, M value);

template <>
inline ets_boolean makeResult(EtsEnv *env, KBoolean value) {
  return value;
}

template <>
inline ets_int makeResult(EtsEnv *env, int32_t value) {
  return value;
}

template <>
inline ets_int makeResult(EtsEnv *env, uint32_t value) {
  return value;
}

template <>
inline ets_float makeResult(EtsEnv *env, float value) {
  return value;
}

template <>
inline ets_long makeResult(EtsEnv *env, void* value) {
  return reinterpret_cast<ets_long>(value);
}

template <>
inline ets_long makeResult(EtsEnv *env, KLong value) {
  return value;
}

class EtsExports {
    std::vector<std::tuple<std::string, std::string, void*>> implementations;

public:
    static EtsExports* getInstance();

    void addImpl(const char* name, const char* type, void* impl) {
        implementations.push_back(std::make_tuple(name, type, impl));
    }

    const std::vector<std::tuple<std::string, std::string, void*>>& getImpls() {
        return implementations;
    }
};

#ifdef _MSC_VER
#define MAKE_ETS_EXPORT(name, type)                             \
    static void __init_##name() {                               \
        EtsExports::getInstance()->addImpl("_"#name, type, reinterpret_cast<void *>(Ark_##name)); \
    }                                                           \
    namespace {                                                 \
      struct __Init_##name {                                    \
        __Init_##name() {  __init_##name(); }                   \
      } __Init_##name##_v;                                      \
    }
#else
#define MAKE_ETS_EXPORT(name, type) \
    __attribute__((constructor)) \
    static void __init_ets_##name() { \
        EtsExports::getInstance()->addImpl("_"#name, type, reinterpret_cast<void *>(Ark_##name)); \
    }
#endif

#define ETS_API_0(name, Ret) \
  T<Ret> Ark_##name(EtsEnv *env) { \
      KOALA_MAYBE_LOG(name)                       \
      return makeResult<Ret>(env, impl_##name()); \
  } \
  MAKE_ETS_EXPORT(name, #Ret)

#define ETS_API_1(name, Ret, P0) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      return makeResult<Ret>(env, impl_##name(p0)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0)

#define ETS_API_2(name, Ret, P0, P1) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      return makeResult<Ret>(env, impl_##name(p0, p1)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0 "_" #P1)

#define ETS_API_3(name, Ret, P0, P1, P2) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      return makeResult<Ret>(env, impl_##name(p0, p1, p2)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0 "_" #P1 "_" #P2)

#define ETS_API_4(name, Ret, P0, P1, P2, P3) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      return makeResult<Ret>(env, impl_##name(p0, p1, p2, p3)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0 "_" #P1 "_" #P2 "_" #P3)

#define ETS_API_5(name, Ret, P0, P1, P2, P3, P4) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      return makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4)

#define ETS_API_6(name, Ret, P0, P1, P2, P3, P4, P5) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      return makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5)

#define ETS_API_7(name, Ret, P0, P1, P2, P3, P4, P5, P6) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      return makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6)

#define ETS_API_8(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      return makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7)

#define ETS_API_9(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7, T<P8> a8) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      P8 p8 = getArgument<P8>(env, a8); \
      return makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7 "_" #P8)

#define ETS_API_10(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7, T<P8> a8, T<P9> a9) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      P8 p8 = getArgument<P8>(env, a8); \
      P9 p9 = getArgument<P9>(env, a9); \
      return makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7 "_" #P8 "_" #P9)

#define ETS_API_11(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7, T<P8> a8, T<P9> a9, T<P10> a10) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      P8 p8 = getArgument<P8>(env, a8); \
      P9 p9 = getArgument<P9>(env, a9); \
      P10 p10 = getArgument<P10>(env, a10); \
      return makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7 "_" #P8 "_" #P9 "_" #P10)

#define ETS_API_12(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7, T<P8> a8, T<P9> a9, T<P10> a10, T<P11> a11) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      P8 p8 = getArgument<P8>(env, a8); \
      P9 p9 = getArgument<P9>(env, a9); \
      P10 p10 = getArgument<P10>(env, a10); \
      P11 p11 = getArgument<P11>(env, a11); \
      return makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7 "_" #P8 "_" #P9 "_" #P10 "_" #P11)

#define ETS_API_13(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7, T<P8> a8, T<P9> a9, T<P10> a10, T<P11> a11, T<P12> a12) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      P8 p8 = getArgument<P8>(env, a8); \
      P9 p9 = getArgument<P9>(env, a9); \
      P10 p10 = getArgument<P10>(env, a10); \
      P11 p11 = getArgument<P11>(env, a11); \
      P12 p12 = getArgument<P12>(env, a12); \
      return makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7 "_" #P8 "_" #P9 "_" #P10 "_" #P11 "_" #P12)

#define ETS_API_14(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13) \
  T<Ret> Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7, T<P8> a8, T<P9> a9, T<P10> a10, T<P11> a11, T<P12> a12, T<P13> a13) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      P8 p8 = getArgument<P8>(env, a8); \
      P9 p9 = getArgument<P9>(env, a9); \
      P10 p10 = getArgument<P10>(env, a10); \
      P11 p11 = getArgument<P11>(env, a11); \
      P12 p12 = getArgument<P12>(env, a12); \
      P13 p13 = getArgument<P13>(env, a13); \
      return makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13)); \
  } \
  MAKE_ETS_EXPORT(name, #Ret "_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7 "_" #P8 "_" #P9 "_" #P10 "_" #P11 "_" #P12 "_" #P13)

#define ETS_API_V0(name) \
  void Ark_##name(EtsEnv *env) { \
      KOALA_MAYBE_LOG(name)                   \
      impl_##name(); \
  } \
  MAKE_ETS_EXPORT(name, "void")

#define ETS_API_V1(name, P0) \
  void Ark_##name(EtsEnv *env, T<P0> a0) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      impl_##name(p0); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0)

#define ETS_API_V2(name, P0, P1) \
  void Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      impl_##name(p0, p1); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0 "_" #P1)

#define ETS_API_V3(name, P0, P1, P2) \
  void Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      impl_##name(p0, p1, p2); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0 "_" #P1 "_" #P2)

#define ETS_API_V4(name, P0, P1, P2, P3) \
  void Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      impl_##name(p0, p1, p2, p3); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0 "_" #P1 "_" #P2 "_" #P3)

#define ETS_API_V5(name, P0, P1, P2, P3, P4) \
  void Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      impl_##name(p0, p1, p2, p3, p4); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4)

#define ETS_API_V6(name, P0, P1, P2, P3, P4, P5) \
  void Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      impl_##name(p0, p1, p2, p3, p4, p5); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_ " #P5)

#define ETS_API_V7(name, P0, P1, P2, P3, P4, P5, P6) \
  void Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6)

#define ETS_API_V8(name, P0, P1, P2, P3, P4, P5, P6, P7) \
  void Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7)

#define ETS_API_V9(name, P0, P1, P2, P3, P4, P5, P6, P7, P8) \
  void Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7, T<P8> a8) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      P8 p8 = getArgument<P8>(env, a8); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7 "_" #P8)

#define ETS_API_V10(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9) \
  void Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7, T<P8> a8, T<P9> a9) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      P8 p8 = getArgument<P8>(env, a8); \
      P9 p9 = getArgument<P9>(env, a9); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7 "_" #P8 "_" #P9)

#define ETS_API_V11(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10) \
  void Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7, T<P8> a8, T<P9> a9, T<P10> a10) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      P8 p8 = getArgument<P8>(env, a8); \
      P9 p9 = getArgument<P9>(env, a9); \
      P10 p10 = getArgument<P10>(env, a10); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7 "_" #P8 "_" #P9 "_" #P10)

#define ETS_API_V12(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11) \
  void Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7, T<P8> a8, T<P9> a9, T<P10> a10, T<P11> a11) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      P8 p8 = getArgument<P8>(env, a8); \
      P9 p9 = getArgument<P9>(env, a9); \
      P10 p10 = getArgument<P10>(env, a10); \
      P11 p11 = getArgument<P11>(env, a11); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7 "_" #P8 "_" #P9 "_" #P10 "_" #P11)

#define ETS_API_V13(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12) \
  void Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7, T<P8> a8, T<P9> a9, T<P10> a10, T<P11> a11, T<P12> a12) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      P8 p8 = getArgument<P8>(env, a8); \
      P9 p9 = getArgument<P9>(env, a9); \
      P10 p10 = getArgument<P10>(env, a10); \
      P11 p11 = getArgument<P11>(env, a11); \
      P12 p12 = getArgument<P12>(env, a12); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7 "_" #P8 "_" #P9 "_" #P10 "_" #P11 "_" #P12)

#define ETS_API_V14(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13) \
  void Ark_##name(EtsEnv *env, T<P0> a0, T<P1> a1, T<P2> a2, T<P3> a3, T<P4> a4, T<P5> a5, T<P6> a6, T<P7> a7, T<P8> a8, T<P9> a9, T<P10> a10, T<P11> a11, T<P12> a12, T<P13> a13) { \
      KOALA_MAYBE_LOG(name)                   \
      P0 p0 = getArgument<P0>(env, a0); \
      P1 p1 = getArgument<P1>(env, a1); \
      P2 p2 = getArgument<P2>(env, a2); \
      P3 p3 = getArgument<P3>(env, a3); \
      P4 p4 = getArgument<P4>(env, a4); \
      P5 p5 = getArgument<P5>(env, a5); \
      P6 p6 = getArgument<P6>(env, a6); \
      P7 p7 = getArgument<P7>(env, a7); \
      P8 p8 = getArgument<P8>(env, a8); \
      P9 p9 = getArgument<P9>(env, a9); \
      P10 p10 = getArgument<P10>(env, a10); \
      P11 p11 = getArgument<P11>(env, a11); \
      P12 p12 = getArgument<P12>(env, a12); \
      P13 p13 = getArgument<P13>(env, a13); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13); \
  } \
  MAKE_ETS_EXPORT(name, "void_" #P0 "_" #P1 "_" #P2 "_" #P3 "_" #P4 "_" #P5 "_" #P6 "_" #P7 "_" #P8 "_" #P9 "_" #P10 "_" #P11 "_" #P12 "_" #P13)

#else
#define ETS_API_0(name, Ret)
#define ETS_API_1(name, Ret, P0)
#define ETS_API_2(name, Ret, P0, P1)
#define ETS_API_3(name, Ret, P0, P1, P2)
#define ETS_API_4(name, Ret, P0, P1, P2, P3)
#define ETS_API_5(name, Ret, P0, P1, P2, P3, P4)
#define ETS_API_6(name, Ret, P0, P1, P2, P3, P4, P5)
#define ETS_API_7(name, Ret, P0, P1, P2, P3, P4, P5, P6)
#define ETS_API_8(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7)
#define ETS_API_9(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8)
#define ETS_API_10(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9)
#define ETS_API_11(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10)
#define ETS_API_12(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11)
#define ETS_API_13(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12)
#define ETS_API_14(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P14)
#define ETS_API_V0(name)
#define ETS_API_V1(name, P0)
#define ETS_API_V2(name, P0, P1)
#define ETS_API_V3(name, P0, P1, P2)
#define ETS_API_V4(name, P0, P1, P2, P3)
#define ETS_API_V5(name, P0, P1, P2, P3, P4)
#define ETS_API_V6(name, P0, P1, P2, P3, P4, P5)
#define ETS_API_V7(name, P0, P1, P2, P3, P4, P5, P6)
#define ETS_API_V8(name, P0, P1, P2, P3, P4, P5, P6, P7)
#define ETS_API_V9(name, P0, P1, P2, P3, P4, P5, P6, P7, P8)
#define ETS_API_V10(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9)
#define ETS_API_V11(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10)
#define ETS_API_V12(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11)
#define ETS_API_V13(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12)
#define ETS_API_V14(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13)
#endif // KOALA_ETS_NAPI
