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
import { ResourceColor, Length } from "./units"
import { Color, LineCapStyle, LineJoinStyle } from "./enums"
import { Resource } from "@global.resource"
import { AttributeModifier, extractors, AttributeUpdater } from "./../handwritten"
import { default as image } from "@ohos.multimedia.image"
export declare interface ViewportRect {
    x?: double | string;
    y?: double | string;
    width?: double | string;
    height?: double | string;
}
export interface ShapeAttribute extends CommonMethod {
    viewPort(value: ViewportRect | undefined): this {
        throw new Error("Unimplemented method viewPort")
    }
    stroke(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method stroke")
    }
    fill(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method fill")
    }
    strokeDashOffset(value: double | string | undefined): this {
        throw new Error("Unimplemented method strokeDashOffset")
    }
    strokeDashArray(value: Array<Length> | undefined): this {
        throw new Error("Unimplemented method strokeDashArray")
    }
    strokeLineCap(value: LineCapStyle | undefined): this {
        throw new Error("Unimplemented method strokeLineCap")
    }
    strokeLineJoin(value: LineJoinStyle | undefined): this {
        throw new Error("Unimplemented method strokeLineJoin")
    }
    strokeMiterLimit(value: double | string | undefined): this {
        throw new Error("Unimplemented method strokeMiterLimit")
    }
    strokeOpacity(value: double | string | Resource | undefined): this {
        throw new Error("Unimplemented method strokeOpacity")
    }
    fillOpacity(value: double | string | Resource | undefined): this {
        throw new Error("Unimplemented method fillOpacity")
    }
    strokeWidth(value: double | string | undefined): this {
        throw new Error("Unimplemented method strokeWidth")
    }
    antiAlias(value: boolean | undefined): this {
        throw new Error("Unimplemented method antiAlias")
    }
    mesh(value: Array<double> | undefined, column: int32 | undefined, row: int32 | undefined): this {
        throw new Error("Unimplemented method mesh")
    }
    attributeModifier(value: AttributeModifier<ShapeAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkShapeStyle extends ArkCommonMethodStyle implements ShapeAttribute {
    viewPort_value?: ViewportRect | undefined
    stroke_value?: ResourceColor | undefined
    fill_value?: ResourceColor | undefined
    strokeDashOffset_value?: double | string | undefined
    strokeDashArray_value?: Array<Length> | undefined
    strokeLineCap_value?: LineCapStyle | undefined
    strokeLineJoin_value?: LineJoinStyle | undefined
    strokeMiterLimit_value?: double | string | undefined
    strokeOpacity_value?: double | string | Resource | undefined
    fillOpacity_value?: double | string | Resource | undefined
    strokeWidth_value?: double | string | undefined
    antiAlias_value?: boolean | undefined
    attributeModifier_value?: AttributeModifier<ShapeAttribute> | AttributeModifier<CommonMethod> | undefined
    viewPort(value: ViewportRect | undefined): this {
        return this
    }
    stroke(value: ResourceColor | undefined): this {
        return this
    }
    fill(value: ResourceColor | undefined): this {
        return this
    }
    strokeDashOffset(value: double | string | undefined): this {
        return this
    }
    strokeDashArray(value: Array<Length> | undefined): this {
        return this
    }
    strokeLineCap(value: LineCapStyle | undefined): this {
        return this
    }
    strokeLineJoin(value: LineJoinStyle | undefined): this {
        return this
    }
    strokeMiterLimit(value: double | string | undefined): this {
        return this
    }
    strokeOpacity(value: double | string | Resource | undefined): this {
        return this
    }
    fillOpacity(value: double | string | Resource | undefined): this {
        return this
    }
    strokeWidth(value: double | string | undefined): this {
        return this
    }
    antiAlias(value: boolean | undefined): this {
        return this
    }
    mesh(value: Array<double> | undefined, column: int32 | undefined, row: int32 | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<ShapeAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Shape(
    value?: image.PixelMap,
    @memo
    content_?: () => void,
): ShapeAttribute { throw new Error("")}
