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
import { AnimationStatus, FillMode, PlayMode } from "./enums"
import { default as curves } from "@ohos.curves"
import { AttributeModifier, AttributeUpdater } from "./../handwritten"
export declare class SpringProp {
    constructor(mass: number, stiffness: number, damping: number)
}
export declare class SpringMotion {
    constructor(start: number, end: number, velocity: number, prop: SpringProp)
}
export declare class FrictionMotion {
    constructor(friction: number, position: number, velocity: number)
}
export declare class ScrollMotion {
    constructor(position: number, velocity: number, min: number, max: number, prop: SpringProp)
}
export interface AnimatorAttribute extends CommonMethod {
    state(value: AnimationStatus | undefined): this {
        throw new Error("Unimplemented method state")
    }
    duration(value: number | undefined): this {
        throw new Error("Unimplemented method duration")
    }
    curve(value: curves.Curve | undefined): this {
        throw new Error("Unimplemented method curve")
    }
    delay(value: number | undefined): this {
        throw new Error("Unimplemented method delay")
    }
    fillMode(value: FillMode | undefined): this {
        throw new Error("Unimplemented method fillMode")
    }
    iterations(value: number | undefined): this {
        throw new Error("Unimplemented method iterations")
    }
    playMode(value: PlayMode | undefined): this {
        throw new Error("Unimplemented method playMode")
    }
    motion(value: SpringMotion | FrictionMotion | ScrollMotion | undefined): this {
        throw new Error("Unimplemented method motion")
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
    onFrame(value: ((value: number) => void) | undefined): this {
        throw new Error("Unimplemented method onFrame")
    }
    attributeModifier(value: AttributeModifier<AnimatorAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkAnimatorStyle extends ArkCommonMethodStyle implements AnimatorAttribute {
    state_value?: AnimationStatus | undefined
    duration_value?: number | undefined
    curve_value?: curves.Curve | undefined
    delay_value?: number | undefined
    fillMode_value?: FillMode | undefined
    iterations_value?: number | undefined
    playMode_value?: PlayMode | undefined
    motion_value?: SpringMotion | FrictionMotion | ScrollMotion | undefined
    onStart_value?: (() => void) | undefined
    onPause_value?: (() => void) | undefined
    onRepeat_value?: (() => void) | undefined
    onCancel_value?: (() => void) | undefined
    onFinish_value?: (() => void) | undefined
    onFrame_value?: ((value: number) => void) | undefined
    attributeModifier_value?: AttributeModifier<AnimatorAttribute> | AttributeModifier<CommonMethod> | undefined
    state(value: AnimationStatus | undefined): this {
        return this
    }
    duration(value: number | undefined): this {
        return this
    }
    curve(value: curves.Curve | undefined): this {
        return this
    }
    delay(value: number | undefined): this {
        return this
    }
    fillMode(value: FillMode | undefined): this {
        return this
    }
    iterations(value: number | undefined): this {
        return this
    }
    playMode(value: PlayMode | undefined): this {
        return this
    }
    motion(value: SpringMotion | FrictionMotion | ScrollMotion | undefined): this {
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
    onFrame(value: ((value: number) => void) | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<AnimatorAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Animator(
    value: string,
    @memo
    content_?: () => void,
): AnimatorAttribute { throw new Error("")}
