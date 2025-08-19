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

import { int32, float32, int64, unsafeCast } from "@koalaui/common"
import { extractors } from "#handwritten"
import { Ability } from "./Ability"
import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr, registerApiEventHandler, ResourceHolder, KInt, KStringPtr, wrapSystemCallback, KLong, KBoolean, KFloat, KDouble, KUInt, KNativePointer, KInt32ArrayPtr, KFloat32ArrayPtr, pointer, KInteropReturnBuffer, loadNativeModuleLibrary } from "@koalaui/interop"
import { AbilityLifecycleCallback } from "./ifecycleCallback"
import { Callee, UIAbility, CalleeCallback } from "@ohos.app.ability.UIAbility"
import { default as window } from "@ohos.window"
import { default as AbilityConstant } from "./onstant"
import { Configuration } from "@ohos.app.ability.Configuration"
import { default as ConfigurationConstant } from "@ohos.app.ability.ConfigurationConstant"
import { Want } from "@ohos.app.ability.Want"
import { default as rpc } from "@ohos.rpc"
import { AsyncCallback, BusinessError } from "@ohos.base"
export enum CallbackKind {
    Kind_EMPTY_Callback = -1
}
export class Ability_serializer {
    public static write(buffer: SerializerBase, value: Ability): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(extractors.toAbilityPtr(value))
    }
    public static read(buffer: DeserializerBase): Ability {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return extractors.fromAbilityPtr(ptr)
    }
}
export class AbilityLifecycleCallback_serializer {
    public static write(buffer: SerializerBase, value: AbilityLifecycleCallback): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(extractors.toAbilityLifecycleCallbackPtr(value))
    }
    public static read(buffer: DeserializerBase): AbilityLifecycleCallback {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return extractors.fromAbilityLifecycleCallbackPtr(ptr)
    }
}
export class Callee_serializer {
    public static write(buffer: SerializerBase, value: Callee): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(extractors.toCalleePtr(value))
    }
    public static read(buffer: DeserializerBase): Callee {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return extractors.fromCalleePtr(ptr)
    }
}
export class window_WindowStage_serializer {
    public static write(buffer: SerializerBase, value: window.WindowStage): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(extractors.toWindowWindowStagePtr(value))
    }
    public static read(buffer: DeserializerBase): window.WindowStage {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return extractors.fromWindowWindowStagePtr(ptr)
    }
}
export class AbilityConstant_LastExitDetailInfo_serializer {
    public static write(buffer: SerializerBase, value: AbilityConstant.LastExitDetailInfo): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForPid  = value.pid
        valueSerializer.writeInt32(valueHolderForPid)
        const valueHolderForProcessName  = value.processName
        valueSerializer.writeString(valueHolderForProcessName)
        const valueHolderForUid  = value.uid
        valueSerializer.writeInt32(valueHolderForUid)
        const valueHolderForExitSubReason  = value.exitSubReason
        valueSerializer.writeInt32(valueHolderForExitSubReason)
        const valueHolderForExitMsg  = value.exitMsg
        valueSerializer.writeString(valueHolderForExitMsg)
        const valueHolderForRss  = value.rss
        valueSerializer.writeInt32(valueHolderForRss)
        const valueHolderForPss  = value.pss
        valueSerializer.writeInt32(valueHolderForPss)
        const valueHolderForTimestamp  = value.timestamp
        valueSerializer.writeInt64(valueHolderForTimestamp)
    }
    public static read(buffer: DeserializerBase): AbilityConstant.LastExitDetailInfo {
        let valueDeserializer : DeserializerBase = buffer
        const pidTmpResult : int32 = valueDeserializer.readInt32()
        const processNameTmpResult : string = (valueDeserializer.readString() as string)
        const uidTmpResult : int32 = valueDeserializer.readInt32()
        const exitSubReasonTmpResult : int32 = valueDeserializer.readInt32()
        const exitMsgTmpResult : string = (valueDeserializer.readString() as string)
        const rssTmpResult : int32 = valueDeserializer.readInt32()
        const pssTmpResult : int32 = valueDeserializer.readInt32()
        const timestampTmpResult : int64 = valueDeserializer.readInt64()
        let value : AbilityConstant.LastExitDetailInfo = ({pid: pidTmpResult, processName: processNameTmpResult, uid: uidTmpResult, exitSubReason: exitSubReasonTmpResult, exitMsg: exitMsgTmpResult, rss: rssTmpResult, pss: pssTmpResult, timestamp: timestampTmpResult} as AbilityConstant.LastExitDetailInfo)
        return value
    }
}
export class Configuration_serializer {
    public static write(buffer: SerializerBase, value: Configuration): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForLanguage  = value.language
        if (valueHolderForLanguage !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForLanguageTmpValue  = valueHolderForLanguage!
            valueSerializer.writeString(valueHolderForLanguageTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForColorMode  = value.colorMode
        if (valueHolderForColorMode !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForColorModeTmpValue  = (valueHolderForColorMode as ConfigurationConstant.ColorMode)
            valueSerializer.writeInt32(TypeChecker.ConfigurationConstant_ColorMode_ToNumeric(valueHolderForColorModeTmpValue))
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForDirection  = value.direction
        if (valueHolderForDirection !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForDirectionTmpValue  = (valueHolderForDirection as ConfigurationConstant.Direction)
            valueSerializer.writeInt32(TypeChecker.ConfigurationConstant_Direction_ToNumeric(valueHolderForDirectionTmpValue))
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForScreenDensity  = value.screenDensity
        if (valueHolderForScreenDensity !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForScreenDensityTmpValue  = (valueHolderForScreenDensity as ConfigurationConstant.ScreenDensity)
            valueSerializer.writeInt32(TypeChecker.ConfigurationConstant_ScreenDensity_ToNumeric(valueHolderForScreenDensityTmpValue))
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForDisplayId  = value.displayId
        if (valueHolderForDisplayId !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForDisplayIdTmpValue  = valueHolderForDisplayId!
            valueSerializer.writeInt64(valueHolderForDisplayIdTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForHasPointerDevice  = value.hasPointerDevice
        if (valueHolderForHasPointerDevice !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForHasPointerDeviceTmpValue  = valueHolderForHasPointerDevice!
            valueSerializer.writeBoolean(valueHolderForHasPointerDeviceTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForFontSizeScale  = value.fontSizeScale
        if (valueHolderForFontSizeScale !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForFontSizeScaleTmpValue  = valueHolderForFontSizeScale!
            valueSerializer.writeFloat64(valueHolderForFontSizeScaleTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForFontWeightScale  = value.fontWeightScale
        if (valueHolderForFontWeightScale !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForFontWeightScaleTmpValue  = valueHolderForFontWeightScale!
            valueSerializer.writeFloat64(valueHolderForFontWeightScaleTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForMcc  = value.mcc
        if (valueHolderForMcc !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForMccTmpValue  = valueHolderForMcc!
            valueSerializer.writeString(valueHolderForMccTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForMnc  = value.mnc
        if (valueHolderForMnc !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForMncTmpValue  = valueHolderForMnc!
            valueSerializer.writeString(valueHolderForMncTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
    }
    public static read(buffer: DeserializerBase): Configuration {
        let valueDeserializer : DeserializerBase = buffer
        const languageTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let languageTmpBuf : string | undefined
        if ((languageTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            languageTmpBuf = (valueDeserializer.readString() as string)
        }
        const languageTmpResult : string | undefined = languageTmpBuf
        const colorModeTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let colorModeTmpBuf : ConfigurationConstant.ColorMode | undefined
        if ((colorModeTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            colorModeTmpBuf = TypeChecker.ConfigurationConstant_ColorMode_FromNumeric(valueDeserializer.readInt32())
        }
        const colorModeTmpResult : ConfigurationConstant.ColorMode | undefined = colorModeTmpBuf
        const directionTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let directionTmpBuf : ConfigurationConstant.Direction | undefined
        if ((directionTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            directionTmpBuf = TypeChecker.ConfigurationConstant_Direction_FromNumeric(valueDeserializer.readInt32())
        }
        const directionTmpResult : ConfigurationConstant.Direction | undefined = directionTmpBuf
        const screenDensityTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let screenDensityTmpBuf : ConfigurationConstant.ScreenDensity | undefined
        if ((screenDensityTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            screenDensityTmpBuf = TypeChecker.ConfigurationConstant_ScreenDensity_FromNumeric(valueDeserializer.readInt32())
        }
        const screenDensityTmpResult : ConfigurationConstant.ScreenDensity | undefined = screenDensityTmpBuf
        const displayIdTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let displayIdTmpBuf : int64 | undefined
        if ((displayIdTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            displayIdTmpBuf = valueDeserializer.readInt64()
        }
        const displayIdTmpResult : int64 | undefined = displayIdTmpBuf
        const hasPointerDeviceTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let hasPointerDeviceTmpBuf : boolean | undefined
        if ((hasPointerDeviceTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            hasPointerDeviceTmpBuf = valueDeserializer.readBoolean()
        }
        const hasPointerDeviceTmpResult : boolean | undefined = hasPointerDeviceTmpBuf
        const fontSizeScaleTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let fontSizeScaleTmpBuf : double | undefined
        if ((fontSizeScaleTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            fontSizeScaleTmpBuf = valueDeserializer.readFloat64()
        }
        const fontSizeScaleTmpResult : double | undefined = fontSizeScaleTmpBuf
        const fontWeightScaleTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let fontWeightScaleTmpBuf : double | undefined
        if ((fontWeightScaleTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            fontWeightScaleTmpBuf = valueDeserializer.readFloat64()
        }
        const fontWeightScaleTmpResult : double | undefined = fontWeightScaleTmpBuf
        const mccTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let mccTmpBuf : string | undefined
        if ((mccTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            mccTmpBuf = (valueDeserializer.readString() as string)
        }
        const mccTmpResult : string | undefined = mccTmpBuf
        const mncTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let mncTmpBuf : string | undefined
        if ((mncTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            mncTmpBuf = (valueDeserializer.readString() as string)
        }
        const mncTmpResult : string | undefined = mncTmpBuf
        let value : Configuration = ({language: languageTmpResult, colorMode: colorModeTmpResult, direction: directionTmpResult, screenDensity: screenDensityTmpResult, displayId: displayIdTmpResult, hasPointerDevice: hasPointerDeviceTmpResult, fontSizeScale: fontSizeScaleTmpResult, fontWeightScale: fontWeightScaleTmpResult, mcc: mccTmpResult, mnc: mncTmpResult} as Configuration)
        return value
    }
}
export class Want_serializer {
    public static write(buffer: SerializerBase, value: Want): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(extractors.toWantPtr(value))
    }
    public static read(buffer: DeserializerBase): Want {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return extractors.fromWantPtr(ptr)
    }
}
export class AbilityConstant_LaunchParam_serializer {
    public static write(buffer: SerializerBase, value: AbilityConstant.LaunchParam): void {
        let valueSerializer : SerializerBase = buffer
        const valueHolderForLaunchReason  = value.launchReason
        valueSerializer.writeInt32(TypeChecker.AbilityConstant_LaunchReason_ToNumeric(valueHolderForLaunchReason))
        const valueHolderForLaunchReasonMessage  = value.launchReasonMessage
        if (valueHolderForLaunchReasonMessage !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForLaunchReasonMessageTmpValue  = valueHolderForLaunchReasonMessage!
            valueSerializer.writeString(valueHolderForLaunchReasonMessageTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForLastExitReason  = value.lastExitReason
        valueSerializer.writeInt32(TypeChecker.AbilityConstant_LastExitReason_ToNumeric(valueHolderForLastExitReason))
        const valueHolderForLastExitMessage  = value.lastExitMessage
        valueSerializer.writeString(valueHolderForLastExitMessage)
        const valueHolderForLastExitDetailInfo  = value.lastExitDetailInfo
        if (valueHolderForLastExitDetailInfo !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForLastExitDetailInfoTmpValue  = valueHolderForLastExitDetailInfo!
            AbilityConstant_LastExitDetailInfo_serializer.write(valueSerializer, valueHolderForLastExitDetailInfoTmpValue)
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
    }
    public static read(buffer: DeserializerBase): AbilityConstant.LaunchParam {
        let valueDeserializer : DeserializerBase = buffer
        const launchReasonTmpResult : AbilityConstant.LaunchReason = TypeChecker.AbilityConstant_LaunchReason_FromNumeric(valueDeserializer.readInt32())
        const launchReasonMessageTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let launchReasonMessageTmpBuf : string | undefined
        if ((launchReasonMessageTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            launchReasonMessageTmpBuf = (valueDeserializer.readString() as string)
        }
        const launchReasonMessageTmpResult : string | undefined = launchReasonMessageTmpBuf
        const lastExitReasonTmpResult : AbilityConstant.LastExitReason = TypeChecker.AbilityConstant_LastExitReason_FromNumeric(valueDeserializer.readInt32())
        const lastExitMessageTmpResult : string = (valueDeserializer.readString() as string)
        const lastExitDetailInfoTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let lastExitDetailInfoTmpBuf : AbilityConstant.LastExitDetailInfo | undefined
        if ((lastExitDetailInfoTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            lastExitDetailInfoTmpBuf = AbilityConstant_LastExitDetailInfo_serializer.read(valueDeserializer)
        }
        const lastExitDetailInfoTmpResult : AbilityConstant.LastExitDetailInfo | undefined = lastExitDetailInfoTmpBuf
        let value : AbilityConstant.LaunchParam = ({launchReason: launchReasonTmpResult, launchReasonMessage: launchReasonMessageTmpResult, lastExitReason: lastExitReasonTmpResult, lastExitMessage: lastExitMessageTmpResult, lastExitDetailInfo: lastExitDetailInfoTmpResult} as AbilityConstant.LaunchParam)
        return value
    }
}
export class UIAbility_serializer {
    public static write(buffer: SerializerBase, value: UIAbility): void {
        let valueSerializer : SerializerBase = buffer
        valueSerializer.writePointer(extractors.toUIAbilityPtr(value))
    }
    public static read(buffer: DeserializerBase): UIAbility {
        let valueDeserializer : DeserializerBase = buffer
        let ptr : KPointer = valueDeserializer.readPointer()
        return extractors.fromUIAbilityPtr(ptr)
    }
}
export function deserializeAndCallCallback(thisDeserializer: DeserializerBase): void {
    const kind : int32 = thisDeserializer.readInt32()
    throw new Error("Unknown callback kind")
}
export function registerOhosAppAbilityAbilityApiHandler(): void {
    registerApiEventHandler(10, deserializeAndCallCallback)
}
export class OHOS_APP_ABILITY_ABILITYNativeModule {
    static {
        loadNativeModuleLibrary("OHOS_APP_ABILITY_ABILITYNativeModule")
    }
    @ani.unsafe.Direct
    native static _Ability_construct(): KPointer
    @ani.unsafe.Direct
    native static _Ability_getFinalizer(): KPointer
    @ani.unsafe.Direct
    native static _Ability_onConfigurationUpdate(ptr: KPointer, thisArray: KSerializerBuffer, thisLength: int32): void
    @ani.unsafe.Direct
    native static _Ability_onMemoryLevel(ptr: KPointer, level: KInt): void
    @ani.unsafe.Direct
    native static _AbilityLifecycleCallback_construct(): KPointer
    @ani.unsafe.Direct
    native static _AbilityLifecycleCallback_getFinalizer(): KPointer
    @ani.unsafe.Direct
    native static _AbilityLifecycleCallback_onAbilityCreate(ptr: KPointer, ability: KPointer): void
    @ani.unsafe.Direct
    native static _AbilityLifecycleCallback_onWindowStageCreate(ptr: KPointer, ability: KPointer, windowStage: KPointer): void
    @ani.unsafe.Direct
    native static _AbilityLifecycleCallback_onWindowStageDestroy(ptr: KPointer, ability: KPointer, windowStage: KPointer): void
    @ani.unsafe.Direct
    native static _AbilityLifecycleCallback_onAbilityDestroy(ptr: KPointer, ability: KPointer): void
    @ani.unsafe.Direct
    native static _AbilityLifecycleCallback_onAbilityForeground(ptr: KPointer, ability: KPointer): void
    @ani.unsafe.Direct
    native static _AbilityLifecycleCallback_onAbilityBackground(ptr: KPointer, ability: KPointer): void
}
export class TypeChecker {
    static typeInstanceOf<T>(value: Object, prop: string): boolean {
        return value instanceof T
    }
    static typeCast<T>(value: Object): T {
        return value as T
    }
    static isNativeBuffer(value: Object): boolean {
        return value instanceof ArrayBuffer
    }
    static isAbility(value: Object | string | number | undefined): boolean {
        return value instanceof Ability
    }
    static isAbilityConstant_LastExitDetailInfo(value: Object | string | number | undefined, arg0: boolean, arg1: boolean, arg2: boolean, arg3: boolean, arg4: boolean, arg5: boolean, arg6: boolean, arg7: boolean): boolean {
        return value instanceof AbilityConstant.LastExitDetailInfo
    }
    static isAbilityConstant_LastExitReason(value: Object | string | number | undefined): boolean {
        return value instanceof AbilityConstant.LastExitReason
    }
    static isAbilityConstant_LaunchParam(value: Object | string | number | undefined, arg0: boolean, arg1: boolean, arg2: boolean, arg3: boolean, arg4: boolean): boolean {
        return value instanceof AbilityConstant.LaunchParam
    }
    static isAbilityConstant_LaunchReason(value: Object | string | number | undefined): boolean {
        return value instanceof AbilityConstant.LaunchReason
    }
    static isAbilityConstant_MemoryLevel(value: Object | string | number | undefined): boolean {
        return value instanceof AbilityConstant.MemoryLevel
    }
    static isAbilityConstant_OnSaveResult(value: Object | string | number | undefined): boolean {
        return value instanceof AbilityConstant.OnSaveResult
    }
    static isAbilityConstant_StateType(value: Object | string | number | undefined): boolean {
        return value instanceof AbilityConstant.StateType
    }
    static isAbilityLifecycleCallback(value: Object | string | number | undefined): boolean {
        return value instanceof AbilityLifecycleCallback
    }
    static isCallee(value: Object | string | number | undefined): boolean {
        return value instanceof Callee
    }
    static isConfiguration(value: Object | string | number | undefined, arg0: boolean, arg1: boolean, arg2: boolean, arg3: boolean, arg4: boolean, arg5: boolean, arg6: boolean, arg7: boolean, arg8: boolean, arg9: boolean): boolean {
        return value instanceof Configuration
    }
    static isConfigurationConstant_ColorMode(value: Object | string | number | undefined): boolean {
        return value instanceof ConfigurationConstant.ColorMode
    }
    static isConfigurationConstant_Direction(value: Object | string | number | undefined): boolean {
        return value instanceof ConfigurationConstant.Direction
    }
    static isConfigurationConstant_ScreenDensity(value: Object | string | number | undefined): boolean {
        return value instanceof ConfigurationConstant.ScreenDensity
    }
    static isUIAbility(value: Object | string | number | undefined, arg0: boolean, arg1: boolean, arg2: boolean, arg3: boolean): boolean {
        return value instanceof UIAbility
    }
    static isWant(value: Object | string | number | undefined, arg0: boolean, arg1: boolean, arg2: boolean, arg3: boolean, arg4: boolean, arg5: boolean, arg6: boolean, arg7: boolean, arg8: boolean, arg9: boolean, arg10: boolean): boolean {
        return value instanceof Want
    }
    static iswindow_WindowStage(value: Object | string | number | undefined): boolean {
        return value instanceof window.WindowStage
    }
    static AbilityConstant_LastExitReason_ToNumeric(value: AbilityConstant.LastExitReason): int32 {
        return value.valueOf()
    }
    static AbilityConstant_LastExitReason_FromNumeric(ordinal: int32): AbilityConstant.LastExitReason {
        return AbilityConstant.LastExitReason.fromValue(ordinal)
    }
    static AbilityConstant_LaunchReason_ToNumeric(value: AbilityConstant.LaunchReason): int32 {
        return value.valueOf()
    }
    static AbilityConstant_LaunchReason_FromNumeric(ordinal: int32): AbilityConstant.LaunchReason {
        return AbilityConstant.LaunchReason.fromValue(ordinal)
    }
    static AbilityConstant_MemoryLevel_ToNumeric(value: AbilityConstant.MemoryLevel): int32 {
        return value.valueOf()
    }
    static AbilityConstant_MemoryLevel_FromNumeric(ordinal: int32): AbilityConstant.MemoryLevel {
        return AbilityConstant.MemoryLevel.fromValue(ordinal)
    }
    static AbilityConstant_OnSaveResult_ToNumeric(value: AbilityConstant.OnSaveResult): int32 {
        return value.valueOf()
    }
    static AbilityConstant_OnSaveResult_FromNumeric(ordinal: int32): AbilityConstant.OnSaveResult {
        return AbilityConstant.OnSaveResult.fromValue(ordinal)
    }
    static AbilityConstant_StateType_ToNumeric(value: AbilityConstant.StateType): int32 {
        return value.valueOf()
    }
    static AbilityConstant_StateType_FromNumeric(ordinal: int32): AbilityConstant.StateType {
        return AbilityConstant.StateType.fromValue(ordinal)
    }
    static ConfigurationConstant_ColorMode_ToNumeric(value: ConfigurationConstant.ColorMode): int32 {
        return value.valueOf()
    }
    static ConfigurationConstant_ColorMode_FromNumeric(ordinal: int32): ConfigurationConstant.ColorMode {
        return ConfigurationConstant.ColorMode.fromValue(ordinal)
    }
    static ConfigurationConstant_Direction_ToNumeric(value: ConfigurationConstant.Direction): int32 {
        return value.valueOf()
    }
    static ConfigurationConstant_Direction_FromNumeric(ordinal: int32): ConfigurationConstant.Direction {
        return ConfigurationConstant.Direction.fromValue(ordinal)
    }
    static ConfigurationConstant_ScreenDensity_ToNumeric(value: ConfigurationConstant.ScreenDensity): int32 {
        return value.valueOf()
    }
    static ConfigurationConstant_ScreenDensity_FromNumeric(ordinal: int32): ConfigurationConstant.ScreenDensity {
        return ConfigurationConstant.ScreenDensity.fromValue(ordinal)
    }
    static isArray_String(value: Object | string | number | undefined): boolean {
        return value instanceof Array
    }
}
