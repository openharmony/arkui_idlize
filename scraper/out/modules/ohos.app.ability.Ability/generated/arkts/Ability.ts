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
import { Configuration_serializer, TypeChecker, OHOS_APP_ABILITY_ABILITYNativeModule } from "./ohos.app.ability.Ability.INTERNAL"
import { Configuration } from "@ohos.app.ability.Configuration"
import { default as AbilityConstant } from "./onstant"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export class AbilityInternal {
    public static fromPtr(ptr: KPointer): Ability {
        return new Ability(ptr)
    }
}
export class Ability implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, Ability.getFinalizer())
    }
    constructor() {
        this(Ability.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_APP_ABILITY_ABILITYNativeModule._Ability_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_APP_ABILITY_ABILITYNativeModule._Ability_getFinalizer()
    }
    public onConfigurationUpdate(newConfig: Configuration): void {
        const newConfig_casted = newConfig as (Configuration)
        this.onConfigurationUpdate_serialize(newConfig_casted)
        return
    }
    public onMemoryLevel(level: AbilityConstant.MemoryLevel): void {
        const level_casted = level as (AbilityConstant.MemoryLevel)
        this.onMemoryLevel_serialize(level_casted)
        return
    }
    onConfigurationUpdate_serialize(newConfig: Configuration): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        Configuration_serializer.write(thisSerializer, newConfig)
        OHOS_APP_ABILITY_ABILITYNativeModule._Ability_onConfigurationUpdate(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onMemoryLevel_serialize(level: AbilityConstant.MemoryLevel): void {
        OHOS_APP_ABILITY_ABILITYNativeModule._Ability_onMemoryLevel(this.peer!.ptr, TypeChecker.AbilityConstant_MemoryLevel_ToNumeric(level))
    }
}
