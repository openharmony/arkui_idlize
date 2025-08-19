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
import { Font, ResourceColor, Dimension, BorderRadiuses, DividerStyleOptions } from "./units"
import { Color } from "./enums"
import { Resource } from "@global.resource"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum SubMenuExpandingMode {
    SIDE_EXPAND = 0,
    EMBEDDED_EXPAND = 1,
    STACK_EXPAND = 2
}
export interface MenuAttribute extends CommonMethod {
    font(value: Font | undefined): this {
        throw new Error("Unimplemented method font")
    }
    fontColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method fontColor")
    }
    radius(value: Dimension | BorderRadiuses | undefined): this {
        throw new Error("Unimplemented method radius")
    }
    menuItemDivider(value: DividerStyleOptions | undefined): this {
        throw new Error("Unimplemented method menuItemDivider")
    }
    menuItemGroupDivider(value: DividerStyleOptions | undefined): this {
        throw new Error("Unimplemented method menuItemGroupDivider")
    }
    subMenuExpandingMode(value: SubMenuExpandingMode | undefined): this {
        throw new Error("Unimplemented method subMenuExpandingMode")
    }
    attributeModifier(value: AttributeModifier<MenuAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkMenuStyle extends ArkCommonMethodStyle implements MenuAttribute {
    font_value?: Font | undefined
    fontColor_value?: ResourceColor | undefined
    radius_value?: Dimension | BorderRadiuses | undefined
    menuItemDivider_value?: DividerStyleOptions | undefined
    menuItemGroupDivider_value?: DividerStyleOptions | undefined
    subMenuExpandingMode_value?: SubMenuExpandingMode | undefined
    attributeModifier_value?: AttributeModifier<MenuAttribute> | AttributeModifier<CommonMethod> | undefined
    font(value: Font | undefined): this {
        return this
    }
    fontColor(value: ResourceColor | undefined): this {
        return this
    }
    radius(value: Dimension | BorderRadiuses | undefined): this {
        return this
    }
    menuItemDivider(value: DividerStyleOptions | undefined): this {
        return this
    }
    menuItemGroupDivider(value: DividerStyleOptions | undefined): this {
        return this
    }
    subMenuExpandingMode(value: SubMenuExpandingMode | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<MenuAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Menu(
    
    @memo
    content_?: () => void,
): MenuAttribute { throw new Error("")}
