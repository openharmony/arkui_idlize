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
import { ResourceColor, Dimension, BorderRadiuses, Font, Length } from "./units"
import { Color, FontStyle, FontWeight, TextCase } from "./enums"
import { Resource } from "@global.resource"
import { CommonMethod, ShadowOptions, ArkCommonMethodStyle } from "./common"
import { LengthMetrics } from "./../Graphics"
import { DecorationStyleInterface } from "./styledString"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface TextBackgroundStyle {
    color?: ResourceColor;
    radius?: Dimension | BorderRadiuses;
}
export interface BaseSpan extends CommonMethod {
    textBackgroundStyle(value: TextBackgroundStyle | undefined): this {
        throw new Error("Unimplemented method textBackgroundStyle")
    }
    baselineOffset(value: LengthMetrics | undefined): this {
        throw new Error("Unimplemented method baselineOffset")
    }
    attributeModifier(value: AttributeModifier<BaseSpan> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkBaseSpanStyle extends ArkCommonMethodStyle implements BaseSpan {
    textBackgroundStyle_value?: TextBackgroundStyle | undefined
    baselineOffset_value?: LengthMetrics | undefined
    textBackgroundStyle(value: TextBackgroundStyle | undefined): this {
        return this
    }
    baselineOffset(value: LengthMetrics | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<BaseSpan> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export interface SpanAttribute extends BaseSpan {
    font(value: Font | undefined): this {
        throw new Error("Unimplemented method font")
    }
    fontColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method fontColor")
    }
    fontSize(value: number | string | Resource | undefined): this {
        throw new Error("Unimplemented method fontSize")
    }
    fontStyle(value: FontStyle | undefined): this {
        throw new Error("Unimplemented method fontStyle")
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        throw new Error("Unimplemented method fontWeight")
    }
    fontFamily(value: string | Resource | undefined): this {
        throw new Error("Unimplemented method fontFamily")
    }
    decoration(value: DecorationStyleInterface | undefined): this {
        throw new Error("Unimplemented method decoration")
    }
    letterSpacing(value: number | string | undefined): this {
        throw new Error("Unimplemented method letterSpacing")
    }
    textCase(value: TextCase | undefined): this {
        throw new Error("Unimplemented method textCase")
    }
    lineHeight(value: Length | undefined): this {
        throw new Error("Unimplemented method lineHeight")
    }
    textShadow(value: ShadowOptions | Array<ShadowOptions> | undefined): this {
        throw new Error("Unimplemented method textShadow")
    }
    attributeModifier(value: AttributeModifier<SpanAttribute> | AttributeModifier<BaseSpan> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkSpanStyle extends ArkBaseSpanStyle implements SpanAttribute {
    font_value?: Font | undefined
    fontColor_value?: ResourceColor | undefined
    fontSize_value?: number | string | Resource | undefined
    fontStyle_value?: FontStyle | undefined
    fontWeight_value?: number | FontWeight | string | undefined
    fontFamily_value?: string | Resource | undefined
    decoration_value?: DecorationStyleInterface | undefined
    letterSpacing_value?: number | string | undefined
    textCase_value?: TextCase | undefined
    lineHeight_value?: Length | undefined
    textShadow_value?: ShadowOptions | Array<ShadowOptions> | undefined
    attributeModifier_value?: AttributeModifier<SpanAttribute> | AttributeModifier<CommonMethod> | undefined
    font(value: Font | undefined): this {
        return this
    }
    fontColor(value: ResourceColor | undefined): this {
        return this
    }
    fontSize(value: number | string | Resource | undefined): this {
        return this
    }
    fontStyle(value: FontStyle | undefined): this {
        return this
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        return this
    }
    fontFamily(value: string | Resource | undefined): this {
        return this
    }
    decoration(value: DecorationStyleInterface | undefined): this {
        return this
    }
    letterSpacing(value: number | string | undefined): this {
        return this
    }
    textCase(value: TextCase | undefined): this {
        return this
    }
    lineHeight(value: Length | undefined): this {
        return this
    }
    textShadow(value: ShadowOptions | Array<ShadowOptions> | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<SpanAttribute> | AttributeModifier<BaseSpan> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Span(
    value: string | Resource,
    @memo
    content_?: () => void,
): SpanAttribute { throw new Error("")}
