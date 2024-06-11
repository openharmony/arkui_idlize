/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

#ifdef KOALA_JNI

#include <jni.h>
#include <assert.h>

#include <vector>
#include <string>
#include <tuple>

#include "interop-types.h"

#define KOALA_JNI_CALL(type) extern "C" JNIEXPORT type JNICALL

class JniExports {
    std::vector<std::tuple<std::string, std::string, void*>> implementations;

public:
    static JniExports* getInstance();

    void addImpl(const char* name, const char* type, void* impl);
    const std::vector<std::tuple<std::string, std::string, void*>>& getImpls() {
        return implementations;
    }
};

#ifdef _MSC_VER
#define MAKE_JNI_EXPORT(name, type)                             \
    static void __init_##name() {                               \
        JniExports::getInstance()->addImpl("_"#name, type, reinterpret_cast<void *>(Java_org_##name)); \
    }                                                           \
    namespace {                                                 \
      struct __Init_##name {                                    \
        __Init_##name() {  __init_##name(); }                   \
      } __Init_##name##_v;                                      \
    }
#else
#define MAKE_JNI_EXPORT(name, type) \
    __attribute__((constructor)) \
    static void __init_jni_##name() { \
        JniExports::getInstance()->addImpl("_"#name, type, reinterpret_cast<void *>(Java_org_##name)); \
    }
#endif

template<class T>
struct InteropTypeConverter {
    using InteropType = T;
    static T convertFrom(JNIEnv* env, InteropType value) { return value; }
    static InteropType convertTo(JNIEnv* env, T value) { return value; }
    static void release(JNIEnv* env, InteropType value, T converted) {}
};

template<>
struct InteropTypeConverter<KStringPtr> {
    using InteropType = jstring;
    static KStringPtr convertFrom(JNIEnv* env, InteropType value) {
        if (value == nullptr) return KStringPtr();
        jboolean isCopy;
		    const char* str_value = env->GetStringUTFChars(value, &isCopy);
        int len = env->GetStringLength(value);
        KStringPtr result(str_value, len, false);
        return result;
    }
    static InteropType convertTo(JNIEnv* env, KStringPtr value) = delete;
    static void release(JNIEnv* env, InteropType value, const KStringPtr& converted) {
      env->ReleaseStringUTFChars(value, converted.data());
    }
};

template<>
struct InteropTypeConverter<KByte*> {
    using InteropType = jbyteArray;
    static KByte* convertFrom(JNIEnv* env, InteropType value) {
        return value ? reinterpret_cast<KByte*>(env->GetByteArrayElements(value, nullptr)) : nullptr;
    }
    static InteropType convertTo(JNIEnv* env, KByte* value) = delete;
    static void release(JNIEnv* env, InteropType value, KByte* converted) {
         env->ReleaseByteArrayElements(value, reinterpret_cast<jbyte*>(converted), 0);
    }
};

template<>
struct InteropTypeConverter<KInt*> {
    using InteropType = jintArray;
    static KInt* convertFrom(JNIEnv* env, InteropType value) {
        return value ? reinterpret_cast<KInt*>(env->GetIntArrayElements(value, nullptr)) : nullptr;
    }
    static InteropType convertTo(JNIEnv* env, KInt* value) = delete;
    static void release(JNIEnv* env, InteropType value, KInt* converted) {
         env->ReleaseIntArrayElements(value, reinterpret_cast<jint*>(converted), 0);
    }
};

template<>
struct InteropTypeConverter<KFloat*> {
    using InteropType = jfloatArray;
    static KFloat* convertFrom(JNIEnv* env, InteropType value) {
        return value ? reinterpret_cast<KFloat*>(env->GetFloatArrayElements(value, nullptr)) : nullptr;
    }
    static InteropType convertTo(JNIEnv* env, KFloat* value) = delete;
    static void release(JNIEnv* env, InteropType value, KFloat* converted) {
        env->ReleaseFloatArrayElements(value, reinterpret_cast<jfloat*>(converted), 0);
    }
};

template<>
struct InteropTypeConverter<KNativePointer> {
    using InteropType = jlong;
    static KNativePointer convertFrom(JNIEnv* env, InteropType value) {
      return reinterpret_cast<KNativePointer>(value);
    }
    static InteropType convertTo(JNIEnv* env, KNativePointer value) {
      return reinterpret_cast<jlong>(value);
    }
    static void release(JNIEnv* env, InteropType value, KNativePointer converted) {}
};

