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
import { LengthMetrics, ColorMetrics } from "./../Graphics"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare class LinearIndicatorController {
    constructor()
    setProgress(index: number, progress: number): void
    start(options?: LinearIndicatorStartOptions): void
    pause(): void
    stop(): void
}
export declare interface LinearIndicatorStartOptions {
    interval?: number;
    duration?: number;
}
export declare interface LinearIndicatorStyle {
    space?: LengthMetrics;
    strokeWidth?: LengthMetrics;
    strokeRadius?: LengthMetrics;
    trackBackgroundColor?: ColorMetrics;
    trackColor?: ColorMetrics;
}
export interface LinearIndicatorAttribute extends CommonMethod {
    indicatorStyle(value: LinearIndicatorStyle | undefined): this {
        throw new Error("Unimplemented method indicatorStyle")
    }
    indicatorLoop(value: boolean | undefined): this {
        throw new Error("Unimplemented method indicatorLoop")
    }
    onChange(value: OnLinearIndicatorChangeCallback | undefined): this {
        throw new Error("Unimplemented method onChange")
    }
    attributeModifier(value: AttributeModifier<LinearIndicatorAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkLinearIndicatorStyle extends ArkCommonMethodStyle implements LinearIndicatorAttribute {
    indicatorStyle_value?: LinearIndicatorStyle | undefined
    indicatorLoop_value?: boolean | undefined
    onChange_value?: OnLinearIndicatorChangeCallback | undefined
    attributeModifier_value?: AttributeModifier<LinearIndicatorAttribute> | AttributeModifier<CommonMethod> | undefined
    indicatorStyle(value: LinearIndicatorStyle | undefined): this {
        return this
    }
    indicatorLoop(value: boolean | undefined): this {
        return this
    }
    onChange(value: OnLinearIndicatorChangeCallback | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<LinearIndicatorAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export type OnLinearIndicatorChangeCallback = (index: number, progress: number) => void;

@memo
@ComponentBuilder
export function LinearIndicator(
    count?: number, controller?: LinearIndicatorController,
    @memo
    content_?: () => void,
): LinearIndicatorAttribute { throw new Error("")}
