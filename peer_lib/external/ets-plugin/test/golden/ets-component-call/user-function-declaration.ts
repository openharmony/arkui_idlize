import { AppStorage, ArkPageTransitionEnterComponent, ArkPageTransitionExitComponent, ArkStructBase, CanvasRenderingContext2D, ESObject, ForEach, GestureGroup, IDataSource, ImageBitmap, Indicator, LazyForEach, LinearGradient, LocalStorage, LongPressGesture, OffscreenCanvasRenderingContext2D, PanGesture, PanGestureOptions, PatternLockController, PinchGesture, RenderingContextSettings, RichEditorController, Scroller, SearchController, SwiperController, TabsController, TapGesture, TextAreaController, TextClockController, TextInputController, TextInputOptions, TextTimerController, TransitionEffect, VideoController, WebController, XComponentController, animateTo } from "@koalaui/arkoala-arkui";
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
export function Foo() {
    return "string";
}
export function Text() {
    return "string";
}
export class ArkStructComponent extends ArkStructBase<ArkStructComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStructComponent>): void {
        this._param = initializers?.param ?? (0);
    }
    _param!: number;
    get param(): number {
        return this._param;
    }
    set param(value: number) {
        this._param = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStructComponent) => void) | undefined) { }
}
export class ArkStructWithContentComponent extends ArkStructBase<ArkStructWithContentComponent> {
    private _entry_local_storage_ = new LocalStorage();
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkStructWithContentComponent>): void {
        this._param = initializers?.param ?? (0);
        if (initializers?.content) {
            this._content = initializers?.content;
        }
        if (!this._content && content)
            this._content = content;
    }
    _param!: number;
    get param(): number {
        return this._param;
    }
    set param(value: number) {
        this._param = value;
    }
    /** @memo */
    _content!: () => void;
    /** @memo */
    get content(): () => void {
        return this._content;
    }
    set content(/**/
    /** @memo */
    value: () => void) {
        this._content = value;
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkStructWithContentComponent) => void) | undefined) {
        this.content();
    }
}
/** @memo */
export function Struct(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStructComponent>): ArkStructComponent {
    return ArkStructComponent._instantiate(style, () => new ArkStructComponent, content, initializers);
}
/** @memo */
export function StructWithContent(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkStructWithContentComponent>): ArkStructWithContentComponent {
    return ArkStructWithContentComponent._instantiate(style, () => new ArkStructWithContentComponent, content, initializers);
}
