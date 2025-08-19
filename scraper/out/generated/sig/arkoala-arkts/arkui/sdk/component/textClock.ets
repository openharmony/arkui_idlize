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
import { CommonConfiguration, CommonMethod, ShadowOptions, ArkCommonMethodStyle } from "./common"
import { ResourceStr, ResourceColor, Length } from "./units"
import { Resource } from "@global.resource"
import { Color, FontStyle, FontWeight } from "./enums"
import { ContentModifier, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { default as intl } from "@ohos.intl"
export declare class TextClockController {
    constructor()
    start(): void
    stop(): void
}
export declare interface TextClockConfiguration extends CommonConfiguration<TextClockConfiguration> {
    timeZoneOffset: number;
    started: boolean;
    timeValue: number;
}
export declare interface TextClockOptions {
    timeZoneOffset?: number;
    controller?: TextClockController;
}
export interface TextClockAttribute extends CommonMethod {
    format(value: ResourceStr | undefined): this {
        throw new Error("Unimplemented method format")
    }
    onDateChange(value: ((value: number) => void) | undefined): this {
        throw new Error("Unimplemented method onDateChange")
    }
    fontColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method fontColor")
    }
    fontSize(value: Length | undefined): this {
        throw new Error("Unimplemented method fontSize")
    }
    fontStyle(value: FontStyle | undefined): this {
        throw new Error("Unimplemented method fontStyle")
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        throw new Error("Unimplemented method fontWeight")
    }
    fontFamily(value: ResourceStr | undefined): this {
        throw new Error("Unimplemented method fontFamily")
    }
    textShadow(value: ShadowOptions | Array<ShadowOptions> | undefined): this {
        throw new Error("Unimplemented method textShadow")
    }
    fontFeature(value: string | undefined): this {
        throw new Error("Unimplemented method fontFeature")
    }
    contentModifier(value: ContentModifier<TextClockConfiguration> | undefined): this {
        throw new Error("Unimplemented method contentModifier")
    }
    dateTimeOptions(value: intl.DateTimeOptions | undefined): this {
        throw new Error("Unimplemented method dateTimeOptions")
    }
    attributeModifier(value: AttributeModifier<TextClockAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkTextClockStyle extends ArkCommonMethodStyle implements TextClockAttribute {
    format_value?: ResourceStr | undefined
    onDateChange_value?: ((value: number) => void) | undefined
    fontColor_value?: ResourceColor | undefined
    fontSize_value?: Length | undefined
    fontStyle_value?: FontStyle | undefined
    fontWeight_value?: number | FontWeight | string | undefined
    fontFamily_value?: ResourceStr | undefined
    textShadow_value?: ShadowOptions | Array<ShadowOptions> | undefined
    fontFeature_value?: string | undefined
    contentModifier_value?: ContentModifier<TextClockConfiguration> | undefined
    dateTimeOptions_value?: intl.DateTimeOptions | undefined
    attributeModifier_value?: AttributeModifier<TextClockAttribute> | AttributeModifier<CommonMethod> | undefined
    format(value: ResourceStr | undefined): this {
        return this
    }
    onDateChange(value: ((value: number) => void) | undefined): this {
        return this
    }
    fontColor(value: ResourceColor | undefined): this {
        return this
    }
    fontSize(value: Length | undefined): this {
        return this
    }
    fontStyle(value: FontStyle | undefined): this {
        return this
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        return this
    }
    fontFamily(value: ResourceStr | undefined): this {
        return this
    }
    textShadow(value: ShadowOptions | Array<ShadowOptions> | undefined): this {
        return this
    }
    fontFeature(value: string | undefined): this {
        return this
    }
    contentModifier(value: ContentModifier<TextClockConfiguration> | undefined): this {
        return this
    }
    dateTimeOptions(value: intl.DateTimeOptions | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<TextClockAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function TextClock(
    options?: TextClockOptions,
    @memo
    content_?: () => void,
): TextClockAttribute { throw new Error("")}
