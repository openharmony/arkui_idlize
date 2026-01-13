#pragma once

#include <ani.h>
#include <cstring>
#include "../types.h"

#define PlatformEnvType ani_env*
#include "../common.h"

template <>
struct BridgeConvertor<UInt8> {
    using PlatformType = ani_boolean;
    static UInt8 toBridgeType(ani_env* env, PlatformType val) {
        return val;
    }
    static PlatformType fromBridgeType(ani_env* env, UInt8 val) {
        return val;
    }
    static void cleanup(UInt8) {};
};

template <>
struct BridgeConvertor<Int32> {
    using PlatformType = ani_int;
    static Int32 toBridgeType(ani_env* env, ani_int val) {
        return val;
    }
    static ani_int fromBridgeType(ani_env* env, Int32 val) {
        return val;
    }
    static void cleanup(Int32) {};
};

template <>
struct BridgeConvertor<Float32> {
    using PlatformType = ani_float;
    static Float32 toBridgeType(ani_env* env, ani_float val) {
        return val;
    }
    static ani_float fromBridgeType(ani_env* env, Float32 val) {
        return val;
    }
    static void cleanup(Float32) {};
};

template <>
struct BridgeConvertor<NativePointer> {
    using PlatformType = ani_long;
    static NativePointer toBridgeType(ani_env* env, ani_long val) {
        return reinterpret_cast<NativePointer>(val);
    }
    static ani_long fromBridgeType(ani_env* env, NativePointer val) {
        return reinterpret_cast<ani_long>(val);
    }
    static void cleanup(NativePointer) {};
};

template <>
struct BridgeConvertor<UInt64> {
    using PlatformType = ani_long;
    static UInt64 toBridgeType(ani_env* env, ani_long val) {
       return reinterpret_cast<UInt64&>(val);
    }
    static ani_long fromBridgeType(ani_env* env, UInt64 val) {
        return reinterpret_cast<ani_long&>(val);
    }
    static void cleanup(UInt64) {};
};

template <>
struct BridgeConvertor<String> {
    using PlatformType = ani_string;
    static String toBridgeType(ani_env* env, ani_string val) {
        if (val == nullptr) return "";
        ani_size length_utf_8 = 0;
        env->String_GetUTF8Size(val, &length_utf_8);
        ani_size count = 0;
        char* memory = new char[length_utf_8 + 1];
        env->String_GetUTF8SubString(val, 0, length_utf_8, memory, length_utf_8 + 1, &count);
        memory[length_utf_8] = 0;
        return memory;
    }
    static ani_string fromBridgeType(ani_env* env, String val) {
        ani_string result = nullptr;
        int length = strlen(val);
        env->String_NewUTF8(val, length, &result);
        return result;
    }
    static void cleanup(String data) {
        delete[] data;
    };
};
