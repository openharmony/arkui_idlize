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
import { extractors } from "./handwritten"
import { UIContext } from "@ohos.arkui.UIContext"
import { FrameNode } from "./FrameNode"
import { Size } from "./Graphics"
import { TouchEvent } from "./component/common"
export declare abstract class NodeController {
    constructor()
    makeNode(uiContext: UIContext): FrameNode | undefined
    aboutToResize(size: Size): void
    aboutToAppear(): void
    aboutToDisappear(): void
    rebuild(): void
    onTouchEvent(event: TouchEvent): void
    onAttach(): void
    onDetach(): void
    onWillBind(containerId: number): void
    onWillUnbind(containerId: number): void
    onBind(containerId: number): void
    onUnbind(containerId: number): void
}
