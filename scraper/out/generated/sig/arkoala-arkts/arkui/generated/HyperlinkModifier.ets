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

import { HyperlinkAttribute, ArkHyperlinkPeer } from "./component/hyperlink"
import { AttributeModifier, AttributeModifierInternal } from "#handwritten"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { CommonMethodModifier } from "./CommonMethodModifier"
import { AttributeUpdaterFlag } from "./AttributeUpdater"
import { CommonMethod } from "./component/common"
import { Color } from "./component/enums"
import { Resource } from "@global.resource"
export class HyperlinkModifierInternal {
    public static fromPtr(ptr: KPointer): HyperlinkModifier {
        return new HyperlinkModifier(ptr)
    }
}
export class HyperlinkModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, HyperlinkModifier.getFinalizer())
    }
    constructor() {
        this(HyperlinkModifier.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._HyperlinkModifier_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._HyperlinkModifier_getFinalizer()
    }
}
export class HyperlinkModifier extends CommonMethodModifier implements HyperlinkAttribute,AttributeModifier<HyperlinkAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: HyperlinkAttribute): void { }
    applyPressedAttribute(instance: HyperlinkAttribute): void { }
    applyFocusedAttribute(instance: HyperlinkAttribute): void { }
    applyDisabledAttribute(instance: HyperlinkAttribute): void { }
    applySelectedAttribute(instance: HyperlinkAttribute): void { }
    _color_0_flag: object = AttributeUpdaterFlag.INITIAL
    _color_0_0value?: Color | number | string | Resource | undefined
    applyModifierPatch(peer: ArkHyperlinkPeer): void {
        super.applyModifierPatch(peer)
        if (this._color_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._color_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setColorAttribute((this._color_0_0value as Color | number | string | Resource | undefined));
                    this._color_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._color_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._color_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setColorAttribute((undefined as Color | number | string | Resource | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: HyperlinkModifier): void {
        super.mergeModifier(modifier)
        if (modifier._color_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._color_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.color(modifier._color_0_0value);
                    break;
                }
                default: {
                    this.color((undefined as Color | number | string | Resource | undefined));
                }
            }
        }
    }
    color(value: Color | number | string | Resource | undefined): this {
        if (((this._color_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._color_0_flag = AttributeUpdaterFlag.UPDATE
            this._color_0_0value = value
        } else
        {
            this._color_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<HyperlinkAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class HyperlinkModifier_serializer {
    public static write(buffer: SerializerBase, value: HyperlinkModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): HyperlinkModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return HyperlinkModifierInternal.fromPtr(ptr)
    }
}
