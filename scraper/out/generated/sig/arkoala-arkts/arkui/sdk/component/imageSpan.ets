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
import { BaseSpan, ArkBaseSpanStyle } from "./span"
import { ImageSpanAlignment, ImageFit } from "./enums"
import { ColorFilter, ResourceStr } from "./units"
import { extractors, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { default as drawing } from "@ohos.graphics.drawing"
import { ImageErrorCallback, ImageError } from "./image"
import { default as image } from "@ohos.multimedia.image"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { Resource } from "@global.resource"
export interface ImageSpanAttribute extends BaseSpan {
    verticalAlign(value: ImageSpanAlignment | undefined): this {
        throw new Error("Unimplemented method verticalAlign")
    }
    colorFilter(value: ColorFilter | drawing.ColorFilter | undefined): this {
        throw new Error("Unimplemented method colorFilter")
    }
    objectFit(value: ImageFit | undefined): this {
        throw new Error("Unimplemented method objectFit")
    }
    onComplete(value: ImageCompleteCallback | undefined): this {
        throw new Error("Unimplemented method onComplete")
    }
    onError(value: ImageErrorCallback | undefined): this {
        throw new Error("Unimplemented method onError")
    }
    alt(value: image.PixelMap | undefined): this {
        throw new Error("Unimplemented method alt")
    }
    attributeModifier(value: AttributeModifier<ImageSpanAttribute> | AttributeModifier<BaseSpan> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkImageSpanStyle extends ArkBaseSpanStyle implements ImageSpanAttribute {
    verticalAlign_value?: ImageSpanAlignment | undefined
    colorFilter_value?: ColorFilter | drawing.ColorFilter | undefined
    objectFit_value?: ImageFit | undefined
    onComplete_value?: ImageCompleteCallback | undefined
    onError_value?: ImageErrorCallback | undefined
    alt_value?: image.PixelMap | undefined
    attributeModifier_value?: AttributeModifier<ImageSpanAttribute> | AttributeModifier<CommonMethod> | undefined
    verticalAlign(value: ImageSpanAlignment | undefined): this {
        return this
    }
    colorFilter(value: ColorFilter | drawing.ColorFilter | undefined): this {
        return this
    }
    objectFit(value: ImageFit | undefined): this {
        return this
    }
    onComplete(value: ImageCompleteCallback | undefined): this {
        return this
    }
    onError(value: ImageErrorCallback | undefined): this {
        return this
    }
    alt(value: image.PixelMap | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<ImageSpanAttribute> | AttributeModifier<BaseSpan> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export type ImageCompleteCallback = (result: ImageLoadResult) => void;
export declare interface ImageLoadResult {
    width: number;
    height: number;
    componentWidth: number;
    componentHeight: number;
    loadingStatus: number;
    contentWidth: number;
    contentHeight: number;
    contentOffsetX: number;
    contentOffsetY: number;
}

@memo
@ComponentBuilder
export function ImageSpan(
    value: ResourceStr | image.PixelMap,
    @memo
    content_?: () => void,
): ImageSpanAttribute { throw new Error("")}
