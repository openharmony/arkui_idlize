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
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { HorizontalAlign, FlexAlign } from "./enums"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export type SpaceType = string | number | Resource;
export declare interface ColumnOptions {
    space?: string | number;
}
export declare interface ColumnOptionsV2 {
    _stub: int32;
}
export interface ColumnAttribute extends CommonMethod {
    alignItems(value: HorizontalAlign | undefined): this {
        throw new Error("Unimplemented method alignItems")
    }
    justifyContent(value: FlexAlign | undefined): this {
        throw new Error("Unimplemented method justifyContent")
    }
    reverse(value: boolean | undefined): this {
        throw new Error("Unimplemented method reverse")
    }
    attributeModifier(value: AttributeModifier<ColumnAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkColumnStyle extends ArkCommonMethodStyle implements ColumnAttribute {
    alignItems_value?: HorizontalAlign | undefined
    justifyContent_value?: FlexAlign | undefined
    reverse_value?: boolean | undefined
    attributeModifier_value?: AttributeModifier<ColumnAttribute> | AttributeModifier<CommonMethod> | undefined
    alignItems(value: HorizontalAlign | undefined): this {
        return this
    }
    justifyContent(value: FlexAlign | undefined): this {
        return this
    }
    reverse(value: boolean | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<ColumnAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Column(
    options?: ColumnOptions | ColumnOptionsV2,
    @memo
    content_?: () => void,
): ColumnAttribute { throw new Error("")}
