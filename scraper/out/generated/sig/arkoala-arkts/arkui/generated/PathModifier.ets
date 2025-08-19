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

import { PathAttribute, ArkPathPeer } from "./component/path"
import { AttributeModifier, AttributeModifierInternal } from "#handwritten"
import { TypeChecker, ArkUIGeneratedNativeModule } from "#components"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, CallbackResource, InteropNativeModule, Tags, nullptr, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { CallbackTransformer } from "./CallbackTransformer"
import { CommonShapeMethodModifier } from "./CommonShapeMethodModifier"
import { CommonMethodModifier } from "./CommonMethodModifier"
import { AttributeUpdaterFlag } from "./AttributeUpdater"
import { CommonShapeMethod, CommonMethod } from "./component/common"
export class PathModifierInternal {
    public static fromPtr(ptr: KPointer): PathModifier {
        return new PathModifier(ptr)
    }
}
export class PathModifier implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, PathModifier.getFinalizer())
    }
    constructor() {
        this(PathModifier.construct())
    }
    static construct(): KPointer {
        const retval  = ArkUIGeneratedNativeModule._PathModifier_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._PathModifier_getFinalizer()
    }
}
export class PathModifier extends CommonShapeMethodModifier implements PathAttribute,AttributeModifier<PathAttribute> {
    _instanceId: number = -1;
    setInstanceId(instanceId: number): void {
        this._instanceId = instanceId
    }
    isUpdater: () => boolean = () => false
    applyNormalAttribute(instance: PathAttribute): void { }
    applyPressedAttribute(instance: PathAttribute): void { }
    applyFocusedAttribute(instance: PathAttribute): void { }
    applyDisabledAttribute(instance: PathAttribute): void { }
    applySelectedAttribute(instance: PathAttribute): void { }
    _commands_0_flag: object = AttributeUpdaterFlag.INITIAL
    _commands_0_0value?: string | undefined
    applyModifierPatch(peer: ArkPathPeer): void {
        super.applyModifierPatch(peer)
        if (this._commands_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (this._commands_0_flag) {
                case AttributeUpdaterFlag.UPDATE: {
                    peer.setCommandsAttribute((this._commands_0_0value as string | undefined));
                    this._commands_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                case AttributeUpdaterFlag.SKIP: {
                    this._commands_0_flag = AttributeUpdaterFlag.RESET;
                    break;
                }
                default: {
                    this._commands_0_flag = AttributeUpdaterFlag.INITIAL;
                    peer.setCommandsAttribute((undefined as string | undefined));
                }
            }
        }
    }
    mergeModifier(modifier: PathModifier): void {
        super.mergeModifier(modifier)
        if (modifier._commands_0_flag != AttributeUpdaterFlag.INITIAL)
        {
            switch (modifier._commands_0_flag) {
                case AttributeUpdaterFlag.UPDATE:
                case AttributeUpdaterFlag.SKIP: {
                    this.commands(modifier._commands_0_0value);
                    break;
                }
                default: {
                    this.commands((undefined as string | undefined));
                }
            }
        }
    }
    commands(value: string | undefined): this {
        if (((this._commands_0_flag) == (AttributeUpdaterFlag.INITIAL)) || ((this._commands_0_0value) !== (value)))
        {
            this._commands_0_flag = AttributeUpdaterFlag.UPDATE
            this._commands_0_0value = value
        } else
        {
            this._commands_0_flag = AttributeUpdaterFlag.SKIP
        }
        return this
    }
    public attributeModifier(value: AttributeModifier<PathAttribute> | AttributeModifier<CommonShapeMethod> | AttributeModifier<CommonMethod> | undefined): this {
        throw new Error("Not implemented")
    }
}
export class PathModifier_serializer {
    public static write(buffer: SerializerBase, value: PathModifier): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(toPeerPtr(value))
    }
    public static read(buffer: DeserializerBase): PathModifier {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return PathModifierInternal.fromPtr(ptr)
    }
}
