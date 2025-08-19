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
import { ImageAIOptions, ImageAnalyzerConfig } from "./imageCommon"
import { CommonMethod, ArkCommonMethodStyle } from "./common"
import { ImageFit } from "./enums"
import { VoidCallback } from "./units"
export enum SeekMode {
    PREVIOUS_KEYFRAME = 0,
    PreviousKeyframe = 0,
    NEXT_KEYFRAME = 1,
    NextKeyframe = 1,
    CLOSEST_KEYFRAME = 2,
    ClosestKeyframe = 2,
    ACCURATE = 3,
    Accurate = 3
}
export enum PlaybackSpeed {
    SPEED_FORWARD_0_75_X = 0,
    Speed_Forward_0_75_X = 0,
    SPEED_FORWARD_1_00_X = 1,
    Speed_Forward_1_00_X = 1,
    SPEED_FORWARD_1_25_X = 2,
    Speed_Forward_1_25_X = 2,
    SPEED_FORWARD_1_75_X = 3,
    Speed_Forward_1_75_X = 3,
    SPEED_FORWARD_2_00_X = 4,
    Speed_Forward_2_00_X = 4
}
export declare interface FullscreenInfo {
    fullscreen: boolean;
}
export declare interface PreparedInfo {
    duration: int32;
}
export declare interface PlaybackInfo {
    time: int32;
}
export declare interface PosterOptions {
    showFirstFrame?: boolean;
}
export declare interface VideoOptions {
    src?: string | Resource;
    currentProgressRate?: double | string | PlaybackSpeed;
    previewUri?: string | image.PixelMap | Resource;
    controller?: VideoController;
    imageAIOptions?: ImageAIOptions;
    posterOptions?: PosterOptions;
}
export declare class VideoController {
    constructor()
    start(): void
    pause(): void
    stop(): void
    requestFullscreen(value: boolean): void
    exitFullscreen(): void
    setCurrentTime(value: double, seekMode?: SeekMode): void
    reset(): void
}
export interface VideoAttribute extends CommonMethod {
    muted(value: boolean | undefined): this {
        throw new Error("Unimplemented method muted")
    }
    autoPlay(value: boolean | undefined): this {
        throw new Error("Unimplemented method autoPlay")
    }
    controls(value: boolean | undefined): this {
        throw new Error("Unimplemented method controls")
    }
    loop(value: boolean | undefined): this {
        throw new Error("Unimplemented method loop")
    }
    objectFit(value: ImageFit | undefined): this {
        throw new Error("Unimplemented method objectFit")
    }
    onStart(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onStart")
    }
    onPause(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onPause")
    }
    onFinish(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onFinish")
    }
    onFullscreenChange(value: ((value0: FullscreenInfo) => void) | undefined): this {
        throw new Error("Unimplemented method onFullscreenChange")
    }
    onPrepared(value: ((value0: PreparedInfo) => void) | undefined): this {
        throw new Error("Unimplemented method onPrepared")
    }
    onSeeking(value: ((value0: PlaybackInfo) => void) | undefined): this {
        throw new Error("Unimplemented method onSeeking")
    }
    onSeeked(value: ((value0: PlaybackInfo) => void) | undefined): this {
        throw new Error("Unimplemented method onSeeked")
    }
    onUpdate(value: ((value0: PlaybackInfo) => void) | undefined): this {
        throw new Error("Unimplemented method onUpdate")
    }
    onError(value: (() => void) | undefined): this {
        throw new Error("Unimplemented method onError")
    }
    onStop(value: VoidCallback | undefined): this {
        throw new Error("Unimplemented method onStop")
    }
    enableAnalyzer(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableAnalyzer")
    }
    analyzerConfig(value: ImageAnalyzerConfig | undefined): this {
        throw new Error("Unimplemented method analyzerConfig")
    }
    enableShortcutKey(value: boolean | undefined): this {
        throw new Error("Unimplemented method enableShortcutKey")
    }
    attributeModifier(value: AttributeModifier<VideoAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Unimplemented method attributeModifier")
    }
}
export class ArkVideoStyle extends ArkCommonMethodStyle implements VideoAttribute {
    muted_value?: boolean | undefined
    autoPlay_value?: boolean | undefined
    controls_value?: boolean | undefined
    loop_value?: boolean | undefined
    objectFit_value?: ImageFit | undefined
    onStart_value?: VoidCallback | undefined
    onPause_value?: VoidCallback | undefined
    onFinish_value?: VoidCallback | undefined
    onFullscreenChange_value?: ((value0: FullscreenInfo) => void) | undefined
    onPrepared_value?: ((value0: PreparedInfo) => void) | undefined
    onSeeking_value?: ((value0: PlaybackInfo) => void) | undefined
    onSeeked_value?: ((value0: PlaybackInfo) => void) | undefined
    onUpdate_value?: ((value0: PlaybackInfo) => void) | undefined
    onError_value?: (() => void) | undefined
    onStop_value?: VoidCallback | undefined
    enableAnalyzer_value?: boolean | undefined
    analyzerConfig_value?: ImageAnalyzerConfig | undefined
    enableShortcutKey_value?: boolean | undefined
    attributeModifier_value?: AttributeModifier<VideoAttribute> | AttributeModifier<CommonMethod> | undefined
    muted(value: boolean | undefined): this {
        return this
    }
    autoPlay(value: boolean | undefined): this {
        return this
    }
    controls(value: boolean | undefined): this {
        return this
    }
    loop(value: boolean | undefined): this {
        return this
    }
    objectFit(value: ImageFit | undefined): this {
        return this
    }
    onStart(value: VoidCallback | undefined): this {
        return this
    }
    onPause(value: VoidCallback | undefined): this {
        return this
    }
    onFinish(value: VoidCallback | undefined): this {
        return this
    }
    onFullscreenChange(value: ((value0: FullscreenInfo) => void) | undefined): this {
        return this
    }
    onPrepared(value: ((value0: PreparedInfo) => void) | undefined): this {
        return this
    }
    onSeeking(value: ((value0: PlaybackInfo) => void) | undefined): this {
        return this
    }
    onSeeked(value: ((value0: PlaybackInfo) => void) | undefined): this {
        return this
    }
    onUpdate(value: ((value0: PlaybackInfo) => void) | undefined): this {
        return this
    }
    onError(value: (() => void) | undefined): this {
        return this
    }
    onStop(value: VoidCallback | undefined): this {
        return this
    }
    enableAnalyzer(value: boolean | undefined): this {
        return this
    }
    analyzerConfig(value: ImageAnalyzerConfig | undefined): this {
        return this
    }
    enableShortcutKey(value: boolean | undefined): this {
        return this
    }
    public attributeModifier(value: AttributeModifier<VideoAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}

@memo
@ComponentBuilder
export function Video(
    value: VideoOptions,
    @memo
    content_?: () => void,
): VideoAttribute { throw new Error("")}
