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

import { SerializerBase, DeserializerBase, Finalizable, runtimeType, RuntimeType, toPeerPtr, KPointer, MaterializedBase, NativeBuffer } from "@koalaui/interop"
import { extractors } from "#handwritten"
import { StartOptions } from "@ohos.app.ability.StartOptions"
import { TypeChecker, OHOS_APP_ABILITY_ATOMICSERVICEOPTIONSNativeModule } from "./ohos.app.ability.AtomicServiceOptions.INTERNAL"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export class AtomicServiceOptionsInternal {
    public static fromPtr(ptr: KPointer): AtomicServiceOptions {
        return new AtomicServiceOptions(ptr)
    }
}
export class AtomicServiceOptions extends StartOptions implements MaterializedBase {
    get flags(): int32 | undefined {
        return this.getFlags()
    }
    set flags(flags: int32 | undefined) {
        const flags_NonNull  = (flags as int32 | undefined)
        this.setFlags(flags_NonNull)
    }
    get parameters(): Map<string, Object> | undefined {
        return this.getParameters()
    }
    set parameters(parameters: Map<string, Object> | undefined) {
        const parameters_NonNull  = (parameters as Map<string, Object> | undefined)
        this.setParameters(parameters_NonNull)
    }
    constructor(peerPtr: KPointer) {
        super(peerPtr)
    }
    constructor() {
        this(AtomicServiceOptions.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_APP_ABILITY_ATOMICSERVICEOPTIONSNativeModule._AtomicServiceOptions_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_APP_ABILITY_ATOMICSERVICEOPTIONSNativeModule._AtomicServiceOptions_getFinalizer()
    }
    private getFlags(): int32 | undefined {
        return this.getFlags_serialize()
    }
    private setFlags(flags: int32 | undefined): void {
        const flags_casted = flags as (int32 | undefined)
        this.setFlags_serialize(flags_casted)
        return
    }
    private getParameters(): Map<string, Object> | undefined {
        return this.getParameters_serialize()
    }
    private setParameters(parameters: Map<string, Object> | undefined): void {
        const parameters_casted = parameters as (Map<string, Object> | undefined)
        this.setParameters_serialize(parameters_casted)
        return
    }
    private getFlags_serialize(): int32 | undefined {
        const retval  = OHOS_APP_ABILITY_ATOMICSERVICEOPTIONSNativeModule._AtomicServiceOptions_getFlags(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : int32 | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = retvalDeserializer.readInt32()
        }
        const returnResult : int32 | undefined = buffer
        return returnResult
    }
    private setFlags_serialize(flags: int32 | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (flags !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const flagsTmpValue  = flags!
            thisSerializer.writeInt32(flagsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_ATOMICSERVICEOPTIONSNativeModule._AtomicServiceOptions_setFlags(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getParameters_serialize(): Map<string, Object> | undefined {
        const retval  = OHOS_APP_ABILITY_ATOMICSERVICEOPTIONSNativeModule._AtomicServiceOptions_getParameters(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : Map<string, Object> | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            const buffer_SizeVar : int32 = retvalDeserializer.readInt32()
            let buffer_ : Map<string, Object> = new Map<string, Object>()
            // TODO: TS map resize
            for (let buffer_IVar = 0; buffer_IVar < buffer_SizeVar; buffer_IVar++) {
                const buffer_KeyVar : string = (retvalDeserializer.readString() as string)
                const buffer_ValueVar : Object = (retvalDeserializer.readObject() as object)
                buffer_.set(buffer_KeyVar, buffer_ValueVar)
            }
            buffer = buffer_
        }
        const returnResult : Map<string, Object> | undefined = buffer
        return returnResult
    }
    private setParameters_serialize(parameters: Map<string, Object> | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (parameters !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const parametersTmpValue  = parameters!
            thisSerializer.writeInt32((parametersTmpValue.size).toInt())
            for (const pair of parametersTmpValue) {
                const parametersTmpValueKeyVar = pair[0]
                const parametersTmpValueValueVar = pair[1]
                thisSerializer.writeString(parametersTmpValueKeyVar)
                thisSerializer.holdAndWriteObject(parametersTmpValueValueVar)
            }
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_ATOMICSERVICEOPTIONSNativeModule._AtomicServiceOptions_setParameters(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
}
