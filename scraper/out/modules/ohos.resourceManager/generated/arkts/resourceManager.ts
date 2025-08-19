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

import { TypeChecker, OHOS_RESOURCEMANAGERNativeModule, resourceManager_Configuration_serializer } from "./ohos.resourceManager.INTERNAL"
import { Finalizable, runtimeType, RuntimeType, SerializerBase, DeserializerBase, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { AsyncCallback, BusinessError } from "@ohos.base"
import { extractors } from "#handwritten"
import { DrawableDescriptor } from "@ohos.arkui.drawableDescriptor"
export default resourceManager
export namespace resourceManager {
    export class ConfigurationInternal {
        public static fromPtr(ptr: KPointer): resourceManager.Configuration {
            return new resourceManager.Configuration(ptr)
        }
    }
    export class Configuration implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        get direction(): Direction {
            return this.getDirection()
        }
        set direction(direction: Direction) {
            this.setDirection(direction)
        }
        get locale(): string {
            return this.getLocale()
        }
        set locale(locale: string) {
            this.setLocale(locale)
        }
        get deviceType(): DeviceType {
            return this.getDeviceType()
        }
        set deviceType(deviceType: DeviceType) {
            this.setDeviceType(deviceType)
        }
        get screenDensity(): ScreenDensity {
            return this.getScreenDensity()
        }
        set screenDensity(screenDensity: ScreenDensity) {
            this.setScreenDensity(screenDensity)
        }
        get colorMode(): ColorMode {
            return this.getColorMode()
        }
        set colorMode(colorMode: ColorMode) {
            this.setColorMode(colorMode)
        }
        get mcc(): int32 {
            return this.getMcc()
        }
        set mcc(mcc: int32) {
            this.setMcc(mcc)
        }
        get mnc(): int32 {
            return this.getMnc()
        }
        set mnc(mnc: int32) {
            this.setMnc(mnc)
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, Configuration.getFinalizer())
        }
        constructor() {
            this(Configuration.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_getFinalizer()
        }
        private getDirection(): Direction {
            return this.getDirection_serialize()
        }
        private setDirection(direction: Direction): void {
            const direction_casted = direction as (Direction)
            this.setDirection_serialize(direction_casted)
            return
        }
        private getLocale(): string {
            return this.getLocale_serialize()
        }
        private setLocale(locale: string): void {
            const locale_casted = locale as (string)
            this.setLocale_serialize(locale_casted)
            return
        }
        private getDeviceType(): DeviceType {
            return this.getDeviceType_serialize()
        }
        private setDeviceType(deviceType: DeviceType): void {
            const deviceType_casted = deviceType as (DeviceType)
            this.setDeviceType_serialize(deviceType_casted)
            return
        }
        private getScreenDensity(): ScreenDensity {
            return this.getScreenDensity_serialize()
        }
        private setScreenDensity(screenDensity: ScreenDensity): void {
            const screenDensity_casted = screenDensity as (ScreenDensity)
            this.setScreenDensity_serialize(screenDensity_casted)
            return
        }
        private getColorMode(): ColorMode {
            return this.getColorMode_serialize()
        }
        private setColorMode(colorMode: ColorMode): void {
            const colorMode_casted = colorMode as (ColorMode)
            this.setColorMode_serialize(colorMode_casted)
            return
        }
        private getMcc(): int32 {
            return this.getMcc_serialize()
        }
        private setMcc(mcc: int32): void {
            const mcc_casted = mcc as (int32)
            this.setMcc_serialize(mcc_casted)
            return
        }
        private getMnc(): int32 {
            return this.getMnc_serialize()
        }
        private setMnc(mnc: int32): void {
            const mnc_casted = mnc as (int32)
            this.setMnc_serialize(mnc_casted)
            return
        }
        private getDirection_serialize(): Direction {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_getDirection(this.peer!.ptr)
            return TypeChecker.resourceManager_Direction_FromNumeric(retval)
        }
        private setDirection_serialize(direction: Direction): void {
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_setDirection(this.peer!.ptr, TypeChecker.resourceManager_Direction_ToNumeric(direction))
        }
        private getLocale_serialize(): string {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_getLocale(this.peer!.ptr)
            return retval
        }
        private setLocale_serialize(locale: string): void {
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_setLocale(this.peer!.ptr, locale)
        }
        private getDeviceType_serialize(): DeviceType {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_getDeviceType(this.peer!.ptr)
            return TypeChecker.resourceManager_DeviceType_FromNumeric(retval)
        }
        private setDeviceType_serialize(deviceType: DeviceType): void {
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_setDeviceType(this.peer!.ptr, TypeChecker.resourceManager_DeviceType_ToNumeric(deviceType))
        }
        private getScreenDensity_serialize(): ScreenDensity {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_getScreenDensity(this.peer!.ptr)
            return TypeChecker.resourceManager_ScreenDensity_FromNumeric(retval)
        }
        private setScreenDensity_serialize(screenDensity: ScreenDensity): void {
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_setScreenDensity(this.peer!.ptr, TypeChecker.resourceManager_ScreenDensity_ToNumeric(screenDensity))
        }
        private getColorMode_serialize(): ColorMode {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_getColorMode(this.peer!.ptr)
            return TypeChecker.resourceManager_ColorMode_FromNumeric(retval)
        }
        private setColorMode_serialize(colorMode: ColorMode): void {
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_setColorMode(this.peer!.ptr, TypeChecker.resourceManager_ColorMode_ToNumeric(colorMode))
        }
        private getMcc_serialize(): int32 {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_getMcc(this.peer!.ptr)
            return retval
        }
        private setMcc_serialize(mcc: int32): void {
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_setMcc(this.peer!.ptr, mcc)
        }
        private getMnc_serialize(): int32 {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_getMnc(this.peer!.ptr)
            return retval
        }
        private setMnc_serialize(mnc: int32): void {
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_Configuration_setMnc(this.peer!.ptr, mnc)
        }
    }
    export class DeviceCapabilityInternal {
        public static fromPtr(ptr: KPointer): resourceManager.DeviceCapability {
            return new resourceManager.DeviceCapability(ptr)
        }
    }
    export class DeviceCapability implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        get screenDensity(): ScreenDensity {
            return this.getScreenDensity()
        }
        set screenDensity(screenDensity: ScreenDensity) {
            this.setScreenDensity(screenDensity)
        }
        get deviceType(): DeviceType {
            return this.getDeviceType()
        }
        set deviceType(deviceType: DeviceType) {
            this.setDeviceType(deviceType)
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, DeviceCapability.getFinalizer())
        }
        constructor() {
            this(DeviceCapability.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_DeviceCapability_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_RESOURCEMANAGERNativeModule._resourceManager_DeviceCapability_getFinalizer()
        }
        private getScreenDensity(): ScreenDensity {
            return this.getScreenDensity_serialize()
        }
        private setScreenDensity(screenDensity: ScreenDensity): void {
            const screenDensity_casted = screenDensity as (ScreenDensity)
            this.setScreenDensity_serialize(screenDensity_casted)
            return
        }
        private getDeviceType(): DeviceType {
            return this.getDeviceType_serialize()
        }
        private setDeviceType(deviceType: DeviceType): void {
            const deviceType_casted = deviceType as (DeviceType)
            this.setDeviceType_serialize(deviceType_casted)
            return
        }
        private getScreenDensity_serialize(): ScreenDensity {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_DeviceCapability_getScreenDensity(this.peer!.ptr)
            return TypeChecker.resourceManager_ScreenDensity_FromNumeric(retval)
        }
        private setScreenDensity_serialize(screenDensity: ScreenDensity): void {
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_DeviceCapability_setScreenDensity(this.peer!.ptr, TypeChecker.resourceManager_ScreenDensity_ToNumeric(screenDensity))
        }
        private getDeviceType_serialize(): DeviceType {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_DeviceCapability_getDeviceType(this.peer!.ptr)
            return TypeChecker.resourceManager_DeviceType_FromNumeric(retval)
        }
        private setDeviceType_serialize(deviceType: DeviceType): void {
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_DeviceCapability_setDeviceType(this.peer!.ptr, TypeChecker.resourceManager_DeviceType_ToNumeric(deviceType))
        }
    }
    export interface ResourceManager {
        getDeviceCapability(callback_: AsyncCallback<DeviceCapability>): void
        getDeviceCapability(): Promise<DeviceCapability>
        getConfiguration(callback_: AsyncCallback<Configuration>): void
        getConfiguration(): Promise<Configuration>
        getStringByName(resName: string, callback_: AsyncCallback<string>): void
        getStringByName(resName: string): Promise<string>
        getStringArrayByName(resName: string, callback_: AsyncCallback<Array<string>>): void
        getStringArrayByName(resName: string): Promise<Array<string>>
        getMediaByName(resName: string, callback_: AsyncCallback<ArrayBuffer>): void
        getMediaByName(resName: string, density: int32, callback_: AsyncCallback<ArrayBuffer>): void
        getMediaByName(resName: string): Promise<ArrayBuffer>
        getMediaByName(resName: string, density: int32): Promise<ArrayBuffer>
        getMediaBase64ByName(resName: string, callback_: AsyncCallback<string>): void
        getMediaBase64ByName(resName: string, density: int32, callback_: AsyncCallback<string>): void
        getMediaBase64ByName(resName: string): Promise<string>
        getMediaBase64ByName(resName: string, density: int32): Promise<string>
        getStringSync(resId: int64): string
        getStringSync(resId: int64, args: Array<string | double>): string
        getStringByNameSync(resName: string): string
        getStringByNameSync(resName: string, args: Array<string | double>): string
        getBoolean(resId: int64): boolean
        getBooleanByName(resName: string): boolean
        getInt(resId: int64): int32
        getDouble(resId: int64): double
        getIntByName(resName: string): int32
        getDoubleByName(resName: string): double
        getStringValue(resId: int64, callback_: AsyncCallback<string>): void
        getStringValue(resId: int64): Promise<string>
        getStringArrayValue(resId: int64, callback_: AsyncCallback<Array<string>>): void
        getStringArrayValue(resId: int64): Promise<Array<string>>
        getIntPluralStringValueSync(resId: int64, num: int32, args: Array<string | double>): string
        getIntPluralStringByNameSync(resName: string, num: int32, args: Array<string | double>): string
        getDoublePluralStringValueSync(resId: int64, num: double, args: Array<string | double>): string
        getDoublePluralStringByNameSync(resName: string, num: double, args: Array<string | double>): string
        getMediaContent(resId: int64, callback_: AsyncCallback<ArrayBuffer>): void
        getMediaContent(resId: int64, density: int32, callback_: AsyncCallback<ArrayBuffer>): void
        getMediaContent(resId: int64): Promise<ArrayBuffer>
        getMediaContent(resId: int64, density: int32): Promise<ArrayBuffer>
        getMediaContentBase64(resId: int64, callback_: AsyncCallback<string>): void
        getMediaContentBase64(resId: int64, density: int32, callback_: AsyncCallback<string>): void
        getMediaContentBase64(resId: int64): Promise<string>
        getMediaContentBase64(resId: int64, density: int32): Promise<string>
        getRawFileContent(path: string, callback_: AsyncCallback<ArrayBuffer>): void
        getRawFileContent(path: string): Promise<ArrayBuffer>
        getRawFd(path: string, callback_: AsyncCallback<RawFileDescriptor>): void
        getRawFd(path: string): Promise<RawFileDescriptor>
        closeRawFd(path: string, callback_: AsyncCallback<void>): void
        closeRawFd(path: string): Promise<void>
        getDrawableDescriptor(resId: int64, density: int32 | undefined, type: int32 | undefined): DrawableDescriptor
        getDrawableDescriptorByName(resName: string, density: int32 | undefined, type: int32 | undefined): DrawableDescriptor
        getRawFileList(path: string, callback_: AsyncCallback<Array<string>>): void
        getRawFileList(path: string): Promise<Array<string>>
        getColor(resId: int64, callback_: AsyncCallback<int64>): void
        getColor(resId: int64): Promise<int64>
        getColorByName(resName: string, callback_: AsyncCallback<int64>): void
        getColorByName(resName: string): Promise<int64>
        getColorSync(resId: int64): int64
        getColorByNameSync(resName: string): int64
        addResource(path: string): void
        removeResource(path: string): void
        getRawFdSync(path: string): RawFileDescriptor
        closeRawFdSync(path: string): void
        getRawFileListSync(path: string): Array<string>
        getRawFileContentSync(path: string): ArrayBuffer
        getMediaContentSync(resId: int64, density: int32 | undefined): ArrayBuffer
        getMediaContentBase64Sync(resId: int64, density: int32 | undefined): string
        getStringArrayValueSync(resId: int64): Array<string>
        getMediaByNameSync(resName: string, density: int32 | undefined): ArrayBuffer
        getMediaBase64ByNameSync(resName: string, density: int32 | undefined): string
        getStringArrayByNameSync(resName: string): Array<string>
        getConfigurationSync(): Configuration
        getDeviceCapabilitySync(): DeviceCapability
        getLocales(includeSystem: boolean | undefined): Array<string>
        getSymbol(resId: int64): int64
        getSymbolByName(resName: string): int64
        isRawDir(path: string): boolean
        getOverrideResourceManager(configuration: Configuration | undefined): ResourceManager
        getOverrideConfiguration(): Configuration
        updateOverrideConfiguration(configuration: Configuration): void
    }
    export class ResourceManagerInternal implements MaterializedBase,ResourceManager {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, ResourceManagerInternal.getFinalizer())
        }
        constructor() {
            this(ResourceManagerInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): ResourceManagerInternal {
            return new ResourceManagerInternal(ptr)
        }
        public getDeviceCapability(callback_: AsyncCallback<DeviceCapability>): void {
            const callback__casted = callback_ as (AsyncCallback<DeviceCapability>)
            this.getDeviceCapability0_serialize(callback__casted)
            return
        }
        public getDeviceCapability(): Promise<DeviceCapability> {
            return this.getDeviceCapability1_serialize()
        }
        public getConfiguration(callback_: AsyncCallback<Configuration>): void {
            const callback__casted = callback_ as (AsyncCallback<Configuration>)
            this.getConfiguration0_serialize(callback__casted)
            return
        }
        public getConfiguration(): Promise<Configuration> {
            return this.getConfiguration1_serialize()
        }
        public getStringByName(resName: string, callback_: AsyncCallback<string>): void {
            const resName_casted = resName as (string)
            const callback__casted = callback_ as (AsyncCallback<string>)
            this.getStringByName0_serialize(resName_casted, callback__casted)
            return
        }
        public getStringByName(resName: string): Promise<string> {
            const resName_casted = resName as (string)
            return this.getStringByName1_serialize(resName_casted)
        }
        public getStringArrayByName(resName: string, callback_: AsyncCallback<Array<string>>): void {
            const resName_casted = resName as (string)
            const callback__casted = callback_ as (AsyncCallback<Array<string>>)
            this.getStringArrayByName0_serialize(resName_casted, callback__casted)
            return
        }
        public getStringArrayByName(resName: string): Promise<Array<string>> {
            const resName_casted = resName as (string)
            return this.getStringArrayByName1_serialize(resName_casted)
        }
        public getMediaByName(resName: string, callback_: AsyncCallback<ArrayBuffer>): void {
            const resName_casted = resName as (string)
            const callback__casted = callback_ as (AsyncCallback<ArrayBuffer>)
            this.getMediaByName0_serialize(resName_casted, callback__casted)
            return
        }
        public getMediaByName(resName: string, density: int32, callback_: AsyncCallback<ArrayBuffer>): void {
            const resName_casted = resName as (string)
            const density_casted = density as (int32)
            const callback__casted = callback_ as (AsyncCallback<ArrayBuffer>)
            this.getMediaByName1_serialize(resName_casted, density_casted, callback__casted)
            return
        }
        public getMediaByName(resName: string): Promise<ArrayBuffer> {
            const resName_casted = resName as (string)
            return this.getMediaByName2_serialize(resName_casted)
        }
        public getMediaByName(resName: string, density: int32): Promise<ArrayBuffer> {
            const resName_casted = resName as (string)
            const density_casted = density as (int32)
            return this.getMediaByName3_serialize(resName_casted, density_casted)
        }
        public getMediaBase64ByName(resName: string, callback_: AsyncCallback<string>): void {
            const resName_casted = resName as (string)
            const callback__casted = callback_ as (AsyncCallback<string>)
            this.getMediaBase64ByName0_serialize(resName_casted, callback__casted)
            return
        }
        public getMediaBase64ByName(resName: string, density: int32, callback_: AsyncCallback<string>): void {
            const resName_casted = resName as (string)
            const density_casted = density as (int32)
            const callback__casted = callback_ as (AsyncCallback<string>)
            this.getMediaBase64ByName1_serialize(resName_casted, density_casted, callback__casted)
            return
        }
        public getMediaBase64ByName(resName: string): Promise<string> {
            const resName_casted = resName as (string)
            return this.getMediaBase64ByName2_serialize(resName_casted)
        }
        public getMediaBase64ByName(resName: string, density: int32): Promise<string> {
            const resName_casted = resName as (string)
            const density_casted = density as (int32)
            return this.getMediaBase64ByName3_serialize(resName_casted, density_casted)
        }
        public getStringSync(resId: int64): string {
            const resId_casted = resId as (int64)
            return this.getStringSync0_serialize(resId_casted)
        }
        public getStringSync(resId: int64, args: Array<string | double>): string {
            const resId_casted = resId as (int64)
            const args_casted = args as (Array<string | double>)
            return this.getStringSync1_serialize(resId_casted, args_casted)
        }
        public getStringByNameSync(resName: string): string {
            const resName_casted = resName as (string)
            return this.getStringByNameSync0_serialize(resName_casted)
        }
        public getStringByNameSync(resName: string, args: Array<string | double>): string {
            const resName_casted = resName as (string)
            const args_casted = args as (Array<string | double>)
            return this.getStringByNameSync1_serialize(resName_casted, args_casted)
        }
        public getBoolean(resId: int64): boolean {
            const resId_casted = resId as (int64)
            return this.getBoolean_serialize(resId_casted)
        }
        public getBooleanByName(resName: string): boolean {
            const resName_casted = resName as (string)
            return this.getBooleanByName_serialize(resName_casted)
        }
        public getInt(resId: int64): int32 {
            const resId_casted = resId as (int64)
            return this.getInt_serialize(resId_casted)
        }
        public getDouble(resId: int64): double {
            const resId_casted = resId as (int64)
            return this.getDouble_serialize(resId_casted)
        }
        public getIntByName(resName: string): int32 {
            const resName_casted = resName as (string)
            return this.getIntByName_serialize(resName_casted)
        }
        public getDoubleByName(resName: string): double {
            const resName_casted = resName as (string)
            return this.getDoubleByName_serialize(resName_casted)
        }
        public getStringValue(resId: int64, callback_: AsyncCallback<string>): void {
            const resId_casted = resId as (int64)
            const callback__casted = callback_ as (AsyncCallback<string>)
            this.getStringValue0_serialize(resId_casted, callback__casted)
            return
        }
        public getStringValue(resId: int64): Promise<string> {
            const resId_casted = resId as (int64)
            return this.getStringValue1_serialize(resId_casted)
        }
        public getStringArrayValue(resId: int64, callback_: AsyncCallback<Array<string>>): void {
            const resId_casted = resId as (int64)
            const callback__casted = callback_ as (AsyncCallback<Array<string>>)
            this.getStringArrayValue0_serialize(resId_casted, callback__casted)
            return
        }
        public getStringArrayValue(resId: int64): Promise<Array<string>> {
            const resId_casted = resId as (int64)
            return this.getStringArrayValue1_serialize(resId_casted)
        }
        public getIntPluralStringValueSync(resId: int64, num: int32, args: Array<string | double>): string {
            const resId_casted = resId as (int64)
            const num_casted = num as (int32)
            const args_casted = args as (Array<string | double>)
            return this.getIntPluralStringValueSync_serialize(resId_casted, num_casted, args_casted)
        }
        public getIntPluralStringByNameSync(resName: string, num: int32, args: Array<string | double>): string {
            const resName_casted = resName as (string)
            const num_casted = num as (int32)
            const args_casted = args as (Array<string | double>)
            return this.getIntPluralStringByNameSync_serialize(resName_casted, num_casted, args_casted)
        }
        public getDoublePluralStringValueSync(resId: int64, num: double, args: Array<string | double>): string {
            const resId_casted = resId as (int64)
            const num_casted = num as (double)
            const args_casted = args as (Array<string | double>)
            return this.getDoublePluralStringValueSync_serialize(resId_casted, num_casted, args_casted)
        }
        public getDoublePluralStringByNameSync(resName: string, num: double, args: Array<string | double>): string {
            const resName_casted = resName as (string)
            const num_casted = num as (double)
            const args_casted = args as (Array<string | double>)
            return this.getDoublePluralStringByNameSync_serialize(resName_casted, num_casted, args_casted)
        }
        public getMediaContent(resId: int64, callback_: AsyncCallback<ArrayBuffer>): void {
            const resId_casted = resId as (int64)
            const callback__casted = callback_ as (AsyncCallback<ArrayBuffer>)
            this.getMediaContent0_serialize(resId_casted, callback__casted)
            return
        }
        public getMediaContent(resId: int64, density: int32, callback_: AsyncCallback<ArrayBuffer>): void {
            const resId_casted = resId as (int64)
            const density_casted = density as (int32)
            const callback__casted = callback_ as (AsyncCallback<ArrayBuffer>)
            this.getMediaContent1_serialize(resId_casted, density_casted, callback__casted)
            return
        }
        public getMediaContent(resId: int64): Promise<ArrayBuffer> {
            const resId_casted = resId as (int64)
            return this.getMediaContent2_serialize(resId_casted)
        }
        public getMediaContent(resId: int64, density: int32): Promise<ArrayBuffer> {
            const resId_casted = resId as (int64)
            const density_casted = density as (int32)
            return this.getMediaContent3_serialize(resId_casted, density_casted)
        }
        public getMediaContentBase64(resId: int64, callback_: AsyncCallback<string>): void {
            const resId_casted = resId as (int64)
            const callback__casted = callback_ as (AsyncCallback<string>)
            this.getMediaContentBase640_serialize(resId_casted, callback__casted)
            return
        }
        public getMediaContentBase64(resId: int64, density: int32, callback_: AsyncCallback<string>): void {
            const resId_casted = resId as (int64)
            const density_casted = density as (int32)
            const callback__casted = callback_ as (AsyncCallback<string>)
            this.getMediaContentBase641_serialize(resId_casted, density_casted, callback__casted)
            return
        }
        public getMediaContentBase64(resId: int64): Promise<string> {
            const resId_casted = resId as (int64)
            return this.getMediaContentBase642_serialize(resId_casted)
        }
        public getMediaContentBase64(resId: int64, density: int32): Promise<string> {
            const resId_casted = resId as (int64)
            const density_casted = density as (int32)
            return this.getMediaContentBase643_serialize(resId_casted, density_casted)
        }
        public getRawFileContent(path: string, callback_: AsyncCallback<ArrayBuffer>): void {
            const path_casted = path as (string)
            const callback__casted = callback_ as (AsyncCallback<ArrayBuffer>)
            this.getRawFileContent0_serialize(path_casted, callback__casted)
            return
        }
        public getRawFileContent(path: string): Promise<ArrayBuffer> {
            const path_casted = path as (string)
            return this.getRawFileContent1_serialize(path_casted)
        }
        public getRawFd(path: string, callback_: AsyncCallback<RawFileDescriptor>): void {
            const path_casted = path as (string)
            const callback__casted = callback_ as (AsyncCallback<RawFileDescriptor>)
            this.getRawFd0_serialize(path_casted, callback__casted)
            return
        }
        public getRawFd(path: string): Promise<RawFileDescriptor> {
            const path_casted = path as (string)
            return this.getRawFd1_serialize(path_casted)
        }
        public closeRawFd(path: string, callback_: AsyncCallback<void>): void {
            const path_casted = path as (string)
            const callback__casted = callback_ as (AsyncCallback<void>)
            this.closeRawFd0_serialize(path_casted, callback__casted)
            return
        }
        public closeRawFd(path: string): Promise<void> {
            const path_casted = path as (string)
            return this.closeRawFd1_serialize(path_casted)
        }
        public getDrawableDescriptor(resId: int64, density?: int32, type?: int32): DrawableDescriptor {
            const resId_casted = resId as (int64)
            const density_casted = density as (int32 | undefined)
            const type_casted = type as (int32 | undefined)
            return this.getDrawableDescriptor_serialize(resId_casted, density_casted, type_casted)
        }
        public getDrawableDescriptorByName(resName: string, density?: int32, type?: int32): DrawableDescriptor {
            const resName_casted = resName as (string)
            const density_casted = density as (int32 | undefined)
            const type_casted = type as (int32 | undefined)
            return this.getDrawableDescriptorByName_serialize(resName_casted, density_casted, type_casted)
        }
        public getRawFileList(path: string, callback_: AsyncCallback<Array<string>>): void {
            const path_casted = path as (string)
            const callback__casted = callback_ as (AsyncCallback<Array<string>>)
            this.getRawFileList0_serialize(path_casted, callback__casted)
            return
        }
        public getRawFileList(path: string): Promise<Array<string>> {
            const path_casted = path as (string)
            return this.getRawFileList1_serialize(path_casted)
        }
        public getColor(resId: int64, callback_: AsyncCallback<int64>): void {
            const resId_casted = resId as (int64)
            const callback__casted = callback_ as (AsyncCallback<int64>)
            this.getColor0_serialize(resId_casted, callback__casted)
            return
        }
        public getColor(resId: int64): Promise<int64> {
            const resId_casted = resId as (int64)
            return this.getColor1_serialize(resId_casted)
        }
        public getColorByName(resName: string, callback_: AsyncCallback<int64>): void {
            const resName_casted = resName as (string)
            const callback__casted = callback_ as (AsyncCallback<int64>)
            this.getColorByName0_serialize(resName_casted, callback__casted)
            return
        }
        public getColorByName(resName: string): Promise<int64> {
            const resName_casted = resName as (string)
            return this.getColorByName1_serialize(resName_casted)
        }
        public getColorSync(resId: int64): int64 {
            const resId_casted = resId as (int64)
            return this.getColorSync_serialize(resId_casted)
        }
        public getColorByNameSync(resName: string): int64 {
            const resName_casted = resName as (string)
            return this.getColorByNameSync_serialize(resName_casted)
        }
        public addResource(path: string): void {
            const path_casted = path as (string)
            this.addResource_serialize(path_casted)
            return
        }
        public removeResource(path: string): void {
            const path_casted = path as (string)
            this.removeResource_serialize(path_casted)
            return
        }
        public getRawFdSync(path: string): RawFileDescriptor {
            const path_casted = path as (string)
            return this.getRawFdSync_serialize(path_casted)
        }
        public closeRawFdSync(path: string): void {
            const path_casted = path as (string)
            this.closeRawFdSync_serialize(path_casted)
            return
        }
        public getRawFileListSync(path: string): Array<string> {
            const path_casted = path as (string)
            return this.getRawFileListSync_serialize(path_casted)
        }
        public getRawFileContentSync(path: string): ArrayBuffer {
            const path_casted = path as (string)
            return this.getRawFileContentSync_serialize(path_casted)
        }
        public getMediaContentSync(resId: int64, density?: int32): ArrayBuffer {
            const resId_casted = resId as (int64)
            const density_casted = density as (int32 | undefined)
            return this.getMediaContentSync_serialize(resId_casted, density_casted)
        }
        public getMediaContentBase64Sync(resId: int64, density?: int32): string {
            const resId_casted = resId as (int64)
            const density_casted = density as (int32 | undefined)
            return this.getMediaContentBase64Sync_serialize(resId_casted, density_casted)
        }
        public getStringArrayValueSync(resId: int64): Array<string> {
            const resId_casted = resId as (int64)
            return this.getStringArrayValueSync_serialize(resId_casted)
        }
        public getMediaByNameSync(resName: string, density?: int32): ArrayBuffer {
            const resName_casted = resName as (string)
            const density_casted = density as (int32 | undefined)
            return this.getMediaByNameSync_serialize(resName_casted, density_casted)
        }
        public getMediaBase64ByNameSync(resName: string, density?: int32): string {
            const resName_casted = resName as (string)
            const density_casted = density as (int32 | undefined)
            return this.getMediaBase64ByNameSync_serialize(resName_casted, density_casted)
        }
        public getStringArrayByNameSync(resName: string): Array<string> {
            const resName_casted = resName as (string)
            return this.getStringArrayByNameSync_serialize(resName_casted)
        }
        public getConfigurationSync(): Configuration {
            return this.getConfigurationSync_serialize()
        }
        public getDeviceCapabilitySync(): DeviceCapability {
            return this.getDeviceCapabilitySync_serialize()
        }
        public getLocales(includeSystem?: boolean): Array<string> {
            const includeSystem_casted = includeSystem as (boolean | undefined)
            return this.getLocales_serialize(includeSystem_casted)
        }
        public getSymbol(resId: int64): int64 {
            const resId_casted = resId as (int64)
            return this.getSymbol_serialize(resId_casted)
        }
        public getSymbolByName(resName: string): int64 {
            const resName_casted = resName as (string)
            return this.getSymbolByName_serialize(resName_casted)
        }
        public isRawDir(path: string): boolean {
            const path_casted = path as (string)
            return this.isRawDir_serialize(path_casted)
        }
        public getOverrideResourceManager(configuration?: Configuration): ResourceManager {
            const configuration_casted = configuration as (Configuration | undefined)
            return this.getOverrideResourceManager_serialize(configuration_casted)
        }
        public getOverrideConfiguration(): Configuration {
            return this.getOverrideConfiguration_serialize()
        }
        public updateOverrideConfiguration(configuration: Configuration): void {
            const configuration_casted = configuration as (Configuration)
            this.updateOverrideConfiguration_serialize(configuration_casted)
            return
        }
        getDeviceCapability0_serialize(callback_: AsyncCallback<DeviceCapability>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getDeviceCapability0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getDeviceCapability1_serialize(): Promise<DeviceCapability> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<DeviceCapability>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getDeviceCapability1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getConfiguration0_serialize(callback_: AsyncCallback<Configuration>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getConfiguration0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getConfiguration1_serialize(): Promise<Configuration> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<Configuration>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getConfiguration1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getStringByName0_serialize(resName: string, callback_: AsyncCallback<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringByName0(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getStringByName1_serialize(resName: string): Promise<string> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<string>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringByName1(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getStringArrayByName0_serialize(resName: string, callback_: AsyncCallback<Array<string>>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringArrayByName0(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getStringArrayByName1_serialize(resName: string): Promise<Array<string>> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<Array<string>>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringArrayByName1(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getMediaByName0_serialize(resName: string, callback_: AsyncCallback<ArrayBuffer>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaByName0(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getMediaByName1_serialize(resName: string, density: int32, callback_: AsyncCallback<ArrayBuffer>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaByName1(this.peer!.ptr, resName, density, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getMediaByName2_serialize(resName: string): Promise<ArrayBuffer> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<ArrayBuffer>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaByName2(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getMediaByName3_serialize(resName: string, density: int32): Promise<ArrayBuffer> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<ArrayBuffer>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaByName3(this.peer!.ptr, resName, density, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getMediaBase64ByName0_serialize(resName: string, callback_: AsyncCallback<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaBase64ByName0(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getMediaBase64ByName1_serialize(resName: string, density: int32, callback_: AsyncCallback<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaBase64ByName1(this.peer!.ptr, resName, density, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getMediaBase64ByName2_serialize(resName: string): Promise<string> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<string>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaBase64ByName2(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getMediaBase64ByName3_serialize(resName: string, density: int32): Promise<string> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<string>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaBase64ByName3(this.peer!.ptr, resName, density, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getStringSync0_serialize(resId: int64): string {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringSync0(this.peer!.ptr, resId)
            return retval
        }
        getStringSync1_serialize(resId: int64, args: Array<string | double>): string {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((args.length).toInt())
            for (let argsCounterI = 0; argsCounterI < args.length; argsCounterI++) {
                const argsTmpElement : string | double = args[argsCounterI]
                if (argsTmpElement instanceof string) {
                    thisSerializer.writeInt8((0).toChar())
                    const argsTmpElementForIdx0  = argsTmpElement as string
                    thisSerializer.writeString(argsTmpElementForIdx0)
                } else if (argsTmpElement instanceof double) {
                    thisSerializer.writeInt8((1).toChar())
                    const argsTmpElementForIdx1  = argsTmpElement as double
                    thisSerializer.writeFloat64(argsTmpElementForIdx1)
                }
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringSync1(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getStringByNameSync0_serialize(resName: string): string {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringByNameSync0(this.peer!.ptr, resName)
            return retval
        }
        getStringByNameSync1_serialize(resName: string, args: Array<string | double>): string {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((args.length).toInt())
            for (let argsCounterI = 0; argsCounterI < args.length; argsCounterI++) {
                const argsTmpElement : string | double = args[argsCounterI]
                if (argsTmpElement instanceof string) {
                    thisSerializer.writeInt8((0).toChar())
                    const argsTmpElementForIdx0  = argsTmpElement as string
                    thisSerializer.writeString(argsTmpElementForIdx0)
                } else if (argsTmpElement instanceof double) {
                    thisSerializer.writeInt8((1).toChar())
                    const argsTmpElementForIdx1  = argsTmpElement as double
                    thisSerializer.writeFloat64(argsTmpElementForIdx1)
                }
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringByNameSync1(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getBoolean_serialize(resId: int64): boolean {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getBoolean(this.peer!.ptr, resId)
            return retval
        }
        getBooleanByName_serialize(resName: string): boolean {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getBooleanByName(this.peer!.ptr, resName)
            return retval
        }
        getInt_serialize(resId: int64): int32 {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getInt(this.peer!.ptr, resId)
            return retval
        }
        getDouble_serialize(resId: int64): double {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getDouble(this.peer!.ptr, resId)
            return retval
        }
        getIntByName_serialize(resName: string): int32 {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getIntByName(this.peer!.ptr, resName)
            return retval
        }
        getDoubleByName_serialize(resName: string): double {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getDoubleByName(this.peer!.ptr, resName)
            return retval
        }
        getStringValue0_serialize(resId: int64, callback_: AsyncCallback<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringValue0(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getStringValue1_serialize(resId: int64): Promise<string> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<string>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringValue1(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getStringArrayValue0_serialize(resId: int64, callback_: AsyncCallback<Array<string>>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringArrayValue0(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getStringArrayValue1_serialize(resId: int64): Promise<Array<string>> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<Array<string>>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringArrayValue1(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getIntPluralStringValueSync_serialize(resId: int64, num: int32, args: Array<string | double>): string {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((args.length).toInt())
            for (let argsCounterI = 0; argsCounterI < args.length; argsCounterI++) {
                const argsTmpElement : string | double = args[argsCounterI]
                if (argsTmpElement instanceof string) {
                    thisSerializer.writeInt8((0).toChar())
                    const argsTmpElementForIdx0  = argsTmpElement as string
                    thisSerializer.writeString(argsTmpElementForIdx0)
                } else if (argsTmpElement instanceof double) {
                    thisSerializer.writeInt8((1).toChar())
                    const argsTmpElementForIdx1  = argsTmpElement as double
                    thisSerializer.writeFloat64(argsTmpElementForIdx1)
                }
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getIntPluralStringValueSync(this.peer!.ptr, resId, num, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getIntPluralStringByNameSync_serialize(resName: string, num: int32, args: Array<string | double>): string {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((args.length).toInt())
            for (let argsCounterI = 0; argsCounterI < args.length; argsCounterI++) {
                const argsTmpElement : string | double = args[argsCounterI]
                if (argsTmpElement instanceof string) {
                    thisSerializer.writeInt8((0).toChar())
                    const argsTmpElementForIdx0  = argsTmpElement as string
                    thisSerializer.writeString(argsTmpElementForIdx0)
                } else if (argsTmpElement instanceof double) {
                    thisSerializer.writeInt8((1).toChar())
                    const argsTmpElementForIdx1  = argsTmpElement as double
                    thisSerializer.writeFloat64(argsTmpElementForIdx1)
                }
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getIntPluralStringByNameSync(this.peer!.ptr, resName, num, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getDoublePluralStringValueSync_serialize(resId: int64, num: double, args: Array<string | double>): string {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((args.length).toInt())
            for (let argsCounterI = 0; argsCounterI < args.length; argsCounterI++) {
                const argsTmpElement : string | double = args[argsCounterI]
                if (argsTmpElement instanceof string) {
                    thisSerializer.writeInt8((0).toChar())
                    const argsTmpElementForIdx0  = argsTmpElement as string
                    thisSerializer.writeString(argsTmpElementForIdx0)
                } else if (argsTmpElement instanceof double) {
                    thisSerializer.writeInt8((1).toChar())
                    const argsTmpElementForIdx1  = argsTmpElement as double
                    thisSerializer.writeFloat64(argsTmpElementForIdx1)
                }
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getDoublePluralStringValueSync(this.peer!.ptr, resId, num, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getDoublePluralStringByNameSync_serialize(resName: string, num: double, args: Array<string | double>): string {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((args.length).toInt())
            for (let argsCounterI = 0; argsCounterI < args.length; argsCounterI++) {
                const argsTmpElement : string | double = args[argsCounterI]
                if (argsTmpElement instanceof string) {
                    thisSerializer.writeInt8((0).toChar())
                    const argsTmpElementForIdx0  = argsTmpElement as string
                    thisSerializer.writeString(argsTmpElementForIdx0)
                } else if (argsTmpElement instanceof double) {
                    thisSerializer.writeInt8((1).toChar())
                    const argsTmpElementForIdx1  = argsTmpElement as double
                    thisSerializer.writeFloat64(argsTmpElementForIdx1)
                }
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getDoublePluralStringByNameSync(this.peer!.ptr, resName, num, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getMediaContent0_serialize(resId: int64, callback_: AsyncCallback<ArrayBuffer>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaContent0(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getMediaContent1_serialize(resId: int64, density: int32, callback_: AsyncCallback<ArrayBuffer>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaContent1(this.peer!.ptr, resId, density, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getMediaContent2_serialize(resId: int64): Promise<ArrayBuffer> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<ArrayBuffer>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaContent2(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getMediaContent3_serialize(resId: int64, density: int32): Promise<ArrayBuffer> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<ArrayBuffer>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaContent3(this.peer!.ptr, resId, density, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getMediaContentBase640_serialize(resId: int64, callback_: AsyncCallback<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaContentBase640(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getMediaContentBase641_serialize(resId: int64, density: int32, callback_: AsyncCallback<string>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaContentBase641(this.peer!.ptr, resId, density, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getMediaContentBase642_serialize(resId: int64): Promise<string> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<string>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaContentBase642(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getMediaContentBase643_serialize(resId: int64, density: int32): Promise<string> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<string>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaContentBase643(this.peer!.ptr, resId, density, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getRawFileContent0_serialize(path: string, callback_: AsyncCallback<ArrayBuffer>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getRawFileContent0(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getRawFileContent1_serialize(path: string): Promise<ArrayBuffer> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<ArrayBuffer>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getRawFileContent1(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getRawFd0_serialize(path: string, callback_: AsyncCallback<RawFileDescriptor>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getRawFd0(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getRawFd1_serialize(path: string): Promise<RawFileDescriptor> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<RawFileDescriptor>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getRawFd1(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        closeRawFd0_serialize(path: string, callback_: AsyncCallback<void>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_closeRawFd0(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        closeRawFd1_serialize(path: string): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_closeRawFd1(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getDrawableDescriptor_serialize(resId: int64, density?: int32, type?: int32): DrawableDescriptor {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (density !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const densityTmpValue  = density!
                thisSerializer.writeInt32(densityTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (type !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const typeTmpValue  = type!
                thisSerializer.writeInt32(typeTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getDrawableDescriptor(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            const obj : DrawableDescriptor = extractors.fromDrawableDescriptorPtr(retval)
            return obj
        }
        getDrawableDescriptorByName_serialize(resName: string, density?: int32, type?: int32): DrawableDescriptor {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (density !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const densityTmpValue  = density!
                thisSerializer.writeInt32(densityTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            if (type !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const typeTmpValue  = type!
                thisSerializer.writeInt32(typeTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getDrawableDescriptorByName(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            const obj : DrawableDescriptor = extractors.fromDrawableDescriptorPtr(retval)
            return obj
        }
        getRawFileList0_serialize(path: string, callback_: AsyncCallback<Array<string>>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getRawFileList0(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getRawFileList1_serialize(path: string): Promise<Array<string>> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<Array<string>>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getRawFileList1(this.peer!.ptr, path, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getColor0_serialize(resId: int64, callback_: AsyncCallback<int64>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getColor0(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getColor1_serialize(resId: int64): Promise<int64> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<int64>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getColor1(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getColorByName0_serialize(resName: string, callback_: AsyncCallback<int64>): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getColorByName0(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        getColorByName1_serialize(resName: string): Promise<int64> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromise<int64>()[0]
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getColorByName1(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getColorSync_serialize(resId: int64): int64 {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getColorSync(this.peer!.ptr, resId)
            return retval
        }
        getColorByNameSync_serialize(resName: string): int64 {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getColorByNameSync(this.peer!.ptr, resName)
            return retval
        }
        addResource_serialize(path: string): void {
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_addResource(this.peer!.ptr, path)
        }
        removeResource_serialize(path: string): void {
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_removeResource(this.peer!.ptr, path)
        }
        getRawFdSync_serialize(path: string): RawFileDescriptor {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getRawFdSync(this.peer!.ptr, path)
            throw new Error("Object deserialization is not implemented.")
        }
        closeRawFdSync_serialize(path: string): void {
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_closeRawFdSync(this.peer!.ptr, path)
        }
        getRawFileListSync_serialize(path: string): Array<string> {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getRawFileListSync(this.peer!.ptr, path)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<string> = new Array<string>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                buffer[bufferBufCounterI] = (retvalDeserializer.readString() as string)
            }
            const returnResult : Array<string> = buffer
            return returnResult
        }
        getRawFileContentSync_serialize(path: string): ArrayBuffer {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getRawFileContentSync(this.peer!.ptr, path)
            return new DeserializerBase(retval, retval.length).readBuffer()
        }
        getMediaContentSync_serialize(resId: int64, density?: int32): ArrayBuffer {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (density !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const densityTmpValue  = density!
                thisSerializer.writeInt32(densityTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaContentSync(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return new DeserializerBase(retval, retval.length).readBuffer()
        }
        getMediaContentBase64Sync_serialize(resId: int64, density?: int32): string {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (density !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const densityTmpValue  = density!
                thisSerializer.writeInt32(densityTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaContentBase64Sync(this.peer!.ptr, resId, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getStringArrayValueSync_serialize(resId: int64): Array<string> {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringArrayValueSync(this.peer!.ptr, resId)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<string> = new Array<string>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                buffer[bufferBufCounterI] = (retvalDeserializer.readString() as string)
            }
            const returnResult : Array<string> = buffer
            return returnResult
        }
        getMediaByNameSync_serialize(resName: string, density?: int32): ArrayBuffer {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (density !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const densityTmpValue  = density!
                thisSerializer.writeInt32(densityTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaByNameSync(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return new DeserializerBase(retval, retval.length).readBuffer()
        }
        getMediaBase64ByNameSync_serialize(resName: string, density?: int32): string {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (density !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const densityTmpValue  = density!
                thisSerializer.writeInt32(densityTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getMediaBase64ByNameSync(this.peer!.ptr, resName, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        getStringArrayByNameSync_serialize(resName: string): Array<string> {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getStringArrayByNameSync(this.peer!.ptr, resName)
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<string> = new Array<string>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                buffer[bufferBufCounterI] = (retvalDeserializer.readString() as string)
            }
            const returnResult : Array<string> = buffer
            return returnResult
        }
        getConfigurationSync_serialize(): Configuration {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getConfigurationSync(this.peer!.ptr)
            const obj : Configuration = extractors.fromResourceManagerConfigurationPtr(retval)
            return obj
        }
        getDeviceCapabilitySync_serialize(): DeviceCapability {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getDeviceCapabilitySync(this.peer!.ptr)
            const obj : DeviceCapability = extractors.fromResourceManagerDeviceCapabilityPtr(retval)
            return obj
        }
        getLocales_serialize(includeSystem?: boolean): Array<string> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (includeSystem !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const includeSystemTmpValue  = includeSystem!
                thisSerializer.writeBoolean(includeSystemTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getLocales(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferLength : int32 = retvalDeserializer.readInt32()
            let buffer : Array<string> = new Array<string>(bufferLength)
            for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
                buffer[bufferBufCounterI] = (retvalDeserializer.readString() as string)
            }
            const returnResult : Array<string> = buffer
            return returnResult
        }
        getSymbol_serialize(resId: int64): int64 {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getSymbol(this.peer!.ptr, resId)
            return retval
        }
        getSymbolByName_serialize(resName: string): int64 {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getSymbolByName(this.peer!.ptr, resName)
            return retval
        }
        isRawDir_serialize(path: string): boolean {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_isRawDir(this.peer!.ptr, path)
            return retval
        }
        getOverrideResourceManager_serialize(configuration?: Configuration): ResourceManager {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (configuration !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const configurationTmpValue  = configuration!
                resourceManager_Configuration_serializer.write(thisSerializer, configurationTmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getOverrideResourceManager(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            const obj : ResourceManager = extractors.fromResourceManagerResourceManagerPtr(retval)
            return obj
        }
        getOverrideConfiguration_serialize(): Configuration {
            const retval  = OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_getOverrideConfiguration(this.peer!.ptr)
            const obj : Configuration = extractors.fromResourceManagerConfigurationPtr(retval)
            return obj
        }
        updateOverrideConfiguration_serialize(configuration: Configuration): void {
            OHOS_RESOURCEMANAGERNativeModule._resourceManager_ResourceManager_updateOverrideConfiguration(this.peer!.ptr, extractors.toResourceManagerConfigurationPtr(configuration))
        }
    }
    export enum Direction {
        DIRECTION_VERTICAL = 0,
        DIRECTION_HORIZONTAL = 1
    }
    export enum DeviceType {
        DEVICE_TYPE_PHONE = 0,
        DEVICE_TYPE_TABLET = 1,
        DEVICE_TYPE_CAR = 2,
        DEVICE_TYPE_PC = 3,
        DEVICE_TYPE_TV = 4,
        DEVICE_TYPE_WEARABLE = 6,
        DEVICE_TYPE_2IN1 = 7
    }
    export enum ScreenDensity {
        SCREEN_SDPI = 120,
        SCREEN_MDPI = 160,
        SCREEN_LDPI = 240,
        SCREEN_XLDPI = 320,
        SCREEN_XXLDPI = 480,
        SCREEN_XXXLDPI = 640
    }
    export enum ColorMode {
        DARK = 0,
        LIGHT = 1
    }
    export type RawFileDescriptor = object;
}
