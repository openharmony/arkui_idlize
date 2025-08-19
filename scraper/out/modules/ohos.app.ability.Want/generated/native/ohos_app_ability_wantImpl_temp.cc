/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

#define KOALA_INTEROP_MODULE NotSpecifiedInteropModule
#include "common-interop.h"
#include "ohos_app_ability_want.h"

OH_OHOS_APP_ABILITY_WANT_WantHandle Want_constructImpl() {
    return {};
}
void Want_destructImpl(OH_OHOS_APP_ABILITY_WANT_WantHandle thisPtr) {
}
Opt_String Want_getAbilityNameImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_String Want_getActionImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_String Want_getBundleNameImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_String Want_getDeviceIdImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_Array_String Want_getEntitiesImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_Map_String_Int32 Want_getFdsImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_Int32 Want_getFlagsImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_String Want_getModuleNameImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_Map_String_Object Want_getParametersImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_String Want_getTypeImpl(OH_NativePointer thisPtr) {
    return {};
}
Opt_String Want_getUriImpl(OH_NativePointer thisPtr) {
    return {};
}
void Want_setAbilityNameImpl(OH_NativePointer thisPtr, const Opt_String* value) {
}
void Want_setActionImpl(OH_NativePointer thisPtr, const Opt_String* value) {
}
void Want_setBundleNameImpl(OH_NativePointer thisPtr, const Opt_String* value) {
}
void Want_setDeviceIdImpl(OH_NativePointer thisPtr, const Opt_String* value) {
}
void Want_setEntitiesImpl(OH_NativePointer thisPtr, const Opt_Array_String* value) {
}
void Want_setFlagsImpl(OH_NativePointer thisPtr, const Opt_Int32* value) {
}
void Want_setModuleNameImpl(OH_NativePointer thisPtr, const Opt_String* value) {
}
void Want_setParametersImpl(OH_NativePointer thisPtr, const Opt_Map_String_Object* value) {
}
void Want_setTypeImpl(OH_NativePointer thisPtr, const Opt_String* value) {
}
void Want_setUriImpl(OH_NativePointer thisPtr, const Opt_String* value) {
}