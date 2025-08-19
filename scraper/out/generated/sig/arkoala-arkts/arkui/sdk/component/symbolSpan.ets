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
import { Resource } from "@global.resource"
import { ResourceColor } from "./units"
import { Color, FontWeight } from "./enums"
import { SymbolEffectStrategy, SymbolRenderingStrategy } from "./symbolglyph"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export interface SymbolSpanAttribute extends CommonMethod {
    fontSize(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method fontSize")
    }
    fontColor(value: Array<ResourceColor> | undefined): this {
        throw new Error("Unimplemented method fontColor")
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        throw new Error("Unimplemented method fontWeight")
    }
    effectStrategy(value: SymbolEffectStrategy | undefined): this {
        throw new Error("Unimplemented method effectStrategy")
    }
    renderingStrategy(value: SymbolRenderingStrategy | undefined): this {
        throw new Error("Unimplemented method renderingStrategy")
    }
    attributeModifier(value: AttributeModifier<SymbolSpanAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkSymbolSpanStyle extends ArkCommonMethodStyle implements SymbolSpanAttribute {
    fontSize_value?: number | string | Resource | undefined
    fontColor_value?: Array<ResourceColor> | undefined
    fontWeight_value?: number | FontWeight | string | undefined
    effectStrategy_value?: SymbolEffectStrategy | undefined
    renderingStrategy_value?: SymbolRenderingStrategy | undefined
    attributeModifier_value?: AttributeModifier<SymbolSpanAttribute> | AttributeModifier<CommonMethod> | undefined
    fontSize(value: number | string | Resource | undefined): this {
        return this
    }
    fontColor(value: Array<ResourceColor> | undefined): this {
        return this
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        return this
    }
    effectStrategy(value: SymbolEffectStrategy | undefined): this {
        return this
    }
    renderingStrategy(value: SymbolRenderingStrategy | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<SymbolSpanAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function SymbolSpan(
    value: Resource,
    @memo
    content_?: () => void,
): SymbolSpanAttribute { throw new Error("")}
