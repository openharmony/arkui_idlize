import { AppStorage, ArkPageTransitionEnterComponent, ArkPageTransitionExitComponent, ArkStructBase, ArkText, CanvasRenderingContext2D, ESObject, ForEach, GestureGroup, IDataSource, ImageBitmap, Indicator, LazyForEach, LinearGradient, LocalStorage, LongPressGesture, MutableState, OffscreenCanvasRenderingContext2D, PanGesture, PanGestureOptions, PatternLockController, PinchGesture, RenderingContextSettings, RichEditorController, Scroller, SearchController, StorageLinkState, SwiperController, TabsController, TapGesture, TextAreaController, TextClockController, TextInputController, TextInputOptions, TextTimerController, TransitionEffect, VideoController, WebController, XComponentController, animateTo, observableProxy } from "@koalaui/arkoala-arkui";
import { registerArkuiEntry } from "@koalaui/arkoala-arkui/ohos.router";
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
export const storage = new LocalStorage();
class ArkLocalStorageLinkExampleComponent extends ArkStructBase<ArkLocalStorageLinkExampleComponent> {
    private _entry_local_storage_ = storage;
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStorageLinkExampleComponent>): void {
        this._link = StorageLinkState<string>(this._entry_local_storage_, "storage", "Start");
    }
    _link!: MutableState<string>;
    get link(): string {
        return this._link!.value;
    }
    set link(value: string) {
        this._link!.value = observableProxy(value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStorageLinkExampleComponent) => void) | undefined) {
        ArkText(undefined, undefined, "LocalStorage entry = " + storage.get("storage"));
    }
}
/** @memo */
export function LocalStorageLinkExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStorageLinkExampleComponent>): ArkLocalStorageLinkExampleComponent {
    return ArkLocalStorageLinkExampleComponent._instantiate(style, () => new ArkLocalStorageLinkExampleComponent, content, initializers);
}
registerArkuiEntry(LocalStorageLinkExample, "Rewrite2");
export const __Entry = LocalStorageLinkExample;
