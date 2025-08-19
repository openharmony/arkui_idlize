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
import { ResourceColor, Length, ResourceStr } from "./units"
import { Color, FontStyle, FontWeight } from "./enums"
import { Resource } from "@global.resource"
import { ContentModifier, AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare class TextTimerController {
    constructor()
    start(): void
    pause(): void
    reset(): void
}
export declare interface TextTimerConfiguration extends CommonConfiguration<TextTimerConfiguration> {
    count: number;
    isCountDown: boolean;
    started: boolean;
    elapsedTime: number;
}
export declare interface TextTimerOptions {
    isCountDown?: boolean;
    count?: number;
    controller?: TextTimerController;
}
export interface TextTimerAttribute extends CommonMethod {
    format(value: string | undefined): this {
        throw new Error("Unimplemented method format")
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
    fontWeight(value: number | FontWeight | ResourceStr | undefined): this {
        throw new Error("Unimplemented method fontWeight")
    }
    fontFamily(value: ResourceStr | undefined): this {
        throw new Error("Unimplemented method fontFamily")
    }
    onTimer(value: ((utc: number,elapsedTime: number) => void) | undefined): this {
        throw new Error("Unimplemented method onTimer")
    }
    textShadow(value: ShadowOptions | Array<ShadowOptions> | undefined): this {
        throw new Error("Unimplemented method textShadow")
    }
    contentModifier(value: ContentModifier<TextTimerConfiguration> | undefined): this {
        throw new Error("Unimplemented method contentModifier")
    }
    attributeModifier(value: AttributeModifier<TextTimerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkTextTimerStyle extends ArkCommonMethodStyle implements TextTimerAttribute {
    format_value?: string | undefined
    fontColor_value?: ResourceColor | undefined
    fontSize_value?: Length | undefined
    fontStyle_value?: FontStyle | undefined
    fontWeight_value?: number | FontWeight | ResourceStr | undefined
    fontFamily_value?: ResourceStr | undefined
    onTimer_value?: ((utc: number,elapsedTime: number) => void) | undefined
    textShadow_value?: ShadowOptions | Array<ShadowOptions> | undefined
    contentModifier_value?: ContentModifier<TextTimerConfiguration> | undefined
    attributeModifier_value?: AttributeModifier<TextTimerAttribute> | AttributeModifier<CommonMethod> | undefined
    format(value: string | undefined): this {
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
    fontWeight(value: number | FontWeight | ResourceStr | undefined): this {
        return this
    }
    fontFamily(value: ResourceStr | undefined): this {
        return this
    }
    onTimer(value: ((utc: number,elapsedTime: number) => void) | undefined): this {
        return this
    }
    textShadow(value: ShadowOptions | Array<ShadowOptions> | undefined): this {
        return this
    }
    contentModifier(value: ContentModifier<TextTimerConfiguration> | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<TextTimerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function TextTimer(
    options?: TextTimerOptions,
    @memo
    content_?: () => void,
): TextTimerAttribute { throw new Error("")}
