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

import { StackAttribute, ArkStackPeer } from "./component/stack"
import { AttributeModifier, AttributeModifierInternal } from "#handwritten"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { CommonMethodModifier } from "./CommonMethodModifier"
import { AttributeUpdaterFlag } from "./AttributeUpdater"
import { CommonMethod } from "./component/common"
import { Alignment } from "./component/enums"
export class StackModifierInternal {
    public static fromPtr(ptr: KPointer): StackModifier {
        return new StackModifier(ptr)
    }
}
export class StackModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, StackModifier.getFinalizer())
    }
    constructor() {
        this(StackModifier.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._StackModifier_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._StackModifier_getFinalizer()
    }
}
export class StackModifier extends CommonMethodModifier implements StackAttribute,AttributeModifier<StackAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: StackAttribute): void { }
    applyPressedAttribute(instance: StackAttribute): void { }
    applyFocusedAttribute(instance: StackAttribute): void { }
    applyDisabledAttribute(instance: StackAttribute): void { }
    applySelectedAttribute(instance: StackAttribute): void { }
    _alignContent_0_flag: object = AttributeUpdaterFlag.INITIAL
    _alignContent_0_0value?: Alignment | undefined
    applyModifierPatch(peer: ArkStackPeer): void {
        super.applyModifierPatch(peer)
        if (this._alignContent_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._alignContent_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setAlignContentAttribute((this._alignContent_0_0value as Alignment | undefined));
                    this._alignContent_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._alignContent_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._alignContent_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setAlignContentAttribute((undefined as Alignment | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: StackModifier): void {
        super.mergeModifier(modifier)
        if (modifier._alignContent_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._alignContent_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.alignContent(modifier._alignContent_0_0value);
                    break;
                }
                default: {
                    this.alignContent((undefined as Alignment | undefined));
                }
            }
        }
    }
    alignContent(value: Alignment | undefined): this {
        if (((this._alignContent_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._alignContent_0_flag = AttributeUpdaterFlag.UPDATE
            this._alignContent_0_0value = value
        } else
        {
            this._alignContent_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<StackAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class StackModifier_serializer {
    public static write(buffer: SerializerBase, value: StackModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): StackModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return StackModifierInternal.fromPtr(ptr)
    }
}
