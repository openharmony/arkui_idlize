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
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum GridItemStyle {
    NONE = 0,
    PLAIN = 1
}
export declare interface GridItemOptions {
    style?: GridItemStyle;
}
export interface GridItemAttribute extends CommonMethod {
    rowStart(value: number | undefined): this {
        throw new Error("Unimplemented method rowStart")
    }
    rowEnd(value: number | undefined): this {
        throw new Error("Unimplemented method rowEnd")
    }
    columnStart(value: number | undefined): this {
        throw new Error("Unimplemented method columnStart")
    }
    columnEnd(value: number | undefined): this {
        throw new Error("Unimplemented method columnEnd")
    }
    selectable(value: boolean | undefined): this {
        throw new Error("Unimplemented method selectable")
    }
    selected(value: boolean | Bindable<boolean> | undefined): this {
        throw new Error("Unimplemented method selected")
    }
    onSelect(value: ((isSelected: boolean) => void) | undefined): this {
        throw new Error("Unimplemented method onSelect")
    }
    attributeModifier(value: AttributeModifier<GridItemAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkGridItemStyle extends ArkCommonMethodStyle implements GridItemAttribute {
    rowStart_value?: number | undefined
    rowEnd_value?: number | undefined
    columnStart_value?: number | undefined
    columnEnd_value?: number | undefined
    selectable_value?: boolean | undefined
    selected_value?: boolean | Bindable<boolean> | undefined
    onSelect_value?: ((isSelected: boolean) => void) | undefined
    attributeModifier_value?: AttributeModifier<GridItemAttribute> | AttributeModifier<CommonMethod> | undefined
    rowStart(value: number | undefined): this {
        return this
    }
    rowEnd(value: number | undefined): this {
        return this
    }
    columnStart(value: number | undefined): this {
        return this
    }
    columnEnd(value: number | undefined): this {
        return this
    }
    selectable(value: boolean | undefined): this {
        return this
    }
    selected(value: boolean | Bindable<boolean> | undefined): this {
        return this
    }
    onSelect(value: ((isSelected: boolean) => void) | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<GridItemAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function GridItem(
    value?: GridItemOptions,
    @memo
    content_?: () => void,
): GridItemAttribute { throw new Error("")}
