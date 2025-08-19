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
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface GridColColumnOption {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
}
export declare interface GridColOptions {
    span?: number | GridColColumnOption;
    offset?: number | GridColColumnOption;
    order?: number | GridColColumnOption;
}
export interface GridColAttribute extends CommonMethod {
    span(value: number | GridColColumnOption | undefined): this {
        throw new Error("Unimplemented method span")
    }
    gridColOffset(value: number | GridColColumnOption | undefined): this {
        throw new Error("Unimplemented method gridColOffset")
    }
    order(value: number | GridColColumnOption | undefined): this {
        throw new Error("Unimplemented method order")
    }
    attributeModifier(value: AttributeModifier<GridColAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkGridColStyle extends ArkCommonMethodStyle implements GridColAttribute {
    span_value?: number | GridColColumnOption | undefined
    gridColOffset_value?: number | GridColColumnOption | undefined
    order_value?: number | GridColColumnOption | undefined
    attributeModifier_value?: AttributeModifier<GridColAttribute> | AttributeModifier<CommonMethod> | undefined
    span(value: number | GridColColumnOption | undefined): this {
        return this
    }
    gridColOffset(value: number | GridColColumnOption | undefined): this {
        return this
    }
    order(value: number | GridColColumnOption | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<GridColAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function GridCol(
    option?: GridColOptions,
    @memo
    content_?: () => void,
): GridColAttribute { throw new Error("")}
