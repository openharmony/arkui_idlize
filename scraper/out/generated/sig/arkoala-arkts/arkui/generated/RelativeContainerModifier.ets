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

import { RelativeContainerAttribute, ArkRelativeContainerPeer, GuideLineStyle, BarrierStyle } from "./component/relativeContainer"
import { AttributeModifier, AttributeModifierInternal } from "#handwritten"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { CommonMethodModifier } from "./CommonMethodModifier"
import { AttributeUpdaterFlag } from "./AttributeUpdater"
import { CommonMethod } from "./component/common"
export class RelativeContainerModifierInternal {
    public static fromPtr(ptr: KPointer): RelativeContainerModifier {
        return new RelativeContainerModifier(ptr)
    }
}
export class RelativeContainerModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, RelativeContainerModifier.getFinalizer())
    }
    constructor() {
        this(RelativeContainerModifier.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._RelativeContainerModifier_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._RelativeContainerModifier_getFinalizer()
    }
}
export class RelativeContainerModifier extends CommonMethodModifier implements RelativeContainerAttribute,AttributeModifier<RelativeContainerAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: RelativeContainerAttribute): void { }
    applyPressedAttribute(instance: RelativeContainerAttribute): void { }
    applyFocusedAttribute(instance: RelativeContainerAttribute): void { }
    applyDisabledAttribute(instance: RelativeContainerAttribute): void { }
    applySelectedAttribute(instance: RelativeContainerAttribute): void { }
    _guideLine_0_flag: object = AttributeUpdaterFlag.INITIAL
    _guideLine_0_0value?: Array<GuideLineStyle> | undefined
    _barrier_0_flag: object = AttributeUpdaterFlag.INITIAL
    _barrier_0_0value?: Array<BarrierStyle> | undefined
    applyModifierPatch(peer: ArkRelativeContainerPeer): void {
        super.applyModifierPatch(peer)
        if (this._guideLine_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._guideLine_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setGuideLineAttribute((this._guideLine_0_0value as Array<GuideLineStyle> | undefined));
                    this._guideLine_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._guideLine_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._guideLine_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setGuideLineAttribute((undefined as Array<GuideLineStyle> | undefined));
                }
            }
        }
        if (this._barrier_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._barrier_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setBarrierAttribute((this._barrier_0_0value as Array<BarrierStyle> | undefined));
                    this._barrier_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._barrier_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._barrier_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setBarrierAttribute((undefined as Array<BarrierStyle> | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: RelativeContainerModifier): void {
        super.mergeModifier(modifier)
        if (modifier._guideLine_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._guideLine_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.guideLine(modifier._guideLine_0_0value);
                    break;
                }
                default: {
                    this.guideLine((undefined as Array<GuideLineStyle> | undefined));
                }
            }
        }
        if (modifier._barrier_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._barrier_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.barrier(modifier._barrier_0_0value);
                    break;
                }
                default: {
                    this.barrier((undefined as Array<BarrierStyle> | undefined));
                }
            }
        }
    }
    guideLine(value: Array<GuideLineStyle> | undefined): this {
        if (((this._guideLine_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._guideLine_0_flag = AttributeUpdaterFlag.UPDATE
            this._guideLine_0_0value = value
        } else
        {
            this._guideLine_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    barrier(value: Array<BarrierStyle> | undefined): this {
        if (((this._barrier_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._barrier_0_flag = AttributeUpdaterFlag.UPDATE
            this._barrier_0_0value = value
        } else
        {
            this._barrier_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<RelativeContainerAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class RelativeContainerModifier_serializer {
    public static write(buffer: SerializerBase, value: RelativeContainerModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): RelativeContainerModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return RelativeContainerModifierInternal.fromPtr(ptr)
    }
}
