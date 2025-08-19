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
import { Length, PX, VP, LPX, ResourceColor, Font } from "./units"
import { Resource } from "@global.resource"
import { Color } from "./enums"
import { LengthMetrics } from "./../Graphics"
import { CommonMethod, CommonConfiguration, ArkCommonMethodStyle } from "./common"
import { LinearGradient } from "./dataPanel"
import { ContentModifier, AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare interface ProgressOptions {
    value: number;
    total?: number;
    type?: ProgressType;
}
export enum ProgressType {
    LINEAR = 0,
    Linear = 0,
    RING = 1,
    Ring = 1,
    ECLIPSE = 2,
    Eclipse = 2,
    SCALE_RING = 3,
    ScaleRing = 3,
    CAPSULE = 4,
    Capsule = 4
}
export enum ProgressStatus {
    LOADING = 0,
    PROGRESSING = 1
}
export declare interface ProgressStyleOptions extends CommonProgressStyleOptions {
    strokeWidth?: Length;
    scaleCount?: number;
    scaleWidth?: Length;
}
export declare interface CommonProgressStyleOptions {
    enableSmoothEffect?: boolean;
}
export declare interface ScanEffectOptions {
    enableScanEffect?: boolean;
}
export declare interface EclipseStyleOptions extends CommonProgressStyleOptions {
}
export declare interface ScaleRingStyleOptions extends CommonProgressStyleOptions {
    strokeWidth?: Length;
    scaleWidth?: Length;
    scaleCount?: number;
}
export declare interface RingStyleOptions extends ScanEffectOptions, CommonProgressStyleOptions {
    strokeWidth?: Length;
    shadow?: boolean;
    status?: ProgressStatus;
}
export declare interface LinearStyleOptions extends ScanEffectOptions, CommonProgressStyleOptions {
    strokeWidth?: Length;
    strokeRadius?: PX | VP | LPX | Resource;
}
export declare interface CapsuleStyleOptions extends ScanEffectOptions, CommonProgressStyleOptions {
    borderColor?: ResourceColor;
    borderWidth?: Length;
    font?: Font;
    fontColor?: ResourceColor;
    showDefaultPercentage?: boolean;
    borderRadius?: LengthMetrics;
}
export enum ProgressStyle {
    LINEAR = 0,
    Linear = 0,
    RING = 1,
    Ring = 1,
    ECLIPSE = 2,
    Eclipse = 2,
    SCALE_RING = 3,
    ScaleRing = 3,
    CAPSULE = 4,
    Capsule = 4
}
export declare interface ProgressStyleMap {
}
export interface ProgressAttribute extends CommonMethod {
    value(value: number | undefined): this {
        throw new Error("Unimplemented method value")
    }
    color(value: ResourceColor | LinearGradient | undefined): this {
        throw new Error("Unimplemented method color")
    }
    style(value: LinearStyleOptions | RingStyleOptions | CapsuleStyleOptions | ProgressStyleOptions | undefined): this {
        throw new Error("Unimplemented method style")
    }
    privacySensitive(value: boolean | undefined): this {
        throw new Error("Unimplemented method privacySensitive")
    }
    contentModifier(value: ContentModifier<ProgressConfiguration> | undefined): this {
        throw new Error("Unimplemented method contentModifier")
    }
    attributeModifier(value: AttributeModifier<ProgressAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkProgressStyle extends ArkCommonMethodStyle implements ProgressAttribute {
    value_value?: number | undefined
    color_value?: ResourceColor | LinearGradient | undefined
    style_value?: LinearStyleOptions | RingStyleOptions | CapsuleStyleOptions | ProgressStyleOptions | undefined
    privacySensitive_value?: boolean | undefined
    contentModifier_value?: ContentModifier<ProgressConfiguration> | undefined
    attributeModifier_value?: AttributeModifier<ProgressAttribute> | AttributeModifier<CommonMethod> | undefined
    value(value: number | undefined): this {
        return this
    }
    color(value: ResourceColor | LinearGradient | undefined): this {
        return this
    }
    style(value: LinearStyleOptions | RingStyleOptions | CapsuleStyleOptions | ProgressStyleOptions | undefined): this {
        return this
    }
    privacySensitive(value: boolean | undefined): this {
        return this
    }
    contentModifier(value: ContentModifier<ProgressConfiguration> | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<ProgressAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export declare interface ProgressConfiguration extends CommonConfiguration<ProgressConfiguration> {
    value: number;
    total: number;
}

@memo
@ComponentBuilder
export function Progress(
    options: ProgressOptions,
    @memo
    content_?: () => void,
): ProgressAttribute { throw new Error("")}
