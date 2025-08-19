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

import { ColumnAttribute, ArkColumnPeer } from "./component/column"
import { AttributeModifier, AttributeModifierInternal } from "#handwritten"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { CommonMethodModifier } from "./CommonMethodModifier"
import { AttributeUpdaterFlag } from "./AttributeUpdater"
import { CommonMethod } from "./component/common"
import { HorizontalAlign, FlexAlign } from "./component/enums"
export class ColumnModifierInternal {
    public static fromPtr(ptr: KPointer): ColumnModifier {
        return new ColumnModifier(ptr)
    }
}
export class ColumnModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, ColumnModifier.getFinalizer())
    }
    constructor() {
        this(ColumnModifier.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._ColumnModifier_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._ColumnModifier_getFinalizer()
    }
}
export class ColumnModifier extends CommonMethodModifier implements ColumnAttribute,AttributeModifier<ColumnAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: ColumnAttribute): void { }
    applyPressedAttribute(instance: ColumnAttribute): void { }
    applyFocusedAttribute(instance: ColumnAttribute): void { }
    applyDisabledAttribute(instance: ColumnAttribute): void { }
    applySelectedAttribute(instance: ColumnAttribute): void { }
    _alignItems_0_flag: object = AttributeUpdaterFlag.INITIAL
    _alignItems_0_0value?: HorizontalAlign | undefined
    _justifyContent_0_flag: object = AttributeUpdaterFlag.INITIAL
    _justifyContent_0_0value?: FlexAlign | undefined
    _reverse_0_flag: object = AttributeUpdaterFlag.INITIAL
    _reverse_0_0value?: boolean | undefined
    applyModifierPatch(peer: ArkColumnPeer): void {
        super.applyModifierPatch(peer)
        if (this._alignItems_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._alignItems_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setAlignItemsAttribute((this._alignItems_0_0value as HorizontalAlign | undefined));
                    this._alignItems_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._alignItems_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._alignItems_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setAlignItemsAttribute((undefined as HorizontalAlign | undefined));
                }
            }
        }
        if (this._justifyContent_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._justifyContent_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setJustifyContentAttribute((this._justifyContent_0_0value as FlexAlign | undefined));
                    this._justifyContent_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._justifyContent_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._justifyContent_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setJustifyContentAttribute((undefined as FlexAlign | undefined));
                }
            }
        }
        if (this._reverse_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._reverse_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setReverseAttribute((this._reverse_0_0value as boolean | undefined));
                    this._reverse_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._reverse_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._reverse_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setReverseAttribute((undefined as boolean | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: ColumnModifier): void {
        super.mergeModifier(modifier)
        if (modifier._alignItems_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._alignItems_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.alignItems(modifier._alignItems_0_0value);
                    break;
                }
                default: {
                    this.alignItems((undefined as HorizontalAlign | undefined));
                }
            }
        }
        if (modifier._justifyContent_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._justifyContent_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.justifyContent(modifier._justifyContent_0_0value);
                    break;
                }
                default: {
                    this.justifyContent((undefined as FlexAlign | undefined));
                }
            }
        }
        if (modifier._reverse_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._reverse_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.reverse(modifier._reverse_0_0value);
                    break;
                }
                default: {
                    this.reverse((undefined as boolean | undefined));
                }
            }
        }
    }
    alignItems(value: HorizontalAlign | undefined): this {
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
    justifyContent(value: FlexAlign | undefined): this {
        if (((this._justifyContent_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._justifyContent_0_flag = AttributeUpdaterFlag.UPDATE
            this._justifyContent_0_0value = value
        } else
        {
            this._justifyContent_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    reverse(value: boolean | undefined): this {
        if (((this._reverse_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._reverse_0_0value) !== (value)))
        {
            this._reverse_0_flag = AttributeUpdaterFlag.UPDATE
            this._reverse_0_0value = value
        } else
        {
            this._reverse_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<ColumnAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class ColumnModifier_serializer {
    public static write(buffer: SerializerBase, value: ColumnModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): ColumnModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return ColumnModifierInternal.fromPtr(ptr)
    }
}
