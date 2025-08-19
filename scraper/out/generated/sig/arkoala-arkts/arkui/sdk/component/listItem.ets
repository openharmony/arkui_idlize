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
import { ComponentContent } from "./../ComponentContent"
import { Length } from "./units"
import { Resource } from "@global.resource"
import { CommonMethod, Bindable, ArkCommonMethodStyle } from "./common"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum SwipeEdgeEffect {
    SPRING = 0,
    Spring = 0,
    NONE = 1,
    None = 1
}
export enum SwipeActionState {
    COLLAPSED = 0,
    EXPANDED = 1,
    ACTIONING = 2
}
export declare interface SwipeActionItem {
    builder?: CustomBuilder;
    builderComponent?: ComponentContent;
    actionAreaDistance?: Length;
    onAction?: (() => void);
    onEnterActionArea?: (() => void);
    onExitActionArea?: (() => void);
    onStateChange?: ((state: SwipeActionState) => void);
}
export declare interface SwipeActionOptions {
    start?: CustomBuilder | SwipeActionItem;
    end?: CustomBuilder | SwipeActionItem;
    edgeEffect?: SwipeEdgeEffect;
    onOffsetChange?: ((offset: number) => void);
}
export enum ListItemStyle {
    NONE = 0,
    CARD = 1
}
export declare interface ListItemOptions {
    style?: ListItemStyle;
}
export interface ListItemAttribute extends CommonMethod {
    selectable(value: boolean | undefined): this {
        throw new Error("Unimplemented method selectable")
    }
    selected(value: boolean | Bindable<boolean> | undefined): this {
        throw new Error("Unimplemented method selected")
    }
    swipeAction(value: SwipeActionOptions | undefined): this {
        throw new Error("Unimplemented method swipeAction")
    }
    onSelect(value: ((isSelected: boolean) => void) | undefined): this {
        throw new Error("Unimplemented method onSelect")
    }
    attributeModifier(value: AttributeModifier<ListItemAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkListItemStyle extends ArkCommonMethodStyle implements ListItemAttribute {
    selectable_value?: boolean | undefined
    selected_value?: boolean | Bindable<boolean> | undefined
    swipeAction_value?: SwipeActionOptions | undefined
    onSelect_value?: ((isSelected: boolean) => void) | undefined
    attributeModifier_value?: AttributeModifier<ListItemAttribute> | AttributeModifier<CommonMethod> | undefined
    selectable(value: boolean | undefined): this {
        return this
    }
    selected(value: boolean | Bindable<boolean> | undefined): this {
        return this
    }
    swipeAction(value: SwipeActionOptions | undefined): this {
        return this
    }
    onSelect(value: ((isSelected: boolean) => void) | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<ListItemAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function ListItem(
    value?: ListItemOptions,
    @memo
    content_?: () => void,
): ListItemAttribute { throw new Error("")}
