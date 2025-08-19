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

import { LineAttribute, ArkLinePeer, ShapePoint } from "./component/line"
import { AttributeModifier, AttributeModifierInternal } from "#handwritten"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { CommonShapeMethodModifier } from "./CommonShapeMethodModifier"
import { CommonMethodModifier } from "./CommonMethodModifier"
import { AttributeUpdaterFlag } from "./AttributeUpdater"
import { CommonShapeMethod, CommonMethod } from "./component/common"
import { Length } from "./component/units"
import { Resource } from "@global.resource"
export class LineModifierInternal {
    public static fromPtr(ptr: KPointer): LineModifier {
        return new LineModifier(ptr)
    }
}
export class LineModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, LineModifier.getFinalizer())
    }
    constructor() {
        this(LineModifier.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._LineModifier_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._LineModifier_getFinalizer()
    }
}
export class LineModifier extends CommonShapeMethodModifier implements LineAttribute,AttributeModifier<LineAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: LineAttribute): void { }
    applyPressedAttribute(instance: LineAttribute): void { }
    applyFocusedAttribute(instance: LineAttribute): void { }
    applyDisabledAttribute(instance: LineAttribute): void { }
    applySelectedAttribute(instance: LineAttribute): void { }
    _startPoint_0_flag: object = AttributeUpdaterFlag.INITIAL
    _startPoint_0_0value?: ShapePoint | undefined
    _endPoint_0_flag: object = AttributeUpdaterFlag.INITIAL
    _endPoint_0_0value?: ShapePoint | undefined
    applyModifierPatch(peer: ArkLinePeer): void {
        super.applyModifierPatch(peer)
        if (this._startPoint_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._startPoint_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setStartPointAttribute((this._startPoint_0_0value as ShapePoint | undefined));
                    this._startPoint_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._startPoint_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._startPoint_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setStartPointAttribute((undefined as ShapePoint | undefined));
                }
            }
        }
        if (this._endPoint_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._endPoint_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setEndPointAttribute((this._endPoint_0_0value as ShapePoint | undefined));
                    this._endPoint_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._endPoint_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._endPoint_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setEndPointAttribute((undefined as ShapePoint | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: LineModifier): void {
        super.mergeModifier(modifier)
        if (modifier._startPoint_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._startPoint_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.startPoint(modifier._startPoint_0_0value);
                    break;
                }
                default: {
                    this.startPoint((undefined as ShapePoint | undefined));
                }
            }
        }
        if (modifier._endPoint_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._endPoint_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.endPoint(modifier._endPoint_0_0value);
                    break;
                }
                default: {
                    this.endPoint((undefined as ShapePoint | undefined));
                }
            }
        }
    }
    startPoint(value: ShapePoint | undefined): this {
        if (((this._startPoint_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._startPoint_0_flag = AttributeUpdaterFlag.UPDATE
            this._startPoint_0_0value = value
        } else
        {
            this._startPoint_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    endPoint(value: ShapePoint | undefined): this {
        if (((this._endPoint_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._endPoint_0_flag = AttributeUpdaterFlag.UPDATE
            this._endPoint_0_0value = value
        } else
        {
            this._endPoint_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<LineAttribute> | AttributeModifier<CommonShapeMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class LineModifier_serializer {
    public static write(buffer: SerializerBase, value: LineModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): LineModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return LineModifierInternal.fromPtr(ptr)
    }
}
