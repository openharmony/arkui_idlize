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
import { CommonConfiguration, CommonMethod, ArkCommonMethodStyle } from "./common"
import { TextOverflow, TextHeightAdaptivePolicy, Color, FontWeight, FontStyle } from "./enums"
import { ResourceStr, Font, ResourceColor, Length } from "./units"
import { Resource } from "@global.resource"
import { ContentModifier, AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum ButtonType {
    CAPSULE = 0,
    Capsule = 0,
    CIRCLE = 1,
    Circle = 1,
    NORMAL = 2,
    Normal = 2,
    ROUNDED_RECTANGLE = 3
}
export enum ButtonStyleMode {
    NORMAL = 0,
    EMPHASIZED = 1,
    TEXTUAL = 2
}
export enum ButtonRole {
    NORMAL = 0,
    ERROR = 1
}
export type ButtonTriggerClickCallback = (xPos: number, yPos: number) => void;
export declare interface ButtonConfiguration extends CommonConfiguration<ButtonConfiguration> {
    label: string;
    pressed: boolean;
    triggerClick: ButtonTriggerClickCallback;
}
export enum ControlSize {
    SMALL = "'small'",
    NORMAL = "'normal'"
}
export declare interface ButtonOptions {
    type?: ButtonType;
    stateEffect?: boolean;
    buttonStyle?: ButtonStyleMode;
    controlSize?: ControlSize;
    role?: ButtonRole;
}
export declare interface ButtonLabelStyle {
    overflow?: TextOverflow;
    maxLines?: number;
    minFontSize?: number | ResourceStr;
    maxFontSize?: number | ResourceStr;
    heightAdaptivePolicy?: TextHeightAdaptivePolicy;
    font?: Font;
}
export interface ButtonAttribute extends CommonMethod {
    type(value: ButtonType | undefined): this {
        throw new Error("Unimplemented method type")
    }
    stateEffect(value: boolean | undefined): this {
        throw new Error("Unimplemented method stateEffect")
    }
    buttonStyle(value: ButtonStyleMode | undefined): this {
        throw new Error("Unimplemented method buttonStyle")
    }
    controlSize(value: ControlSize | undefined): this {
        throw new Error("Unimplemented method controlSize")
    }
    role(value: ButtonRole | undefined): this {
        throw new Error("Unimplemented method role")
    }
    fontColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method fontColor")
    }
    fontSize(value: Length | undefined): this {
        throw new Error("Unimplemented method fontSize")
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        throw new Error("Unimplemented method fontWeight")
    }
    fontStyle(value: FontStyle | undefined): this {
        throw new Error("Unimplemented method fontStyle")
    }
    fontFamily(value: string | Resource | undefined): this {
        throw new Error("Unimplemented method fontFamily")
    }
    contentModifier(value: ContentModifier<ButtonConfiguration> | undefined): this {
        throw new Error("Unimplemented method contentModifier")
    }
    labelStyle(value: ButtonLabelStyle | undefined): this {
        throw new Error("Unimplemented method labelStyle")
    }
    minFontScale(value: number | Resource | undefined): this {
        throw new Error("Unimplemented method minFontScale")
    }
    maxFontScale(value: number | Resource | undefined): this {
        throw new Error("Unimplemented method maxFontScale")
    }
    attributeModifier(value: AttributeModifier<ButtonAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkButtonStyle extends ArkCommonMethodStyle implements ButtonAttribute {
    type_value?: ButtonType | undefined
    stateEffect_value?: boolean | undefined
    buttonStyle_value?: ButtonStyleMode | undefined
    controlSize_value?: ControlSize | undefined
    role_value?: ButtonRole | undefined
    fontColor_value?: ResourceColor | undefined
    fontSize_value?: Length | undefined
    fontWeight_value?: number | FontWeight | string | undefined
    fontStyle_value?: FontStyle | undefined
    fontFamily_value?: string | Resource | undefined
    contentModifier_value?: ContentModifier<ButtonConfiguration> | undefined
    labelStyle_value?: ButtonLabelStyle | undefined
    minFontScale_value?: number | Resource | undefined
    maxFontScale_value?: number | Resource | undefined
    attributeModifier_value?: AttributeModifier<ButtonAttribute> | AttributeModifier<CommonMethod> | undefined
    type(value: ButtonType | undefined): this {
        return this
    }
    stateEffect(value: boolean | undefined): this {
        return this
    }
    buttonStyle(value: ButtonStyleMode | undefined): this {
        return this
    }
    controlSize(value: ControlSize | undefined): this {
        return this
    }
    role(value: ButtonRole | undefined): this {
        return this
    }
    fontColor(value: ResourceColor | undefined): this {
        return this
    }
    fontSize(value: Length | undefined): this {
        return this
    }
    fontWeight(value: number | FontWeight | string | undefined): this {
        return this
    }
    fontStyle(value: FontStyle | undefined): this {
        return this
    }
    fontFamily(value: string | Resource | undefined): this {
        return this
    }
    contentModifier(value: ContentModifier<ButtonConfiguration> | undefined): this {
        return this
    }
    labelStyle(value: ButtonLabelStyle | undefined): this {
        return this
    }
    minFontScale(value: number | Resource | undefined): this {
        return this
    }
    maxFontScale(value: number | Resource | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<ButtonAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Button(
    label: ButtonOptions | ResourceStr, options?: ButtonOptions,
    @memo
    content_?: () => void,
): ButtonAttribute { throw new Error("")}
