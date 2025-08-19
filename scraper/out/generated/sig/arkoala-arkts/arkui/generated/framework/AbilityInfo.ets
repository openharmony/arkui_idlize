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

import { WindowSize, AbilityInfo } from "@bundleManager.AbilityInfo"
import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { int32, int64, float32, unsafeCast } from "@koalaui/common"
import { TypeChecker } from "#components"
import { CallbackTransformer } from "./../CallbackTransformer"
import { ApplicationInfo_serializer } from "./ApplicationInfo"
import { Metadata_serializer } from "./Metadata"
import { Skill_serializer } from "./Skill"
import { default as bundleManager } from "@ohos.bundle.bundleManager"
import { ApplicationInfo } from "@bundleManager.ApplicationInfo"
import { Metadata } from "@bundleManager.Metadata"
import { Skill } from "@bundleManager.Skill"
export class WindowSize_serializer {
    public static write(buffer: SerializerBase, value: WindowSize): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForMaxWindowRatio  = value.maxWindowRatio
        valueSerializer.writeFloat64(valueHolderForMaxWindowRatio)
        const valueHolderForMinWindowRatio  = value.minWindowRatio
        valueSerializer.writeFloat64(valueHolderForMinWindowRatio)
        const valueHolderForMaxWindowWidth  = value.maxWindowWidth
        valueSerializer.writeInt64(valueHolderForMaxWindowWidth)
        const valueHolderForMinWindowWidth  = value.minWindowWidth
        valueSerializer.writeInt64(valueHolderForMinWindowWidth)
        const valueHolderForMaxWindowHeight  = value.maxWindowHeight
        valueSerializer.writeInt64(valueHolderForMaxWindowHeight)
        const valueHolderForMinWindowHeight  = value.minWindowHeight
        valueSerializer.writeInt64(valueHolderForMinWindowHeight)
    }
    public static read(buffer: DeserializerBase): WindowSize {
        let valueDeserializer : DeserializerBase = buffer
        const maxWindowRatioTmpResult : double = valueDeserializer.readFloat64()
        const minWindowRatioTmpResult : double = valueDeserializer.readFloat64()
        const maxWindowWidthTmpResult : int64 = valueDeserializer.readInt64()
        const minWindowWidthTmpResult : int64 = valueDeserializer.readInt64()
        const maxWindowHeightTmpResult : int64 = valueDeserializer.readInt64()
        const minWindowHeightTmpResult : int64 = valueDeserializer.readInt64()
        let value : WindowSize = ({maxWindowRatio: maxWindowRatioTmpResult, minWindowRatio: minWindowRatioTmpResult, maxWindowWidth: maxWindowWidthTmpResult, minWindowWidth: minWindowWidthTmpResult, maxWindowHeight: maxWindowHeightTmpResult, minWindowHeight: minWindowHeightTmpResult} as WindowSize)
        return value
    }
}
export class AbilityInfo_serializer {
    public static write(buffer: SerializerBase, value: AbilityInfo): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForBundleName  = value.bundleName
        valueSerializer.writeString(valueHolderForBundleName)
        const valueHolderForModuleName  = value.moduleName
        valueSerializer.writeString(valueHolderForModuleName)
        const valueHolderForName  = value.name
        valueSerializer.writeString(valueHolderForName)
        const valueHolderForLabel  = value.label
        valueSerializer.writeString(valueHolderForLabel)
        const valueHolderForLabelId  = value.labelId
        valueSerializer.writeInt64(valueHolderForLabelId)
        const valueHolderForDescription  = value.description
        valueSerializer.writeString(valueHolderForDescription)
        const valueHolderForDescriptionId  = value.descriptionId
        valueSerializer.writeInt64(valueHolderForDescriptionId)
        const valueHolderForIcon  = value.icon
        valueSerializer.writeString(valueHolderForIcon)
        const valueHolderForIconId  = value.iconId
        valueSerializer.writeInt64(valueHolderForIconId)
        const valueHolderForProcess  = value.process
        valueSerializer.writeString(valueHolderForProcess)
        const valueHolderForExported  = value.exported
        valueSerializer.writeBoolean(valueHolderForExported)
        const valueHolderForOrientation  = value.orientation
        valueSerializer.writeInt32(valueHolderForOrientation.valueOf())
        const valueHolderForLaunchType  = value.launchType
        valueSerializer.writeInt32(valueHolderForLaunchType.valueOf())
        const valueHolderForPermissions  = value.permissions
        valueSerializer.writeInt32((valueHolderForPermissions.length).toInt())
        for (let valueHolderForPermissionsCounterI = 0; valueHolderForPermissionsCounterI < valueHolderForPermissions.length; valueHolderForPermissionsCounterI++) {
            const valueHolderForPermissionsTmpElement : string = valueHolderForPermissions[valueHolderForPermissionsCounterI]
            valueSerializer.writeString(valueHolderForPermissionsTmpElement)
        }
        const valueHolderForDeviceTypes  = value.deviceTypes
        valueSerializer.writeInt32((valueHolderForDeviceTypes.length).toInt())
        for (let valueHolderForDeviceTypesCounterI = 0; valueHolderForDeviceTypesCounterI < valueHolderForDeviceTypes.length; valueHolderForDeviceTypesCounterI++) {
            const valueHolderForDeviceTypesTmpElement : string = valueHolderForDeviceTypes[valueHolderForDeviceTypesCounterI]
            valueSerializer.writeString(valueHolderForDeviceTypesTmpElement)
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
        const valueHolderForSupportWindowModes  = value.supportWindowModes
        valueSerializer.writeInt32((valueHolderForSupportWindowModes.length).toInt())
        for (let valueHolderForSupportWindowModesCounterI = 0; valueHolderForSupportWindowModesCounterI < valueHolderForSupportWindowModes.length; valueHolderForSupportWindowModesCounterI++) {
            const valueHolderForSupportWindowModesTmpElement : bundleManager.SupportWindowMode = valueHolderForSupportWindowModes[valueHolderForSupportWindowModesCounterI]
            valueSerializer.writeInt32(valueHolderForSupportWindowModesTmpElement.valueOf())
        }
        const valueHolderForWindowSize  = value.windowSize
        WindowSize_serializer.write(valueSerializer, valueHolderForWindowSize)
        const valueHolderForExcludeFromDock  = value.excludeFromDock
        valueSerializer.writeBoolean(valueHolderForExcludeFromDock)
        const valueHolderForSkills  = value.skills
        valueSerializer.writeInt32((valueHolderForSkills.length).toInt())
        for (let valueHolderForSkillsCounterI = 0; valueHolderForSkillsCounterI < valueHolderForSkills.length; valueHolderForSkillsCounterI++) {
            const valueHolderForSkillsTmpElement : Skill = valueHolderForSkills[valueHolderForSkillsCounterI]
            Skill_serializer.write(valueSerializer, valueHolderForSkillsTmpElement)
        }
        const valueHolderForAppIndex  = value.appIndex
        valueSerializer.writeInt32(valueHolderForAppIndex)
        const valueHolderForOrientationId  = value.orientationId
        valueSerializer.writeInt64(valueHolderForOrientationId)
    }
    public static read(buffer: DeserializerBase): AbilityInfo {
        let valueDeserializer : DeserializerBase = buffer
        const bundleNameTmpResult : string = (valueDeserializer.readString() as string)
        const moduleNameTmpResult : string = (valueDeserializer.readString() as string)
        const nameTmpResult : string = (valueDeserializer.readString() as string)
        const labelTmpResult : string = (valueDeserializer.readString() as string)
        const labelIdTmpResult : int64 = valueDeserializer.readInt64()
        const descriptionTmpResult : string = (valueDeserializer.readString() as string)
        const descriptionIdTmpResult : int64 = valueDeserializer.readInt64()
        const iconTmpResult : string = (valueDeserializer.readString() as string)
        const iconIdTmpResult : int64 = valueDeserializer.readInt64()
        const processTmpResult : string = (valueDeserializer.readString() as string)
        const exportedTmpResult : boolean = valueDeserializer.readBoolean()
        const orientationTmpResult : bundleManager.DisplayOrientation = bundleManager.DisplayOrientation.fromValue(valueDeserializer.readInt32())
        const launchTypeTmpResult : bundleManager.LaunchType = bundleManager.LaunchType.fromValue(valueDeserializer.readInt32())
        const permissionsTmpBufLength : int32 = valueDeserializer.readInt32()
        let permissionsTmpBuf : Array<string> = new Array<string>(permissionsTmpBufLength)
        for (let permissionsTmpBufBufCounterI = 0; permissionsTmpBufBufCounterI < permissionsTmpBufLength; permissionsTmpBufBufCounterI++) {
            permissionsTmpBuf[permissionsTmpBufBufCounterI] = (valueDeserializer.readString() as string)
        }
        const permissionsTmpResult : Array<string> = permissionsTmpBuf
        const deviceTypesTmpBufLength : int32 = valueDeserializer.readInt32()
        let deviceTypesTmpBuf : Array<string> = new Array<string>(deviceTypesTmpBufLength)
        for (let deviceTypesTmpBufBufCounterI = 0; deviceTypesTmpBufBufCounterI < deviceTypesTmpBufLength; deviceTypesTmpBufBufCounterI++) {
            deviceTypesTmpBuf[deviceTypesTmpBufBufCounterI] = (valueDeserializer.readString() as string)
        }
        const deviceTypesTmpResult : Array<string> = deviceTypesTmpBuf
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
        const supportWindowModesTmpBufLength : int32 = valueDeserializer.readInt32()
        let supportWindowModesTmpBuf : Array<bundleManager.SupportWindowMode> = new Array<bundleManager.SupportWindowMode>(supportWindowModesTmpBufLength)
        for (let supportWindowModesTmpBufBufCounterI = 0; supportWindowModesTmpBufBufCounterI < supportWindowModesTmpBufLength; supportWindowModesTmpBufBufCounterI++) {
            supportWindowModesTmpBuf[supportWindowModesTmpBufBufCounterI] = bundleManager.SupportWindowMode.fromValue(valueDeserializer.readInt32())
        }
        const supportWindowModesTmpResult : Array<bundleManager.SupportWindowMode> = supportWindowModesTmpBuf
        const windowSizeTmpResult : WindowSize = WindowSize_serializer.read(valueDeserializer)
        const excludeFromDockTmpResult : boolean = valueDeserializer.readBoolean()
        const skillsTmpBufLength : int32 = valueDeserializer.readInt32()
        let skillsTmpBuf : Array<Skill> = new Array<Skill>(skillsTmpBufLength)
        for (let skillsTmpBufBufCounterI = 0; skillsTmpBufBufCounterI < skillsTmpBufLength; skillsTmpBufBufCounterI++) {
            skillsTmpBuf[skillsTmpBufBufCounterI] = Skill_serializer.read(valueDeserializer)
        }
        const skillsTmpResult : Array<Skill> = skillsTmpBuf
        const appIndexTmpResult : int32 = valueDeserializer.readInt32()
        const orientationIdTmpResult : int64 = valueDeserializer.readInt64()
        let value : AbilityInfo = ({bundleName: bundleNameTmpResult, moduleName: moduleNameTmpResult, name: nameTmpResult, label: labelTmpResult, labelId: labelIdTmpResult, description: descriptionTmpResult, descriptionId: descriptionIdTmpResult, icon: iconTmpResult, iconId: iconIdTmpResult, process: processTmpResult, exported: exportedTmpResult, orientation: orientationTmpResult, launchType: launchTypeTmpResult, permissions: permissionsTmpResult, deviceTypes: deviceTypesTmpResult, applicationInfo: applicationInfoTmpResult, metadata: metadataTmpResult, enabled: enabledTmpResult, supportWindowModes: supportWindowModesTmpResult, windowSize: windowSizeTmpResult, excludeFromDock: excludeFromDockTmpResult, skills: skillsTmpResult, appIndex: appIndexTmpResult, orientationId: orientationIdTmpResult} as AbilityInfo)
        return value
    }
}
