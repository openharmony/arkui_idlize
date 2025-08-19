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
import { CommonMethod, StateStyles } from "../framework"

import { AnimateParam } from '../framework'
import { ArkButtonComponent, ButtonConfiguration} from "../framework"
import { ArkCheckboxComponent, CheckBoxConfiguration } from "../framework"
import { ArkDataPanelComponent, DataPanelConfiguration } from "../framework"
import { ArkGaugeComponent, GaugeConfiguration } from "../framework"
import { ArkLoadingProgressComponent, LoadingProgressConfiguration } from "../framework"
import { ArkProgressComponent, ProgressConfiguration } from "../framework"
import { ArkRadioComponent, RadioConfiguration } from "../framework"
import { ArkRatingComponent, RatingConfiguration } from "../framework"
import { ArkSelectComponent, MenuItemConfiguration } from "../framework"
import { ArkSliderComponent, SliderConfiguration } from "../framework"
import { ArkTextClockComponent, TextClockConfiguration } from "../framework"
import { ArkTextTimerComponent, TextTimerConfiguration } from "../framework"
import { ArkToggleComponent, ToggleConfiguration } from "../framework"
import { pointer } from "@koalaui/interop"

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

export function enterForeignContext(context: pointer) {}
export function leaveForeignContext() {}

export function Routed(
    /** @memo */
    initial: () => void,
    initialUrl?: string,
): void {}

export function hookId(component: object, value?: string) {}

export namespace extractors {

    export function toImagePixelMapPtr(value: image.PixelMap): KPointer {
        return 123
    }

    export function fromImagePixelMapPtr(ptr: KPointer): image.PixelMap {
        return new image.PixelMapImpl(ptr)
    }
}

export interface GestureModifier {}
export interface UIGestureEvent {}
export function hookGestureModifier(receiver: CommonMethod, value: GestureModifier | undefined) {}

export function hookStateStyleImpl(receiver: CommonMethod, value: StateStyles | undefined) {}
export type CustomStyles = (instance: CommonMethod) => void;

export interface LifeCycle {
    build(): void
}
export abstract class ExtendableComponent implements LifeCycle {}

export interface CustomDialogControllerOptions {}
export class CustomDialogController {
    constructor(value:CustomDialogControllerOptions) {}
}
