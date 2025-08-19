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
import { Length } from "./units"
import { Resource } from "@global.resource"
import { CommonShapeMethod, CommonMethod, ArkCommonShapeMethodStyle, ArkCommonMethodStyle } from "./common"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export type ShapePoint = [
    Length,
    Length
]
export declare interface LineOptions {
    width?: string | double;
    height?: string | double;
}
export interface LineAttribute extends CommonShapeMethod {
    startPoint(value: ShapePoint | undefined): this {
        throw new Error("Unimplemented method startPoint")
    }
    endPoint(value: ShapePoint | undefined): this {
        throw new Error("Unimplemented method endPoint")
    }
    attributeModifier(value: AttributeModifier<LineAttribute> | AttributeModifier<CommonShapeMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkLineStyle extends ArkCommonShapeMethodStyle implements LineAttribute {
    startPoint_value?: ShapePoint | undefined
    endPoint_value?: ShapePoint | undefined
    attributeModifier_value?: AttributeModifier<LineAttribute> | AttributeModifier<CommonMethod> | undefined
    startPoint(value: ShapePoint | undefined): this {
        return this
    }
    endPoint(value: ShapePoint | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<LineAttribute> | AttributeModifier<CommonShapeMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Line(
    options?: LineOptions,
    @memo
    content_?: () => void,
): LineAttribute { throw new Error("")}
