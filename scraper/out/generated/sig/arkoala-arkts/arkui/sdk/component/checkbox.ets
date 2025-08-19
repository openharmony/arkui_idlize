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
import { CustomBuilder } from "./builder"
import { CommonConfiguration, CommonMethod, Bindable, ArkCommonMethodStyle } from "./common"
import { ResourceColor, MarkStyle } from "./units"
import { Color, CheckBoxShape } from "./enums"
import { Resource } from "@global.resource"
import { ContentModifier, AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface CheckboxOptions {
    name?: string;
    group?: string;
    indicatorBuilder?: CustomBuilder;
}
export declare interface CheckBoxConfiguration extends CommonConfiguration<CheckBoxConfiguration> {
    name: string;
    selected: boolean;
    triggerChange: ((value0: boolean) => void);
}
export type OnCheckboxChangeCallback = (value: boolean) => void;
export interface CheckboxAttribute extends CommonMethod {
    select(value: boolean | Bindable<boolean> | undefined): this {
        throw new Error("Unimplemented method select")
    }
    selectedColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method selectedColor")
    }
    shape(value: CheckBoxShape | undefined): this {
        throw new Error("Unimplemented method shape")
    }
    unselectedColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method unselectedColor")
    }
    mark(value: MarkStyle | undefined): this {
        throw new Error("Unimplemented method mark")
    }
    onChange(value: OnCheckboxChangeCallback | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    contentModifier(value: ContentModifier<CheckBoxConfiguration> | undefined): this {
        throw new Error("Unimplemented method contentModifier")
    }
    attributeModifier(value: AttributeModifier<CheckboxAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkCheckboxStyle extends ArkCommonMethodStyle implements CheckboxAttribute {
    select_value?: boolean | Bindable<boolean> | undefined
    selectedColor_value?: ResourceColor | undefined
    shape_value?: CheckBoxShape | undefined
    unselectedColor_value?: ResourceColor | undefined
    mark_value?: MarkStyle | undefined
    onChange_value?: OnCheckboxChangeCallback | undefined
    contentModifier_value?: ContentModifier<CheckBoxConfiguration> | undefined
    attributeModifier_value?: AttributeModifier<CheckboxAttribute> | AttributeModifier<CommonMethod> | undefined
    select(value: boolean | Bindable<boolean> | undefined): this {
        return this
    }
    selectedColor(value: ResourceColor | undefined): this {
        return this
    }
    shape(value: CheckBoxShape | undefined): this {
        return this
    }
    unselectedColor(value: ResourceColor | undefined): this {
        return this
    }
    mark(value: MarkStyle | undefined): this {
        return this
    }
    onChange(value: OnCheckboxChangeCallback | undefined): this {
        return this
    }
    contentModifier(value: ContentModifier<CheckBoxConfiguration> | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<CheckboxAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Checkbox(
    options?: CheckboxOptions,
    @memo
    content_?: () => void,
): CheckboxAttribute { throw new Error("")}
