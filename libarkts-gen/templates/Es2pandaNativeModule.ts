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

import {
    KNativePointer,
    KInt,
    KBoolean,
    KNativePointer,
    registerNativeModule,
    registerLoadedLibrary
} from "@koalaui/interop"

// TODO: this type should be in interop
export type KNativePointerArray = BigUint64Array

%GENERATED_PART%

export function initEs2panda(): Es2pandaNativeModule {
    registerLoadedLibrary(require("../native/build/es2panda.node"))
    const instance = new Es2pandaNativeModule()
    // registerNativeModule("InteropNativeModule", NativeModule)
    registerNativeModule("NativeModule", instance)
    return instance
}
