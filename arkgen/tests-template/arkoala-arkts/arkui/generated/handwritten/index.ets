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
import { KPointer } from "@koalaui/interop"
import { image } from "@ohos.multimedia.image"
import { CommonMethod, ArkCommonMethodPeer, StateStyles, PageMapBuilder } from "../framework"

import { AnimateParam } from '../framework'
import { ArkButtonComponent, ArkButtonPeer, ButtonConfiguration} from "../framework"
import { ArkCheckboxComponent, ArkCheckboxPeer, CheckBoxConfiguration } from "../framework"
import { ArkDataPanelComponent, ArkDataPanelPeer, DataPanelConfiguration } from "../framework"
import { ArkGaugeComponent, ArkGaugePeer, GaugeConfiguration } from "../framework"
import { ArkLoadingProgressComponent, ArkLoadingProgressPeer, LoadingProgressConfiguration } from "../framework"
import { ArkProgressComponent, ArkProgressPeer, ProgressConfiguration } from "../framework"
import { ArkRadioComponent, ArkRadioPeer, RadioConfiguration } from "../framework"
import { ArkRatingComponent, ArkRatingPeer, RatingConfiguration } from "../framework"
import { ArkSelectComponent, ArkSelectPeer, MenuItemConfiguration } from "../framework"
import { ArkSliderComponent, ArkSliderPeer, SliderConfiguration } from "../framework"
import { ArkTextClockComponent, ArkTextClockPeer, TextClockConfiguration } from "../framework"
import { ArkTextTimerComponent, ArkTextTimerPeer, TextTimerConfiguration } from "../framework"
import { ArkToggleComponent, ArkTogglePeer, ToggleConfiguration } from "../framework"
import { BusinessErrorInterface, PageMapNodeBuilder } from "../framework"
import { BusinessError } from "../framework/ohos.base"
import { pointer } from "@koalaui/interop"

// Imports for Initializers
import { SymbolGlyphModifier, RectResult, TouchTestStrategy } from "../framework"

import { Resource, ResourceStr } from "../framework"
import { Bindable } from "../framework"

export interface PageTransitionExitInterface {}
export interface CommonTransition {}
export interface NavigationAttribute {}
export interface SubscribaleAbstract {}
export interface ISinglePropertyChangeSubscriber {}
export interface IPropertySubscriber {}
export interface AbstractProperty {}
export interface BaseCustomComponent {}
export interface CustomComponent {}
export interface CustomComponentV2 {}
export interface AttributeModifier<T> {
    isUpdater: () => boolean
    applyNormalAttribute(instance: T): void;
    applyPressedAttribute(instance: T): void;
    applyFocusedAttribute(instance: T): void;
    applyDisabledAttribute(instance: T): void;
    applySelectedAttribute(instance: T): void;
}
export class AttributeUpdater<T> implements AttributeModifier<T> {
    isUpdater: () => boolean = () => true
    applyPressedAttribute(instance: T): void {}
    applyFocusedAttribute(instance: T): void {}
    applyDisabledAttribute(instance: T): void {}
    applySelectedAttribute(instance: T): void {}
    applyNormalAttribute(instance: T): void {}
    initializeModifier(instance: T): void {}
    get attribute(): T | undefined { return undefined }
    onComponentChanged(component: T): void {}
}
export interface PageTransitionEnterInterface {}
export interface SystemBarStyle {}
export interface UICommonBase {}
export interface ContentModifier<T = void> {}

export function _animateTo(param: AnimateParam, event: (() => void)): void {}
export function _animationStart(param: AnimateParam, isFirstBuild: boolean) {}
export function _animationEnd(isFirstBuild: boolean, update: (() => void)): void {}

export function hookButtonContentModifier(
    receiver: ArkButtonComponent, value?: ContentModifier<ButtonConfiguration>) {}
export function hookCheckBoxContentModifier(
    receiver: ArkCheckboxComponent, value?: ContentModifier<CheckBoxConfiguration>) {}
export function hookDataPanelContentModifier(
    receiver: ArkDataPanelComponent, value?: ContentModifier<DataPanelConfiguration>) {}
export function hookGaugeContentModifier(
    receiver: ArkGaugeComponent, value?: ContentModifier<GaugeConfiguration>) {}
export function hookLoadingProgressContentModifier(
    receiver: ArkLoadingProgressComponent, value?: ContentModifier<LoadingProgressConfiguration>) {}
export function hookProgressContentModifier(
    receiver: ArkProgressComponent, value?: ContentModifier<ProgressConfiguration>) {}
