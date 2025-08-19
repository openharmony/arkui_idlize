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
import { KInt, KPointer, KBoolean, NativeBuffer } from "@koalaui/interop"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { Size } from "./Graphics"
import { extractors } from "./handwritten"
import { UIContext } from "@ohos.arkui.UIContext"
import { WrappedBuilder, CustomBuilder, CustomBuilderT } from "./component/builder"
import { FrameNode } from "./FrameNode"
import { TouchEvent, MouseEvent, AxisEvent } from "./component/common"
export enum NodeRenderType {
    RENDER_TYPE_DISPLAY = 0,
    RENDER_TYPE_TEXTURE = 1
}
export declare interface RenderOptions {
    selfIdealSize?: Size;
    type?: NodeRenderType;
    surfaceId?: string;
}
export declare interface BuildOptions {
    useParallel?: boolean;
}
export declare class BuilderNode<T = void> {
    constructor(uiContext: UIContext, options: RenderOptions | undefined)
    build(builder: WrappedBuilder<CustomBuilder>): void
    build(builder: WrappedBuilder<CustomBuilderT<T>>, arg: T, options?: BuildOptions): void
    update(arg: T): void
    getFrameNode(): FrameNode | undefined
    postTouchEvent(event: TouchEvent): boolean
    dispose(): void
    reuse(param?: Object): void
    recycle(): void
    updateConfiguration(): void
    isDisposed(): boolean
    postInputEvent(event: InputEventType): boolean
    inheritFreezeOptions(enabled: boolean): void
}
export type InputEventType = TouchEvent | MouseEvent | AxisEvent;
