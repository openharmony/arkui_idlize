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
import { extractors, AttributeModifier, AttributeUpdater } from "./../handwritten"
import { default as image } from "@ohos.multimedia.image"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { AnimationStatus, FillMode } from "./enums"
export declare interface ImageFrameInfo {
    src: string | Resource | image.PixelMap;
    width?: number | string;
    height?: number | string;
    top?: number | string;
    left?: number | string;
    duration?: number;
}
export interface ImageAnimatorAttribute extends CommonMethod {
    images(value: Array<ImageFrameInfo> | undefined): this {
        throw new Error("Unimplemented method images")
    }
    state(value: AnimationStatus | undefined): this {
        throw new Error("Unimplemented method state")
    }
    duration(value: number | undefined): this {
        throw new Error("Unimplemented method duration")
    }
    reverse(value: boolean | undefined): this {
        throw new Error("Unimplemented method reverse")
    }
    fixedSize(value: boolean | undefined): this {
        throw new Error("Unimplemented method fixedSize")
    }
    fillMode(value: FillMode | undefined): this {
        throw new Error("Unimplemented method fillMode")
    }
    iterations(value: number | undefined): this {
        throw new Error("Unimplemented method iterations")
    }
    monitorInvisibleArea(value: boolean | undefined): this {
        throw new Error("Unimplemented method monitorInvisibleArea")
    }
    onStart(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onStart")
    }
    onPause(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onPause")
    }
    onRepeat(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onRepeat")
    }
    onCancel(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onCancel")
    }
    onFinish(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onFinish")
    }
    attributeModifier(value: AttributeModifier<ImageAnimatorAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkImageAnimatorStyle extends ArkCommonMethodStyle implements ImageAnimatorAttribute {
    images_value?: Array<ImageFrameInfo> | undefined
    state_value?: AnimationStatus | undefined
    duration_value?: number | undefined
    reverse_value?: boolean | undefined
    fixedSize_value?: boolean | undefined
    fillMode_value?: FillMode | undefined
    iterations_value?: number | undefined
    monitorInvisibleArea_value?: boolean | undefined
    onStart_value?: (() => void) | undefined
    onPause_value?: (() => void) | undefined
    onRepeat_value?: (() => void) | undefined
    onCancel_value?: (() => void) | undefined
    onFinish_value?: (() => void) | undefined
    attributeModifier_value?: AttributeModifier<ImageAnimatorAttribute> | AttributeModifier<CommonMethod> | undefined
    images(value: Array<ImageFrameInfo> | undefined): this {
        return this
    }
    state(value: AnimationStatus | undefined): this {
        return this
    }
    duration(value: number | undefined): this {
        return this
    }
    reverse(value: boolean | undefined): this {
        return this
    }
    fixedSize(value: boolean | undefined): this {
        return this
    }
    fillMode(value: FillMode | undefined): this {
        return this
    }
    iterations(value: number | undefined): this {
        return this
    }
    monitorInvisibleArea(value: boolean | undefined): this {
        return this
    }
    onStart(value: (() => void) | undefined): this {
        return this
    }
    onPause(value: (() => void) | undefined): this {
        return this
    }
    onRepeat(value: (() => void) | undefined): this {
        return this
    }
    onCancel(value: (() => void) | undefined): this {
        return this
    }
    onFinish(value: (() => void) | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<ImageAnimatorAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function ImageAnimator(
    
    @memo
    content_?: () => void,
): ImageAnimatorAttribute { throw new Error("")}
