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

import { GridColAttribute, ArkGridColPeer, GridColColumnOption } from "./component/gridCol"
import { AttributeModifier, AttributeModifierInternal } from "#handwritten"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { CommonMethodModifier } from "./CommonMethodModifier"
import { AttributeUpdaterFlag } from "./AttributeUpdater"
import { CommonMethod } from "./component/common"
export class GridColModifierInternal {
    public static fromPtr(ptr: KPointer): GridColModifier {
        return new GridColModifier(ptr)
    }
}
export class GridColModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, GridColModifier.getFinalizer())
    }
    constructor() {
        this(GridColModifier.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._GridColModifier_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._GridColModifier_getFinalizer()
    }
}
export class GridColModifier extends CommonMethodModifier implements GridColAttribute,AttributeModifier<GridColAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: GridColAttribute): void { }
    applyPressedAttribute(instance: GridColAttribute): void { }
    applyFocusedAttribute(instance: GridColAttribute): void { }
    applyDisabledAttribute(instance: GridColAttribute): void { }
    applySelectedAttribute(instance: GridColAttribute): void { }
    _span_0_flag: object = AttributeUpdaterFlag.INITIAL
    _span_0_0value?: number | GridColColumnOption | undefined
    _gridColOffset_0_flag: object = AttributeUpdaterFlag.INITIAL
    _gridColOffset_0_0value?: number | GridColColumnOption | undefined
    _order_0_flag: object = AttributeUpdaterFlag.INITIAL
    _order_0_0value?: number | GridColColumnOption | undefined
    applyModifierPatch(peer: ArkGridColPeer): void {
        super.applyModifierPatch(peer)
        if (this._span_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._span_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setSpanAttribute((this._span_0_0value as number | GridColColumnOption | undefined));
                    this._span_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._span_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._span_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setSpanAttribute((undefined as number | GridColColumnOption | undefined));
                }
            }
        }
        if (this._gridColOffset_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._gridColOffset_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setGridColOffsetAttribute((this._gridColOffset_0_0value as number | GridColColumnOption | undefined));
                    this._gridColOffset_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._gridColOffset_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._gridColOffset_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setGridColOffsetAttribute((undefined as number | GridColColumnOption | undefined));
                }
            }
        }
        if (this._order_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._order_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setOrderAttribute((this._order_0_0value as number | GridColColumnOption | undefined));
                    this._order_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._order_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._order_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setOrderAttribute((undefined as number | GridColColumnOption | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: GridColModifier): void {
        super.mergeModifier(modifier)
        if (modifier._span_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._span_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.span(modifier._span_0_0value);
                    break;
                }
                default: {
                    this.span((undefined as number | GridColColumnOption | undefined));
                }
            }
        }
        if (modifier._gridColOffset_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._gridColOffset_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.gridColOffset(modifier._gridColOffset_0_0value);
                    break;
                }
                default: {
                    this.gridColOffset((undefined as number | GridColColumnOption | undefined));
                }
            }
        }
        if (modifier._order_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._order_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.order(modifier._order_0_0value);
                    break;
                }
                default: {
                    this.order((undefined as number | GridColColumnOption | undefined));
                }
            }
        }
    }
    span(value: number | GridColColumnOption | undefined): this {
        if (((this._span_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._span_0_flag = AttributeUpdaterFlag.UPDATE
            this._span_0_0value = value
        } else
        {
            this._span_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    gridColOffset(value: number | GridColColumnOption | undefined): this {
        if (((this._gridColOffset_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._gridColOffset_0_flag = AttributeUpdaterFlag.UPDATE
            this._gridColOffset_0_0value = value
        } else
        {
            this._gridColOffset_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    order(value: number | GridColColumnOption | undefined): this {
        if (((this._order_0_flag) == (AttributeUpdaterFlag.INITIAL)) || (true))
        {
            this._order_0_flag = AttributeUpdaterFlag.UPDATE
            this._order_0_0value = value
        } else
        {
            this._order_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<GridColAttribute> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class GridColModifier_serializer {
    public static write(buffer: SerializerBase, value: GridColModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): GridColModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return GridColModifierInternal.fromPtr(ptr)
    }
}