template <typename Type>
inline typename InteropTypeConverter<Type>::InteropType makeResult(JNIEnv* env, Type value) {
  return InteropTypeConverter<Type>::convertTo(env, value);
}

template <typename Type>
inline Type getArgument(JNIEnv* env, typename InteropTypeConverter<Type>::InteropType arg) {
  return InteropTypeConverter<Type>::convertFrom(env, arg);
}

template <typename Type>
inline void releaseArgument(JNIEnv* env, typename InteropTypeConverter<Type>::InteropType arg, Type data) {
  InteropTypeConverter<Type>::release(env, arg, data);
}

#define KOALA_INTEROP_0(name, Ret) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance) { \
      KOALA_MAYBE_LOG(name) \
      return makeResult(env, impl_##name()); \
  } \
MAKE_JNI_EXPORT(name, #Ret)

#define KOALA_INTEROP_1(name, Ret, P0) \
   KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) \
   Java_org_##name(JNIEnv* env, jclass instance, \
    InteropTypeConverter<P0>::InteropType _p0) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      auto rv = makeResult<Ret>(env, impl_##name(p0)); \
      releaseArgument(env, _p0, p0); \
      return rv; \
  } \
MAKE_JNI_EXPORT(name, #Ret "|" #P0)

#define KOALA_INTEROP_2(name, Ret, P0, P1) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      return rv; \
} \
MAKE_JNI_EXPORT(name, #Ret "|" #P0 "|" #P1)

#define KOALA_INTEROP_3(name, Ret, P0, P1, P2) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      return rv; \
} \
MAKE_JNI_EXPORT(name, #Ret "|" #P0 "|" #P1 "|" #P2)

#define KOALA_INTEROP_4(name, Ret, P0, P1, P2, P3) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      return rv; \
} \
MAKE_JNI_EXPORT(name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3)

#define KOALA_INTEROP_5(name, Ret, P0, P1, P2, P3, P4) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      return rv; \
} \
MAKE_JNI_EXPORT(name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4)

#define KOALA_INTEROP_6(name, Ret, P0, P1, P2, P3, P4, P5) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      return rv; \
} \
MAKE_JNI_EXPORT(name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5)

#define KOALA_INTEROP_7(name, Ret, P0, P1, P2, P3, P4, P5, P6) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      return rv; \
} \
MAKE_JNI_EXPORT(name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6)

#define KOALA_INTEROP_8(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5, \
  InteropTypeConverter<P6>::InteropType _p6, \
  InteropTypeConverter<P7>::InteropType _p7) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      return rv; \
} \
MAKE_JNI_EXPORT(name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7)

#define KOALA_INTEROP_9(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5, \
  InteropTypeConverter<P6>::InteropType _p6, \
  InteropTypeConverter<P7>::InteropType _p7, \
  InteropTypeConverter<P8>::InteropType _p8) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      return rv; \
} \
MAKE_JNI_EXPORT(name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8)

#define KOALA_INTEROP_10(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5, \
  InteropTypeConverter<P6>::InteropType _p6, \
  InteropTypeConverter<P7>::InteropType _p7, \
  InteropTypeConverter<P8>::InteropType _p8, \
  InteropTypeConverter<P9>::InteropType _p9) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      return rv; \
} \
MAKE_JNI_EXPORT(name, #Ret "|" #P0 "|" #P1 "|" #P2 "|" #P3 "|" #P4 "|" #P5 "|" #P6 "|" #P7 "|" #P8 "|" #P9)

#define KOALA_INTEROP_11(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5, \
  InteropTypeConverter<P6>::InteropType _p6, \
  InteropTypeConverter<P7>::InteropType _p7, \
  InteropTypeConverter<P8>::InteropType _p8, \
  InteropTypeConverter<P9>::InteropType _p9, \
  InteropTypeConverter<P10>::InteropType _p10) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      return rv; \
}

#define KOALA_INTEROP_12(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8, \
    InteropTypeConverter<P9>::InteropType _p9, \
    InteropTypeConverter<P10>::InteropType _p10, \
    InteropTypeConverter<P11>::InteropType _p11) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      P11 p11 = getArgument<P11>(env, _p11); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      releaseArgument(env, _p11, p11); \
      return rv; \
}

