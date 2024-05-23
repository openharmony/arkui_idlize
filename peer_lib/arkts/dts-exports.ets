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

export interface CustomComponent extends CommonAttribute {
    build(): void;
    aboutToAppear(): void;
    aboutToDisappear(): void;
    aboutToReuse(params: object): void;
    aboutToRecycle(): void;
}

export interface Resource {

  bundleName: string;

  moduleName: string;

  id: number;

  params?: object[];

  type?: number;
}

export enum Color {
    White,
    Black,
}

export type Length = string | number

export type ResourceColor = Color | number | string

export type ResourceStr = string

export interface Offset {
    dx: Length;

    dy: Length;
};

export interface AltOffset {
    dx1: Length;
    dy2: Length;
};

export interface Position {
    x: Length;
    y: Length;
}

export type AnimationRange<T> = [from: T, to: T];

export interface Callback<T> {}

export interface ClickEvent {

    displayX: number;

    displayY: number;
}

export interface StateStyles {

    normal?: object;
}

export interface AttributeModifier<T>{}
export interface ContentModifier<T>{}

export interface SheetTitleOptions {
    title: ResourceStr;
    subtitle?: ResourceStr;
}

export interface UICommonEvent {
    setOnClick(callback: Callback<ClickEvent> | undefined): void;
}

export enum SheetSize {
    MEDIUM,
    LARGE,
    FIT_CONTENT = 2,
}

export interface BindOptions {
    backgroundColor?: ResourceColor;
}

export interface SheetOptions extends BindOptions {
    title?: SheetTitleOptions;
    detents?: [(SheetSize | Length), (SheetSize | Length), (SheetSize | Length)];
}

export enum BlurStyle {
    Thin = 0,
}

export enum ThemeColorMode {
    SYSTEM = 0,
    LIGHT = 1,
    DARK = 2
}

export enum AdaptiveColor {
    DEFAULT = 0,
}

export interface BlurOptions {
    grayscale: [number, number];
}

export interface BlurStyleOptions {
    colorMode?: ThemeColorMode;
    adaptiveColor?: AdaptiveColor;
    scale?: number;
    blurOptions?: BlurOptions;
}

export interface BackgroundBlurStyleOptions extends BlurStyleOptions {}

export interface SizeResult {
    width: number,
    height: number,
}

export interface EdgeWidths {
    top?: Length;
    right?: Length;
    bottom?: Length;
    left?: Length;
};

export type EdgeWidth = EdgeWidths;

export interface Padding  {
    top?: Length;
    right?: Length;
    bottom?: Length;
    left?: Length;
};

export interface DragPreviewOptions {
    numberBadge?: boolean | number;
}

export interface DragInteractionOptions {

    isMultiSelectionEnabled?: boolean;

    defaultAnimationBeforeLifting?: boolean;
}

export interface CommonMethod<T> {
    stateStyles(value: StateStyles): this;

    backdropBlur(value: number, options?: BlurOptions): this;

    width(value: Length): this;

    height(value: Length): this;

    bindSheet(isShow: boolean, builder: () => void, options?: SheetOptions): this;

    backgroundBlurStyle(value: BlurStyle, options?: BackgroundBlurStyleOptions): this;

    dragPreviewOptions(value: DragPreviewOptions, options?: DragInteractionOptions): this;
}

export interface CommonAttribute extends CommonMethod<CommonAttribute> {
}