export function hookRadioContentModifier(
    receiver: ArkRadioComponent, value?: ContentModifier<RadioConfiguration>) {}
export function hookRatingContentModifier(
    receiver: ArkRatingComponent, value?: ContentModifier<RatingConfiguration>) {}
export function hookSelectContentModifier(
    receiver: ArkSelectComponent, value?: ContentModifier<MenuItemConfiguration>) {}
export function hookSliderContentModifier(
    receiver: ArkSliderComponent, value?: ContentModifier<SliderConfiguration>) {}
export function hookTextClockContentModifier(
    receiver: ArkTextClockComponent, value?: ContentModifier<TextClockConfiguration>) {}
export function hookTextTimerContentModifier(
    receiver: ArkTextTimerComponent, value?: ContentModifier<TextTimerConfiguration>) {}
export function hookToggleContentModifier(
    receiver: ArkToggleComponent, value?: ContentModifier<ToggleConfiguration>) {}

export function hookButtonContentModifier(
    receiver: ArkButtonPeer, value?: ContentModifier<ButtonConfiguration>) {}
export function hookCheckBoxContentModifier(
    receiver: ArkCheckboxPeer, value?: ContentModifier<CheckBoxConfiguration>) {}
export function hookDataPanelContentModifier(
    receiver: ArkDataPanelPeer, value?: ContentModifier<DataPanelConfiguration>) {}
export function hookGaugeContentModifier(
    receiver: ArkGaugePeer, value?: ContentModifier<GaugeConfiguration>) {}
export function hookLoadingProgressContentModifier(
    receiver: ArkLoadingProgressPeer, value?: ContentModifier<LoadingProgressConfiguration>) {}
export function hookProgressContentModifier(
    receiver: ArkProgressPeer, value?: ContentModifier<ProgressConfiguration>) {}
export function hookRadioContentModifier(
    receiver: ArkRadioPeer, value?: ContentModifier<RadioConfiguration>) {}
export function hookRatingContentModifier(
    receiver: ArkRatingPeer, value?: ContentModifier<RatingConfiguration>) {}
export function hookSelectContentModifier(
    receiver: ArkSelectPeer, value?: ContentModifier<MenuItemConfiguration>) {}
export function hookSliderContentModifier(
    receiver: ArkSliderPeer, value?: ContentModifier<SliderConfiguration>) {}
export function hookTextClockContentModifier(
    receiver: ArkTextClockPeer, value?: ContentModifier<TextClockConfiguration>) {}
export function hookTextTimerContentModifier(
    receiver: ArkTextTimerPeer, value?: ContentModifier<TextTimerConfiguration>) {}
export function hookToggleContentModifier(
    receiver: ArkTogglePeer, value?: ContentModifier<ToggleConfiguration>) {}

export function enterForeignContext(context: pointer) {}
export function leaveForeignContext() {}

export function Routed(
    /** @memo */
    initial: () => void,
    initialUrl?: string,
): void {}

export function hookId(component: object, value?: string) {}

export namespace initializers {
    export namespace arkui.component {
        export namespace BaseContextNS {
            export const stageMode = false
        }
        export namespace TouchTestInfoNS {
            export const windowX = 0
            export const windowY = 0
            export const parentX = 0
            export const parentY = 0
            export const x = 0
            export const y = 0
            export const rect: RectResult = { x: 0, y: 0, width: 0, height: 0 }
            export const id = "id"
        }
        export namespace TouchResultNS {
            export const strategy = TouchTestStrategy.DEFAULT
        }
        export namespace ScrollResultNS {
            export const offsetRemain = 0
        }
        export namespace TabBarSymbolNS {
            export const normal = new SymbolGlyphModifier()
        }
        export namespace ClassDTSNS {
            export const valBoolean = true
        }
        export namespace common {
            export namespace TouchTestInfoNS {
                export const windowX = 0
                export const windowY = 0
                export const parentX = 0
                export const parentY = 0
                export const x = 0
                export const y = 0
                export const rect: RectResult = { x: 0, y: 0, width: 0, height: 0 }
                export const id = "id"
            }
            export namespace TouchResultNS {
                export const strategy = TouchTestStrategy.DEFAULT
            }
        }
        export namespace waterFlow {
            export namespace SectionOptionsNS {
                export const itemsCount = 0
            }
        }
        export namespace idlize {
            export namespace LengthMetricsCustomNS {
                export const unit = 0
                export const value = 0
            }
        }
    }
    export namespace waterFlow {
        export namespace SectionOptionsNS {
            export const itemsCount = 0
        }
    }
}
export class ImageData {
  constructor(){
    throw new Error("Not implemented")
  }
}

