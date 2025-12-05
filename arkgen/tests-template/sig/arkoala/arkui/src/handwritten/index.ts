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
import { BusinessErrorInterface, PageMapNodeBuilder, PageMapBuilder } from "../framework"
import { BusinessError } from "../framework/ohos.base"

import { CustomNodeBuilder } from "../framework"

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

export namespace initializers {
    // subset
    export namespace arkui.component {
        export namespace TouchTestInfoNS {
            export const windowX = 0
            export const windowY = 0
            export const parentX = 0
            export const parentY = 0
            export const x = 0
            export const y = 0
            export const rect = { x: 0, y: 0, width: 0, height: 0 }
            export const id = "id"
        }
        export namespace TabBarSymbolNS {
            //export const normal = new SymbolGlyphModifier()
            export const normal = {
                getPeer: () => { return undefined }
            }
        }
        export namespace ClassDTSNS {
            export const valBoolean = true
        }
        // sdk
        export namespace common {
            export namespace TouchTestInfoNS {
                export const windowX = 0
                export const windowY = 0
                export const parentX = 0
                export const parentY = 0
                export const x = 0
                export const y = 0
                export const rect = { x: 0, y: 0, width: 0, height: 0 }
                export const id = "id"
            }
            export namespace TouchResultNS {
                //export const strategy = TouchTestStrategy.DEFAULT
                export const strategy = 0
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
}

export namespace typechecks {
    // bindable: Bindable<T>
    export function isGeneric_ArkuiComponentCommonBindable_I32<T>(bindable: any): boolean {
        return false
    }
    export function isGeneric_ArkuiComponentCommonBindable_String<T>(bindable: any): boolean {
        return false
    }
    export function isGeneric_ArkuiComponentCommonBindable_Resource<T>(bindable: any): boolean {
        return false
    }
    export function isGeneric_ArkuiComponentCommonBindable_ResourceStr<T>(bindable: any): boolean {
        return false
    }
    export function isGeneric_ArkuiComponentCommonBindable_Array_I32<T>(bindable: any): boolean {
        return false
    }
    export function isGeneric_ArkuiComponentCommonBindable_Array_Resource<T>(bindable: any): boolean {
        return false
    }
    export function isGeneric_ArkuiComponentCommonBindable_Array_ResourceStr<T>(bindable: any): boolean {
        return false
    }
    export function isGeneric_ArkuiComponentCommonBindable_Array_String<T>(bindable: any): boolean {
        return false
    }
}

export class ImageData {
  constructor(){
    throw new Error("Not implemented")
  }
}
export namespace extractors {

    export function toImagePixelMapPtr(value: image.PixelMap): KPointer {
        return BigInt(123)
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

    export function transform_Ark_ExtendableComponent_to_CustomNodeBuilder(comp: ExtendableComponent): CustomNodeBuilder {
        return (parentNode) => { return 123 }
    }

    export function transform_CustomNodeBuilder_to_Ark_ExtendableComponent(builder: CustomNodeBuilder): ExtendableComponent {
        return new ExtendableComponentImpl()
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

class ExtendableComponentImpl extends ExtendableComponent {
    override build(): void {
    }
}

export interface CustomDialogControllerOptions {}
export class CustomDialogController {
    constructor(_:CustomDialogControllerOptions) {}
}
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
