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
import { ResourceColor, Length } from "./units"
import { Color } from "./enums"
import { Resource } from "@global.resource"
import { LengthMetrics } from "./../Graphics"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export enum PatternLockChallengeResult {
    CORRECT = 1,
    WRONG = 2
}
export declare interface CircleStyleOptions {
    color?: ResourceColor;
    radius?: LengthMetrics;
    enableWaveEffect?: boolean;
    enableForeground?: boolean;
}
export declare class PatternLockController {
    constructor()
    reset(): void
    setChallengeResult(result: PatternLockChallengeResult): void
}
export interface PatternLockAttribute extends CommonMethod {
    sideLength(value: Length | undefined): this {
        throw new Error("Unimplemented method sideLength")
    }
    circleRadius(value: Length | undefined): this {
        throw new Error("Unimplemented method circleRadius")
    }
    backgroundColor(value: ResourceColor | undefined): this
    regularColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method regularColor")
    }
    selectedColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method selectedColor")
    }
    activeColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method activeColor")
    }
    pathColor(value: ResourceColor | undefined): this {
        throw new Error("Unimplemented method pathColor")
    }
    pathStrokeWidth(value: number | string | undefined): this {
        throw new Error("Unimplemented method pathStrokeWidth")
    }
    onPatternComplete(value: ((input: Array<number>) => void) | undefined): this {
        throw new Error("Unimplemented method onPatternComplete")
    }
    autoReset(value: boolean | undefined): this {
        throw new Error("Unimplemented method autoReset")
    }
    onDotConnect(value: ((value0: number) => void) | undefined): this {
        throw new Error("Unimplemented method onDotConnect")
    }
    activateCircleStyle(value: CircleStyleOptions | undefined): this {
        throw new Error("Unimplemented method activateCircleStyle")
    }
    skipUnselectedPoint(value: boolean | undefined): this {
        throw new Error("Unimplemented method skipUnselectedPoint")
    }
    attributeModifier(value: AttributeModifier<PatternLockAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkPatternLockStyle extends ArkCommonMethodStyle implements PatternLockAttribute {
    sideLength_value?: Length | undefined
    circleRadius_value?: Length | undefined
    backgroundColor_value?: ResourceColor | undefined
    regularColor_value?: ResourceColor | undefined
    selectedColor_value?: ResourceColor | undefined
    activeColor_value?: ResourceColor | undefined
    pathColor_value?: ResourceColor | undefined
    pathStrokeWidth_value?: number | string | undefined
    onPatternComplete_value?: ((input: Array<number>) => void) | undefined
    autoReset_value?: boolean | undefined
    onDotConnect_value?: ((value0: number) => void) | undefined
    activateCircleStyle_value?: CircleStyleOptions | undefined
    skipUnselectedPoint_value?: boolean | undefined
    attributeModifier_value?: AttributeModifier<PatternLockAttribute> | AttributeModifier<CommonMethod> | undefined
    sideLength(value: Length | undefined): this {
        return this
    }
    circleRadius(value: Length | undefined): this {
        return this
    }
    backgroundColor(value: ResourceColor | undefined): this {
        return this
    }
    regularColor(value: ResourceColor | undefined): this {
        return this
    }
    selectedColor(value: ResourceColor | undefined): this {
        return this
    }
    activeColor(value: ResourceColor | undefined): this {
        return this
    }
    pathColor(value: ResourceColor | undefined): this {
        return this
    }
    pathStrokeWidth(value: number | string | undefined): this {
        return this
    }
    onPatternComplete(value: ((input: Array<number>) => void) | undefined): this {
        return this
    }
    autoReset(value: boolean | undefined): this {
        return this
    }
    onDotConnect(value: ((value0: number) => void) | undefined): this {
        return this
    }
    activateCircleStyle(value: CircleStyleOptions | undefined): this {
        return this
    }
    skipUnselectedPoint(value: boolean | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<PatternLockAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function PatternLock(
    controller?: PatternLockController,
    @memo
    content_?: () => void,
): PatternLockAttribute { throw new Error("")}
