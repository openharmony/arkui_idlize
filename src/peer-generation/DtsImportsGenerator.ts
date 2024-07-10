/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

const dtsImports = `import {
    AltOffset,
    BackgroundBlurStyleOptions,
    BindOptions,
    BlurOptions,
    BlurStyleOptions,
    CommonAttribute,
    CommonMethod,
    DragInteractionOptions,
    DragPreviewOptions,
    Length,
    Offset,
    Padding,
    Position,
    Resource,
    ResourceStr,
    ResourceColor,
    SheetOptions,
    StateStyles,
    SheetTitleOptions,
    CustomComponent,
    CanvasPath,
    CanvasRenderer,
    NativeEmbedInfo,
    DividerOptions,
    BooleanInterfaceDTS,
    LocalizedPadding,
    TabBarSymbol,
    NativeEmbedDataInfo,
    VisibleListContentInfo,
    TextCascadePickerRangeContent,
    TextPickerRangeContent,
    TextPickerOptions,
    IndicatorStyle,
    EmitterProperty,
    ClassWithConstructorAndFieldsDTS,
    ClassWithConstructorDTS,
    ClassDTS,
    ArrayRefNumberInterfaceDTS,
    OptionInterfaceDTS,
    TupleInterfaceDTS,
    UnionOptionalInterfaceDTS,
    UnionInterfaceDTS,
    StringInterfaceDTS,
    NumberInterfaceDTS,
    ClassWithConstructorAndMethodsDTS,
    ClassWithConstructorAndStaticMethodsDTS,
    ClassWithConstructorAndFieldsAndMethodsDTS,
    ClassWithConstructorAndNonOptionalParamsDTS,
    ClassWithConstructorAndSomeOptionalParamsDTS,
    ClassWithConstructorAndAllOptionalParamsDTS,
    ClassWithConstructorAndWithoutParamsDTS,
    BorderOptions,
    RenderingContextSettings,
    LabelStyle,
    Dimension,
    OnScrollVisibleContentChangeCallback,
    Vector1,
    Vector2,
    PixelMap,
    RectResult,
    TouchTestInfo,
    AttributeModifier,
    CustomBuilder,
    ShadowOptions,
    LocalizedEdgeColors,
    LocalizedEdgeWidths,
    Font,
    EdgeWidths,
    EdgeColors,
    EdgeStyles,
    ImageModifier,
    SheetDismiss,
    DismissSheetAction,
    SpringBackAction,
    UIContext,
    BaseEvent,
    FingerInfo,
    BaseGestureEvent,
    LengthMetricsUnit,
    ImageData,
    GestureInterface,
    GestureHandler,
    UIGestureEvent,
    GestureModifier,
    GestureRecognizerJudgeBeginCallback,
    CanvasRenderingContext2D,
    DrawingRenderingContext,
    BoardStyle,
    ComponentContent,
    LengthMetrics,
    DotIndicator
} from "./dts-exports"
`

export function collectDtsImports() {
    return dtsImports // for now
}