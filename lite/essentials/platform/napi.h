#pragma once

#include <node_api.h>
#include "../types.h"

#define PlatformEnvType napi_env
#include "../common.h"

template <>
struct BridgeConvertor<UInt8> {
    using PlatformType = napi_value;
    static UInt8 toBridgeType(napi_env env, napi_value val) {
        Int32 result;
        napi_get_value_int32(env, val, &result);
        return static_cast<UInt8>(result);
    }
    static napi_value fromBridgeType(napi_env env, UInt8 val) {
        Int32 casted = static_cast<Int32>(val);
        napi_value result;
        napi_create_int32(env, casted, &result);
        return result;
    }
    static void cleanup(UInt8) {};
};

template <>
struct BridgeConvertor<Int32> {
    using PlatformType = napi_value;
    static Int32 toBridgeType(napi_env env, napi_value val) {
        Int32 result;
        napi_get_value_int32(env, val, &result);
        return result;
    }
    static napi_value fromBridgeType(napi_env env, Int32 val) {
        napi_value result;
        napi_create_int32(env, val, &result);
        return result;
    }
    static void cleanup(Int32) {};
};

template <>
struct BridgeConvertor<Float32> {
    using PlatformType = napi_value;
    static Float32 toBridgeType(napi_env env, napi_value val) {
        double result;
        napi_get_value_double(env, val, &result);
        return static_cast<Float32>(result);
    }
    static napi_value fromBridgeType(napi_env env, Float32 val) {
        napi_value result;
        napi_create_double(env, static_cast<double>(val), &result);
        return result;
    }
    static void cleanup(Float32) {};
};

template <>
struct BridgeConvertor<NativePointer> {
    using PlatformType = napi_value;
    static NativePointer toBridgeType(napi_env env, napi_value val) {
        uint64_t result;
        bool lossless;
        napi_get_value_bigint_uint64(env, val, &result, &lossless);
        return reinterpret_cast<NativePointer>(result);
    }
    static napi_value fromBridgeType(napi_env env, NativePointer val) {
        uint64_t casted = reinterpret_cast<uint64_t>(val);
        napi_value result;
        napi_create_bigint_uint64(env, casted, &result);
        return result;
    }
    static void cleanup(NativePointer) {};
};

template <>
struct BridgeConvertor<UInt64> {
    using PlatformType = napi_value;
    static UInt64 toBridgeType(napi_env env, napi_value val) {
        uint64_t result;
        bool lossless;
        napi_get_value_bigint_uint64(env, val, &result, &lossless);
        return reinterpret_cast<UInt64>(result);
    }
    static napi_value fromBridgeType(napi_env env, UInt64 val) {
        uint64_t casted = reinterpret_cast<uint64_t>(val);
        napi_value result;
        napi_create_bigint_uint64(env, casted, &result);
        return result;
    }
    static void cleanup(UInt64) {};
};

template <>
struct BridgeConvertor<String> {
    using PlatformType = napi_value;
    static String toBridgeType(napi_env env, napi_value val) {
        size_t string_length;
        napi_get_value_string_utf8(env, val, nullptr, 0, &string_length);
        char* memory = new char[string_length + 1];
        napi_get_value_string_utf8(env, val, memory, string_length + 1, nullptr);
        return memory;
    }
    static napi_value fromBridgeType(napi_env env, String val) {
        napi_value result;
        napi_create_string_utf8(env, val, NAPI_AUTO_LENGTH, &result);
        return result;
    }
    static void cleanup(String data) {
        delete[] data;
    };
};
