import { AppStorage, ArkButton, ArkPageTransitionEnterComponent, ArkPageTransitionExitComponent, CanvasRenderingContext2D, ESObject, ForEach, GestureGroup, IDataSource, ImageBitmap, Indicator, LazyForEach, LinearGradient, LocalStorage, LongPressGesture, OffscreenCanvasRenderingContext2D, PanGesture, PanGestureOptions, PatternLockController, PinchGesture, RenderingContextSettings, RichEditorController, Scroller, SearchController, SwiperController, TabsController, TapGesture, TextAreaController, TextClockController, TextInputController, TextInputOptions, TextTimerController, TransitionEffect, VideoController, WebController, XComponentController, animateTo } from "@koalaui/arkoala-arkui";
/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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
import { Foo, Text, Struct, StructWithContent } from './user-function-declaration';
/** @memo */
export function callPlainFunction() {
    Foo();
}
/** @memo */
export function callBuiltinComponent() {
    ArkButton(undefined, undefined);
}
/** @memo */
export function callFunctionWithReservedName() {
    Text(undefined, undefined);
}
/** @memo */
export function callStruct() {
    Struct(undefined, undefined, { param: 17 });
}
/** @memo */
export function callStructWithContent() {
    StructWithContent(undefined, undefined, { param: 17 });
}
/** @memo */
export function callStructWithContentWithContent() {
    StructWithContent(undefined, () => {
        ArkButton(undefined, undefined);
    }, { param: 17 });
}
