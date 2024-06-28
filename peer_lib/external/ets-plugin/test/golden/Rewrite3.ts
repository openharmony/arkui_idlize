import { AppStorage, ArkPageTransitionEnterComponent, ArkPageTransitionExitComponent, ArkStructBase, CanvasRenderingContext2D, ESObject, ForEach, GestureGroup, IDataSource, ImageBitmap, Indicator, LazyForEach, LinearGradient, LocalStorage, LongPressGesture, OffscreenCanvasRenderingContext2D, PanGesture, PanGestureOptions, PatternLockController, PinchGesture, RenderingContextSettings, RichEditorController, Scroller, SearchController, StorageLinkState, SwiperController, SyncedProperty, TabsController, TapGesture, TextAreaController, TextClockController, TextInputController, TextInputOptions, TextTimerController, TransitionEffect, VideoController, WebController, XComponentController, animateTo, observableProxy, propState } from "@koalaui/arkoala-arkui";
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
import { storage } from "./Rewrite2";
class ArkLocalStoragePropExampleComponent extends ArkStructBase<ArkLocalStoragePropExampleComponent> {
    private _entry_local_storage_ = storage;
    __initializeStruct(/**/
    /** @memo */
    content?: () => void, initializers?: Partial<ArkLocalStoragePropExampleComponent>): void {
        this._prop = propState<string>(StorageLinkState<string>(this._entry_local_storage_, "storage", "Start").value);
    }
    _prop!: SyncedProperty<string>;
    get prop(): string {
        return this._prop!.value;
    }
    set prop(value: string) {
        this._prop!.value = observableProxy(value);
    }
    /** @memo */
    __updateStruct(initializers: Partial<ArkLocalStoragePropExampleComponent> | undefined): void {
        this._prop.update(StorageLinkState<string>(this._entry_local_storage_, "storage", "Start").value);
    }
    /** @memo */
    _build(/**/
    /** @memo */
    builder: ((instance: ArkLocalStoragePropExampleComponent) => void) | undefined) {
    }
}
/** @memo */
export function LocalStoragePropExample(style?: any, /**/
/** @memo */
content?: () => void, initializers?: Partial<ArkLocalStoragePropExampleComponent>): ArkLocalStoragePropExampleComponent {
    return ArkLocalStoragePropExampleComponent._instantiate(style, () => new ArkLocalStoragePropExampleComponent, content, initializers);
}
registerArkuiEntry(LocalStoragePropExample, "Rewrite3");
export const __Entry = LocalStoragePropExample;
