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
import { ResourceColor } from "./units"
import { Color, LineCapStyle } from "./enums"
import { Resource } from "@global.resource"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export interface DividerAttribute extends CommonMethod {
    vertical(value: boolean | undefined): this {
        throw new Error("Unimplemented method vertical")
    }
    color(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method color")
    }
    strokeWidth(value: number | string | undefined): this {
        throw new Error("Unimplemented method strokeWidth")
    }
    lineCap(value: LineCapStyle | undefined): this {
        throw new Error("Unimplemented method lineCap")
    }
    attributeModifier(value: AttributeModifier<DividerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkDividerStyle extends ArkCommonMethodStyle implements DividerAttribute {
    vertical_value?: boolean | undefined
    color_value?: ResourceColor | undefined
    strokeWidth_value?: number | string | undefined
    lineCap_value?: LineCapStyle | undefined
    attributeModifier_value?: AttributeModifier<DividerAttribute> | AttributeModifier<CommonMethod> | undefined
    vertical(value: boolean | undefined): this {
        return this
    }
    color(value: ResourceColor | undefined): this {
        return this
    }
    strokeWidth(value: number | string | undefined): this {
        return this
    }
    lineCap(value: LineCapStyle | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<DividerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Divider(
    
    @memo
    content_?: () => void,
): DividerAttribute { throw new Error("")}
