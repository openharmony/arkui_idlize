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

import { GridRowAttribute, ArkGridRowPeer } from "./component/gridRow"
import { AttributeModifier, AttributeModifierInternal } from "#handwritten"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { CommonMethodModifier } from "./CommonMethodModifier"
import { AttributeUpdaterFlag } from "./AttributeUpdater"
import { CommonMethod } from "./component/common"
import { ItemAlign } from "./component/enums"
export class GridRowModifierInternal {
    public static fromPtr(ptr: KPointer): GridRowModifier {
        return new GridRowModifier(ptr)
    }
}
export class GridRowModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, GridRowModifier.getFinalizer())
    }
    constructor() {
        this(GridRowModifier.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._GridRowModifier_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._GridRowModifier_getFinalizer()
    }
}
export class GridRowModifier extends CommonMethodModifier implements GridRowAttribute,AttributeModifier<GridRowAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: GridRowAttribute): void { }
    applyPressedAttribute(instance: GridRowAttribute): void { }
    applyFocusedAttribute(instance: GridRowAttribute): void { }
    applyDisabledAttribute(instance: GridRowAttribute): void { }
    applySelectedAttribute(instance: GridRowAttribute): void { }
    _onBreakpointChange_0_flag: object = AttributeUpdaterFlag.INITIAL
    _onBreakpointChange_0_0value?: ((breakpoints: string) => void) | undefined
    _alignItems_0_flag: object = AttributeUpdaterFlag.INITIAL
    _alignItems_0_0value?: ItemAlign | undefined
    applyModifierPatch(peer: ArkGridRowPeer): void {
        super.applyModifierPatch(peer)
        if (this._onBreakpointChange_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._onBreakpointChange_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setOnBreakpointChangeAttribute((this._onBreakpointChange_0_0value as ((breakpoints: string) => void) | undefined));
                    this._onBreakpointChange_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._onBreakpointChange_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._onBreakpointChange_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setOnBreakpointChangeAttribute((undefined as ((breakpoints: string) => void) | undefined));
                }
            }
        }
        if (this._alignItems_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._alignItems_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setAlignItemsAttribute((this._alignItems_0_0value as ItemAlign | undefined));
                    this._alignItems_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._alignItems_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._alignItems_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setAlignItemsAttribute((undefined as ItemAlign | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: GridRowModifier): void {
        super.mergeModifier(modifier)
        if (modifier._onBreakpointChange_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._onBreakpointChange_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.onBreakpointChange(modifier._onBreakpointChange_0_0value);
                    break;
                }
                default: {
                    this.onBreakpointChange((undefined as ((breakpoints: string) => void) | undefined));
                }
            }
        }
        if (modifier._alignItems_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._alignItems_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.alignItems(modifier._alignItems_0_0value);
                    break;
                }
                default: {
                    this.alignItems((undefined as ItemAlign | undefined));
                }
            }
        }
    }
    onBreakpointChange(value: ((breakpoints: string) => void) | undefined): this {
        if (((this._onBreakpointChange_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._onBreakpointChange_0_flag = AttributeUpdaterFlag.UPDATE
            this._onBreakpointChange_0_0value = value
        } else
        {
            this._onBreakpointChange_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    alignItems(value: ItemAlign | undefined): this {
        if (((this._alignItems_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._alignItems_0_flag = AttributeUpdaterFlag.UPDATE
            this._alignItems_0_0value = value
        } else
        {
            this._alignItems_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<GridRowAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class GridRowModifier_serializer {
    public static write(buffer: SerializerBase, value: GridRowModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): GridRowModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return GridRowModifierInternal.fromPtr(ptr)
    }
}
