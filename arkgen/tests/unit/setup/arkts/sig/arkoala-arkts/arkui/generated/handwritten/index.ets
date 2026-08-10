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
import { CheckCustomModifierModifierBase } from '../framework';
import { AnimateParam } from '../framework'
import { ArkCheckHooksComponent, ArkCheckHooksPeer, CheckHooksModifier } from '../framework'
import {
    SampleTransformSrcI,
    SampleTransformDstI,
    TransformSrcCallbackI,
    TransformDstCallbackI,
} from '../framework'
import {
    ArkCheckChildComponent, ArkCheckCustomModifierComponent, ArkCheckDuplicateChildComponent,
    ArkCheckDuplicateParentComponent, ArkCheckEnumComponent, ArkCheckExceptionComponent, ArkCheckExtendableComponent,
    ArkCheckExtendableNoContentComponent, ArkCheckNoModifiersComponent, ArkCheckOptionalComponent,
    ArkCheckParentComponent, ArkCheckTransformComponent, ArkCheckTrivialModifierComponent, ArkCheckUnitsComponent,
    ArkDatebookComponent, ArkListItemComponent, ArkRootComponent, CheckChildAttribute, CheckCustomModifierAttribute,
    CheckDuplicateChildAttribute, CheckDuplicateParentAttribute, CheckEnumAttribute, CheckExceptionAttribute,
    CheckExtendableAttribute, CheckExtendableNoContentAttribute, CheckHooksAttribute, CheckNoModifiersAttribute,
    CheckOptionalAttribute, CheckParentAttribute, CheckTransformAttribute, CheckTrivialModifierAttribute,
    CheckUnitsAttribute, DatebookAttribute, ListItemAttribute, Root
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
    addRef(): void {}
    fireChange(): void {}
}

export function _animateTo(param: AnimateParam, event: (() => void)): void {}
export function _animationStart(param: AnimateParam, isFirstBuild: boolean): void {}
export function _animationEnd(isFirstBuild: boolean, update: (() => void)): void {}

export function hookCheckHooksText(receiver: ArkCheckHooksComponent, text?: string): void {
    receiver.checkHookResult(`Check hook text: ${text}`)
}

export function hookCheckHooksMethodPrimitives(receiver: ArkCheckHooksComponent, flag: boolean, count: number, text: string): void {
    receiver.checkHookResult(`Check hook method primitives: ${flag}, ${count}, ${text}`)
}

// Probably only one set of methods with Component or Peer are needed
export function hookCheckHooksText(modifier: CheckHooksModifier, receiver: ArkCheckHooksPeer, text?: string): void {
    receiver.setCheckHookResultAttribute(`Check hook text: ${text}`)
}

export function hookCheckHooksMethodPrimitives(modifier: CheckHooksModifier, receiver: ArkCheckHooksPeer, flag: boolean, count: number, text: string): void {
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

export namespace initializers {
    export namespace arkui {
        export namespace component {
            export namespace check {
                export namespace duplicates {
                    export namespace DuplicateClassParentNS {
                        export const parentEnabled: boolean = false
                        export const commonEnabled: boolean = false
                        export const parentStatic: boolean = false
                    }
                    export namespace DuplicateClassChildNS {
                        export const childEnabled: boolean = false
                        export const commonEnabled: boolean = false
                        export const parentStatic: boolean = false
                        export const childStatic: boolean = false
                    }
                }
            }
        }
    }
}

export class CheckCustomModifierModifier extends CheckCustomModifierModifierBase {
    private _a: number
    constructor(a: number) {
        super()
        this._a = a
    }
    foo(param: string): number {
        return this._a + param.length
    }
}

export class ModifierStateManager {
    static INSTANCE: ModifierStateManager = new ModifierStateManager();

    constructor() { }

    scope(callback: () => void): void {}
}

export function hookCheckDuplicateParentAttributeModifier(
    attr: ArkCheckDuplicateParentComponent,
    value: AttributeModifier<CheckDuplicateParentAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookCheckDuplicateChildAttributeModifier(
    attr: ArkCheckDuplicateChildComponent,
    value: AttributeModifier<CheckDuplicateChildAttribute> | AttributeModifier<CheckDuplicateParentAttribute>
        | AttributeModifier<Root> | undefined
): void {}
export function hookCheckEnumAttributeModifier(
    attr: ArkCheckEnumComponent,
    value: AttributeModifier<CheckEnumAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookCheckExceptionAttributeModifier(
    attr: ArkCheckExceptionComponent,
    value: AttributeModifier<CheckExceptionAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookCheckExtendableAttributeModifier(
    attr: ArkCheckExtendableComponent,
    value: AttributeModifier<CheckExtendableAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookCheckExtendableNoContentAttributeModifier(
    attr: ArkCheckExtendableNoContentComponent,
    value: AttributeModifier<CheckExtendableNoContentAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookCheckParentAttributeModifier(
    attr: ArkCheckParentComponent,
    value: AttributeModifier<CheckParentAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookCheckChildAttributeModifier(
    attr: ArkCheckChildComponent,
    value: AttributeModifier<CheckChildAttribute> | AttributeModifier<CheckParentAttribute>
        | AttributeModifier<Root> | undefined
): void {}
export function hookCheckHooksAttributeModifier(
    attr: ArkCheckHooksComponent,
    value: AttributeModifier<CheckHooksAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookCheckCustomModifierAttributeModifier(
    attr: ArkCheckCustomModifierComponent,
    value: AttributeModifier<CheckCustomModifierAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookCheckTrivialModifierAttributeModifier(
    attr: ArkCheckTrivialModifierComponent,
    value: AttributeModifier<CheckTrivialModifierAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookCheckNoModifiersAttributeModifier(
    attr: ArkCheckNoModifiersComponent,
    value: AttributeModifier<CheckNoModifiersAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookCheckOptionalAttributeModifier(
    attr: ArkCheckOptionalComponent,
    value: AttributeModifier<CheckOptionalAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookCheckTransformAttributeModifier(
    attr: ArkCheckTransformComponent,
    value: AttributeModifier<CheckTransformAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookDatebookAttributeModifier(
    attr: ArkDatebookComponent,
    value: AttributeModifier<DatebookAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookRootAttributeModifier(
    attr: ArkRootComponent,
    value: AttributeModifier<Root> | undefined
): void {}
export function hookCheckUnitsAttributeModifier(
    attr: ArkCheckUnitsComponent,
    value: AttributeModifier<CheckUnitsAttribute> | AttributeModifier<Root> | undefined
): void {}
export function hookListItemAttributeModifier(
    attr: ArkListItemComponent,
    value: AttributeModifier<ListItemAttribute> | AttributeModifier<Root> | undefined
): void {}
