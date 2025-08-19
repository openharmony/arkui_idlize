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
export type RadiusItem = [
    Length,
    Length
]
export declare interface RectOptions {
    width?: double | string;
    height?: double | string;
    radius?: Length | Array<RadiusItem>;
}
export declare interface RoundedRectOptions {
    width?: double | string;
    height?: double | string;
    radiusWidth?: double | string;
    radiusHeight?: double | string;
}
export interface RectAttribute extends CommonShapeMethod {
    radiusWidth(value: double | string | undefined): this {
        throw new Error("Unimplemented method radiusWidth")
    }
    radiusHeight(value: double | string | undefined): this {
        throw new Error("Unimplemented method radiusHeight")
    }
    radius(value: Length | Array<RadiusItem> | undefined): this {
        throw new Error("Unimplemented method radius")
    }
    attributeModifier(value: AttributeModifier<RectAttribute> | AttributeModifier<CommonShapeMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkRectStyle extends ArkCommonShapeMethodStyle implements RectAttribute {
    radiusWidth_value?: double | string | undefined
    radiusHeight_value?: double | string | undefined
    radius_value?: Length | Array<RadiusItem> | undefined
    attributeModifier_value?: AttributeModifier<RectAttribute> | AttributeModifier<CommonMethod> | undefined
    radiusWidth(value: double | string | undefined): this {
        return this
    }
    radiusHeight(value: double | string | undefined): this {
        return this
    }
    radius(value: Length | Array<RadiusItem> | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<RectAttribute> | AttributeModifier<CommonShapeMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Rect(
    options?: RectOptions | RoundedRectOptions,
    @memo
    content_?: () => void,
): RectAttribute { throw new Error("")}
