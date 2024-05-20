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

#include "convertors-node.h"
#include "init-exports-cb.h"
#include <cstring>

uint8_t* getUInt8Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<uint8_t>(info, index);
}

int8_t* getInt8Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<int8_t>(info, index);
}

uint16_t* getUInt16Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<uint16_t>(info, index);
}

int16_t* getInt16Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<int16_t>(info, index);
}

uint32_t* getUInt32Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<uint32_t>(info, index);
}

uint32_t* getUInt32Elements(Napi::Env env, Napi::Value value) {
    return getTypedElements<uint32_t>(env, value);
}

int32_t* getInt32Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<int32_t>(info, index);
}

float* getFloat32Elements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<float>(info, index);
}

KNativePointer* getPointerElements(const Napi::CallbackInfo& info, int index) {
  return getTypedElements<KNativePointer>(info, index);
}

KBoolean getBoolean(Napi::Env env, Napi::Value value) {
    if (value.IsBoolean()) {
        return static_cast<KBoolean>(value.As<Napi::Boolean>().Value());
    }
    return static_cast<KBoolean>(getInt32(env, value) != 0);
}

KInt getInt32(Napi::Env env, Napi::Value value) {
  if (!value.IsNumber()) {
    Napi::Error::New(env, "Expected Number")
        .ThrowAsJavaScriptException();
    return 0;
  }

  return value.As<Napi::Number>().Int32Value();
}

KUInt getUInt32(Napi::Env env, Napi::Value value) {
  if (!value.IsNumber()) {
    Napi::Error::New(env, "Expected Number")
        .ThrowAsJavaScriptException();
    return 0;
  }

  return value.As<Napi::Number>().Uint32Value();
}

KFloat getFloat32(const Napi::CallbackInfo& info, Napi::Value value) {
  if (!value.IsNumber()) {
    Napi::Error::New(info.Env(), "Expected Number")
        .ThrowAsJavaScriptException();
    return 0.0f;
  }
  return value.As<Napi::Number>().FloatValue();
}

KDouble getFloat64(const Napi::CallbackInfo& info, Napi::Value value) {
  if (!value.IsNumber()) {
    Napi::Error::New(info.Env(), "Expected Number")
        .ThrowAsJavaScriptException();
    return 0.0;
  }
  return value.As<Napi::Number>().DoubleValue();
}

KStringPtr getString(Napi::Env env, Napi::Value value) {
  if (value.IsNull() || value.IsUndefined()) {
      return KStringPtr();
  }

  if (!value.IsString()) {
    Napi::Error::New(env, "Expected String")
        .ThrowAsJavaScriptException();
    return KStringPtr();
  }

  auto string = value.As<Napi::String>().ToString().Utf8Value();
  return KStringPtr(string.c_str());
}

KNativePointer getPointer(Napi::Env env, Napi::Value value) {
    if (!value.IsBigInt()) {
        Napi::Error::New(env, "cannot be coerced to pointer")
            .ThrowAsJavaScriptException();
        return nullptr;
    }
    bool isWithinRange = true;
    uint64_t ptrU64 = value.As<Napi::BigInt>().Uint64Value(&isWithinRange);
    if (!isWithinRange) {
        Napi::Error::New(env, "cannot be coerced to pointer, value is too large")
            .ThrowAsJavaScriptException();
        return nullptr;
    }
    return reinterpret_cast<KNativePointer>(ptrU64);
}

Napi::Object getObject(Napi::Env env, Napi::Value value) {
    if (!value.IsObject()) {
        Napi::Error::New(env, "Expected Object")
          .ThrowAsJavaScriptException();
        return env.Global();
    }

    return value.As<Napi::Object>();
}

Napi::Value makeString(const Napi::CallbackInfo& info, const KStringPtr& value) {
    return Napi::String::New(info.Env(), value.isNull() ? "" : value.data());
}

Napi::Value makeString(const Napi::CallbackInfo& info, const std::string& value) {
    return Napi::String::New(info.Env(), value);
}

Napi::Value makeBoolean(const Napi::CallbackInfo& info, int8_t value) {
    return Napi::Number::New(info.Env(), value);
}

Napi::Value makeInt32(const Napi::CallbackInfo& info, int32_t value) {
    return Napi::Number::New(info.Env(), value);
}

Napi::Value makeUInt32(const Napi::CallbackInfo& info, uint32_t value) {
    return Napi::Number::New(info.Env(), value);
}

Napi::Value makeFloat32(const Napi::CallbackInfo& info, float value) {
    return Napi::Number::New(info.Env(), value);
}

Napi::Value makePointer(const Napi::CallbackInfo& info, void* value) {
    return makePointer(info.Env(), value);
}

Napi::Value makePointer(Napi::Env env, void* value) {
    return Napi::BigInt::New(env, static_cast<uint64_t>(reinterpret_cast<uintptr_t>(value)));
}

Napi::Value makeVoid(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
}

Napi::Object makeObject(const Napi::CallbackInfo& info, napi_value object) {
    return Napi::Object(info.Env(), object);
}

#if _MSC_VER >= 1932 // Visual Studio 2022 version 17.2+
#    pragma comment(linker, "/alternatename:__imp___std_init_once_complete=__imp_InitOnceComplete")
#    pragma comment(linker, "/alternatename:__imp___std_init_once_begin_initialize=__imp_InitOnceBeginInitialize")
#endif

Exports* Exports::getInstance() {
    static Exports *instance = nullptr;
    if (instance == nullptr) {
        instance = new Exports();
    }
    return instance;
}

/**
 * Sets a new callback and returns its previous value.
 */
Napi::ModuleRegisterCallback ProvideModuleRegisterCallback(Napi::ModuleRegisterCallback value = nullptr) {
    static const Napi::ModuleRegisterCallback DEFAULT_CB = [](Napi::Env env, Napi::Object exports) { return exports; };
    static Napi::ModuleRegisterCallback curCallback = DEFAULT_CB;

    Napi::ModuleRegisterCallback prevCallback = curCallback;
    curCallback = value ? value : DEFAULT_CB;
    return prevCallback;
}

static Napi::Object InitModule(Napi::Env env, Napi::Object exports) {
    LOG("InitModule: " QUOTE(INTEROP_LIBRARY_NAME) "\n");
    for (const auto& impl: Exports::getInstance()->getImpls()) {
        exports.Set(Napi::String::New(env, impl.first.c_str()),
                    Napi::Function::New(env, impl.second, impl.first.c_str()));
    }
    return ProvideModuleRegisterCallback()(env, exports);
}

NODE_API_MODULE(INTEROP_LIBRARY_NAME, InitModule)
