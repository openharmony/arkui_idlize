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
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface RRect {
    left: number;
    top: number;
    width: number;
    height: number;
    radius: number;
}
export declare interface WindowAnimationTarget {
    readonly bundleName: string;
    readonly abilityName: string;
    readonly windowBounds: RRect;
    readonly missionId: number;
}
export interface RemoteWindowAttribute extends CommonMethod {
    attributeModifier(value: AttributeModifier<RemoteWindowAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkRemoteWindowStyle extends ArkCommonMethodStyle implements RemoteWindowAttribute {
    attributeModifier_value?: AttributeModifier<RemoteWindowAttribute> | AttributeModifier<CommonMethod> | undefined
    public attributeModifier(value: AttributeModifier<RemoteWindowAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function RemoteWindow(
    target: WindowAnimationTarget,
    @memo
    content_?: () => void,
): RemoteWindowAttribute { throw new Error("")}
