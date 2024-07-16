/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

declare interface BlurOptions {
    grayscale: [number, number];
}

declare enum DragPreviewMode {
    AUTO = 1,
    DISABLE_SCALE = 2,
    ENABLE_DEFAULT_SHADOW = 3,
    ENABLE_DEFAULT_RADIUS = 4,
}

//declare type ImageModifier = import('../api/arkui/ImageModifier').ImageModifier; // hack

declare interface DragPreviewOptions {
    mode?: DragPreviewMode | Array<DragPreviewMode>;
    //modifier?: ImageModifier;
    numberBadge?: boolean | number;
}

declare interface DragInteractionOptions {

    isMultiSelectionEnabled?: boolean;

    defaultAnimationBeforeLifting?: boolean;
}

declare enum GradientDirection {
    Left,
    Top,
    Right,
    Bottom,
    LeftTop,
    LeftBottom,
    RightTop,
    RightBottom,
    None,
}

declare class CommonMethod<T> {

    constructor();

    width(value: Length): T;

    height(value: Length): T;

    backdropBlur(value: number, options?: BlurOptions): T;

    dragPreviewOptions(value: DragPreviewOptions, options?: DragInteractionOptions): T;
}
