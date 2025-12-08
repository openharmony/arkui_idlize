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
import { AnimateParam } from '../framework'
import { ArkCheckHooksComponent, ArkCheckHooksPeer } from '../framework'
import {
    SampleTransformSrcI,
    SampleTransformDstI,
    TransformSrcCallbackI,
    TransformDstCallbackI,
} from '../framework'

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
export class ModifierState {
    addRef(): void {
    }
    fireChange(): void {
    }
}

export function _animateTo(param: AnimateParam, event: (() => void)): void {}
export function _animationStart(param: AnimateParam, isFirstBuild: boolean) {}
export function _animationEnd(isFirstBuild: boolean, update: (() => void)): void {}

export function hookCheckHooksText(receiver: ArkCheckHooksComponent, text?: string){
    receiver.checkHookResult(`Check hook text: ${text}`)
}

export function hookCheckHooksMethodPrimitives(receiver: ArkCheckHooksComponent, flag: boolean, count: number, text: string){
    receiver.checkHookResult(`Check hook method primitives: ${flag}, ${count}, ${text}`)
}

// Probably only one set of methods with Component or Peer are needed
export function hookCheckHooksText(receiver: ArkCheckHooksPeer, text?: string){
    receiver.setCheckHookResultAttribute(`Check hook text: ${text}`)
}

export function hookCheckHooksMethodPrimitives(receiver: ArkCheckHooksPeer, flag: boolean, count: number, text: string){
    receiver.setCheckHookResultAttribute(`Check hook method primitives: ${flag}, ${count}, ${text}`)
}

export namespace extractors {
    export function transform_Ark_SampleTransformSrcI_to_Ark_SampleTransformDstI(src: SampleTransformSrcI): SampleTransformDstI {
        const result: SampleTransformDstI = { length: src.text.length }
        return result
    }

    export function transform_Ark_TransformSrcCallbackI_to_TransformDstCallbackI(src: TransformSrcCallbackI): TransformDstCallbackI {
        return src.flag
            ? (value: boolean) => { return !value }
            : (value: boolean) => { return value }
    }
}
