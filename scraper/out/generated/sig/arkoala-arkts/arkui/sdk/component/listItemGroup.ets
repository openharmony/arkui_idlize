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
import { CommonMethod, ChildrenMainSize, ArkCommonMethodStyle } from "./common"
import { ListDividerOptions } from "./list"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum ListItemGroupStyle {
    NONE = 0,
    CARD = 1
}
export declare interface ListItemGroupOptions {
    header?: CustomBuilder;
    headerComponent?: ComponentContent;
    footer?: CustomBuilder;
    footerComponent?: ComponentContent;
    space?: number | string;
    style?: ListItemGroupStyle;
}
export interface ListItemGroupAttribute extends CommonMethod {
    divider(value: ListDividerOptions | undefined): this {
        throw new Error("Unimplemented method divider")
    }
    childrenMainSize(value: ChildrenMainSize | undefined): this {
        throw new Error("Unimplemented method childrenMainSize")
    }
    attributeModifier(value: AttributeModifier<ListItemGroupAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkListItemGroupStyle extends ArkCommonMethodStyle implements ListItemGroupAttribute {
    divider_value?: ListDividerOptions | undefined
    childrenMainSize_value?: ChildrenMainSize | undefined
    attributeModifier_value?: AttributeModifier<ListItemGroupAttribute> | AttributeModifier<CommonMethod> | undefined
    divider(value: ListDividerOptions | undefined): this {
        return this
    }
    childrenMainSize(value: ChildrenMainSize | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<ListItemGroupAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function ListItemGroup(
    options?: ListItemGroupOptions,
    @memo
    content_?: () => void,
): ListItemGroupAttribute { throw new Error("")}
