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

import { DataItem, Dependency, HapModuleInfo, PreloadItem, RouterItem } from "@bundleManager.HapModuleInfo"
import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { int32, int64, float32, unsafeCast } from "@koalaui/common"
import { TypeChecker } from "#components"
import { CallbackTransformer } from "./../CallbackTransformer"
import { AbilityInfo_serializer } from "./AbilityInfo"
import { ExtensionAbilityInfo_serializer } from "./ExtensionAbilityInfo"
import { Metadata_serializer } from "./Metadata"
import { AbilityInfo } from "@bundleManager.AbilityInfo"
import { ExtensionAbilityInfo } from "@bundleManager.ExtensionAbilityInfo"
import { Metadata } from "@bundleManager.Metadata"
import { default as bundleManager } from "@ohos.bundle.bundleManager"
export class DataItem_serializer {
    public static write(buffer: SerializerBase, value: DataItem): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForKey  = value.key
        valueSerializer.writeString(valueHolderForKey)
        const valueHolderForValue  = value.value
        valueSerializer.writeString(valueHolderForValue)
    }
    public static read(buffer: DeserializerBase): DataItem {
        let valueDeserializer : DeserializerBase = buffer
        const keyTmpResult : string = (valueDeserializer.readString() as string)
        const valueTmpResult : string = (valueDeserializer.readString() as string)
        let value : DataItem = ({key: keyTmpResult, value: valueTmpResult} as DataItem)
        return value
    }
}
export class Dependency_serializer {
    public static write(buffer: SerializerBase, value: Dependency): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForModuleName  = value.moduleName
        valueSerializer.writeString(valueHolderForModuleName)
        const valueHolderForBundleName  = value.bundleName
        valueSerializer.writeString(valueHolderForBundleName)
        const valueHolderForVersionCode  = value.versionCode
        valueSerializer.writeInt64(valueHolderForVersionCode)
    }
    public static read(buffer: DeserializerBase): Dependency {
        let valueDeserializer : DeserializerBase = buffer
        const moduleNameTmpResult : string = (valueDeserializer.readString() as string)
        const bundleNameTmpResult : string = (valueDeserializer.readString() as string)
        const versionCodeTmpResult : int64 = valueDeserializer.readInt64()
        let value : Dependency = ({moduleName: moduleNameTmpResult, bundleName: bundleNameTmpResult, versionCode: versionCodeTmpResult} as Dependency)
        return value
    }
}
export class HapModuleInfo_serializer {
    public static write(buffer: SerializerBase, value: HapModuleInfo): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForName  = value.name
        valueSerializer.writeString(valueHolderForName)
        const valueHolderForIcon  = value.icon
        valueSerializer.writeString(valueHolderForIcon)
        const valueHolderForIconId  = value.iconId
        valueSerializer.writeInt64(valueHolderForIconId)
        const valueHolderForLabel  = value.label
        valueSerializer.writeString(valueHolderForLabel)
        const valueHolderForLabelId  = value.labelId
        valueSerializer.writeInt64(valueHolderForLabelId)
        const valueHolderForDescription  = value.description
        valueSerializer.writeString(valueHolderForDescription)
        const valueHolderForDescriptionId  = value.descriptionId
        valueSerializer.writeInt64(valueHolderForDescriptionId)
        const valueHolderForMainElementName  = value.mainElementName
        valueSerializer.writeString(valueHolderForMainElementName)
        const valueHolderForAbilitiesInfo  = value.abilitiesInfo
        valueSerializer.writeInt32((valueHolderForAbilitiesInfo.length).toInt())
        for (let valueHolderForAbilitiesInfoCounterI = 0; valueHolderForAbilitiesInfoCounterI < valueHolderForAbilitiesInfo.length; valueHolderForAbilitiesInfoCounterI++) {
            const valueHolderForAbilitiesInfoTmpElement : AbilityInfo = valueHolderForAbilitiesInfo[valueHolderForAbilitiesInfoCounterI]
            AbilityInfo_serializer.write(valueSerializer, valueHolderForAbilitiesInfoTmpElement)
        }
        const valueHolderForExtensionAbilitiesInfo  = value.extensionAbilitiesInfo
        valueSerializer.writeInt32((valueHolderForExtensionAbilitiesInfo.length).toInt())
        for (let valueHolderForExtensionAbilitiesInfoCounterI = 0; valueHolderForExtensionAbilitiesInfoCounterI < valueHolderForExtensionAbilitiesInfo.length; valueHolderForExtensionAbilitiesInfoCounterI++) {
            const valueHolderForExtensionAbilitiesInfoTmpElement : ExtensionAbilityInfo = valueHolderForExtensionAbilitiesInfo[valueHolderForExtensionAbilitiesInfoCounterI]
            ExtensionAbilityInfo_serializer.write(valueSerializer, valueHolderForExtensionAbilitiesInfoTmpElement)
        }
        const valueHolderForMetadata  = value.metadata
        valueSerializer.writeInt32((valueHolderForMetadata.length).toInt())
        for (let valueHolderForMetadataCounterI = 0; valueHolderForMetadataCounterI < valueHolderForMetadata.length; valueHolderForMetadataCounterI++) {
            const valueHolderForMetadataTmpElement : Metadata = valueHolderForMetadata[valueHolderForMetadataCounterI]
            Metadata_serializer.write(valueSerializer, valueHolderForMetadataTmpElement)
        }
        const valueHolderForDeviceTypes  = value.deviceTypes
        valueSerializer.writeInt32((valueHolderForDeviceTypes.length).toInt())
        for (let valueHolderForDeviceTypesCounterI = 0; valueHolderForDeviceTypesCounterI < valueHolderForDeviceTypes.length; valueHolderForDeviceTypesCounterI++) {
            const valueHolderForDeviceTypesTmpElement : string = valueHolderForDeviceTypes[valueHolderForDeviceTypesCounterI]
            valueSerializer.writeString(valueHolderForDeviceTypesTmpElement)
        }
        const valueHolderForInstallationFree  = value.installationFree
        valueSerializer.writeBoolean(valueHolderForInstallationFree)
        const valueHolderForHashValue  = value.hashValue
        valueSerializer.writeString(valueHolderForHashValue)
        const valueHolderForType  = value.type
        valueSerializer.writeInt32(valueHolderForType.valueOf())
        const valueHolderForDependencies  = value.dependencies
        valueSerializer.writeInt32((valueHolderForDependencies.length).toInt())
        for (let valueHolderForDependenciesCounterI = 0; valueHolderForDependenciesCounterI < valueHolderForDependencies.length; valueHolderForDependenciesCounterI++) {
            const valueHolderForDependenciesTmpElement : Dependency = valueHolderForDependencies[valueHolderForDependenciesCounterI]
            Dependency_serializer.write(valueSerializer, valueHolderForDependenciesTmpElement)
        }
        const valueHolderForPreloads  = value.preloads
        valueSerializer.writeInt32((valueHolderForPreloads.length).toInt())
        for (let valueHolderForPreloadsCounterI = 0; valueHolderForPreloadsCounterI < valueHolderForPreloads.length; valueHolderForPreloadsCounterI++) {
            const valueHolderForPreloadsTmpElement : PreloadItem = valueHolderForPreloads[valueHolderForPreloadsCounterI]
            PreloadItem_serializer.write(valueSerializer, valueHolderForPreloadsTmpElement)
        }
        const valueHolderForFileContextMenuConfig  = value.fileContextMenuConfig
        valueSerializer.writeString(valueHolderForFileContextMenuConfig)
        const valueHolderForRouterMap  = value.routerMap
        valueSerializer.writeInt32((valueHolderForRouterMap.length).toInt())
        for (let valueHolderForRouterMapCounterI = 0; valueHolderForRouterMapCounterI < valueHolderForRouterMap.length; valueHolderForRouterMapCounterI++) {
            const valueHolderForRouterMapTmpElement : RouterItem = valueHolderForRouterMap[valueHolderForRouterMapCounterI]
            RouterItem_serializer.write(valueSerializer, valueHolderForRouterMapTmpElement)
        }
        const valueHolderForNativeLibraryPath  = value.nativeLibraryPath
        valueSerializer.writeString(valueHolderForNativeLibraryPath)
        const valueHolderForCodePath  = value.codePath
        valueSerializer.writeString(valueHolderForCodePath)
    }
    public static read(buffer: DeserializerBase): HapModuleInfo {
        let valueDeserializer : DeserializerBase = buffer
        const nameTmpResult : string = (valueDeserializer.readString() as string)
        const iconTmpResult : string = (valueDeserializer.readString() as string)
        const iconIdTmpResult : int64 = valueDeserializer.readInt64()
        const labelTmpResult : string = (valueDeserializer.readString() as string)
        const labelIdTmpResult : int64 = valueDeserializer.readInt64()
        const descriptionTmpResult : string = (valueDeserializer.readString() as string)
        const descriptionIdTmpResult : int64 = valueDeserializer.readInt64()
        const mainElementNameTmpResult : string = (valueDeserializer.readString() as string)
        const abilitiesInfoTmpBufLength : int32 = valueDeserializer.readInt32()
        let abilitiesInfoTmpBuf : Array<AbilityInfo> = new Array<AbilityInfo>(abilitiesInfoTmpBufLength)
        for (let abilitiesInfoTmpBufBufCounterI = 0; abilitiesInfoTmpBufBufCounterI < abilitiesInfoTmpBufLength; abilitiesInfoTmpBufBufCounterI++) {
            abilitiesInfoTmpBuf[abilitiesInfoTmpBufBufCounterI] = AbilityInfo_serializer.read(valueDeserializer)
        }
        const abilitiesInfoTmpResult : Array<AbilityInfo> = abilitiesInfoTmpBuf
        const extensionAbilitiesInfoTmpBufLength : int32 = valueDeserializer.readInt32()
        let extensionAbilitiesInfoTmpBuf : Array<ExtensionAbilityInfo> = new Array<ExtensionAbilityInfo>(extensionAbilitiesInfoTmpBufLength)
        for (let extensionAbilitiesInfoTmpBufBufCounterI = 0; extensionAbilitiesInfoTmpBufBufCounterI < extensionAbilitiesInfoTmpBufLength; extensionAbilitiesInfoTmpBufBufCounterI++) {
            extensionAbilitiesInfoTmpBuf[extensionAbilitiesInfoTmpBufBufCounterI] = ExtensionAbilityInfo_serializer.read(valueDeserializer)
        }
        const extensionAbilitiesInfoTmpResult : Array<ExtensionAbilityInfo> = extensionAbilitiesInfoTmpBuf
        const metadataTmpBufLength : int32 = valueDeserializer.readInt32()
        let metadataTmpBuf : Array<Metadata> = new Array<Metadata>(metadataTmpBufLength)
        for (let metadataTmpBufBufCounterI = 0; metadataTmpBufBufCounterI < metadataTmpBufLength; metadataTmpBufBufCounterI++) {
            metadataTmpBuf[metadataTmpBufBufCounterI] = Metadata_serializer.read(valueDeserializer)
        }
        const metadataTmpResult : Array<Metadata> = metadataTmpBuf
        const deviceTypesTmpBufLength : int32 = valueDeserializer.readInt32()
        let deviceTypesTmpBuf : Array<string> = new Array<string>(deviceTypesTmpBufLength)
        for (let deviceTypesTmpBufBufCounterI = 0; deviceTypesTmpBufBufCounterI < deviceTypesTmpBufLength; deviceTypesTmpBufBufCounterI++) {
            deviceTypesTmpBuf[deviceTypesTmpBufBufCounterI] = (valueDeserializer.readString() as string)
        }
        const deviceTypesTmpResult : Array<string> = deviceTypesTmpBuf
        const installationFreeTmpResult : boolean = valueDeserializer.readBoolean()
        const hashValueTmpResult : string = (valueDeserializer.readString() as string)
        const typeTmpResult : bundleManager.ModuleType = bundleManager.ModuleType.fromValue(valueDeserializer.readInt32())
        const dependenciesTmpBufLength : int32 = valueDeserializer.readInt32()
        let dependenciesTmpBuf : Array<Dependency> = new Array<Dependency>(dependenciesTmpBufLength)
        for (let dependenciesTmpBufBufCounterI = 0; dependenciesTmpBufBufCounterI < dependenciesTmpBufLength; dependenciesTmpBufBufCounterI++) {
            dependenciesTmpBuf[dependenciesTmpBufBufCounterI] = Dependency_serializer.read(valueDeserializer)
        }
        const dependenciesTmpResult : Array<Dependency> = dependenciesTmpBuf
        const preloadsTmpBufLength : int32 = valueDeserializer.readInt32()
        let preloadsTmpBuf : Array<PreloadItem> = new Array<PreloadItem>(preloadsTmpBufLength)
        for (let preloadsTmpBufBufCounterI = 0; preloadsTmpBufBufCounterI < preloadsTmpBufLength; preloadsTmpBufBufCounterI++) {
            preloadsTmpBuf[preloadsTmpBufBufCounterI] = PreloadItem_serializer.read(valueDeserializer)
        }
        const preloadsTmpResult : Array<PreloadItem> = preloadsTmpBuf
        const fileContextMenuConfigTmpResult : string = (valueDeserializer.readString() as string)
        const routerMapTmpBufLength : int32 = valueDeserializer.readInt32()
        let routerMapTmpBuf : Array<RouterItem> = new Array<RouterItem>(routerMapTmpBufLength)
        for (let routerMapTmpBufBufCounterI = 0; routerMapTmpBufBufCounterI < routerMapTmpBufLength; routerMapTmpBufBufCounterI++) {
            routerMapTmpBuf[routerMapTmpBufBufCounterI] = RouterItem_serializer.read(valueDeserializer)
        }
        const routerMapTmpResult : Array<RouterItem> = routerMapTmpBuf
        const nativeLibraryPathTmpResult : string = (valueDeserializer.readString() as string)
        const codePathTmpResult : string = (valueDeserializer.readString() as string)
        let value : HapModuleInfo = ({name: nameTmpResult, icon: iconTmpResult, iconId: iconIdTmpResult, label: labelTmpResult, labelId: labelIdTmpResult, description: descriptionTmpResult, descriptionId: descriptionIdTmpResult, mainElementName: mainElementNameTmpResult, abilitiesInfo: abilitiesInfoTmpResult, extensionAbilitiesInfo: extensionAbilitiesInfoTmpResult, metadata: metadataTmpResult, deviceTypes: deviceTypesTmpResult, installationFree: installationFreeTmpResult, hashValue: hashValueTmpResult, type: typeTmpResult, dependencies: dependenciesTmpResult, preloads: preloadsTmpResult, fileContextMenuConfig: fileContextMenuConfigTmpResult, routerMap: routerMapTmpResult, nativeLibraryPath: nativeLibraryPathTmpResult, codePath: codePathTmpResult} as HapModuleInfo)
        return value
    }
}
export class PreloadItem_serializer {
    public static write(buffer: SerializerBase, value: PreloadItem): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForModuleName  = value.moduleName
        valueSerializer.writeString(valueHolderForModuleName)
    }
    public static read(buffer: DeserializerBase): PreloadItem {
        let valueDeserializer : DeserializerBase = buffer
        const moduleNameTmpResult : string = (valueDeserializer.readString() as string)
        let value : PreloadItem = ({moduleName: moduleNameTmpResult} as PreloadItem)
        return value
    }
}
export class RouterItem_serializer {
    public static write(buffer: SerializerBase, value: RouterItem): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForName  = value.name
        valueSerializer.writeString(valueHolderForName)
        const valueHolderForPageSourceFile  = value.pageSourceFile
        valueSerializer.writeString(valueHolderForPageSourceFile)
        const valueHolderForBuildFunction  = value.buildFunction
        valueSerializer.writeString(valueHolderForBuildFunction)
        const valueHolderForCustomData  = value.customData
        valueSerializer.writeString(valueHolderForCustomData)
        const valueHolderForData  = value.data
        valueSerializer.writeInt32((valueHolderForData.length).toInt())
        for (let valueHolderForDataCounterI = 0; valueHolderForDataCounterI < valueHolderForData.length; valueHolderForDataCounterI++) {
            const valueHolderForDataTmpElement : DataItem = valueHolderForData[valueHolderForDataCounterI]
            DataItem_serializer.write(valueSerializer, valueHolderForDataTmpElement)
        }
    }
    public static read(buffer: DeserializerBase): RouterItem {
        let valueDeserializer : DeserializerBase = buffer
        const nameTmpResult : string = (valueDeserializer.readString() as string)
        const pageSourceFileTmpResult : string = (valueDeserializer.readString() as string)
        const buildFunctionTmpResult : string = (valueDeserializer.readString() as string)
        const customDataTmpResult : string = (valueDeserializer.readString() as string)
        const dataTmpBufLength : int32 = valueDeserializer.readInt32()
        let dataTmpBuf : Array<DataItem> = new Array<DataItem>(dataTmpBufLength)
        for (let dataTmpBufBufCounterI = 0; dataTmpBufBufCounterI < dataTmpBufLength; dataTmpBufBufCounterI++) {
            dataTmpBuf[dataTmpBufBufCounterI] = DataItem_serializer.read(valueDeserializer)
        }
        const dataTmpResult : Array<DataItem> = dataTmpBuf
        let value : RouterItem = ({name: nameTmpResult, pageSourceFile: pageSourceFileTmpResult, buildFunction: buildFunctionTmpResult, customData: customDataTmpResult, data: dataTmpResult} as RouterItem)
        return value
    }
}
