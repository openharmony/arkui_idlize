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
import { Resource } from "@global.resource"
import { ResourceColor } from "./units"
import { Color } from "./enums"
import { CommonConfiguration, Bindable, CommonMethod, ArkCommonMethodStyle } from "./common"
import { ContentModifier, AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum ToggleType {
    CHECKBOX = 0,
    Checkbox = 0,
    SWITCH = 1,
    Switch = 1,
    BUTTON = 2,
    Button = 2
}
export declare interface SwitchStyle {
    pointRadius?: number | Resource;
    unselectedColor?: ResourceColor;
    pointColor?: ResourceColor;
    trackBorderRadius?: number | Resource;
}
export declare interface ToggleConfiguration extends CommonConfiguration<ToggleConfiguration> {
    isOn: boolean;
    toggleEnabled: boolean;
    triggerChange: ((value0: boolean) => void);
}
export declare interface ToggleOptions {
    type: ToggleType;
    isOn?: boolean | Bindable<boolean> | undefined;
}
export interface ToggleAttribute extends CommonMethod {
    onChange(value: ((value0: boolean) => void) | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    contentModifier(value: ContentModifier<ToggleConfiguration> | undefined): this {
        throw new Error("Unimplemented method contentModifier")
    }
    selectedColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method selectedColor")
    }
    switchPointColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method switchPointColor")
    }
    switchStyle(value: SwitchStyle | undefined): this {
        throw new Error("Unimplemented method switchStyle")
    }
    attributeModifier(value: AttributeModifier<ToggleAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkToggleStyle extends ArkCommonMethodStyle implements ToggleAttribute {
    onChange_value?: ((value0: boolean) => void) | undefined
    contentModifier_value?: ContentModifier<ToggleConfiguration> | undefined
    selectedColor_value?: ResourceColor | undefined
    switchPointColor_value?: ResourceColor | undefined
    switchStyle_value?: SwitchStyle | undefined
    attributeModifier_value?: AttributeModifier<ToggleAttribute> | AttributeModifier<CommonMethod> | undefined
    onChange(value: ((value0: boolean) => void) | undefined): this {
        return this
    }
    contentModifier(value: ContentModifier<ToggleConfiguration> | undefined): this {
        return this
    }
    selectedColor(value: ResourceColor | undefined): this {
        return this
    }
    switchPointColor(value: ResourceColor | undefined): this {
        return this
    }
    switchStyle(value: SwitchStyle | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<ToggleAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Toggle(
    options: ToggleOptions,
    @memo
    content_?: () => void,
): ToggleAttribute { throw new Error("")}
