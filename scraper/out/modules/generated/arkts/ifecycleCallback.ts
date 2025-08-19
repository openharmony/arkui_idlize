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

import { extractors } from "#handwritten"
import { UIAbility } from "@ohos.app.ability.UIAbility"
import { default as window } from "@ohos.window"
import { TypeChecker, OHOS_APP_ABILITY_ABILITYNativeModule } from "./ohos.app.ability.Ability.INTERNAL"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export interface AbilityLifecycleCallback {
    onAbilityCreate(ability: UIAbility): void
    onWindowStageCreate(ability: UIAbility, windowStage: window.WindowStage): void
    onWindowStageDestroy(ability: UIAbility, windowStage: window.WindowStage): void
    onAbilityDestroy(ability: UIAbility): void
    onAbilityForeground(ability: UIAbility): void
    onAbilityBackground(ability: UIAbility): void
}
export class AbilityLifecycleCallbackInternal implements MaterializedBase,AbilityLifecycleCallback {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, AbilityLifecycleCallbackInternal.getFinalizer())
    }
    constructor() {
        this(AbilityLifecycleCallbackInternal.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_APP_ABILITY_ABILITYNativeModule._AbilityLifecycleCallback_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_APP_ABILITY_ABILITYNativeModule._AbilityLifecycleCallback_getFinalizer()
    }
    public static fromPtr(ptr: KPointer): AbilityLifecycleCallbackInternal {
        return new AbilityLifecycleCallbackInternal(ptr)
    }
    public onAbilityCreate(ability: UIAbility): void {
        const ability_casted = ability as (UIAbility)
        this.onAbilityCreate_serialize(ability_casted)
        return
    }
    public onWindowStageCreate(ability: UIAbility, windowStage: window.WindowStage): void {
        const ability_casted = ability as (UIAbility)
        const windowStage_casted = windowStage as (window.WindowStage)
        this.onWindowStageCreate_serialize(ability_casted, windowStage_casted)
        return
    }
    public onWindowStageDestroy(ability: UIAbility, windowStage: window.WindowStage): void {
        const ability_casted = ability as (UIAbility)
        const windowStage_casted = windowStage as (window.WindowStage)
        this.onWindowStageDestroy_serialize(ability_casted, windowStage_casted)
        return
    }
    public onAbilityDestroy(ability: UIAbility): void {
        const ability_casted = ability as (UIAbility)
        this.onAbilityDestroy_serialize(ability_casted)
        return
    }
    public onAbilityForeground(ability: UIAbility): void {
        const ability_casted = ability as (UIAbility)
        this.onAbilityForeground_serialize(ability_casted)
        return
    }
    public onAbilityBackground(ability: UIAbility): void {
        const ability_casted = ability as (UIAbility)
        this.onAbilityBackground_serialize(ability_casted)
        return
    }
    onAbilityCreate_serialize(ability: UIAbility): void {
        OHOS_APP_ABILITY_ABILITYNativeModule._AbilityLifecycleCallback_onAbilityCreate(this.peer!.ptr, extractors.toUIAbilityPtr(ability))
    }
    onWindowStageCreate_serialize(ability: UIAbility, windowStage: window.WindowStage): void {
        OHOS_APP_ABILITY_ABILITYNativeModule._AbilityLifecycleCallback_onWindowStageCreate(this.peer!.ptr, extractors.toUIAbilityPtr(ability), extractors.toWindowWindowStagePtr(windowStage))
    }
    onWindowStageDestroy_serialize(ability: UIAbility, windowStage: window.WindowStage): void {
        OHOS_APP_ABILITY_ABILITYNativeModule._AbilityLifecycleCallback_onWindowStageDestroy(this.peer!.ptr, extractors.toUIAbilityPtr(ability), extractors.toWindowWindowStagePtr(windowStage))
    }
    onAbilityDestroy_serialize(ability: UIAbility): void {
        OHOS_APP_ABILITY_ABILITYNativeModule._AbilityLifecycleCallback_onAbilityDestroy(this.peer!.ptr, extractors.toUIAbilityPtr(ability))
    }
    onAbilityForeground_serialize(ability: UIAbility): void {
        OHOS_APP_ABILITY_ABILITYNativeModule._AbilityLifecycleCallback_onAbilityForeground(this.peer!.ptr, extractors.toUIAbilityPtr(ability))
    }
    onAbilityBackground_serialize(ability: UIAbility): void {
        OHOS_APP_ABILITY_ABILITYNativeModule._AbilityLifecycleCallback_onAbilityBackground(this.peer!.ptr, extractors.toUIAbilityPtr(ability))
    }
}
