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
import { TypeChecker, OHOS_APP_ABILITY_WANTNativeModule } from "./ohos.app.ability.Want.INTERNAL"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export class WantInternal {
    public static fromPtr(ptr: KPointer): Want {
        return new Want(ptr)
    }
}
export class Want implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    get bundleName(): string | undefined {
        return this.getBundleName()
    }
    set bundleName(bundleName: string | undefined) {
        const bundleName_NonNull  = (bundleName as string | undefined)
        this.setBundleName(bundleName_NonNull)
    }
    get abilityName(): string | undefined {
        return this.getAbilityName()
    }
    set abilityName(abilityName: string | undefined) {
        const abilityName_NonNull  = (abilityName as string | undefined)
        this.setAbilityName(abilityName_NonNull)
    }
    get deviceId(): string | undefined {
        return this.getDeviceId()
    }
    set deviceId(deviceId: string | undefined) {
        const deviceId_NonNull  = (deviceId as string | undefined)
        this.setDeviceId(deviceId_NonNull)
    }
    get uri(): string | undefined {
        return this.getUri()
    }
    set uri(uri: string | undefined) {
        const uri_NonNull  = (uri as string | undefined)
        this.setUri(uri_NonNull)
    }
    get type(): string | undefined {
        return this.getType()
    }
    set type(type: string | undefined) {
        const type_NonNull  = (type as string | undefined)
        this.setType(type_NonNull)
    }
    get flags(): int32 | undefined {
        return this.getFlags()
    }
    set flags(flags: int32 | undefined) {
        const flags_NonNull  = (flags as int32 | undefined)
        this.setFlags(flags_NonNull)
    }
    get action(): string | undefined {
        return this.getAction()
    }
    set action(action: string | undefined) {
        const action_NonNull  = (action as string | undefined)
        this.setAction(action_NonNull)
    }
    get parameters(): Map<string, Object> | undefined {
        return this.getParameters()
    }
    set parameters(parameters: Map<string, Object> | undefined) {
        const parameters_NonNull  = (parameters as Map<string, Object> | undefined)
        this.setParameters(parameters_NonNull)
    }
    get entities(): Array<string> | undefined {
        return this.getEntities()
    }
    set entities(entities: Array<string> | undefined) {
        const entities_NonNull  = (entities as Array<string> | undefined)
        this.setEntities(entities_NonNull)
    }
    get moduleName(): string | undefined {
        return this.getModuleName()
    }
    set moduleName(moduleName: string | undefined) {
        const moduleName_NonNull  = (moduleName as string | undefined)
        this.setModuleName(moduleName_NonNull)
    }
    readonly fds?: Map<string, int32> | undefined
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, Want.getFinalizer())
        this.fds = this.getFds()
    }
    constructor() {
        this(Want.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_APP_ABILITY_WANTNativeModule._Want_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_APP_ABILITY_WANTNativeModule._Want_getFinalizer()
    }
    private getBundleName(): string | undefined {
        return this.getBundleName_serialize()
    }
    private setBundleName(bundleName: string | undefined): void {
        const bundleName_casted = bundleName as (string | undefined)
        this.setBundleName_serialize(bundleName_casted)
        return
    }
    private getAbilityName(): string | undefined {
        return this.getAbilityName_serialize()
    }
    private setAbilityName(abilityName: string | undefined): void {
        const abilityName_casted = abilityName as (string | undefined)
        this.setAbilityName_serialize(abilityName_casted)
        return
    }
    private getDeviceId(): string | undefined {
        return this.getDeviceId_serialize()
    }
    private setDeviceId(deviceId: string | undefined): void {
        const deviceId_casted = deviceId as (string | undefined)
        this.setDeviceId_serialize(deviceId_casted)
        return
    }
    private getUri(): string | undefined {
        return this.getUri_serialize()
    }
    private setUri(uri: string | undefined): void {
        const uri_casted = uri as (string | undefined)
        this.setUri_serialize(uri_casted)
        return
    }
    private getType(): string | undefined {
        return this.getType_serialize()
    }
    private setType(type: string | undefined): void {
        const type_casted = type as (string | undefined)
        this.setType_serialize(type_casted)
        return
    }
    private getFlags(): int32 | undefined {
        return this.getFlags_serialize()
    }
    private setFlags(flags: int32 | undefined): void {
        const flags_casted = flags as (int32 | undefined)
        this.setFlags_serialize(flags_casted)
        return
    }
    private getAction(): string | undefined {
        return this.getAction_serialize()
    }
    private setAction(action: string | undefined): void {
        const action_casted = action as (string | undefined)
        this.setAction_serialize(action_casted)
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
    private getEntities(): Array<string> | undefined {
        return this.getEntities_serialize()
    }
    private setEntities(entities: Array<string> | undefined): void {
        const entities_casted = entities as (Array<string> | undefined)
        this.setEntities_serialize(entities_casted)
        return
    }
    private getModuleName(): string | undefined {
        return this.getModuleName_serialize()
    }
    private setModuleName(moduleName: string | undefined): void {
        const moduleName_casted = moduleName as (string | undefined)
        this.setModuleName_serialize(moduleName_casted)
        return
    }
    private getFds(): Map<string, int32> | undefined {
        return this.getFds_serialize()
    }
    private getBundleName_serialize(): string | undefined {
        const retval  = OHOS_APP_ABILITY_WANTNativeModule._Want_getBundleName(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : string | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readString() as string)
        }
        const returnResult : string | undefined = buffer
        return returnResult
    }
    private setBundleName_serialize(bundleName: string | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (bundleName !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const bundleNameTmpValue  = bundleName!
            thisSerializer.writeString(bundleNameTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_WANTNativeModule._Want_setBundleName(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getAbilityName_serialize(): string | undefined {
        const retval  = OHOS_APP_ABILITY_WANTNativeModule._Want_getAbilityName(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : string | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readString() as string)
        }
        const returnResult : string | undefined = buffer
        return returnResult
    }
    private setAbilityName_serialize(abilityName: string | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (abilityName !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const abilityNameTmpValue  = abilityName!
            thisSerializer.writeString(abilityNameTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_WANTNativeModule._Want_setAbilityName(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getDeviceId_serialize(): string | undefined {
        const retval  = OHOS_APP_ABILITY_WANTNativeModule._Want_getDeviceId(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : string | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readString() as string)
        }
        const returnResult : string | undefined = buffer
        return returnResult
    }
    private setDeviceId_serialize(deviceId: string | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (deviceId !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const deviceIdTmpValue  = deviceId!
            thisSerializer.writeString(deviceIdTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_WANTNativeModule._Want_setDeviceId(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getUri_serialize(): string | undefined {
        const retval  = OHOS_APP_ABILITY_WANTNativeModule._Want_getUri(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : string | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readString() as string)
        }
        const returnResult : string | undefined = buffer
        return returnResult
    }
    private setUri_serialize(uri: string | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (uri !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const uriTmpValue  = uri!
            thisSerializer.writeString(uriTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_WANTNativeModule._Want_setUri(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getType_serialize(): string | undefined {
        const retval  = OHOS_APP_ABILITY_WANTNativeModule._Want_getType(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : string | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readString() as string)
        }
        const returnResult : string | undefined = buffer
        return returnResult
    }
    private setType_serialize(type: string | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (type !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const typeTmpValue  = type!
            thisSerializer.writeString(typeTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_WANTNativeModule._Want_setType(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getFlags_serialize(): int32 | undefined {
        const retval  = OHOS_APP_ABILITY_WANTNativeModule._Want_getFlags(this.peer!.ptr)
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
        OHOS_APP_ABILITY_WANTNativeModule._Want_setFlags(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getAction_serialize(): string | undefined {
        const retval  = OHOS_APP_ABILITY_WANTNativeModule._Want_getAction(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : string | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readString() as string)
        }
        const returnResult : string | undefined = buffer
        return returnResult
    }
    private setAction_serialize(action: string | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (action !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const actionTmpValue  = action!
            thisSerializer.writeString(actionTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_WANTNativeModule._Want_setAction(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getParameters_serialize(): Map<string, Object> | undefined {
        const retval  = OHOS_APP_ABILITY_WANTNativeModule._Want_getParameters(this.peer!.ptr)
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
        OHOS_APP_ABILITY_WANTNativeModule._Want_setParameters(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getEntities_serialize(): Array<string> | undefined {
        const retval  = OHOS_APP_ABILITY_WANTNativeModule._Want_getEntities(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : Array<string> | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            const buffer_Length : int32 = retvalDeserializer.readInt32()
            let buffer_ : Array<string> = new Array<string>(buffer_Length)
            for (let buffer_BufCounterI = 0; buffer_BufCounterI < buffer_Length; buffer_BufCounterI++) {
                buffer_[buffer_BufCounterI] = (retvalDeserializer.readString() as string)
            }
            buffer = buffer_
        }
        const returnResult : Array<string> | undefined = buffer
        return returnResult
    }
    private setEntities_serialize(entities: Array<string> | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (entities !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const entitiesTmpValue  = entities!
            thisSerializer.writeInt32((entitiesTmpValue.length).toInt())
            for (let entitiesTmpValueCounterI = 0; entitiesTmpValueCounterI < entitiesTmpValue.length; entitiesTmpValueCounterI++) {
                const entitiesTmpValueTmpElement : string = entitiesTmpValue[entitiesTmpValueCounterI]
                thisSerializer.writeString(entitiesTmpValueTmpElement)
            }
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_WANTNativeModule._Want_setEntities(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getModuleName_serialize(): string | undefined {
        const retval  = OHOS_APP_ABILITY_WANTNativeModule._Want_getModuleName(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : string | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readString() as string)
        }
        const returnResult : string | undefined = buffer
        return returnResult
    }
    private setModuleName_serialize(moduleName: string | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (moduleName !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const moduleNameTmpValue  = moduleName!
            thisSerializer.writeString(moduleNameTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_WANTNativeModule._Want_setModuleName(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getFds_serialize(): Map<string, int32> | undefined {
        const retval  = OHOS_APP_ABILITY_WANTNativeModule._Want_getFds(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : Map<string, int32> | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            const buffer_SizeVar : int32 = retvalDeserializer.readInt32()
            let buffer_ : Map<string, int32> = new Map<string, int32>()
            // TODO: TS map resize
            for (let buffer_IVar = 0; buffer_IVar < buffer_SizeVar; buffer_IVar++) {
                const buffer_KeyVar : string = (retvalDeserializer.readString() as string)
                const buffer_ValueVar : int32 = retvalDeserializer.readInt32()
                buffer_.set(buffer_KeyVar, buffer_ValueVar)
            }
            buffer = buffer_
        }
        const returnResult : Map<string, int32> | undefined = buffer
        return returnResult
    }
}
