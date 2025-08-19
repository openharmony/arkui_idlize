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

import { int32, int64, float32 } from "@koalaui/common"
import { KInt, KPointer, KBoolean, NativeBuffer, KStringPtr } from "@koalaui/interop"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { ComponentContent } from "./../ComponentContent"
import { RecordData } from "./pluginComponent"
import { TerminationInfo, CommonMethod, ArkCommonMethodStyle } from "./common"
import { ErrorCallback } from "@ohos.base"
import { AttributeModifier, extractors, AttributeUpdater } from "./../handwritten"
import { Want } from "@ohos.app.ability.Want"
export enum DpiFollowStrategy {
    FOLLOW_HOST_DPI = 0,
    FOLLOW_UI_EXTENSION_ABILITY_DPI = 1
}
export enum WindowModeFollowStrategy {
    FOLLOW_HOST_WINDOW_MODE = 0,
    FOLLOW_UI_EXTENSION_ABILITY_WINDOW_MODE = 1
}
export declare interface UIExtensionOptions {
    isTransferringCaller?: boolean;
    placeholder?: ComponentContent;
    areaChangePlaceholder?: Map<string, ComponentContent>;
    dpiFollowStrategy?: DpiFollowStrategy;
    windowModeFollowStrategy?: WindowModeFollowStrategy;
}
export type ReceiveCallback = ((value0: Map<string, RecordData>) => void);
export declare interface UIExtensionProxy {
    send(data: Map<string, RecordData>): void
    sendSync(data: Map<string, RecordData>): Map<string, RecordData>
    onAsyncReceiverRegisterAsyncReceiverRegister(callback_: ((value0: UIExtensionProxy) => void)): void
    onSyncReceiverRegisterSyncReceiverRegister(callback_: ((value0: UIExtensionProxy) => void)): void
    offAsyncReceiverRegisterAsyncReceiverRegister(callback_?: ((value0: UIExtensionProxy) => void)): void
    offSyncReceiverRegisterSyncReceiverRegister(callback_?: ((value0: UIExtensionProxy) => void)): void
}
export interface UIExtensionComponentAttribute extends CommonMethod {
    onRemoteReady(value: ((value0: UIExtensionProxy) => void) | undefined): this {
        throw new Error("Unimplemented method onRemoteReady")
    }
    onReceive(value: ((value0: Map<string, RecordData>) => void) | undefined): this {
        throw new Error("Unimplemented method onReceive")
    }
    onError(value: ErrorCallback | undefined): this {
        throw new Error("Unimplemented method onError")
    }
    onTerminated(value: ((value0: TerminationInfo) => void) | undefined): this {
        throw new Error("Unimplemented method onTerminated")
    }
    onDrawReady(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onDrawReady")
    }
    attributeModifier(value: AttributeModifier<UIExtensionComponentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkUIExtensionComponentStyle extends ArkCommonMethodStyle implements UIExtensionComponentAttribute {
    onRemoteReady_value?: ((value0: UIExtensionProxy) => void) | undefined
    onReceive_value?: ((value0: Map<string, RecordData>) => void) | undefined
    onError_value?: ErrorCallback | undefined
    onTerminated_value?: ((value0: TerminationInfo) => void) | undefined
    onDrawReady_value?: (() => void) | undefined
    attributeModifier_value?: AttributeModifier<UIExtensionComponentAttribute> | AttributeModifier<CommonMethod> | undefined
    onRemoteReady(value: ((value0: UIExtensionProxy) => void) | undefined): this {
        return this
    }
    onReceive(value: ((value0: Map<string, RecordData>) => void) | undefined): this {
        return this
    }
    onError(value: ErrorCallback | undefined): this {
        return this
    }
    onTerminated(value: ((value0: TerminationInfo) => void) | undefined): this {
        return this
    }
    onDrawReady(value: (() => void) | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<UIExtensionComponentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function UIExtensionComponent(
    want: Want, options?: UIExtensionOptions,
    @memo
    content_?: () => void,
): UIExtensionComponentAttribute { throw new Error("")}