#define KOALA_INTEROP_13(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8, \
    InteropTypeConverter<P9>::InteropType _p9, \
    InteropTypeConverter<P10>::InteropType _p10, \
    InteropTypeConverter<P11>::InteropType _p11, \
    InteropTypeConverter<P12>::InteropType _p12) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      P11 p11 = getArgument<P11>(env, _p11); \
      P12 p12 = getArgument<P12>(env, _p12); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      releaseArgument(env, _p11, p11); \
      releaseArgument(env, _p12, p12); \
      return rv; \
}

#define KOALA_INTEROP_14(name, Ret, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13) \
  KOALA_JNI_CALL(InteropTypeConverter<Ret>::InteropType) Java_org_##name(JNIEnv* env, jclass instance, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8, \
    InteropTypeConverter<P9>::InteropType _p9, \
    InteropTypeConverter<P10>::InteropType _p10, \
    InteropTypeConverter<P11>::InteropType _p11, \
    InteropTypeConverter<P12>::InteropType _p12, \
    InteropTypeConverter<P13>::InteropType _p13) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      P11 p11 = getArgument<P11>(env, _p11); \
      P12 p12 = getArgument<P12>(env, _p12); \
      P13 p13 = getArgument<P13>(env, _p13); \
      auto rv = makeResult<Ret>(env, impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13)); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      releaseArgument(env, _p11, p11); \
      releaseArgument(env, _p12, p12); \
      releaseArgument(env, _p13, p13); \
      return rv; \
}


#define KOALA_INTEROP_V0(name) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance) { \
      KOALA_MAYBE_LOG(name) \
      impl_##name(); \
  } \
MAKE_JNI_EXPORT(name, "void")

#define KOALA_INTEROP_V1(name, P0) \
   KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
    InteropTypeConverter<P0>::InteropType _p0) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      impl_##name(p0); \
      releaseArgument(env, _p0, p0); \
  } \
MAKE_JNI_EXPORT(name, "void|" #P0)

#define KOALA_INTEROP_V2(name, P0, P1) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
   InteropTypeConverter<P0>::InteropType _p0, \
   InteropTypeConverter<P1>::InteropType _p1) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      impl_##name(p0, p1); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
} \
MAKE_JNI_EXPORT(name, "void|" #P0 "|" #P1)

#define KOALA_INTEROP_V3(name, P0, P1, P2) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
   InteropTypeConverter<P0>::InteropType _p0, \
   InteropTypeConverter<P1>::InteropType _p1, \
   InteropTypeConverter<P2>::InteropType _p2) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      impl_##name(p0, p1, p2); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
} \
MAKE_JNI_EXPORT(name, "void|" #P0 "|" #P1 "|" #P2)

#define KOALA_INTEROP_V4(name, P0, P1, P2, P3) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      impl_##name(p0, p1, p2, p3); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
} \
MAKE_JNI_EXPORT(name, "void|" #P0 "|" #P1 "|" #P2 "|" #P3)

#define KOALA_INTEROP_V5(name, P0, P1, P2, P3, P4) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      impl_##name(p0, p1, p2, p3, p4); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
}

#define KOALA_INTEROP_V6(name, P0, P1, P2, P3, P4, P5) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      impl_##name(p0, p1, p2, p3, p4, p5); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
}

#define KOALA_INTEROP_V7(name, P0, P1, P2, P3, P4, P5, P6) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5, \
  InteropTypeConverter<P6>::InteropType _p6) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
}

#define KOALA_INTEROP_V8(name, P0, P1, P2, P3, P4, P5, P6, P7) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5, \
  InteropTypeConverter<P6>::InteropType _p6, \
  InteropTypeConverter<P7>::InteropType _p7) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
}

#define KOALA_INTEROP_V9(name, P0, P1, P2, P3, P4, P5, P6, P7, P8) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
    InteropTypeConverter<P0>::InteropType _p0, \
    InteropTypeConverter<P1>::InteropType _p1, \
    InteropTypeConverter<P2>::InteropType _p2, \
    InteropTypeConverter<P3>::InteropType _p3, \
    InteropTypeConverter<P4>::InteropType _p4, \
    InteropTypeConverter<P5>::InteropType _p5, \
    InteropTypeConverter<P6>::InteropType _p6, \
    InteropTypeConverter<P7>::InteropType _p7, \
    InteropTypeConverter<P8>::InteropType _p8) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
}

#define KOALA_INTEROP_V10(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5, \
  InteropTypeConverter<P6>::InteropType _p6, \
  InteropTypeConverter<P7>::InteropType _p7, \
  InteropTypeConverter<P8>::InteropType _p8, \
  InteropTypeConverter<P9>::InteropType _p9) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
}

