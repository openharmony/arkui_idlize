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
import { extractors, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { default as drawing } from "@ohos.graphics.drawing"
import { default as image } from "@ohos.multimedia.image"
import { default as matrix4 } from "@ohos.matrix4"
import { CommonMethod, PointLightStyle, ArkCommonMethodStyle } from "./common"
import { Resource } from "@global.resource"
import { ResourceColor, ColorFilter, EdgeWidths, ResourceStr } from "./units"
import { Color, ImageFit, ImageRepeat, CopyOptions } from "./enums"
import { ColorMetrics } from "./../Graphics"
import { ImageAnalyzerConfig, ImageAIOptions } from "./imageCommon"
import { BusinessError } from "@ohos.base"
import { DrawableDescriptor } from "@ohos.arkui.drawableDescriptor"
export type DrawingColorFilter = drawing.ColorFilter;
export type ResolutionQuality = image.ResolutionQuality;
export type DrawingLattice = drawing.Lattice;
export type ImageMatrix = matrix4.Matrix4Transit;
export enum ImageRenderMode {
    ORIGINAL = 0,
    Original = 0,
    TEMPLATE = 1,
    Template = 1
}
export enum ImageContent {
    EMPTY = 0
}
export enum DynamicRangeMode {
    HIGH = 0,
    CONSTRAINT = 1,
    STANDARD = 2
}
export enum ImageInterpolation {
    NONE = 0,
    None = 0,
    LOW = 1,
    Low = 1,
    MEDIUM = 2,
    Medium = 2,
    HIGH = 3,
    High = 3
}
export enum ImageRotateOrientation {
    AUTO = 0,
    UP = 1,
    RIGHT = 2,
    DOWN = 3,
    LEFT = 4,
    UP_MIRRORED = 5,
    RIGHT_MIRRORED = 6,
    DOWN_MIRRORED = 7,
    LEFT_MIRRORED = 8
}
export declare interface ImageCompleteEvent {
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
export declare interface ImageSourceSize {
    width: number;
    height: number;
}
export declare class ColorContent {
    constructor()
    static readonly ORIGIN: ColorContent;
}
export interface ImageAttribute extends CommonMethod {
    alt(value: string | Resource | image.PixelMap | undefined): this {
        throw new Error("Unimplemented method alt")
    }
    matchTextDirection(value: boolean | undefined): this {
        throw new Error("Unimplemented method matchTextDirection")
    }
    fitOriginalSize(value: boolean | undefined): this {
        throw new Error("Unimplemented method fitOriginalSize")
    }
    fillColor(value: ResourceColor | ColorContent | ColorMetrics | undefined): this {
        throw new Error("Unimplemented method fillColor")
    }
    objectFit(value: ImageFit | undefined): this {
        throw new Error("Unimplemented method objectFit")
    }
    imageMatrix(value: matrix4.Matrix4Transit | undefined): this {
        throw new Error("Unimplemented method imageMatrix")
    }
    objectRepeat(value: ImageRepeat | undefined): this {
        throw new Error("Unimplemented method objectRepeat")
    }
    autoResize(value: boolean | undefined): this {
        throw new Error("Unimplemented method autoResize")
    }
    renderMode(value: ImageRenderMode | undefined): this {
        throw new Error("Unimplemented method renderMode")
    }
    dynamicRangeMode(value: DynamicRangeMode | undefined): this {
        throw new Error("Unimplemented method dynamicRangeMode")
    }
    interpolation(value: ImageInterpolation | undefined): this {
        throw new Error("Unimplemented method interpolation")
    }
    sourceSize(value: ImageSourceSize | undefined): this {
        throw new Error("Unimplemented method sourceSize")
    }
    syncLoad(value: boolean | undefined): this {
        throw new Error("Unimplemented method syncLoad")
    }
    colorFilter(value: ColorFilter | drawing.ColorFilter | undefined): this {
        throw new Error("Unimplemented method colorFilter")
    }
    copyOption(value: CopyOptions | undefined): this {
        throw new Error("Unimplemented method copyOption")
    }
    draggable(value: boolean | undefined): this
    pointLight(value: PointLightStyle | undefined): this {
        throw new Error("Unimplemented method pointLight")
    }
    edgeAntialiasing(value: number | undefined): this {
        throw new Error("Unimplemented method edgeAntialiasing")
    }
    onComplete(value: ImageOnCompleteCallback | undefined): this {
        throw new Error("Unimplemented method onComplete")
    }
    onError(value: ImageErrorCallback | undefined): this {
        throw new Error("Unimplemented method onError")
    }
    onFinish(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onFinish")
    }
    enableAnalyzer(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableAnalyzer")
    }
    analyzerConfig(value: ImageAnalyzerConfig | undefined): this {
        throw new Error("Unimplemented method analyzerConfig")
    }
    resizable(value: ResizableOptions | undefined): this {
        throw new Error("Unimplemented method resizable")
    }
    privacySensitive(value: boolean | undefined): this {
        throw new Error("Unimplemented method privacySensitive")
    }
    enhancedImageQuality(value: image.ResolutionQuality | undefined): this {
        throw new Error("Unimplemented method enhancedImageQuality")
    }
    orientation(value: ImageRotateOrientation | undefined): this {
        throw new Error("Unimplemented method orientation")
    }
    attributeModifier(value: AttributeModifier<ImageAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkImageStyle extends ArkCommonMethodStyle implements ImageAttribute {
    alt_value?: string | Resource | image.PixelMap | undefined
    matchTextDirection_value?: boolean | undefined
    fitOriginalSize_value?: boolean | undefined
    fillColor_value?: ResourceColor | ColorContent | ColorMetrics | undefined
    objectFit_value?: ImageFit | undefined
    imageMatrix_value?: matrix4.Matrix4Transit | undefined
    objectRepeat_value?: ImageRepeat | undefined
    autoResize_value?: boolean | undefined
    renderMode_value?: ImageRenderMode | undefined
    dynamicRangeMode_value?: DynamicRangeMode | undefined
    interpolation_value?: ImageInterpolation | undefined
    sourceSize_value?: ImageSourceSize | undefined
    syncLoad_value?: boolean | undefined
    colorFilter_value?: ColorFilter | drawing.ColorFilter | undefined
    copyOption_value?: CopyOptions | undefined
    draggable_value?: boolean | undefined
    pointLight_value?: PointLightStyle | undefined
    edgeAntialiasing_value?: number | undefined
    onComplete_value?: ImageOnCompleteCallback | undefined
    onError_value?: ImageErrorCallback | undefined
    onFinish_value?: (() => void) | undefined
    enableAnalyzer_value?: boolean | undefined
    analyzerConfig_value?: ImageAnalyzerConfig | undefined
    resizable_value?: ResizableOptions | undefined
    privacySensitive_value?: boolean | undefined
    enhancedImageQuality_value?: image.ResolutionQuality | undefined
    orientation_value?: ImageRotateOrientation | undefined
    attributeModifier_value?: AttributeModifier<ImageAttribute> | AttributeModifier<CommonMethod> | undefined
    alt(value: string | Resource | image.PixelMap | undefined): this {
        return this
    }
    matchTextDirection(value: boolean | undefined): this {
        return this
    }
    fitOriginalSize(value: boolean | undefined): this {
        return this
    }
    fillColor(value: ResourceColor | ColorContent | ColorMetrics | undefined): this {
        return this
    }
    objectFit(value: ImageFit | undefined): this {
        return this
    }
    imageMatrix(value: matrix4.Matrix4Transit | undefined): this {
        return this
    }
    objectRepeat(value: ImageRepeat | undefined): this {
        return this
    }
    autoResize(value: boolean | undefined): this {
        return this
    }
    renderMode(value: ImageRenderMode | undefined): this {
        return this
    }
    dynamicRangeMode(value: DynamicRangeMode | undefined): this {
        return this
    }
    interpolation(value: ImageInterpolation | undefined): this {
        return this
    }
    sourceSize(value: ImageSourceSize | undefined): this {
        return this
    }
    syncLoad(value: boolean | undefined): this {
        return this
    }
    colorFilter(value: ColorFilter | drawing.ColorFilter | undefined): this {
        return this
    }
    copyOption(value: CopyOptions | undefined): this {
        return this
    }
    draggable(value: boolean | undefined): this {
        return this
    }
    pointLight(value: PointLightStyle | undefined): this {
        return this
    }
    edgeAntialiasing(value: number | undefined): this {
        return this
    }
    onComplete(value: ImageOnCompleteCallback | undefined): this {
        return this
    }
    onError(value: ImageErrorCallback | undefined): this {
        return this
    }
    onFinish(value: (() => void) | undefined): this {
        return this
    }
    enableAnalyzer(value: boolean | undefined): this {
        return this
    }
    analyzerConfig(value: ImageAnalyzerConfig | undefined): this {
        return this
    }
    resizable(value: ResizableOptions | undefined): this {
        return this
    }
    privacySensitive(value: boolean | undefined): this {
        return this
    }
    enhancedImageQuality(value: image.ResolutionQuality | undefined): this {
        return this
    }
    orientation(value: ImageRotateOrientation | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<ImageAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export type ImageErrorCallback = (error: ImageError) => void;
export type ImageOnCompleteCallback = (loadEvent?: ImageCompleteEvent) => void;
export declare interface ImageError {
    componentWidth: number;
    componentHeight: number;
    message: string;
    error?: BusinessError;
}
export declare interface ResizableOptions {
    slice?: EdgeWidths;
    lattice?: drawing.Lattice;
}

@memo
@ComponentBuilder
export function Image(
    src: image.PixelMap | ResourceStr | DrawableDescriptor | ImageContent,
    @memo
    content_?: () => void,
): ImageAttribute { throw new Error("")}
@memo
@ComponentBuilder
export function Image(
    src: image.PixelMap | ResourceStr | DrawableDescriptor, imageAIOptions: ImageAIOptions,
    @memo
    content_?: () => void,
): ImageAttribute { throw new Error("")}
