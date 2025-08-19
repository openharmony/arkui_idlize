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

import { RowSplitAttribute, ArkRowSplitPeer } from "./component/rowSplit"
import { AttributeModifier, AttributeModifierInternal } from "#handwritten"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { CommonMethodModifier } from "./CommonMethodModifier"
import { AttributeUpdaterFlag } from "./AttributeUpdater"
import { CommonMethod } from "./component/common"
export class RowSplitModifierInternal {
    public static fromPtr(ptr: KPointer): RowSplitModifier {
        return new RowSplitModifier(ptr)
    }
}
export class RowSplitModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, RowSplitModifier.getFinalizer())
    }
    constructor() {
        this(RowSplitModifier.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._RowSplitModifier_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._RowSplitModifier_getFinalizer()
    }
}
export class RowSplitModifier extends CommonMethodModifier implements RowSplitAttribute,AttributeModifier<RowSplitAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: RowSplitAttribute): void { }
    applyPressedAttribute(instance: RowSplitAttribute): void { }
    applyFocusedAttribute(instance: RowSplitAttribute): void { }
    applyDisabledAttribute(instance: RowSplitAttribute): void { }
    applySelectedAttribute(instance: RowSplitAttribute): void { }
    _resizeable_0_flag: object = AttributeUpdaterFlag.INITIAL
    _resizeable_0_0value?: boolean | undefined
    applyModifierPatch(peer: ArkRowSplitPeer): void {
        super.applyModifierPatch(peer)
        if (this._resizeable_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._resizeable_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setResizeableAttribute((this._resizeable_0_0value as boolean | undefined));
                    this._resizeable_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._resizeable_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._resizeable_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setResizeableAttribute((undefined as boolean | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: RowSplitModifier): void {
        super.mergeModifier(modifier)
        if (modifier._resizeable_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._resizeable_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.resizeable(modifier._resizeable_0_0value);
                    break;
                }
                default: {
                    this.resizeable((undefined as boolean | undefined));
                }
            }
        }
    }
    resizeable(value: boolean | undefined): this {
        if (((this._resizeable_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._resizeable_0_0value) !== (value)))
        {
            this._resizeable_0_flag = AttributeUpdaterFlag.UPDATE
            this._resizeable_0_0value = value
        } else
        {
            this._resizeable_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<RowSplitAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class RowSplitModifier_serializer {
    public static write(buffer: SerializerBase, value: RowSplitModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): RowSplitModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return RowSplitModifierInternal.fromPtr(ptr)
    }
}
