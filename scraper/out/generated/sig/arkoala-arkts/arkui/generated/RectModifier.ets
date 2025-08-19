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

import { RectAttribute, ArkRectPeer, RadiusItem } from "./component/rect"
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
export class RectModifierInternal {
    public static fromPtr(ptr: KPointer): RectModifier {
        return new RectModifier(ptr)
    }
}
export class RectModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, RectModifier.getFinalizer())
    }
    constructor() {
        this(RectModifier.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._RectModifier_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._RectModifier_getFinalizer()
    }
}
export class RectModifier extends CommonShapeMethodModifier implements RectAttribute,AttributeModifier<RectAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: RectAttribute): void { }
    applyPressedAttribute(instance: RectAttribute): void { }
    applyFocusedAttribute(instance: RectAttribute): void { }
    applyDisabledAttribute(instance: RectAttribute): void { }
    applySelectedAttribute(instance: RectAttribute): void { }
    _radiusWidth_0_flag: object = AttributeUpdaterFlag.INITIAL
    _radiusWidth_0_0value?: double | string | undefined
    _radiusHeight_0_flag: object = AttributeUpdaterFlag.INITIAL
    _radiusHeight_0_0value?: double | string | undefined
    _radius_0_flag: object = AttributeUpdaterFlag.INITIAL
    _radius_0_0value?: Length | Array<RadiusItem> | undefined
    applyModifierPatch(peer: ArkRectPeer): void {
        super.applyModifierPatch(peer)
        if (this._radiusWidth_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._radiusWidth_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setRadiusWidthAttribute((this._radiusWidth_0_0value as double | string | undefined));
                    this._radiusWidth_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._radiusWidth_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._radiusWidth_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setRadiusWidthAttribute((undefined as double | string | undefined));
                }
            }
        }
        if (this._radiusHeight_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._radiusHeight_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setRadiusHeightAttribute((this._radiusHeight_0_0value as double | string | undefined));
                    this._radiusHeight_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._radiusHeight_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._radiusHeight_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setRadiusHeightAttribute((undefined as double | string | undefined));
                }
            }
        }
        if (this._radius_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._radius_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setRadiusAttribute((this._radius_0_0value as Length | Array<RadiusItem> | undefined));
                    this._radius_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._radius_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._radius_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setRadiusAttribute((undefined as Length | Array<RadiusItem> | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: RectModifier): void {
        super.mergeModifier(modifier)
        if (modifier._radiusWidth_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._radiusWidth_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.radiusWidth(modifier._radiusWidth_0_0value);
                    break;
                }
                default: {
                    this.radiusWidth((undefined as double | string | undefined));
                }
            }
        }
        if (modifier._radiusHeight_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._radiusHeight_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.radiusHeight(modifier._radiusHeight_0_0value);
                    break;
                }
                default: {
                    this.radiusHeight((undefined as double | string | undefined));
                }
            }
        }
        if (modifier._radius_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._radius_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.radius(modifier._radius_0_0value);
                    break;
                }
                default: {
                    this.radius((undefined as Length | Array<RadiusItem> | undefined));
                }
            }
        }
    }
    radiusWidth(value: double | string | undefined): this {
        if (((this._radiusWidth_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._radiusWidth_0_0value) !== (value)))
        {
            this._radiusWidth_0_flag = AttributeUpdaterFlag.UPDATE
            this._radiusWidth_0_0value = value
        } else
        {
            this._radiusWidth_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    radiusHeight(value: double | string | undefined): this {
        if (((this._radiusHeight_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._radiusHeight_0_0value) !== (value)))
        {
            this._radiusHeight_0_flag = AttributeUpdaterFlag.UPDATE
            this._radiusHeight_0_0value = value
        } else
        {
            this._radiusHeight_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    radius(value: Length | Array<RadiusItem> | undefined): this {
        if (((this._radius_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._radius_0_flag = AttributeUpdaterFlag.UPDATE
            this._radius_0_0value = value
        } else
        {
            this._radius_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<RectAttribute> | AttributeModifier<CommonShapeMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class RectModifier_serializer {
    public static write(buffer: SerializerBase, value: RectModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): RectModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return RectModifierInternal.fromPtr(ptr)
    }
}
