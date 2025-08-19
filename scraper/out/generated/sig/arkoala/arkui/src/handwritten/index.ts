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


// Imports for Extractors
import { KPointer } from "@koalaui/interop"
import { image } from "@ohos.multimedia.image"

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
export interface UICommonBase {}
export interface ContentModifier<T = void> {}

export namespace extractors {

    export function toImagePixelMapPtr(value: image.PixelMap): KPointer {
        return BigInt(123)
    }

    export function fromImagePixelMapPtr(ptr: KPointer): image.PixelMap {
        return new image.PixelMapImpl(ptr)
    }
}

export function hookButtonContentModifier(receiver: object, value?: ContentModifier<object>) {}
export function hookCheckBoxContentModifier(receiver: object, value?: ContentModifier<object>) {}
export function hookDataPanelContentModifier(receiver: object, value?: ContentModifier<object>) {}
export function hookGaugeContentModifier(receiver: object, value?: ContentModifier<object>) {}
export function hookLoadingProgressContentModifier(receiver: object, value?: ContentModifier<object>) {}
export function hookProgressContentModifier(receiver: object, value?: ContentModifier<object>) {}
export function hookRadioContentModifier(receiver: object, value?: ContentModifier<object>) {}
export function hookRatingContentModifier(receiver: object, value?: ContentModifier<object>) {}
export function hookSelectContentModifier(receiver: object, value?: ContentModifier<object>) {}
export function hookSliderContentModifier(receiver: object, value?: ContentModifier<object>) {}
export function hookTextClockContentModifier(receiver: object, value?: ContentModifier<object>) {}
export function hookTextTimerContentModifier(receiver: object, value?: ContentModifier<object>) {}
export function hookToggleContentModifier(receiver: object, value?: ContentModifier<object>) {}
export function hookStateStyleImpl(receiver: any, value: any) {}
export function hookId(component: object, value?: string) {}

export type CustomStyles = (instance: any) => void;

export interface GestureModifier {}
export interface UIGestureEvent {}
export function hookGestureModifier(receiver: any, value: GestureModifier | undefined) {}

export interface LifeCycle {
    build(): void
}
export abstract class ExtendableComponent implements LifeCycle {
    abstract build(): void
}

export interface CustomDialogControllerOptions {}
export class CustomDialogController {
    constructor(_:CustomDialogControllerOptions) {}
}