#define KOALA_INTEROP_V11(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5, \
  InteropTypeConverter<P6>::InteropType _p6, \
  InteropTypeConverter<P7>::InteropType _p7, \
  InteropTypeConverter<P8>::InteropType _p8, \
  InteropTypeConverter<P9>::InteropType _p9, \
  InteropTypeConverter<P10>::InteropType _p10) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
}

#define KOALA_INTEROP_V12(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5, \
  InteropTypeConverter<P6>::InteropType _p6, \
  InteropTypeConverter<P7>::InteropType _p7, \
  InteropTypeConverter<P8>::InteropType _p8, \
  InteropTypeConverter<P9>::InteropType _p9, \
  InteropTypeConverter<P10>::InteropType _p10, \
  InteropTypeConverter<P11>::InteropType _p11) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      P11 p11 = getArgument<P11>(env, _p11); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      releaseArgument(env, _p11, p11); \
}

#define KOALA_INTEROP_V13(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5, \
  InteropTypeConverter<P6>::InteropType _p6, \
  InteropTypeConverter<P7>::InteropType _p7, \
  InteropTypeConverter<P8>::InteropType _p8, \
  InteropTypeConverter<P9>::InteropType _p9, \
  InteropTypeConverter<P10>::InteropType _p10, \
  InteropTypeConverter<P11>::InteropType _p11, \
  InteropTypeConverter<P12>::InteropType _p12) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      P11 p11 = getArgument<P11>(env, _p11); \
      P12 p12 = getArgument<P12>(env, _p12); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      releaseArgument(env, _p11, p11); \
      releaseArgument(env, _p12, p12); \
}

#define KOALA_INTEROP_V14(name, P0, P1, P2, P3, P4, P5, P6, P7, P8, P9, P10, P11, P12, P13) \
  KOALA_JNI_CALL(void) Java_org_##name(JNIEnv* env, jclass instance, \
  InteropTypeConverter<P0>::InteropType _p0, \
  InteropTypeConverter<P1>::InteropType _p1, \
  InteropTypeConverter<P2>::InteropType _p2, \
  InteropTypeConverter<P3>::InteropType _p3, \
  InteropTypeConverter<P4>::InteropType _p4, \
  InteropTypeConverter<P5>::InteropType _p5, \
  InteropTypeConverter<P6>::InteropType _p6, \
  InteropTypeConverter<P7>::InteropType _p7, \
  InteropTypeConverter<P8>::InteropType _p8, \
  InteropTypeConverter<P9>::InteropType _p9, \
  InteropTypeConverter<P10>::InteropType _p10, \
  InteropTypeConverter<P11>::InteropType _p11, \
  InteropTypeConverter<P12>::InteropType _p12, \
  InteropTypeConverter<P13>::InteropType _p13) { \
      KOALA_MAYBE_LOG(name) \
      P0 p0 = getArgument<P0>(env, _p0); \
      P1 p1 = getArgument<P1>(env, _p1); \
      P2 p2 = getArgument<P2>(env, _p2); \
      P3 p3 = getArgument<P3>(env, _p3); \
      P4 p4 = getArgument<P4>(env, _p4); \
      P5 p5 = getArgument<P5>(env, _p5); \
      P6 p6 = getArgument<P6>(env, _p6); \
      P7 p7 = getArgument<P7>(env, _p7); \
      P8 p8 = getArgument<P8>(env, _p8); \
      P9 p9 = getArgument<P9>(env, _p9); \
      P10 p10 = getArgument<P10>(env, _p10); \
      P11 p11 = getArgument<P11>(env, _p11); \
      P12 p12 = getArgument<P12>(env, _p12); \
      P13 p13 = getArgument<P13>(env, _p13); \
      impl_##name(p0, p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13); \
      releaseArgument(env, _p0, p0); \
      releaseArgument(env, _p1, p1); \
      releaseArgument(env, _p2, p2); \
      releaseArgument(env, _p3, p3); \
      releaseArgument(env, _p4, p4); \
      releaseArgument(env, _p5, p5); \
      releaseArgument(env, _p6, p6); \
      releaseArgument(env, _p7, p7); \
      releaseArgument(env, _p8, p8); \
      releaseArgument(env, _p9, p9); \
      releaseArgument(env, _p10, p10); \
      releaseArgument(env, _p11, p11); \
      releaseArgument(env, _p12, p12); \
      releaseArgument(env, _p13, p13); \
}

#endif  // KOALA_JNI_CALL