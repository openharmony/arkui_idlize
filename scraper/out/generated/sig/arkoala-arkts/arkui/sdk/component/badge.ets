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
import { ResourceColor, ResourceStr, Length, Position } from "./units"
import { Color, FontWeight } from "./enums"
import { Resource } from "@global.resource"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum BadgePosition {
    RIGHT_TOP = 0,
    RightTop = 0,
    RIGHT = 1,
    Right = 1,
    LEFT = 2,
    Left = 2
}
export declare interface BadgeStyle {
    color?: ResourceColor;
    fontSize?: number | ResourceStr;
    badgeSize?: number | ResourceStr;
    badgeColor?: ResourceColor;
    borderColor?: ResourceColor;
    borderWidth?: Length;
    fontWeight?: number | FontWeight | ResourceStr;
}
export declare interface BadgeParam {
    position?: BadgePosition | Position;
    style: BadgeStyle;
}
export declare interface BadgeParamWithNumber extends BadgeParam {
    count: number;
    maxCount?: number;
}
export declare interface BadgeParamWithString extends BadgeParam {
    value: ResourceStr;
}
export interface BadgeAttribute extends CommonMethod {
    attributeModifier(value: AttributeModifier<BadgeAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkBadgeStyle extends ArkCommonMethodStyle implements BadgeAttribute {
    attributeModifier_value?: AttributeModifier<BadgeAttribute> | AttributeModifier<CommonMethod> | undefined
    public attributeModifier(value: AttributeModifier<BadgeAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Badge(
    value: BadgeParamWithNumber,
    @memo
    content_?: () => void,
): BadgeAttribute { throw new Error("")}
@memo
@ComponentBuilder
export function Badge(
    value: BadgeParamWithString,
    @memo
    content_?: () => void,
): BadgeAttribute { throw new Error("")}
