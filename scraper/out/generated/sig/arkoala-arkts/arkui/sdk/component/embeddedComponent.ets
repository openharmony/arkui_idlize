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
import { TerminationInfo, CommonMethod, ArkCommonMethodStyle } from "./common"
import { ErrorCallback } from "@ohos.base"
import { AttributeModifier, extractors, AttributeUpdater } from "./../handwritten"
import { Want } from "@ohos.app.ability.Want"
import { EmbeddedType } from "./enums"
export interface EmbeddedComponentAttribute extends CommonMethod {
    onTerminated(value: ((value0: TerminationInfo) => void) | undefined): this {
        throw new Error("Unimplemented method onTerminated")
    }
    onError(value: ErrorCallback | undefined): this {
        throw new Error("Unimplemented method onError")
    }
    attributeModifier(value: AttributeModifier<EmbeddedComponentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkEmbeddedComponentStyle extends ArkCommonMethodStyle implements EmbeddedComponentAttribute {
    onTerminated_value?: ((value0: TerminationInfo) => void) | undefined
    onError_value?: ErrorCallback | undefined
    attributeModifier_value?: AttributeModifier<EmbeddedComponentAttribute> | AttributeModifier<CommonMethod> | undefined
    onTerminated(value: ((value0: TerminationInfo) => void) | undefined): this {
        return this
    }
    onError(value: ErrorCallback | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<EmbeddedComponentAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function EmbeddedComponent(
    loader: Want, type?: EmbeddedType,
    @memo
    content_?: () => void,
): EmbeddedComponentAttribute { throw new Error("")}
