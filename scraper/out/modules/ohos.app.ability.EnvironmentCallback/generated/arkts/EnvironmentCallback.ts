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

import { SerializerBase, DeserializerBase, Finalizable, runtimeType, RuntimeType, toPeerPtr, KPointer, MaterializedBase, NativeBuffer } from "@koalaui/interop"
import { Configuration_serializer, TypeChecker, OHOS_APP_ABILITY_ENVIRONMENTCALLBACKNativeModule } from "./ohos.app.ability.EnvironmentCallback.INTERNAL"
import { Configuration } from "@ohos.app.ability.Configuration"
import { default as AbilityConstant } from "@ohos.app.ability.AbilityConstant"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export interface EnvironmentCallback {
    onConfigurationUpdated(config: Configuration): void
    onMemoryLevel(level: AbilityConstant.MemoryLevel): void
}
export class EnvironmentCallbackInternal implements MaterializedBase,EnvironmentCallback {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, EnvironmentCallbackInternal.getFinalizer())
    }
    constructor() {
        this(EnvironmentCallbackInternal.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_APP_ABILITY_ENVIRONMENTCALLBACKNativeModule._EnvironmentCallback_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_APP_ABILITY_ENVIRONMENTCALLBACKNativeModule._EnvironmentCallback_getFinalizer()
    }
    public static fromPtr(ptr: KPointer): EnvironmentCallbackInternal {
        return new EnvironmentCallbackInternal(ptr)
    }
    public onConfigurationUpdated(config: Configuration): void {
        const config_casted = config as (Configuration)
        this.onConfigurationUpdated_serialize(config_casted)
        return
    }
    public onMemoryLevel(level: AbilityConstant.MemoryLevel): void {
        const level_casted = level as (AbilityConstant.MemoryLevel)
        this.onMemoryLevel_serialize(level_casted)
        return
    }
    onConfigurationUpdated_serialize(config: Configuration): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        Configuration_serializer.write(thisSerializer, config)
        OHOS_APP_ABILITY_ENVIRONMENTCALLBACKNativeModule._EnvironmentCallback_onConfigurationUpdated(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onMemoryLevel_serialize(level: AbilityConstant.MemoryLevel): void {
        OHOS_APP_ABILITY_ENVIRONMENTCALLBACKNativeModule._EnvironmentCallback_onMemoryLevel(this.peer!.ptr, TypeChecker.AbilityConstant_MemoryLevel_ToNumeric(level))
    }
}
