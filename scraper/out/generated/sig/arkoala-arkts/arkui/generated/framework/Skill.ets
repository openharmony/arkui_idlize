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

import { Skill, SkillUri } from "@bundleManager.Skill"
import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { int32, int64, float32, unsafeCast } from "@koalaui/common"
import { TypeChecker } from "#components"
import { CallbackTransformer } from "./../CallbackTransformer"
export class Skill_serializer {
    public static write(buffer: SerializerBase, value: Skill): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForActions  = value.actions
        valueSerializer.writeInt32((valueHolderForActions.length).toInt())
        for (let valueHolderForActionsCounterI = 0; valueHolderForActionsCounterI < valueHolderForActions.length; valueHolderForActionsCounterI++) {
            const valueHolderForActionsTmpElement : string = valueHolderForActions[valueHolderForActionsCounterI]
            valueSerializer.writeString(valueHolderForActionsTmpElement)
        }
        const valueHolderForEntities  = value.entities
        valueSerializer.writeInt32((valueHolderForEntities.length).toInt())
        for (let valueHolderForEntitiesCounterI = 0; valueHolderForEntitiesCounterI < valueHolderForEntities.length; valueHolderForEntitiesCounterI++) {
            const valueHolderForEntitiesTmpElement : string = valueHolderForEntities[valueHolderForEntitiesCounterI]
            valueSerializer.writeString(valueHolderForEntitiesTmpElement)
        }
        const valueHolderForUris  = value.uris
        valueSerializer.writeInt32((valueHolderForUris.length).toInt())
        for (let valueHolderForUrisCounterI = 0; valueHolderForUrisCounterI < valueHolderForUris.length; valueHolderForUrisCounterI++) {
            const valueHolderForUrisTmpElement : SkillUri = valueHolderForUris[valueHolderForUrisCounterI]
            SkillUri_serializer.write(valueSerializer, valueHolderForUrisTmpElement)
        }
        const valueHolderForDomainVerify  = value.domainVerify
        valueSerializer.writeBoolean(valueHolderForDomainVerify)
    }
    public static read(buffer: DeserializerBase): Skill {
        let valueDeserializer : DeserializerBase = buffer
        const actionsTmpBufLength : int32 = valueDeserializer.readInt32()
        let actionsTmpBuf : Array<string> = new Array<string>(actionsTmpBufLength)
        for (let actionsTmpBufBufCounterI = 0; actionsTmpBufBufCounterI < actionsTmpBufLength; actionsTmpBufBufCounterI++) {
            actionsTmpBuf[actionsTmpBufBufCounterI] = (valueDeserializer.readString() as string)
        }
        const actionsTmpResult : Array<string> = actionsTmpBuf
        const entitiesTmpBufLength : int32 = valueDeserializer.readInt32()
        let entitiesTmpBuf : Array<string> = new Array<string>(entitiesTmpBufLength)
        for (let entitiesTmpBufBufCounterI = 0; entitiesTmpBufBufCounterI < entitiesTmpBufLength; entitiesTmpBufBufCounterI++) {
            entitiesTmpBuf[entitiesTmpBufBufCounterI] = (valueDeserializer.readString() as string)
        }
        const entitiesTmpResult : Array<string> = entitiesTmpBuf
        const urisTmpBufLength : int32 = valueDeserializer.readInt32()
        let urisTmpBuf : Array<SkillUri> = new Array<SkillUri>(urisTmpBufLength)
        for (let urisTmpBufBufCounterI = 0; urisTmpBufBufCounterI < urisTmpBufLength; urisTmpBufBufCounterI++) {
            urisTmpBuf[urisTmpBufBufCounterI] = SkillUri_serializer.read(valueDeserializer)
        }
        const urisTmpResult : Array<SkillUri> = urisTmpBuf
        const domainVerifyTmpResult : boolean = valueDeserializer.readBoolean()
        let value : Skill = ({actions: actionsTmpResult, entities: entitiesTmpResult, uris: urisTmpResult, domainVerify: domainVerifyTmpResult} as Skill)
        return value
    }
}
export class SkillUri_serializer {
    public static write(buffer: SerializerBase, value: SkillUri): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForScheme  = value.scheme
        valueSerializer.writeString(valueHolderForScheme)
        const valueHolderForHost  = value.host
        valueSerializer.writeString(valueHolderForHost)
        const valueHolderForPort  = value.port
        valueSerializer.writeInt32(valueHolderForPort)
        const valueHolderForPath  = value.path
        valueSerializer.writeString(valueHolderForPath)
        const valueHolderForPathStartWith  = value.pathStartWith
        valueSerializer.writeString(valueHolderForPathStartWith)
        const valueHolderForPathRegex  = value.pathRegex
        valueSerializer.writeString(valueHolderForPathRegex)
        const valueHolderForType  = value.type
        valueSerializer.writeString(valueHolderForType)
        const valueHolderForUtd  = value.utd
        valueSerializer.writeString(valueHolderForUtd)
        const valueHolderForMaxFileSupported  = value.maxFileSupported
        valueSerializer.writeInt32(valueHolderForMaxFileSupported)
        const valueHolderForLinkFeature  = value.linkFeature
        valueSerializer.writeString(valueHolderForLinkFeature)
    }
    public static read(buffer: DeserializerBase): SkillUri {
        let valueDeserializer : DeserializerBase = buffer
        const schemeTmpResult : string = (valueDeserializer.readString() as string)
        const hostTmpResult : string = (valueDeserializer.readString() as string)
        const portTmpResult : int32 = valueDeserializer.readInt32()
        const pathTmpResult : string = (valueDeserializer.readString() as string)
        const pathStartWithTmpResult : string = (valueDeserializer.readString() as string)
        const pathRegexTmpResult : string = (valueDeserializer.readString() as string)
        const typeTmpResult : string = (valueDeserializer.readString() as string)
        const utdTmpResult : string = (valueDeserializer.readString() as string)
        const maxFileSupportedTmpResult : int32 = valueDeserializer.readInt32()
        const linkFeatureTmpResult : string = (valueDeserializer.readString() as string)
        let value : SkillUri = ({scheme: schemeTmpResult, host: hostTmpResult, port: portTmpResult, path: pathTmpResult, pathStartWith: pathStartWithTmpResult, pathRegex: pathRegexTmpResult, type: typeTmpResult, utd: utdTmpResult, maxFileSupported: maxFileSupportedTmpResult, linkFeature: linkFeatureTmpResult} as SkillUri)
        return value
    }
}