export namespace extractors {

    export function toImagePixelMapPtr(value: image.PixelMap): KPointer {
        return 123
    }

    export function fromImagePixelMapPtr(ptr: KPointer): image.PixelMap {
        return new image.PixelMapImpl(ptr)
    }

    export function transform_Ark_BusinessError_Void_to_Ark_BusinessErrorInterface_Void(from: BusinessError<void>): BusinessErrorInterface<void> {
        return {
            name: from.name,
            message: from.message,
            stack: from.stack,
            code: from.code,
            data: undefined,
        }
    }

    export function transform_Ark_BusinessErrorInterface_Void_to_Ark_BusinessError_Void(from: BusinessErrorInterface<void>): BusinessError<void> {
        return {
            name: from.name,
            message: from.message,
            stack: from.stack,
            code: from.code,
            data: undefined,
        }
    }

    export function transform_PageMapBuilder_to_PageMapNodeBuilder(from: PageMapBuilder): PageMapNodeBuilder {
        throw new Error("Not implemented")
    }
}

export namespace typechecks {

    export function isGeneric_ArkuiComponentCommonBindable_I32<T>(bindable: Bindable<T>): boolean {
        return bindable.value instanceof int
    }
    export function isGeneric_ArkuiComponentCommonBindable_String<T>(bindable: Bindable<T>): boolean {
        return bindable.value instanceof string
    }
    export function isGeneric_ArkuiComponentCommonBindable_Resource<T>(bindable: Bindable<T>): boolean {
        return bindable.value instanceof Resource
    }
    export function isGeneric_ArkuiComponentCommonBindable_ResourceStr<T>(bindable: Bindable<T>): boolean {
        return bindable.value instanceof ResourceStr
    }
    export function isGeneric_ArkuiComponentCommonBindable_Array_I32<T>(bindable: Bindable<T>): boolean {
        const value = bindable.value
        if (!(value instanceof Array)) return false
        if (value.length == 0) return true
        return value[0] instanceof int
    }
    export function isGeneric_ArkuiComponentCommonBindable_Array_String<T>(bindable: Bindable<T>): boolean {
        const value = bindable.value
        if (!(value instanceof Array)) return false
        if (value.length == 0) return true
        return value[0] instanceof string
    }
    export function isGeneric_ArkuiComponentCommonBindable_Array_Resource<T>(bindable: Bindable<T>): boolean {
        const value = bindable.value
        if (!(value instanceof Array)) return false
        if (value.length == 0) return true
        return value[0] instanceof Resource
    }
    export function isGeneric_ArkuiComponentCommonBindable_Array_ResourceStr<T>(bindable: Bindable<T>): boolean {
        const value = bindable.value
        if (!(value instanceof Array)) return false
        if (value.length == 0) return true
        return value[0] instanceof ResourceStr
    }
}

export interface GestureModifier {}
export interface UIGestureEvent {}
export function hookGestureModifier(receiver: CommonMethod, value: GestureModifier | undefined) {}
export function hookGestureModifier(receiver: ArkCommonMethodPeer, value: GestureModifier | undefined) {}

export function hookStateStyleImpl(receiver: CommonMethod, value: StateStyles | undefined) {}
export function hookStateStyleImpl(receiver: ArkCommonMethodPeer, value: StateStyles | undefined) {}
export type CustomStyles = (instance: CommonMethod) => void;

export interface LifeCycle {
    build(): void
}
export abstract class ExtendableComponent implements LifeCycle {}

export interface CustomDialogControllerOptions {}
export class CustomDialogController {
    constructor(value:CustomDialogControllerOptions) {}
}

export class ModifierState {
    addRef(): void {
    }
    fireChange(): void {
    }
}

export class WrappedBuilder {}

export class ComponentContentBase {}

export class ComponentContent<T = undefined> extends ComponentContentBase {}

export interface TabContentAttribute {}
/** @memo */
export function TabContent(
    /** @memo */
    style: ((attributes: TabContentAttribute) => void) | undefined,
    /** @memo */
    content_?: () => void,
): void {}

export class Gesture {}
export class GestureGroup {}
export class TapGesture {}
export class LongPressGesture {}
export class PanGesture {}
export class PinchGesture {}
export class RotationGesture {}
export class SwipeGesture {}
export class GestureHandler {}
export class LongPressGestureHandler {}
export class PanGestureHandler {}
export class PinchGestureHandler {}
export class TapGestureHandler {}
export class RotationGestureHandler {}
export class SwipeGestureHandler {}