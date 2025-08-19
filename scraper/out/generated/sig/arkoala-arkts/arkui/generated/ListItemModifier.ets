/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

import { ListItemAttribute, ArkListItemPeer, SwipeActionOptions } from "./component/listItem"
import { AttributeModifier, AttributeModifierInternal } from "#handwritten"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { CommonMethodModifier } from "./CommonMethodModifier"
import { AttributeUpdaterFlag } from "./AttributeUpdater"
import { CommonMethod, Bindable } from "./component/common"
export class ListItemModifierInternal {
    public static fromPtr(ptr: KPointer): ListItemModifier {
        return new ListItemModifier(ptr)
    }
}
export class ListItemModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, ListItemModifier.getFinalizer())
    }
    constructor() {
        this(ListItemModifier.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._ListItemModifier_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._ListItemModifier_getFinalizer()
    }
}
export class ListItemModifier extends CommonMethodModifier implements ListItemAttribute,AttributeModifier<ListItemAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: ListItemAttribute): void { }
    applyPressedAttribute(instance: ListItemAttribute): void { }
    applyFocusedAttribute(instance: ListItemAttribute): void { }
    applyDisabledAttribute(instance: ListItemAttribute): void { }
    applySelectedAttribute(instance: ListItemAttribute): void { }
    _selectable_0_flag: object = AttributeUpdaterFlag.INITIAL
    _selectable_0_0value?: boolean | undefined
    _selected_0_flag: object = AttributeUpdaterFlag.INITIAL
    _selected_0_0value?: boolean | Bindable<boolean> | undefined
    _swipeAction_0_flag: object = AttributeUpdaterFlag.INITIAL
    _swipeAction_0_0value?: SwipeActionOptions | undefined
    _onSelect_0_flag: object = AttributeUpdaterFlag.INITIAL
    _onSelect_0_0value?: ((isSelected: boolean) => void) | undefined
    applyModifierPatch(peer: ArkListItemPeer): void {
        super.applyModifierPatch(peer)
        if (this._selectable_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._selectable_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setSelectableAttribute((this._selectable_0_0value as boolean | undefined));
                    this._selectable_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._selectable_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._selectable_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setSelectableAttribute((undefined as boolean | undefined));
                }
            }
        }
        if (this._selected_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._selected_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setSelectedAttribute((this._selected_0_0value as boolean | Bindable<boolean> | undefined));
                    this._selected_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._selected_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._selected_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setSelectedAttribute((undefined as boolean | Bindable<boolean> | undefined));
                }
            }
        }
        if (this._swipeAction_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._swipeAction_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setSwipeActionAttribute((this._swipeAction_0_0value as SwipeActionOptions | undefined));
                    this._swipeAction_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._swipeAction_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._swipeAction_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setSwipeActionAttribute((undefined as SwipeActionOptions | undefined));
                }
            }
        }
        if (this._onSelect_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._onSelect_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setOnSelectAttribute((this._onSelect_0_0value as ((isSelected: boolean) => void) | undefined));
                    this._onSelect_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._onSelect_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._onSelect_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setOnSelectAttribute((undefined as ((isSelected: boolean) => void) | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: ListItemModifier): void {
        super.mergeModifier(modifier)
        if (modifier._selectable_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._selectable_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.selectable(modifier._selectable_0_0value);
                    break;
                }
                default: {
                    this.selectable((undefined as boolean | undefined));
                }
            }
        }
        if (modifier._selected_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._selected_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.selected(modifier._selected_0_0value);
                    break;
                }
                default: {
                    this.selected((undefined as boolean | Bindable<boolean> | undefined));
                }
            }
        }
        if (modifier._swipeAction_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._swipeAction_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.swipeAction(modifier._swipeAction_0_0value);
                    break;
                }
                default: {
                    this.swipeAction((undefined as SwipeActionOptions | undefined));
                }
            }
        }
        if (modifier._onSelect_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._onSelect_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.onSelect(modifier._onSelect_0_0value);
                    break;
                }
                default: {
                    this.onSelect((undefined as ((isSelected: boolean) => void) | undefined));
                }
            }
        }
    }
    selectable(value: boolean | undefined): this {
        if (((this._selectable_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._selectable_0_0value) !== (value)))
        {
            this._selectable_0_flag = AttributeUpdaterFlag.UPDATE
            this._selectable_0_0value = value
        } else
        {
            this._selectable_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    selected(value: boolean | Bindable<boolean> | undefined): this {
        if (((this._selected_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._selected_0_flag = AttributeUpdaterFlag.UPDATE
            this._selected_0_0value = value
        } else
        {
            this._selected_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    swipeAction(value: SwipeActionOptions | undefined): this {
        if (((this._swipeAction_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._swipeAction_0_flag = AttributeUpdaterFlag.UPDATE
            this._swipeAction_0_0value = value
        } else
        {
            this._swipeAction_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    onSelect(value: ((isSelected: boolean) => void) | undefined): this {
        if (((this._onSelect_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._onSelect_0_flag = AttributeUpdaterFlag.UPDATE
            this._onSelect_0_0value = value
        } else
        {
            this._onSelect_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<ListItemAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class ListItemModifier_serializer {
    public static write(buffer: SerializerBase, value: ListItemModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): ListItemModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return ListItemModifierInternal.fromPtr(ptr)
    }
}
