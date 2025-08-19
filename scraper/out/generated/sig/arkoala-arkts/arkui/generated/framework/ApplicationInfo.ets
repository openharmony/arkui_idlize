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

import { MultiAppMode, ModuleMetadata, ApplicationInfo } from "@bundleManager.ApplicationInfo"
import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { int32, int64, float32, unsafeCast } from "@koalaui/common"
import { TypeChecker } from "#components"
import { CallbackTransformer } from "./../CallbackTransformer"
import { default as bundleManager } from "@ohos.bundle.bundleManager"
import { Metadata_serializer } from "./Metadata"
import { Metadata } from "@bundleManager.Metadata"
import { Resource_serializer } from "./resource"
import { Resource } from "@global.resource"
export class MultiAppMode_serializer {
    public static write(buffer: SerializerBase, value: MultiAppMode): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForMultiAppModeType  = value.multiAppModeType
        valueSerializer.writeInt32(valueHolderForMultiAppModeType.valueOf())
        const valueHolderForMaxCount  = value.maxCount
        valueSerializer.writeInt32(valueHolderForMaxCount)
    }
    public static read(buffer: DeserializerBase): MultiAppMode {
        let valueDeserializer : DeserializerBase = buffer
        const multiAppModeTypeTmpResult : bundleManager.MultiAppModeType = bundleManager.MultiAppModeType.fromValue(valueDeserializer.readInt32())
        const maxCountTmpResult : int32 = valueDeserializer.readInt32()
        let value : MultiAppMode = ({multiAppModeType: multiAppModeTypeTmpResult, maxCount: maxCountTmpResult} as MultiAppMode)
        return value
    }
}
export class ModuleMetadata_serializer {
    public static write(buffer: SerializerBase, value: ModuleMetadata): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForModuleName  = value.moduleName
        valueSerializer.writeString(valueHolderForModuleName)
        const valueHolderForMetadata  = value.metadata
        valueSerializer.writeInt32((valueHolderForMetadata.length).toInt())
        for (let valueHolderForMetadataCounterI = 0; valueHolderForMetadataCounterI < valueHolderForMetadata.length; valueHolderForMetadataCounterI++) {
            const valueHolderForMetadataTmpElement : Metadata = valueHolderForMetadata[valueHolderForMetadataCounterI]
            Metadata_serializer.write(valueSerializer, valueHolderForMetadataTmpElement)
        }
    }
    public static read(buffer: DeserializerBase): ModuleMetadata {
        let valueDeserializer : DeserializerBase = buffer
        const moduleNameTmpResult : string = (valueDeserializer.readString() as string)
        const metadataTmpBufLength : int32 = valueDeserializer.readInt32()
        let metadataTmpBuf : Array<Metadata> = new Array<Metadata>(metadataTmpBufLength)
        for (let metadataTmpBufBufCounterI = 0; metadataTmpBufBufCounterI < metadataTmpBufLength; metadataTmpBufBufCounterI++) {
            metadataTmpBuf[metadataTmpBufBufCounterI] = Metadata_serializer.read(valueDeserializer)
        }
        const metadataTmpResult : Array<Metadata> = metadataTmpBuf
        let value : ModuleMetadata = ({moduleName: moduleNameTmpResult, metadata: metadataTmpResult} as ModuleMetadata)
        return value
    }
}
export class ApplicationInfo_serializer {
    public static write(buffer: SerializerBase, value: ApplicationInfo): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForName  = value.name
        valueSerializer.writeString(valueHolderForName)
        const valueHolderForDescription  = value.description
        valueSerializer.writeString(valueHolderForDescription)
        const valueHolderForDescriptionId  = value.descriptionId
        valueSerializer.writeInt64(valueHolderForDescriptionId)
        const valueHolderForEnabled  = value.enabled
        valueSerializer.writeBoolean(valueHolderForEnabled)
        const valueHolderForLabel  = value.label
        valueSerializer.writeString(valueHolderForLabel)
        const valueHolderForLabelId  = value.labelId
        valueSerializer.writeInt64(valueHolderForLabelId)
        const valueHolderForIcon  = value.icon
        valueSerializer.writeString(valueHolderForIcon)
        const valueHolderForIconId  = value.iconId
        valueSerializer.writeInt64(valueHolderForIconId)
        const valueHolderForProcess  = value.process
        valueSerializer.writeString(valueHolderForProcess)
        const valueHolderForPermissions  = value.permissions
        valueSerializer.writeInt32((valueHolderForPermissions.length).toInt())
        for (let valueHolderForPermissionsCounterI = 0; valueHolderForPermissionsCounterI < valueHolderForPermissions.length; valueHolderForPermissionsCounterI++) {
            const valueHolderForPermissionsTmpElement : string = valueHolderForPermissions[valueHolderForPermissionsCounterI]
            valueSerializer.writeString(valueHolderForPermissionsTmpElement)
        }
        const valueHolderForCodePath  = value.codePath
        valueSerializer.writeString(valueHolderForCodePath)
        const valueHolderForMetadataArray  = value.metadataArray
        valueSerializer.writeInt32((valueHolderForMetadataArray.length).toInt())
        for (let valueHolderForMetadataArrayCounterI = 0; valueHolderForMetadataArrayCounterI < valueHolderForMetadataArray.length; valueHolderForMetadataArrayCounterI++) {
            const valueHolderForMetadataArrayTmpElement : ModuleMetadata = valueHolderForMetadataArray[valueHolderForMetadataArrayCounterI]
            ModuleMetadata_serializer.write(valueSerializer, valueHolderForMetadataArrayTmpElement)
        }
        const valueHolderForRemovable  = value.removable
        valueSerializer.writeBoolean(valueHolderForRemovable)
        const valueHolderForAccessTokenId  = value.accessTokenId
        valueSerializer.writeInt64(valueHolderForAccessTokenId)
        const valueHolderForUid  = value.uid
        valueSerializer.writeInt32(valueHolderForUid)
        const valueHolderForIconResource  = value.iconResource
        Resource_serializer.write(valueSerializer, valueHolderForIconResource)
        const valueHolderForLabelResource  = value.labelResource
        Resource_serializer.write(valueSerializer, valueHolderForLabelResource)
        const valueHolderForDescriptionResource  = value.descriptionResource
        Resource_serializer.write(valueSerializer, valueHolderForDescriptionResource)
        const valueHolderForAppDistributionType  = value.appDistributionType
        valueSerializer.writeString(valueHolderForAppDistributionType)
        const valueHolderForAppProvisionType  = value.appProvisionType
        valueSerializer.writeString(valueHolderForAppProvisionType)
        const valueHolderForSystemApp  = value.systemApp
        valueSerializer.writeBoolean(valueHolderForSystemApp)
        const valueHolderForBundleType  = value.bundleType
        valueSerializer.writeInt32(valueHolderForBundleType.valueOf())
        const valueHolderForDebug  = value.debug
        valueSerializer.writeBoolean(valueHolderForDebug)
        const valueHolderForDataUnclearable  = value.dataUnclearable
        valueSerializer.writeBoolean(valueHolderForDataUnclearable)
        const valueHolderForNativeLibraryPath  = value.nativeLibraryPath
        valueSerializer.writeString(valueHolderForNativeLibraryPath)
        const valueHolderForMultiAppMode  = value.multiAppMode
        MultiAppMode_serializer.write(valueSerializer, valueHolderForMultiAppMode)
        const valueHolderForAppIndex  = value.appIndex
        valueSerializer.writeInt32(valueHolderForAppIndex)
        const valueHolderForInstallSource  = value.installSource
        valueSerializer.writeString(valueHolderForInstallSource)
        const valueHolderForReleaseType  = value.releaseType
        valueSerializer.writeString(valueHolderForReleaseType)
        const valueHolderForCloudFileSyncEnabled  = value.cloudFileSyncEnabled
        valueSerializer.writeBoolean(valueHolderForCloudFileSyncEnabled)
        const valueHolderForFlags  = value.flags
        if (valueHolderForFlags !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForFlagsTmpValue  = valueHolderForFlags!
            valueSerializer.writeInt32(valueHolderForFlagsTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
    }
    public static read(buffer: DeserializerBase): ApplicationInfo {
        let valueDeserializer : DeserializerBase = buffer
        const nameTmpResult : string = (valueDeserializer.readString() as string)
        const descriptionTmpResult : string = (valueDeserializer.readString() as string)
        const descriptionIdTmpResult : int64 = valueDeserializer.readInt64()
        const enabledTmpResult : boolean = valueDeserializer.readBoolean()
        const labelTmpResult : string = (valueDeserializer.readString() as string)
        const labelIdTmpResult : int64 = valueDeserializer.readInt64()
        const iconTmpResult : string = (valueDeserializer.readString() as string)
        const iconIdTmpResult : int64 = valueDeserializer.readInt64()
        const processTmpResult : string = (valueDeserializer.readString() as string)
        const permissionsTmpBufLength : int32 = valueDeserializer.readInt32()
        let permissionsTmpBuf : Array<string> = new Array<string>(permissionsTmpBufLength)
        for (let permissionsTmpBufBufCounterI = 0; permissionsTmpBufBufCounterI < permissionsTmpBufLength; permissionsTmpBufBufCounterI++) {
            permissionsTmpBuf[permissionsTmpBufBufCounterI] = (valueDeserializer.readString() as string)
        }
        const permissionsTmpResult : Array<string> = permissionsTmpBuf
        const codePathTmpResult : string = (valueDeserializer.readString() as string)
        const metadataArrayTmpBufLength : int32 = valueDeserializer.readInt32()
        let metadataArrayTmpBuf : Array<ModuleMetadata> = new Array<ModuleMetadata>(metadataArrayTmpBufLength)
        for (let metadataArrayTmpBufBufCounterI = 0; metadataArrayTmpBufBufCounterI < metadataArrayTmpBufLength; metadataArrayTmpBufBufCounterI++) {
            metadataArrayTmpBuf[metadataArrayTmpBufBufCounterI] = ModuleMetadata_serializer.read(valueDeserializer)
        }
        const metadataArrayTmpResult : Array<ModuleMetadata> = metadataArrayTmpBuf
        const removableTmpResult : boolean = valueDeserializer.readBoolean()
        const accessTokenIdTmpResult : int64 = valueDeserializer.readInt64()
        const uidTmpResult : int32 = valueDeserializer.readInt32()
        const iconResourceTmpResult : Resource = Resource_serializer.read(valueDeserializer)
        const labelResourceTmpResult : Resource = Resource_serializer.read(valueDeserializer)
        const descriptionResourceTmpResult : Resource = Resource_serializer.read(valueDeserializer)
        const appDistributionTypeTmpResult : string = (valueDeserializer.readString() as string)
        const appProvisionTypeTmpResult : string = (valueDeserializer.readString() as string)
        const systemAppTmpResult : boolean = valueDeserializer.readBoolean()
        const bundleTypeTmpResult : bundleManager.BundleType = bundleManager.BundleType.fromValue(valueDeserializer.readInt32())
        const debugTmpResult : boolean = valueDeserializer.readBoolean()
        const dataUnclearableTmpResult : boolean = valueDeserializer.readBoolean()
        const nativeLibraryPathTmpResult : string = (valueDeserializer.readString() as string)
        const multiAppModeTmpResult : MultiAppMode = MultiAppMode_serializer.read(valueDeserializer)
        const appIndexTmpResult : int32 = valueDeserializer.readInt32()
        const installSourceTmpResult : string = (valueDeserializer.readString() as string)
        const releaseTypeTmpResult : string = (valueDeserializer.readString() as string)
        const cloudFileSyncEnabledTmpResult : boolean = valueDeserializer.readBoolean()
        const flagsTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let flagsTmpBuf : int32 | undefined
        if ((flagsTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            flagsTmpBuf = valueDeserializer.readInt32()
        }
        const flagsTmpResult : int32 | undefined = flagsTmpBuf
        let value : ApplicationInfo = ({name: nameTmpResult, description: descriptionTmpResult, descriptionId: descriptionIdTmpResult, enabled: enabledTmpResult, label: labelTmpResult, labelId: labelIdTmpResult, icon: iconTmpResult, iconId: iconIdTmpResult, process: processTmpResult, permissions: permissionsTmpResult, codePath: codePathTmpResult, metadataArray: metadataArrayTmpResult, removable: removableTmpResult, accessTokenId: accessTokenIdTmpResult, uid: uidTmpResult, iconResource: iconResourceTmpResult, labelResource: labelResourceTmpResult, descriptionResource: descriptionResourceTmpResult, appDistributionType: appDistributionTypeTmpResult, appProvisionType: appProvisionTypeTmpResult, systemApp: systemAppTmpResult, bundleType: bundleTypeTmpResult, debug: debugTmpResult, dataUnclearable: dataUnclearableTmpResult, nativeLibraryPath: nativeLibraryPathTmpResult, multiAppMode: multiAppModeTmpResult, appIndex: appIndexTmpResult, installSource: installSourceTmpResult, releaseType: releaseTypeTmpResult, cloudFileSyncEnabled: cloudFileSyncEnabledTmpResult, flags: flagsTmpResult} as ApplicationInfo)
        return value
    }
}
