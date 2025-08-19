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
import { ResourceStr, Font, ResourceColor } from "./units"
import { Resource } from "@global.resource"
import { SymbolGlyphModifier } from "./../SymbolGlyphModifier"
import { CustomBuilder } from "./builder"
import { CommonMethod, Bindable, ArkCommonMethodStyle } from "./common"
import { Color } from "./enums"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface MenuItemOptions {
    startIcon?: ResourceStr;
    symbolStartIcon?: SymbolGlyphModifier;
    content?: ResourceStr;
    endIcon?: ResourceStr;
    symbolEndIcon?: SymbolGlyphModifier;
    labelInfo?: ResourceStr;
    builder?: CustomBuilder;
}
export interface MenuItemAttribute extends CommonMethod {
    selected(value: boolean | Bindable<boolean> | undefined): this {
        throw new Error("Unimplemented method selected")
    }
    selectIcon(value: boolean | ResourceStr | SymbolGlyphModifier | undefined): this {
        throw new Error("Unimplemented method selectIcon")
    }
    onChange(value: ((selected: boolean) => void) | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    contentFont(value: Font | undefined): this {
        throw new Error("Unimplemented method contentFont")
    }
    contentFontColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method contentFontColor")
    }
    labelFont(value: Font | undefined): this {
        throw new Error("Unimplemented method labelFont")
    }
    labelFontColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method labelFontColor")
    }
    attributeModifier(value: AttributeModifier<MenuItemAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkMenuItemStyle extends ArkCommonMethodStyle implements MenuItemAttribute {
    selected_value?: boolean | Bindable<boolean> | undefined
    selectIcon_value?: boolean | ResourceStr | SymbolGlyphModifier | undefined
    onChange_value?: ((selected: boolean) => void) | undefined
    contentFont_value?: Font | undefined
    contentFontColor_value?: ResourceColor | undefined
    labelFont_value?: Font | undefined
    labelFontColor_value?: ResourceColor | undefined
    attributeModifier_value?: AttributeModifier<MenuItemAttribute> | AttributeModifier<CommonMethod> | undefined
    selected(value: boolean | Bindable<boolean> | undefined): this {
        return this
    }
    selectIcon(value: boolean | ResourceStr | SymbolGlyphModifier | undefined): this {
        return this
    }
    onChange(value: ((selected: boolean) => void) | undefined): this {
        return this
    }
    contentFont(value: Font | undefined): this {
        return this
    }
    contentFontColor(value: ResourceColor | undefined): this {
        return this
    }
    labelFont(value: Font | undefined): this {
        return this
    }
    labelFontColor(value: ResourceColor | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<MenuItemAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function MenuItem(
    value?: MenuItemOptions | CustomBuilder,
    @memo
    content_?: () => void,
): MenuItemAttribute { throw new Error("")}
