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

import { ApplicationInfo_serializer } from "./ApplicationInfo"
import { Metadata_serializer } from "./Metadata"
import { Skill_serializer } from "./Skill"
import { ExtensionAbilityInfo } from "@bundleManager.ExtensionAbilityInfo"
import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { int32, int64, float32, unsafeCast } from "@koalaui/common"
import { TypeChecker } from "#components"
import { CallbackTransformer } from "./../CallbackTransformer"
import { default as bundleManager } from "@ohos.bundle.bundleManager"
import { ApplicationInfo } from "@bundleManager.ApplicationInfo"
import { Metadata } from "@bundleManager.Metadata"
import { Skill } from "@bundleManager.Skill"
export class ExtensionAbilityInfo_serializer {
    public static write(buffer: SerializerBase, value: ExtensionAbilityInfo): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForBundleName  = value.bundleName
        valueSerializer.writeString(valueHolderForBundleName)
        const valueHolderForModuleName  = value.moduleName
        valueSerializer.writeString(valueHolderForModuleName)
        const valueHolderForName  = value.name
        valueSerializer.writeString(valueHolderForName)
        const valueHolderForLabelId  = value.labelId
        valueSerializer.writeInt64(valueHolderForLabelId)
        const valueHolderForDescriptionId  = value.descriptionId
        valueSerializer.writeInt64(valueHolderForDescriptionId)
        const valueHolderForIconId  = value.iconId
        valueSerializer.writeInt64(valueHolderForIconId)
        const valueHolderForExported  = value.exported
        valueSerializer.writeBoolean(valueHolderForExported)
        const valueHolderForExtensionAbilityType  = value.extensionAbilityType
        valueSerializer.writeInt32(valueHolderForExtensionAbilityType.valueOf())
        const valueHolderForExtensionAbilityTypeName  = value.extensionAbilityTypeName
        valueSerializer.writeString(valueHolderForExtensionAbilityTypeName)
        const valueHolderForPermissions  = value.permissions
        valueSerializer.writeInt32((valueHolderForPermissions.length).toInt())
        for (let valueHolderForPermissionsCounterI = 0; valueHolderForPermissionsCounterI < valueHolderForPermissions.length; valueHolderForPermissionsCounterI++) {
            const valueHolderForPermissionsTmpElement : string = valueHolderForPermissions[valueHolderForPermissionsCounterI]
            valueSerializer.writeString(valueHolderForPermissionsTmpElement)
        }
        const valueHolderForApplicationInfo  = value.applicationInfo
        if (valueHolderForApplicationInfo !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForApplicationInfoTmpValue  = valueHolderForApplicationInfo!
            ApplicationInfo_serializer.write(valueSerializer, valueHolderForApplicationInfoTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForMetadata  = value.metadata
        valueSerializer.writeInt32((valueHolderForMetadata.length).toInt())
        for (let valueHolderForMetadataCounterI = 0; valueHolderForMetadataCounterI < valueHolderForMetadata.length; valueHolderForMetadataCounterI++) {
            const valueHolderForMetadataTmpElement : Metadata = valueHolderForMetadata[valueHolderForMetadataCounterI]
            Metadata_serializer.write(valueSerializer, valueHolderForMetadataTmpElement)
        }
        const valueHolderForEnabled  = value.enabled
        valueSerializer.writeBoolean(valueHolderForEnabled)
        const valueHolderForReadPermission  = value.readPermission
        valueSerializer.writeString(valueHolderForReadPermission)
        const valueHolderForWritePermission  = value.writePermission
        valueSerializer.writeString(valueHolderForWritePermission)
        const valueHolderForSkills  = value.skills
        valueSerializer.writeInt32((valueHolderForSkills.length).toInt())
        for (let valueHolderForSkillsCounterI = 0; valueHolderForSkillsCounterI < valueHolderForSkills.length; valueHolderForSkillsCounterI++) {
            const valueHolderForSkillsTmpElement : Skill = valueHolderForSkills[valueHolderForSkillsCounterI]
            Skill_serializer.write(valueSerializer, valueHolderForSkillsTmpElement)
        }
        const valueHolderForAppIndex  = value.appIndex
        valueSerializer.writeInt32(valueHolderForAppIndex)
    }
    public static read(buffer: DeserializerBase): ExtensionAbilityInfo {
        let valueDeserializer : DeserializerBase = buffer
        const bundleNameTmpResult : string = (valueDeserializer.readString() as string)
        const moduleNameTmpResult : string = (valueDeserializer.readString() as string)
        const nameTmpResult : string = (valueDeserializer.readString() as string)
        const labelIdTmpResult : int64 = valueDeserializer.readInt64()
        const descriptionIdTmpResult : int64 = valueDeserializer.readInt64()
        const iconIdTmpResult : int64 = valueDeserializer.readInt64()
        const exportedTmpResult : boolean = valueDeserializer.readBoolean()
        const extensionAbilityTypeTmpResult : bundleManager.ExtensionAbilityType = bundleManager.ExtensionAbilityType.fromValue(valueDeserializer.readInt32())
        const extensionAbilityTypeNameTmpResult : string = (valueDeserializer.readString() as string)
        const permissionsTmpBufLength : int32 = valueDeserializer.readInt32()
        let permissionsTmpBuf : Array<string> = new Array<string>(permissionsTmpBufLength)
        for (let permissionsTmpBufBufCounterI = 0; permissionsTmpBufBufCounterI < permissionsTmpBufLength; permissionsTmpBufBufCounterI++) {
            permissionsTmpBuf[permissionsTmpBufBufCounterI] = (valueDeserializer.readString() as string)
        }
        const permissionsTmpResult : Array<string> = permissionsTmpBuf
        const applicationInfoTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let applicationInfoTmpBuf : ApplicationInfo | undefined
        if ((applicationInfoTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            applicationInfoTmpBuf = ApplicationInfo_serializer.read(valueDeserializer)
        }
        const applicationInfoTmpResult : ApplicationInfo | undefined = applicationInfoTmpBuf
        const metadataTmpBufLength : int32 = valueDeserializer.readInt32()
        let metadataTmpBuf : Array<Metadata> = new Array<Metadata>(metadataTmpBufLength)
        for (let metadataTmpBufBufCounterI = 0; metadataTmpBufBufCounterI < metadataTmpBufLength; metadataTmpBufBufCounterI++) {
            metadataTmpBuf[metadataTmpBufBufCounterI] = Metadata_serializer.read(valueDeserializer)
        }
        const metadataTmpResult : Array<Metadata> = metadataTmpBuf
        const enabledTmpResult : boolean = valueDeserializer.readBoolean()
        const readPermissionTmpResult : string = (valueDeserializer.readString() as string)
        const writePermissionTmpResult : string = (valueDeserializer.readString() as string)
        const skillsTmpBufLength : int32 = valueDeserializer.readInt32()
        let skillsTmpBuf : Array<Skill> = new Array<Skill>(skillsTmpBufLength)
        for (let skillsTmpBufBufCounterI = 0; skillsTmpBufBufCounterI < skillsTmpBufLength; skillsTmpBufBufCounterI++) {
            skillsTmpBuf[skillsTmpBufBufCounterI] = Skill_serializer.read(valueDeserializer)
        }
        const skillsTmpResult : Array<Skill> = skillsTmpBuf
        const appIndexTmpResult : int32 = valueDeserializer.readInt32()
        let value : ExtensionAbilityInfo = ({bundleName: bundleNameTmpResult, moduleName: moduleNameTmpResult, name: nameTmpResult, labelId: labelIdTmpResult, descriptionId: descriptionIdTmpResult, iconId: iconIdTmpResult, exported: exportedTmpResult, extensionAbilityType: extensionAbilityTypeTmpResult, extensionAbilityTypeName: extensionAbilityTypeNameTmpResult, permissions: permissionsTmpResult, applicationInfo: applicationInfoTmpResult, metadata: metadataTmpResult, enabled: enabledTmpResult, readPermission: readPermissionTmpResult, writePermission: writePermissionTmpResult, skills: skillsTmpResult, appIndex: appIndexTmpResult} as ExtensionAbilityInfo)
        return value
    }
}
