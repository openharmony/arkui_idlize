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
import { image_PixelMap_serializer, TypeChecker, OHOS_APP_ABILITY_STARTOPTIONSNativeModule } from "./ohos.app.ability.StartOptions.INTERNAL"
import { default as contextConstant } from "@ohos.app.ability.contextConstant"
import { extractors } from "#handwritten"
import { default as image } from "@ohos.multimedia.image"
import { default as bundleManager } from "@ohos.bundle.bundleManager"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export class StartOptionsInternal {
    public static fromPtr(ptr: KPointer): StartOptions {
        return new StartOptions(ptr)
    }
}
export class StartOptions implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    get windowMode(): int32 | undefined {
        return this.getWindowMode()
    }
    set windowMode(windowMode: int32 | undefined) {
        const windowMode_NonNull  = (windowMode as int32 | undefined)
        this.setWindowMode(windowMode_NonNull)
    }
    get displayId(): int64 | undefined {
        return this.getDisplayId()
    }
    set displayId(displayId: int64 | undefined) {
        const displayId_NonNull  = (displayId as int64 | undefined)
        this.setDisplayId(displayId_NonNull)
    }
    get withAnimation(): boolean | undefined {
        return this.getWithAnimation()
    }
    set withAnimation(withAnimation: boolean | undefined) {
        const withAnimation_NonNull  = (withAnimation as boolean | undefined)
        this.setWithAnimation(withAnimation_NonNull)
    }
    get windowLeft(): int32 | undefined {
        return this.getWindowLeft()
    }
    set windowLeft(windowLeft: int32 | undefined) {
        const windowLeft_NonNull  = (windowLeft as int32 | undefined)
        this.setWindowLeft(windowLeft_NonNull)
    }
    get windowTop(): int32 | undefined {
        return this.getWindowTop()
    }
    set windowTop(windowTop: int32 | undefined) {
        const windowTop_NonNull  = (windowTop as int32 | undefined)
        this.setWindowTop(windowTop_NonNull)
    }
    get windowWidth(): int32 | undefined {
        return this.getWindowWidth()
    }
    set windowWidth(windowWidth: int32 | undefined) {
        const windowWidth_NonNull  = (windowWidth as int32 | undefined)
        this.setWindowWidth(windowWidth_NonNull)
    }
    get windowHeight(): int32 | undefined {
        return this.getWindowHeight()
    }
    set windowHeight(windowHeight: int32 | undefined) {
        const windowHeight_NonNull  = (windowHeight as int32 | undefined)
        this.setWindowHeight(windowHeight_NonNull)
    }
    get windowFocused(): boolean | undefined {
        return this.getWindowFocused()
    }
    set windowFocused(windowFocused: boolean | undefined) {
        const windowFocused_NonNull  = (windowFocused as boolean | undefined)
        this.setWindowFocused(windowFocused_NonNull)
    }
    get processMode(): contextConstant.ProcessMode | undefined {
        return this.getProcessMode()
    }
    set processMode(processMode: contextConstant.ProcessMode | undefined) {
        const processMode_NonNull  = (processMode as contextConstant.ProcessMode | undefined)
        this.setProcessMode(processMode_NonNull)
    }
    get startupVisibility(): contextConstant.StartupVisibility | undefined {
        return this.getStartupVisibility()
    }
    set startupVisibility(startupVisibility: contextConstant.StartupVisibility | undefined) {
        const startupVisibility_NonNull  = (startupVisibility as contextConstant.StartupVisibility | undefined)
        this.setStartupVisibility(startupVisibility_NonNull)
    }
    get startWindowIcon(): image.PixelMap | undefined {
        return this.getStartWindowIcon()
    }
    set startWindowIcon(startWindowIcon: image.PixelMap | undefined) {
        const startWindowIcon_NonNull  = (startWindowIcon as image.PixelMap | undefined)
        this.setStartWindowIcon(startWindowIcon_NonNull)
    }
    get startWindowBackgroundColor(): string | undefined {
        return this.getStartWindowBackgroundColor()
    }
    set startWindowBackgroundColor(startWindowBackgroundColor: string | undefined) {
        const startWindowBackgroundColor_NonNull  = (startWindowBackgroundColor as string | undefined)
        this.setStartWindowBackgroundColor(startWindowBackgroundColor_NonNull)
    }
    get supportWindowModes(): Array<bundleManager.SupportWindowMode> | undefined {
        return this.getSupportWindowModes()
    }
    set supportWindowModes(supportWindowModes: Array<bundleManager.SupportWindowMode> | undefined) {
        const supportWindowModes_NonNull  = (supportWindowModes as Array<bundleManager.SupportWindowMode> | undefined)
        this.setSupportWindowModes(supportWindowModes_NonNull)
    }
    get minWindowWidth(): int32 | undefined {
        return this.getMinWindowWidth()
    }
    set minWindowWidth(minWindowWidth: int32 | undefined) {
        const minWindowWidth_NonNull  = (minWindowWidth as int32 | undefined)
        this.setMinWindowWidth(minWindowWidth_NonNull)
    }
    get minWindowHeight(): int32 | undefined {
        return this.getMinWindowHeight()
    }
    set minWindowHeight(minWindowHeight: int32 | undefined) {
        const minWindowHeight_NonNull  = (minWindowHeight as int32 | undefined)
        this.setMinWindowHeight(minWindowHeight_NonNull)
    }
    get maxWindowWidth(): int32 | undefined {
        return this.getMaxWindowWidth()
    }
    set maxWindowWidth(maxWindowWidth: int32 | undefined) {
        const maxWindowWidth_NonNull  = (maxWindowWidth as int32 | undefined)
        this.setMaxWindowWidth(maxWindowWidth_NonNull)
    }
    get maxWindowHeight(): int32 | undefined {
        return this.getMaxWindowHeight()
    }
    set maxWindowHeight(maxWindowHeight: int32 | undefined) {
        const maxWindowHeight_NonNull  = (maxWindowHeight as int32 | undefined)
        this.setMaxWindowHeight(maxWindowHeight_NonNull)
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, StartOptions.getFinalizer())
    }
    constructor() {
        this(StartOptions.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getFinalizer()
    }
    private getWindowMode(): int32 | undefined {
        return this.getWindowMode_serialize()
    }
    private setWindowMode(windowMode: int32 | undefined): void {
        const windowMode_casted = windowMode as (int32 | undefined)
        this.setWindowMode_serialize(windowMode_casted)
        return
    }
    private getDisplayId(): int64 | undefined {
        return this.getDisplayId_serialize()
    }
    private setDisplayId(displayId: int64 | undefined): void {
        const displayId_casted = displayId as (int64 | undefined)
        this.setDisplayId_serialize(displayId_casted)
        return
    }
    private getWithAnimation(): boolean | undefined {
        return this.getWithAnimation_serialize()
    }
    private setWithAnimation(withAnimation: boolean | undefined): void {
        const withAnimation_casted = withAnimation as (boolean | undefined)
        this.setWithAnimation_serialize(withAnimation_casted)
        return
    }
    private getWindowLeft(): int32 | undefined {
        return this.getWindowLeft_serialize()
    }
    private setWindowLeft(windowLeft: int32 | undefined): void {
        const windowLeft_casted = windowLeft as (int32 | undefined)
        this.setWindowLeft_serialize(windowLeft_casted)
        return
    }
    private getWindowTop(): int32 | undefined {
        return this.getWindowTop_serialize()
    }
    private setWindowTop(windowTop: int32 | undefined): void {
        const windowTop_casted = windowTop as (int32 | undefined)
        this.setWindowTop_serialize(windowTop_casted)
        return
    }
    private getWindowWidth(): int32 | undefined {
        return this.getWindowWidth_serialize()
    }
    private setWindowWidth(windowWidth: int32 | undefined): void {
        const windowWidth_casted = windowWidth as (int32 | undefined)
        this.setWindowWidth_serialize(windowWidth_casted)
        return
    }
    private getWindowHeight(): int32 | undefined {
        return this.getWindowHeight_serialize()
    }
    private setWindowHeight(windowHeight: int32 | undefined): void {
        const windowHeight_casted = windowHeight as (int32 | undefined)
        this.setWindowHeight_serialize(windowHeight_casted)
        return
    }
    private getWindowFocused(): boolean | undefined {
        return this.getWindowFocused_serialize()
    }
    private setWindowFocused(windowFocused: boolean | undefined): void {
        const windowFocused_casted = windowFocused as (boolean | undefined)
        this.setWindowFocused_serialize(windowFocused_casted)
        return
    }
    private getProcessMode(): contextConstant.ProcessMode | undefined {
        return this.getProcessMode_serialize()
    }
    private setProcessMode(processMode: contextConstant.ProcessMode | undefined): void {
        const processMode_casted = processMode as (contextConstant.ProcessMode | undefined)
        this.setProcessMode_serialize(processMode_casted)
        return
    }
    private getStartupVisibility(): contextConstant.StartupVisibility | undefined {
        return this.getStartupVisibility_serialize()
    }
    private setStartupVisibility(startupVisibility: contextConstant.StartupVisibility | undefined): void {
        const startupVisibility_casted = startupVisibility as (contextConstant.StartupVisibility | undefined)
        this.setStartupVisibility_serialize(startupVisibility_casted)
        return
    }
    private getStartWindowIcon(): image.PixelMap | undefined {
        return this.getStartWindowIcon_serialize()
    }
    private setStartWindowIcon(startWindowIcon: image.PixelMap | undefined): void {
        const startWindowIcon_casted = startWindowIcon as (image.PixelMap | undefined)
        this.setStartWindowIcon_serialize(startWindowIcon_casted)
        return
    }
    private getStartWindowBackgroundColor(): string | undefined {
        return this.getStartWindowBackgroundColor_serialize()
    }
    private setStartWindowBackgroundColor(startWindowBackgroundColor: string | undefined): void {
        const startWindowBackgroundColor_casted = startWindowBackgroundColor as (string | undefined)
        this.setStartWindowBackgroundColor_serialize(startWindowBackgroundColor_casted)
        return
    }
    private getSupportWindowModes(): Array<bundleManager.SupportWindowMode> | undefined {
        return this.getSupportWindowModes_serialize()
    }
    private setSupportWindowModes(supportWindowModes: Array<bundleManager.SupportWindowMode> | undefined): void {
        const supportWindowModes_casted = supportWindowModes as (Array<bundleManager.SupportWindowMode> | undefined)
        this.setSupportWindowModes_serialize(supportWindowModes_casted)
        return
    }
    private getMinWindowWidth(): int32 | undefined {
        return this.getMinWindowWidth_serialize()
    }
    private setMinWindowWidth(minWindowWidth: int32 | undefined): void {
        const minWindowWidth_casted = minWindowWidth as (int32 | undefined)
        this.setMinWindowWidth_serialize(minWindowWidth_casted)
        return
    }
    private getMinWindowHeight(): int32 | undefined {
        return this.getMinWindowHeight_serialize()
    }
    private setMinWindowHeight(minWindowHeight: int32 | undefined): void {
        const minWindowHeight_casted = minWindowHeight as (int32 | undefined)
        this.setMinWindowHeight_serialize(minWindowHeight_casted)
        return
    }
    private getMaxWindowWidth(): int32 | undefined {
        return this.getMaxWindowWidth_serialize()
    }
    private setMaxWindowWidth(maxWindowWidth: int32 | undefined): void {
        const maxWindowWidth_casted = maxWindowWidth as (int32 | undefined)
        this.setMaxWindowWidth_serialize(maxWindowWidth_casted)
        return
    }
    private getMaxWindowHeight(): int32 | undefined {
        return this.getMaxWindowHeight_serialize()
    }
    private setMaxWindowHeight(maxWindowHeight: int32 | undefined): void {
        const maxWindowHeight_casted = maxWindowHeight as (int32 | undefined)
        this.setMaxWindowHeight_serialize(maxWindowHeight_casted)
        return
    }
    private getWindowMode_serialize(): int32 | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getWindowMode(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : int32 | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = retvalDeserializer.readInt32()
        }
        const returnResult : int32 | undefined = buffer
        return returnResult
    }
    private setWindowMode_serialize(windowMode: int32 | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (windowMode !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const windowModeTmpValue  = windowMode!
            thisSerializer.writeInt32(windowModeTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setWindowMode(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getDisplayId_serialize(): int64 | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getDisplayId(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : int64 | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = retvalDeserializer.readInt64()
        }
        const returnResult : int64 | undefined = buffer
        return returnResult
    }
    private setDisplayId_serialize(displayId: int64 | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (displayId !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const displayIdTmpValue  = displayId!
            thisSerializer.writeInt64(displayIdTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setDisplayId(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getWithAnimation_serialize(): boolean | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getWithAnimation(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : boolean | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = retvalDeserializer.readBoolean()
        }
        const returnResult : boolean | undefined = buffer
        return returnResult
    }
    private setWithAnimation_serialize(withAnimation: boolean | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (withAnimation !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const withAnimationTmpValue  = withAnimation!
            thisSerializer.writeBoolean(withAnimationTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setWithAnimation(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getWindowLeft_serialize(): int32 | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getWindowLeft(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : int32 | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = retvalDeserializer.readInt32()
        }
        const returnResult : int32 | undefined = buffer
        return returnResult
    }
    private setWindowLeft_serialize(windowLeft: int32 | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (windowLeft !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const windowLeftTmpValue  = windowLeft!
            thisSerializer.writeInt32(windowLeftTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setWindowLeft(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getWindowTop_serialize(): int32 | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getWindowTop(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : int32 | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = retvalDeserializer.readInt32()
        }
        const returnResult : int32 | undefined = buffer
        return returnResult
    }
    private setWindowTop_serialize(windowTop: int32 | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (windowTop !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const windowTopTmpValue  = windowTop!
            thisSerializer.writeInt32(windowTopTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setWindowTop(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getWindowWidth_serialize(): int32 | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getWindowWidth(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : int32 | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = retvalDeserializer.readInt32()
        }
        const returnResult : int32 | undefined = buffer
        return returnResult
    }
    private setWindowWidth_serialize(windowWidth: int32 | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (windowWidth !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const windowWidthTmpValue  = windowWidth!
            thisSerializer.writeInt32(windowWidthTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setWindowWidth(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getWindowHeight_serialize(): int32 | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getWindowHeight(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : int32 | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = retvalDeserializer.readInt32()
        }
        const returnResult : int32 | undefined = buffer
        return returnResult
    }
    private setWindowHeight_serialize(windowHeight: int32 | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (windowHeight !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const windowHeightTmpValue  = windowHeight!
            thisSerializer.writeInt32(windowHeightTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setWindowHeight(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getWindowFocused_serialize(): boolean | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getWindowFocused(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : boolean | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = retvalDeserializer.readBoolean()
        }
        const returnResult : boolean | undefined = buffer
        return returnResult
    }
    private setWindowFocused_serialize(windowFocused: boolean | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (windowFocused !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const windowFocusedTmpValue  = windowFocused!
            thisSerializer.writeBoolean(windowFocusedTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setWindowFocused(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getProcessMode_serialize(): contextConstant.ProcessMode | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getProcessMode(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : contextConstant.ProcessMode | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = TypeChecker.contextConstant_ProcessMode_FromNumeric(retvalDeserializer.readInt32())
        }
        const returnResult : contextConstant.ProcessMode | undefined = buffer
        return returnResult
    }
    private setProcessMode_serialize(processMode: contextConstant.ProcessMode | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (processMode !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const processModeTmpValue  = (processMode as contextConstant.ProcessMode)
            thisSerializer.writeInt32(TypeChecker.contextConstant_ProcessMode_ToNumeric(processModeTmpValue))
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setProcessMode(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getStartupVisibility_serialize(): contextConstant.StartupVisibility | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getStartupVisibility(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : contextConstant.StartupVisibility | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = TypeChecker.contextConstant_StartupVisibility_FromNumeric(retvalDeserializer.readInt32())
        }
        const returnResult : contextConstant.StartupVisibility | undefined = buffer
        return returnResult
    }
    private setStartupVisibility_serialize(startupVisibility: contextConstant.StartupVisibility | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (startupVisibility !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const startupVisibilityTmpValue  = (startupVisibility as contextConstant.StartupVisibility)
            thisSerializer.writeInt32(TypeChecker.contextConstant_StartupVisibility_ToNumeric(startupVisibilityTmpValue))
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setStartupVisibility(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getStartWindowIcon_serialize(): image.PixelMap | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getStartWindowIcon(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : image.PixelMap | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (image_PixelMap_serializer.read(retvalDeserializer) as image.PixelMap)
        }
        const returnResult : image.PixelMap | undefined = buffer
        return returnResult
    }
    private setStartWindowIcon_serialize(startWindowIcon: image.PixelMap | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (startWindowIcon !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const startWindowIconTmpValue  = startWindowIcon!
            image_PixelMap_serializer.write(thisSerializer, startWindowIconTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setStartWindowIcon(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getStartWindowBackgroundColor_serialize(): string | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getStartWindowBackgroundColor(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : string | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readString() as string)
        }
        const returnResult : string | undefined = buffer
        return returnResult
    }
    private setStartWindowBackgroundColor_serialize(startWindowBackgroundColor: string | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (startWindowBackgroundColor !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const startWindowBackgroundColorTmpValue  = startWindowBackgroundColor!
            thisSerializer.writeString(startWindowBackgroundColorTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setStartWindowBackgroundColor(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getSupportWindowModes_serialize(): Array<bundleManager.SupportWindowMode> | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getSupportWindowModes(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : Array<bundleManager.SupportWindowMode> | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            const buffer_Length : int32 = retvalDeserializer.readInt32()
            let buffer_ : Array<bundleManager.SupportWindowMode> = new Array<bundleManager.SupportWindowMode>(buffer_Length)
            for (let buffer_BufCounterI = 0; buffer_BufCounterI < buffer_Length; buffer_BufCounterI++) {
                buffer_[buffer_BufCounterI] = TypeChecker.bundleManager_SupportWindowMode_FromNumeric(retvalDeserializer.readInt32())
            }
            buffer = buffer_
        }
        const returnResult : Array<bundleManager.SupportWindowMode> | undefined = buffer
        return returnResult
    }
    private setSupportWindowModes_serialize(supportWindowModes: Array<bundleManager.SupportWindowMode> | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (supportWindowModes !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const supportWindowModesTmpValue  = supportWindowModes!
            thisSerializer.writeInt32((supportWindowModesTmpValue.length).toInt())
            for (let supportWindowModesTmpValueCounterI = 0; supportWindowModesTmpValueCounterI < supportWindowModesTmpValue.length; supportWindowModesTmpValueCounterI++) {
                const supportWindowModesTmpValueTmpElement : bundleManager.SupportWindowMode = supportWindowModesTmpValue[supportWindowModesTmpValueCounterI]
                thisSerializer.writeInt32(TypeChecker.bundleManager_SupportWindowMode_ToNumeric(supportWindowModesTmpValueTmpElement))
            }
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setSupportWindowModes(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getMinWindowWidth_serialize(): int32 | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getMinWindowWidth(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : int32 | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = retvalDeserializer.readInt32()
        }
        const returnResult : int32 | undefined = buffer
        return returnResult
    }
    private setMinWindowWidth_serialize(minWindowWidth: int32 | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (minWindowWidth !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const minWindowWidthTmpValue  = minWindowWidth!
            thisSerializer.writeInt32(minWindowWidthTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setMinWindowWidth(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getMinWindowHeight_serialize(): int32 | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getMinWindowHeight(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : int32 | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = retvalDeserializer.readInt32()
        }
        const returnResult : int32 | undefined = buffer
        return returnResult
    }
    private setMinWindowHeight_serialize(minWindowHeight: int32 | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (minWindowHeight !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const minWindowHeightTmpValue  = minWindowHeight!
            thisSerializer.writeInt32(minWindowHeightTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setMinWindowHeight(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getMaxWindowWidth_serialize(): int32 | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getMaxWindowWidth(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : int32 | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = retvalDeserializer.readInt32()
        }
        const returnResult : int32 | undefined = buffer
        return returnResult
    }
    private setMaxWindowWidth_serialize(maxWindowWidth: int32 | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (maxWindowWidth !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const maxWindowWidthTmpValue  = maxWindowWidth!
            thisSerializer.writeInt32(maxWindowWidthTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setMaxWindowWidth(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    private getMaxWindowHeight_serialize(): int32 | undefined {
        const retval  = OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_getMaxWindowHeight(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : int32 | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = retvalDeserializer.readInt32()
        }
        const returnResult : int32 | undefined = buffer
        return returnResult
    }
    private setMaxWindowHeight_serialize(maxWindowHeight: int32 | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (maxWindowHeight !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const maxWindowHeightTmpValue  = maxWindowHeight!
            thisSerializer.writeInt32(maxWindowHeightTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_APP_ABILITY_STARTOPTIONSNativeModule._StartOptions_setMaxWindowHeight(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
}
