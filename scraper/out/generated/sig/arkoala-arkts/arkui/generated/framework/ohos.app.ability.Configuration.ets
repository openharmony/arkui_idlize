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

import { Configuration } from "@ohos.app.ability.Configuration"
import { SerializerBase, DeserializerBase, CallbackResource, InteropNativeModule, MaterializedBase, Tags, RuntimeType, runtimeType, toPeerPtr, nullptr, KPointer, NativeBuffer, KSerializerBuffer, KUint8ArrayPtr } from "@koalaui/interop"
import { int32, int64, float32, unsafeCast } from "@koalaui/common"
import { TypeChecker } from "#components"
import { CallbackTransformer } from "./../CallbackTransformer"
import { default as ConfigurationConstant } from "@ohos.app.ability.ConfigurationConstant"
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
            valueSerializer.writeInt32(valueHolderForColorModeTmpValue.valueOf())
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForDirection  = value.direction
        if (valueHolderForDirection !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForDirectionTmpValue  = (valueHolderForDirection as ConfigurationConstant.Direction)
            valueSerializer.writeInt32(valueHolderForDirectionTmpValue.valueOf())
        } else {
            valueSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const valueHolderForScreenDensity  = value.screenDensity
        if (valueHolderForScreenDensity !== undefined) {
            valueSerializer.writeInt8(RuntimeType.OBJECT)
            const valueHolderForScreenDensityTmpValue  = (valueHolderForScreenDensity as ConfigurationConstant.ScreenDensity)
            valueSerializer.writeInt32(valueHolderForScreenDensityTmpValue.valueOf())
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
            colorModeTmpBuf = ConfigurationConstant.ColorMode.fromValue(valueDeserializer.readInt32())
        }
        const colorModeTmpResult : ConfigurationConstant.ColorMode | undefined = colorModeTmpBuf
        const directionTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let directionTmpBuf : ConfigurationConstant.Direction | undefined
        if ((directionTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            directionTmpBuf = ConfigurationConstant.Direction.fromValue(valueDeserializer.readInt32())
        }
        const directionTmpResult : ConfigurationConstant.Direction | undefined = directionTmpBuf
        const screenDensityTmpBuf_runtimeType  = valueDeserializer.readInt8().toInt()
        let screenDensityTmpBuf : ConfigurationConstant.ScreenDensity | undefined
        if ((screenDensityTmpBuf_runtimeType) != (RuntimeType.UNDEFINED)) {
            screenDensityTmpBuf = ConfigurationConstant.ScreenDensity.fromValue(valueDeserializer.readInt32())
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
