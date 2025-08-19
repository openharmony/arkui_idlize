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
import { Configuration } from "./Configuration"
import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr, registerApiEventHandler, ResourceHolder, KInt, KStringPtr, wrapSystemCallback, KLong, KBoolean, KFloat, KDouble, KUInt, KNativePointer, KInt32ArrayPtr, KFloat32ArrayPtr, pointer, KInteropReturnBuffer, loadNativeModuleLibrary } from "@koalaui/interop"
import { default as ConfigurationConstant } from "./onstant"
export enum CallbackKind {
    Kind_EMPTY_Callback = -1
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
export function deserializeAndCallCallback(thisDeserializer: DeserializerBase): void {
    const kind : int32 = thisDeserializer.readInt32()
    throw new Error("Unknown callback kind")
}
export function registerOhosAppAbilityConfigurationApiHandler(): void {
    registerApiEventHandler(10, deserializeAndCallCallback)
}
export class OHOS_APP_ABILITY_CONFIGURATIONNativeModule {
    static {
        loadNativeModuleLibrary("OHOS_APP_ABILITY_CONFIGURATIONNativeModule")
    }
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
}
