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


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

import { TypeChecker, OHOS_APP_ABILITY_APPLICATIONSTATECHANGECALLBACKNativeModule } from "./ohos.app.ability.ApplicationStateChangeCallback.INTERNAL"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export interface ApplicationStateChangeCallback {
    onApplicationForeground(): void
    onApplicationBackground(): void
}
export class ApplicationStateChangeCallbackInternal implements MaterializedBase,ApplicationStateChangeCallback {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, ApplicationStateChangeCallbackInternal.getFinalizer())
    }
    constructor() {
        this(ApplicationStateChangeCallbackInternal.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_APP_ABILITY_APPLICATIONSTATECHANGECALLBACKNativeModule._ApplicationStateChangeCallback_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_APP_ABILITY_APPLICATIONSTATECHANGECALLBACKNativeModule._ApplicationStateChangeCallback_getFinalizer()
    }
    public static fromPtr(ptr: KPointer): ApplicationStateChangeCallbackInternal {
        return new ApplicationStateChangeCallbackInternal(ptr)
    }
    public onApplicationForeground(): void {
        this.onApplicationForeground_serialize()
        return
    }
    public onApplicationBackground(): void {
        this.onApplicationBackground_serialize()
        return
    }
    onApplicationForeground_serialize(): void {
        OHOS_APP_ABILITY_APPLICATIONSTATECHANGECALLBACKNativeModule._ApplicationStateChangeCallback_onApplicationForeground(this.peer!.ptr)
    }
    onApplicationBackground_serialize(): void {
        OHOS_APP_ABILITY_APPLICATIONSTATECHANGECALLBACKNativeModule._ApplicationStateChangeCallback_onApplicationBackground(this.peer!.ptr)
    }
}
