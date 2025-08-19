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
import { CommonMethod, Bindable, ArkCommonMethodStyle } from "./common"
import { ResourceColor, MarkStyle } from "./units"
import { Color, CheckBoxShape } from "./enums"
import { Resource } from "@global.resource"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum SelectStatus {
    ALL = 0,
    All = 0,
    PART = 1,
    Part = 1,
    NONE = 2,
    None = 2
}
export declare interface CheckboxGroupOptions {
    group?: string;
}
export declare interface CheckboxGroupResult {
    name: Array<string>;
    status: SelectStatus;
}
export type OnCheckboxGroupChangeCallback = (value: CheckboxGroupResult) => void;
export interface CheckboxGroupAttribute extends CommonMethod {
    selectAll(value: boolean | Bindable<boolean> | undefined): this {
        throw new Error("Unimplemented method selectAll")
    }
    selectedColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method selectedColor")
    }
    unselectedColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method unselectedColor")
    }
    mark(value: MarkStyle | undefined): this {
        throw new Error("Unimplemented method mark")
    }
    onChange(value: OnCheckboxGroupChangeCallback | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    checkboxShape(value: CheckBoxShape | undefined): this {
        throw new Error("Unimplemented method checkboxShape")
    }
    attributeModifier(value: AttributeModifier<CheckboxGroupAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkCheckboxGroupStyle extends ArkCommonMethodStyle implements CheckboxGroupAttribute {
    selectAll_value?: boolean | Bindable<boolean> | undefined
    selectedColor_value?: ResourceColor | undefined
    unselectedColor_value?: ResourceColor | undefined
    mark_value?: MarkStyle | undefined
    onChange_value?: OnCheckboxGroupChangeCallback | undefined
    checkboxShape_value?: CheckBoxShape | undefined
    attributeModifier_value?: AttributeModifier<CheckboxGroupAttribute> | AttributeModifier<CommonMethod> | undefined
    selectAll(value: boolean | Bindable<boolean> | undefined): this {
        return this
    }
    selectedColor(value: ResourceColor | undefined): this {
        return this
    }
    unselectedColor(value: ResourceColor | undefined): this {
        return this
    }
    mark(value: MarkStyle | undefined): this {
        return this
    }
    onChange(value: OnCheckboxGroupChangeCallback | undefined): this {
        return this
    }
    checkboxShape(value: CheckBoxShape | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<CheckboxGroupAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function CheckboxGroup(
    options?: CheckboxGroupOptions,
    @memo
    content_?: () => void,
): CheckboxGroupAttribute { throw new Error("")}
