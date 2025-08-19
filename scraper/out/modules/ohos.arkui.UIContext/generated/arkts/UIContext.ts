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

import { SerializerBase, DeserializerBase, Finalizable, runtimeType, RuntimeType, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"
import { componentSnapshot_SnapshotOptions_serializer, TypeChecker, OHOS_ARKUI_UICONTEXTNativeModule, componentUtils_ComponentInfo_serializer, dragController_DragInfo_serializer, font_FontOptions_serializer, font_FontInfo_serializer, MeasureOptions_serializer, LevelOrder_serializer, promptAction_ShowToastOptions_serializer, promptAction_ShowDialogOptions_serializer, promptAction_ActionMenuOptions_serializer, promptAction_BaseDialogOptions_serializer, promptAction_CustomDialogOptions_serializer, promptAction_DialogController_serializer, promptAction_DialogOptions_serializer, TargetInfo_serializer, router_RouterOptions_serializer, router_RouterState_serializer, router_EnableAlertOptions_serializer, router_NamedRouterOptions_serializer, UIContext_serializer, OverlayManagerOptions_serializer, AnimatorOptions_serializer, SimpleAnimatorOptions_serializer, PageInfo_serializer, uiObserver_NavigationInfo_serializer, DynamicSyncScene_serializer, uiObserver_NavDestinationSwitchObserverOptions_serializer, uiObserver_ObserverOptions_serializer, GestureObserverConfigs_serializer } from "./ohos.arkui.UIContext.INTERNAL"
import { AsyncCallback, BusinessError } from "@ohos.base"
import { extractors } from "#handwritten"
import { default as image } from "@ohos.multimedia.image"
import { default as componentSnapshot } from "@ohos.arkui.componentSnapshot"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { default as componentUtils } from "@ohos.arkui.componentUtils"
import { default as pointer } from "@ohos.multimodalInput.pointer"
import { default as dragController } from "@ohos.arkui.dragController"
import { default as font } from "@ohos.font"
import { MeasureOptions } from "@ohos.measure"
import { default as mediaquery } from "@ohos.mediaquery"
import { LevelOrder, default as promptAction } from "@ohos.promptAction"
import { default as router } from "@ohos.router"
import { AnimatorOptions, SimpleAnimatorOptions, AnimatorResult } from "@ohos.animator"
import { default as uiObserver } from "@ohos.arkui.observer"
import { default as common } from "@ohos.app.ability.common"
import { default as inspector } from "@ohos.arkui.inspector"
export class ComponentSnapshotInternal {
    public static fromPtr(ptr: KPointer): ComponentSnapshot {
        return new ComponentSnapshot(ptr)
    }
}
export class ComponentSnapshot implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, ComponentSnapshot.getFinalizer())
    }
    constructor() {
        this(ComponentSnapshot.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._ComponentSnapshot_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._ComponentSnapshot_getFinalizer()
    }
    public get(id: string, callback_: AsyncCallback<image.PixelMap>, options?: componentSnapshot.SnapshotOptions): void {
        const id_casted = id as (string)
        const callback__casted = callback_ as (AsyncCallback<image.PixelMap>)
        const options_casted = options as (componentSnapshot.SnapshotOptions | undefined)
        this.get0_serialize(id_casted, callback__casted, options_casted)
        return
    }
    public get(id: string, options?: componentSnapshot.SnapshotOptions): Promise<image.PixelMap> {
        const id_casted = id as (string)
        const options_casted = options as (componentSnapshot.SnapshotOptions | undefined)
        return this.get1_serialize(id_casted, options_casted)
    }
    public createFromBuilder(builder: object, callback_: AsyncCallback<image.PixelMap>, delay?: number, checkImageStatus?: boolean, options?: componentSnapshot.SnapshotOptions): void {
        const builder_casted = builder as (object)
        const callback__casted = callback_ as (AsyncCallback<image.PixelMap>)
        const delay_casted = delay as (number | undefined)
        const checkImageStatus_casted = checkImageStatus as (boolean | undefined)
        const options_casted = options as (componentSnapshot.SnapshotOptions | undefined)
        this.createFromBuilder0_serialize(builder_casted, callback__casted, delay_casted, checkImageStatus_casted, options_casted)
        return
    }
    public createFromBuilder(builder: object, delay?: number, checkImageStatus?: boolean, options?: componentSnapshot.SnapshotOptions): Promise<image.PixelMap> {
        const builder_casted = builder as (object)
        const delay_casted = delay as (number | undefined)
        const checkImageStatus_casted = checkImageStatus as (boolean | undefined)
        const options_casted = options as (componentSnapshot.SnapshotOptions | undefined)
        return this.createFromBuilder1_serialize(builder_casted, delay_casted, checkImageStatus_casted, options_casted)
    }
    public getSync(id: string, options?: componentSnapshot.SnapshotOptions): image.PixelMap {
        const id_casted = id as (string)
        const options_casted = options as (componentSnapshot.SnapshotOptions | undefined)
        return this.getSync_serialize(id_casted, options_casted)
    }
    public getWithUniqueId(uniqueId: number, options?: componentSnapshot.SnapshotOptions): Promise<image.PixelMap> {
        const uniqueId_casted = uniqueId as (number)
        const options_casted = options as (componentSnapshot.SnapshotOptions | undefined)
        return this.getWithUniqueId_serialize(uniqueId_casted, options_casted)
    }
    public getSyncWithUniqueId(uniqueId: number, options?: componentSnapshot.SnapshotOptions): image.PixelMap {
        const uniqueId_casted = uniqueId as (number)
        const options_casted = options as (componentSnapshot.SnapshotOptions | undefined)
        return this.getSyncWithUniqueId_serialize(uniqueId_casted, options_casted)
    }
    public createFromComponent<T>(content: object, delay?: number, checkImageStatus?: boolean, options?: componentSnapshot.SnapshotOptions): Promise<image.PixelMap> {
        const content_casted = content as (object)
        const delay_casted = delay as (number | undefined)
        const checkImageStatus_casted = checkImageStatus as (boolean | undefined)
        const options_casted = options as (componentSnapshot.SnapshotOptions | undefined)
        return this.createFromComponent_serialize(content_casted, delay_casted, checkImageStatus_casted, options_casted)
    }
    public getWithRange(start: NodeIdentity, end: NodeIdentity, isStartRect: boolean, options?: componentSnapshot.SnapshotOptions): Promise<image.PixelMap> {
        const start_casted = start as (NodeIdentity)
        const end_casted = end as (NodeIdentity)
        const isStartRect_casted = isStartRect as (boolean)
        const options_casted = options as (componentSnapshot.SnapshotOptions | undefined)
        return this.getWithRange_serialize(start_casted, end_casted, isStartRect_casted, options_casted)
    }
    get0_serialize(id: string, callback_: AsyncCallback<image.PixelMap>, options?: componentSnapshot.SnapshotOptions): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            componentSnapshot_SnapshotOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._ComponentSnapshot_get0(this.peer!.ptr, id, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    get1_serialize(id: string, options?: componentSnapshot.SnapshotOptions): Promise<image.PixelMap> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            componentSnapshot_SnapshotOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromise<image.PixelMap>()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._ComponentSnapshot_get1(this.peer!.ptr, id, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    createFromBuilder0_serialize(builder: object, callback_: AsyncCallback<image.PixelMap>, delay?: number, checkImageStatus?: boolean, options?: componentSnapshot.SnapshotOptions): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', builder)
        thisSerializer.holdAndWriteCallback(callback_)
        if (delay !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const delayTmpValue  = delay!
            thisSerializer.writeNumber(delayTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        if (checkImageStatus !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const checkImageStatusTmpValue  = checkImageStatus!
            thisSerializer.writeBoolean(checkImageStatusTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            componentSnapshot_SnapshotOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._ComponentSnapshot_createFromBuilder0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    createFromBuilder1_serialize(builder: object, delay?: number, checkImageStatus?: boolean, options?: componentSnapshot.SnapshotOptions): Promise<image.PixelMap> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', builder)
        if (delay !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const delayTmpValue  = delay!
            thisSerializer.writeNumber(delayTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        if (checkImageStatus !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const checkImageStatusTmpValue  = checkImageStatus!
            thisSerializer.writeBoolean(checkImageStatusTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            componentSnapshot_SnapshotOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromise<image.PixelMap>()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._ComponentSnapshot_createFromBuilder1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    getSync_serialize(id: string, options?: componentSnapshot.SnapshotOptions): image.PixelMap {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            componentSnapshot_SnapshotOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._ComponentSnapshot_getSync(this.peer!.ptr, id, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        const obj : image.PixelMap = extractors.fromImagePixelMapPtr(retval)
        return obj
    }
    getWithUniqueId_serialize(uniqueId: number, options?: componentSnapshot.SnapshotOptions): Promise<image.PixelMap> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            componentSnapshot_SnapshotOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromise<image.PixelMap>()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._ComponentSnapshot_getWithUniqueId(this.peer!.ptr, uniqueId, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    getSyncWithUniqueId_serialize(uniqueId: number, options?: componentSnapshot.SnapshotOptions): image.PixelMap {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            componentSnapshot_SnapshotOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._ComponentSnapshot_getSyncWithUniqueId(this.peer!.ptr, uniqueId, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        const obj : image.PixelMap = extractors.fromImagePixelMapPtr(retval)
        return obj
    }
    createFromComponent_serialize<T>(content: object, delay?: number, checkImageStatus?: boolean, options?: componentSnapshot.SnapshotOptions): Promise<image.PixelMap> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', content)
        if (delay !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const delayTmpValue  = delay!
            thisSerializer.writeNumber(delayTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        if (checkImageStatus !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const checkImageStatusTmpValue  = checkImageStatus!
            thisSerializer.writeBoolean(checkImageStatusTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            componentSnapshot_SnapshotOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromise<image.PixelMap>()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._ComponentSnapshot_createFromComponent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    getWithRange_serialize(start: NodeIdentity, end: NodeIdentity, isStartRect: boolean, options?: componentSnapshot.SnapshotOptions): Promise<image.PixelMap> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (start instanceof string) {
            thisSerializer.writeInt8((0).toChar())
            const startForIdx0  = start as string
            thisSerializer.writeString(startForIdx0)
        } else if (start instanceof number) {
            thisSerializer.writeInt8((1).toChar())
            const startForIdx1  = start as number
            thisSerializer.writeNumber(startForIdx1)
        }
        if (end instanceof string) {
            thisSerializer.writeInt8((0).toChar())
            const endForIdx0  = end as string
            thisSerializer.writeString(endForIdx0)
        } else if (end instanceof number) {
            thisSerializer.writeInt8((1).toChar())
            const endForIdx1  = end as number
            thisSerializer.writeNumber(endForIdx1)
        }
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            componentSnapshot_SnapshotOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromise<image.PixelMap>()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._ComponentSnapshot_getWithRange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), isStartRect ? 1 : 0)
        thisSerializer.release()
        return retval
    }
}
export class ComponentUtilsInternal {
    public static fromPtr(ptr: KPointer): ComponentUtils {
        return new ComponentUtils(ptr)
    }
}
export class ComponentUtils implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, ComponentUtils.getFinalizer())
    }
    constructor() {
        this(ComponentUtils.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._ComponentUtils_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._ComponentUtils_getFinalizer()
    }
    public getRectangleById(id: string): componentUtils.ComponentInfo {
        const id_casted = id as (string)
        return this.getRectangleById_serialize(id_casted)
    }
    getRectangleById_serialize(id: string): componentUtils.ComponentInfo {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._ComponentUtils_getRectangleById(this.peer!.ptr, id)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : componentUtils.ComponentInfo = componentUtils_ComponentInfo_serializer.read(retvalDeserializer)
        return returnResult
    }
}
export class ContentCoverControllerInternal {
    public static fromPtr(ptr: KPointer): ContentCoverController {
        return new ContentCoverController(ptr)
    }
}
export class ContentCoverController implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, ContentCoverController.getFinalizer())
    }
    constructor() {
        this(ContentCoverController.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._ContentCoverController_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._ContentCoverController_getFinalizer()
    }
    public update(contentCoverOptions: object, partialUpdate?: boolean): void {
        const contentCoverOptions_casted = contentCoverOptions as (object)
        const partialUpdate_casted = partialUpdate as (boolean | undefined)
        this.update_serialize(contentCoverOptions_casted, partialUpdate_casted)
        return
    }
    public close(): void {
        this.close_serialize()
        return
    }
    update_serialize(contentCoverOptions: object, partialUpdate?: boolean): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', contentCoverOptions)
        if (partialUpdate !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const partialUpdateTmpValue  = partialUpdate!
            thisSerializer.writeBoolean(partialUpdateTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._ContentCoverController_update(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    close_serialize(): void {
        OHOS_ARKUI_UICONTEXTNativeModule._ContentCoverController_close(this.peer!.ptr)
    }
}
export class ContextMenuControllerInternal {
    public static fromPtr(ptr: KPointer): ContextMenuController {
        return new ContextMenuController(ptr)
    }
}
export class ContextMenuController implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, ContextMenuController.getFinalizer())
    }
    constructor() {
        this(ContextMenuController.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._ContextMenuController_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._ContextMenuController_getFinalizer()
    }
    public close(): void {
        this.close_serialize()
        return
    }
    close_serialize(): void {
        OHOS_ARKUI_UICONTEXTNativeModule._ContextMenuController_close(this.peer!.ptr)
    }
}
export class CursorControllerInternal {
    public static fromPtr(ptr: KPointer): CursorController {
        return new CursorController(ptr)
    }
}
export class CursorController implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, CursorController.getFinalizer())
    }
    constructor() {
        this(CursorController.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._CursorController_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._CursorController_getFinalizer()
    }
    public restoreDefault(): void {
        this.restoreDefault_serialize()
        return
    }
    public setCursor(value: pointer.PointerStyle): void {
        const value_casted = value as (pointer.PointerStyle)
        this.setCursor_serialize(value_casted)
        return
    }
    restoreDefault_serialize(): void {
        OHOS_ARKUI_UICONTEXTNativeModule._CursorController_restoreDefault(this.peer!.ptr)
    }
    setCursor_serialize(value: pointer.PointerStyle): void {
        OHOS_ARKUI_UICONTEXTNativeModule._CursorController_setCursor(this.peer!.ptr, TypeChecker.pointer_PointerStyle_ToNumeric(value))
    }
}
export class DragControllerInternal {
    public static fromPtr(ptr: KPointer): DragController {
        return new DragController(ptr)
    }
}
export class DragController implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, DragController.getFinalizer())
    }
    constructor() {
        this(DragController.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._DragController_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._DragController_getFinalizer()
    }
    public executeDrag(custom: object | object, dragInfo: dragController.DragInfo, callback_: AsyncCallback<dragController.DragEventParam>): void {
        const custom_casted = custom as (object | object)
        const dragInfo_casted = dragInfo as (dragController.DragInfo)
        const callback__casted = callback_ as (AsyncCallback<dragController.DragEventParam>)
        this.executeDrag0_serialize(custom_casted, dragInfo_casted, callback__casted)
        return
    }
    public executeDrag(custom: object | object, dragInfo: dragController.DragInfo): Promise<dragController.DragEventParam> {
        const custom_casted = custom as (object | object)
        const dragInfo_casted = dragInfo as (dragController.DragInfo)
        return this.executeDrag1_serialize(custom_casted, dragInfo_casted)
    }
    public createDragAction(customArray: Array<object | object>, dragInfo: dragController.DragInfo): dragController.DragAction {
        const customArray_casted = customArray as (Array<object | object>)
        const dragInfo_casted = dragInfo as (dragController.DragInfo)
        return this.createDragAction_serialize(customArray_casted, dragInfo_casted)
    }
    public getDragPreview(): dragController.DragPreview {
        return this.getDragPreview_serialize()
    }
    public setDragEventStrictReportingEnabled(enable: boolean): void {
        const enable_casted = enable as (boolean)
        this.setDragEventStrictReportingEnabled_serialize(enable_casted)
        return
    }
    public notifyDragStartRequest(requestStatus: dragController.DragStartRequestStatus): void {
        const requestStatus_casted = requestStatus as (dragController.DragStartRequestStatus)
        this.notifyDragStartRequest_serialize(requestStatus_casted)
        return
    }
    public cancelDataLoading(key: string): void {
        const key_casted = key as (string)
        this.cancelDataLoading_serialize(key_casted)
        return
    }
    public enableDropDisallowedBadge(enabled: boolean): void {
        const enabled_casted = enabled as (boolean)
        this.enableDropDisallowedBadge_serialize(enabled_casted)
        return
    }
    executeDrag0_serialize(custom: object | object, dragInfo: dragController.DragInfo, callback_: AsyncCallback<dragController.DragEventParam>): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (custom instanceof object) {
            thisSerializer.writeInt8((0).toChar())
            const customForIdx0  = custom as object
            thisSerializer.writeCustomObject('object', customForIdx0)
        } else if (custom instanceof object) {
            thisSerializer.writeInt8((1).toChar())
            const customForIdx1  = custom as object
            thisSerializer.writeCustomObject('object', customForIdx1)
        }
        dragController_DragInfo_serializer.write(thisSerializer, dragInfo)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._DragController_executeDrag0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    executeDrag1_serialize(custom: object | object, dragInfo: dragController.DragInfo): Promise<dragController.DragEventParam> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (custom instanceof object) {
            thisSerializer.writeInt8((0).toChar())
            const customForIdx0  = custom as object
            thisSerializer.writeCustomObject('object', customForIdx0)
        } else if (custom instanceof object) {
            thisSerializer.writeInt8((1).toChar())
            const customForIdx1  = custom as object
            thisSerializer.writeCustomObject('object', customForIdx1)
        }
        dragController_DragInfo_serializer.write(thisSerializer, dragInfo)
        const retval  = thisSerializer.holdAndWriteCallbackForPromise<dragController.DragEventParam>()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._DragController_executeDrag1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    createDragAction_serialize(customArray: Array<object | object>, dragInfo: dragController.DragInfo): dragController.DragAction {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeInt32((customArray.length).toInt())
        for (let customArrayCounterI = 0; customArrayCounterI < customArray.length; customArrayCounterI++) {
            const customArrayTmpElement : object | object = customArray[customArrayCounterI]
            if (customArrayTmpElement instanceof object) {
                thisSerializer.writeInt8((0).toChar())
                const customArrayTmpElementForIdx0  = customArrayTmpElement as object
                thisSerializer.writeCustomObject('object', customArrayTmpElementForIdx0)
            } else if (customArrayTmpElement instanceof object) {
                thisSerializer.writeInt8((1).toChar())
                const customArrayTmpElementForIdx1  = customArrayTmpElement as object
                thisSerializer.writeCustomObject('object', customArrayTmpElementForIdx1)
            }
        }
        dragController_DragInfo_serializer.write(thisSerializer, dragInfo)
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._DragController_createDragAction(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        const obj : dragController.DragAction = extractors.fromDragControllerDragActionPtr(retval)
        return obj
    }
    getDragPreview_serialize(): dragController.DragPreview {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._DragController_getDragPreview(this.peer!.ptr)
        const obj : dragController.DragPreview = extractors.fromDragControllerDragPreviewPtr(retval)
        return obj
    }
    setDragEventStrictReportingEnabled_serialize(enable: boolean): void {
        OHOS_ARKUI_UICONTEXTNativeModule._DragController_setDragEventStrictReportingEnabled(this.peer!.ptr, enable ? 1 : 0)
    }
    notifyDragStartRequest_serialize(requestStatus: dragController.DragStartRequestStatus): void {
        OHOS_ARKUI_UICONTEXTNativeModule._DragController_notifyDragStartRequest(this.peer!.ptr, TypeChecker.dragController_DragStartRequestStatus_ToNumeric(requestStatus))
    }
    cancelDataLoading_serialize(key: string): void {
        OHOS_ARKUI_UICONTEXTNativeModule._DragController_cancelDataLoading(this.peer!.ptr, key)
    }
    enableDropDisallowedBadge_serialize(enabled: boolean): void {
        OHOS_ARKUI_UICONTEXTNativeModule._DragController_enableDropDisallowedBadge(this.peer!.ptr, enabled ? 1 : 0)
    }
}
export class DynamicSyncSceneInternal {
    public static fromPtr(ptr: KPointer): DynamicSyncScene {
        return new DynamicSyncScene(ptr)
    }
}
export class DynamicSyncScene implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, DynamicSyncScene.getFinalizer())
    }
    constructor() {
        this(DynamicSyncScene.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._DynamicSyncScene_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._DynamicSyncScene_getFinalizer()
    }
    public setFrameRateRange(range: object): void {
        const range_casted = range as (object)
        this.setFrameRateRange_serialize(range_casted)
        return
    }
    public getFrameRateRange(): object {
        return this.getFrameRateRange_serialize()
    }
    setFrameRateRange_serialize(range: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', range)
        OHOS_ARKUI_UICONTEXTNativeModule._DynamicSyncScene_setFrameRateRange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    getFrameRateRange_serialize(): object {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._DynamicSyncScene_getFrameRateRange(this.peer!.ptr)
        throw new Error("Object deserialization is not implemented.")
    }
}
export class FocusControllerInternal {
    public static fromPtr(ptr: KPointer): FocusController {
        return new FocusController(ptr)
    }
}
export class FocusController implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, FocusController.getFinalizer())
    }
    constructor() {
        this(FocusController.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._FocusController_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._FocusController_getFinalizer()
    }
    public clearFocus(): void {
        this.clearFocus_serialize()
        return
    }
    public requestFocus(key: string): void {
        const key_casted = key as (string)
        this.requestFocus_serialize(key_casted)
        return
    }
    public activate(isActive: boolean, autoInactive?: boolean): void {
        const isActive_casted = isActive as (boolean)
        const autoInactive_casted = autoInactive as (boolean | undefined)
        this.activate_serialize(isActive_casted, autoInactive_casted)
        return
    }
    public isActive(): boolean {
        return this.isActive_serialize()
    }
    public setAutoFocusTransfer(isAutoFocusTransfer: boolean): void {
        const isAutoFocusTransfer_casted = isAutoFocusTransfer as (boolean)
        this.setAutoFocusTransfer_serialize(isAutoFocusTransfer_casted)
        return
    }
    public setKeyProcessingMode(mode: object): void {
        const mode_casted = mode as (object)
        this.setKeyProcessingMode_serialize(mode_casted)
        return
    }
    clearFocus_serialize(): void {
        OHOS_ARKUI_UICONTEXTNativeModule._FocusController_clearFocus(this.peer!.ptr)
    }
    requestFocus_serialize(key: string): void {
        OHOS_ARKUI_UICONTEXTNativeModule._FocusController_requestFocus(this.peer!.ptr, key)
    }
    activate_serialize(isActive: boolean, autoInactive?: boolean): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (autoInactive !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const autoInactiveTmpValue  = autoInactive!
            thisSerializer.writeBoolean(autoInactiveTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._FocusController_activate(this.peer!.ptr, isActive ? 1 : 0, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    isActive_serialize(): boolean {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._FocusController_isActive(this.peer!.ptr)
        return retval
    }
    setAutoFocusTransfer_serialize(isAutoFocusTransfer: boolean): void {
        OHOS_ARKUI_UICONTEXTNativeModule._FocusController_setAutoFocusTransfer(this.peer!.ptr, isAutoFocusTransfer ? 1 : 0)
    }
    setKeyProcessingMode_serialize(mode: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', mode)
        OHOS_ARKUI_UICONTEXTNativeModule._FocusController_setKeyProcessingMode(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
}
export class FontInternal {
    public static fromPtr(ptr: KPointer): Font {
        return new Font(ptr)
    }
}
export class Font implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, Font.getFinalizer())
    }
    constructor() {
        this(Font.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._Font_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._Font_getFinalizer()
    }
    public registerFont(options: font.FontOptions): void {
        const options_casted = options as (font.FontOptions)
        this.registerFont_serialize(options_casted)
        return
    }
    public getSystemFontList(): Array<string> {
        return this.getSystemFontList_serialize()
    }
    public getFontByName(fontName: string): font.FontInfo {
        const fontName_casted = fontName as (string)
        return this.getFontByName_serialize(fontName_casted)
    }
    registerFont_serialize(options: font.FontOptions): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        font_FontOptions_serializer.write(thisSerializer, options)
        OHOS_ARKUI_UICONTEXTNativeModule._Font_registerFont(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    getSystemFontList_serialize(): Array<string> {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._Font_getSystemFontList(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const bufferLength : int32 = retvalDeserializer.readInt32()
        let buffer : Array<string> = new Array<string>(bufferLength)
        for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
            buffer[bufferBufCounterI] = (retvalDeserializer.readString() as string)
        }
        const returnResult : Array<string> = buffer
        return returnResult
    }
    getFontByName_serialize(fontName: string): font.FontInfo {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._Font_getFontByName(this.peer!.ptr, fontName)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : font.FontInfo = font_FontInfo_serializer.read(retvalDeserializer)
        return returnResult
    }
}
export class FrameCallbackInternal {
    public static fromPtr(ptr: KPointer): FrameCallback {
        return new FrameCallback(ptr)
    }
}
export class FrameCallback implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, FrameCallback.getFinalizer())
    }
    constructor() {
        this(FrameCallback.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._FrameCallback_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._FrameCallback_getFinalizer()
    }
    public onFrame(frameTimeInNano: number): void {
        const frameTimeInNano_casted = frameTimeInNano as (number)
        this.onFrame_serialize(frameTimeInNano_casted)
        return
    }
    public onIdle(timeLeftInNano: number): void {
        const timeLeftInNano_casted = timeLeftInNano as (number)
        this.onIdle_serialize(timeLeftInNano_casted)
        return
    }
    onFrame_serialize(frameTimeInNano: number): void {
        OHOS_ARKUI_UICONTEXTNativeModule._FrameCallback_onFrame(this.peer!.ptr, frameTimeInNano)
    }
    onIdle_serialize(timeLeftInNano: number): void {
        OHOS_ARKUI_UICONTEXTNativeModule._FrameCallback_onIdle(this.peer!.ptr, timeLeftInNano)
    }
}
export class MeasureUtilsInternal {
    public static fromPtr(ptr: KPointer): MeasureUtils {
        return new MeasureUtils(ptr)
    }
}
export class MeasureUtils implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, MeasureUtils.getFinalizer())
    }
    constructor() {
        this(MeasureUtils.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._MeasureUtils_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._MeasureUtils_getFinalizer()
    }
    public measureText(options: MeasureOptions): number {
        const options_casted = options as (MeasureOptions)
        return this.measureText_serialize(options_casted)
    }
    public measureTextSize(options: MeasureOptions): object {
        const options_casted = options as (MeasureOptions)
        return this.measureTextSize_serialize(options_casted)
    }
    measureText_serialize(options: MeasureOptions): number {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        MeasureOptions_serializer.write(thisSerializer, options)
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._MeasureUtils_measureText(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    measureTextSize_serialize(options: MeasureOptions): object {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        MeasureOptions_serializer.write(thisSerializer, options)
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._MeasureUtils_measureTextSize(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        throw new Error("Object deserialization is not implemented.")
    }
}
export class MediaQueryInternal {
    public static fromPtr(ptr: KPointer): MediaQuery {
        return new MediaQuery(ptr)
    }
}
export class MediaQuery implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, MediaQuery.getFinalizer())
    }
    constructor() {
        this(MediaQuery.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._MediaQuery_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._MediaQuery_getFinalizer()
    }
    public matchMediaSync(condition: string): mediaquery.MediaQueryListener {
        const condition_casted = condition as (string)
        return this.matchMediaSync_serialize(condition_casted)
    }
    matchMediaSync_serialize(condition: string): mediaquery.MediaQueryListener {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._MediaQuery_matchMediaSync(this.peer!.ptr, condition)
        const obj : mediaquery.MediaQueryListener = extractors.fromMediaqueryMediaQueryListenerPtr(retval)
        return obj
    }
}
export class OverlayManagerInternal {
    public static fromPtr(ptr: KPointer): OverlayManager {
        return new OverlayManager(ptr)
    }
}
export class OverlayManager implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, OverlayManager.getFinalizer())
    }
    constructor() {
        this(OverlayManager.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._OverlayManager_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._OverlayManager_getFinalizer()
    }
    public addComponentContent<T>(content: object, index?: number): void {
        const content_casted = content as (object)
        const index_casted = index as (number | undefined)
        this.addComponentContent_serialize(content_casted, index_casted)
        return
    }
    public addComponentContentWithOrder<T>(content: object, levelOrder?: LevelOrder): void {
        const content_casted = content as (object)
        const levelOrder_casted = levelOrder as (LevelOrder | undefined)
        this.addComponentContentWithOrder_serialize(content_casted, levelOrder_casted)
        return
    }
    public removeComponentContent<T>(content: object): void {
        const content_casted = content as (object)
        this.removeComponentContent_serialize(content_casted)
        return
    }
    public showComponentContent<T>(content: object): void {
        const content_casted = content as (object)
        this.showComponentContent_serialize(content_casted)
        return
    }
    public hideComponentContent<T>(content: object): void {
        const content_casted = content as (object)
        this.hideComponentContent_serialize(content_casted)
        return
    }
    public showAllComponentContents(): void {
        this.showAllComponentContents_serialize()
        return
    }
    public hideAllComponentContents(): void {
        this.hideAllComponentContents_serialize()
        return
    }
    addComponentContent_serialize<T>(content: object, index?: number): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', content)
        if (index !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const indexTmpValue  = index!
            thisSerializer.writeNumber(indexTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._OverlayManager_addComponentContent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    addComponentContentWithOrder_serialize<T>(content: object, levelOrder?: LevelOrder): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', content)
        if (levelOrder !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const levelOrderTmpValue  = levelOrder!
            LevelOrder_serializer.write(thisSerializer, levelOrderTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._OverlayManager_addComponentContentWithOrder(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    removeComponentContent_serialize<T>(content: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', content)
        OHOS_ARKUI_UICONTEXTNativeModule._OverlayManager_removeComponentContent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    showComponentContent_serialize<T>(content: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', content)
        OHOS_ARKUI_UICONTEXTNativeModule._OverlayManager_showComponentContent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    hideComponentContent_serialize<T>(content: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', content)
        OHOS_ARKUI_UICONTEXTNativeModule._OverlayManager_hideComponentContent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    showAllComponentContents_serialize(): void {
        OHOS_ARKUI_UICONTEXTNativeModule._OverlayManager_showAllComponentContents(this.peer!.ptr)
    }
    hideAllComponentContents_serialize(): void {
        OHOS_ARKUI_UICONTEXTNativeModule._OverlayManager_hideAllComponentContents(this.peer!.ptr)
    }
}
export class PromptActionInternal {
    public static fromPtr(ptr: KPointer): PromptAction {
        return new PromptAction(ptr)
    }
}
export class PromptAction implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, PromptAction.getFinalizer())
    }
    constructor() {
        this(PromptAction.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_getFinalizer()
    }
    public showToast(options: promptAction.ShowToastOptions): void {
        const options_casted = options as (promptAction.ShowToastOptions)
        this.showToast_serialize(options_casted)
        return
    }
    public openToast(options: promptAction.ShowToastOptions): Promise<number> {
        const options_casted = options as (promptAction.ShowToastOptions)
        return this.openToast_serialize(options_casted)
    }
    public closeToast(toastId: number): void {
        const toastId_casted = toastId as (number)
        this.closeToast_serialize(toastId_casted)
        return
    }
    public showDialog(options: promptAction.ShowDialogOptions, callback_: AsyncCallback<promptAction.ShowDialogSuccessResponse>): void {
        const options_casted = options as (promptAction.ShowDialogOptions)
        const callback__casted = callback_ as (AsyncCallback<promptAction.ShowDialogSuccessResponse>)
        this.showDialog0_serialize(options_casted, callback__casted)
        return
    }
    public showDialog(options: promptAction.ShowDialogOptions): Promise<promptAction.ShowDialogSuccessResponse> {
        const options_casted = options as (promptAction.ShowDialogOptions)
        return this.showDialog1_serialize(options_casted)
    }
    public showActionMenu(options: promptAction.ActionMenuOptions, callback_: AsyncCallback<promptAction.ActionMenuSuccessResponse>): void {
        const options_casted = options as (promptAction.ActionMenuOptions)
        const callback__casted = callback_ as (AsyncCallback<promptAction.ActionMenuSuccessResponse>)
        this.showActionMenu0_serialize(options_casted, callback__casted)
        return
    }
    public showActionMenu(options: promptAction.ActionMenuOptions): Promise<promptAction.ActionMenuSuccessResponse> {
        const options_casted = options as (promptAction.ActionMenuOptions)
        return this.showActionMenu1_serialize(options_casted)
    }
    public openCustomDialog<T>(dialogContent: object, options?: promptAction.BaseDialogOptions): Promise<void> {
        const dialogContent_casted = dialogContent as (object)
        const options_casted = options as (promptAction.BaseDialogOptions | undefined)
        return this.openCustomDialog0_serialize(dialogContent_casted, options_casted)
    }
    public openCustomDialogWithController<T>(dialogContent: object, controller: promptAction.DialogController, options?: promptAction.BaseDialogOptions): Promise<void> {
        const dialogContent_casted = dialogContent as (object)
        const controller_casted = controller as (promptAction.DialogController)
        const options_casted = options as (promptAction.BaseDialogOptions | undefined)
        return this.openCustomDialogWithController_serialize(dialogContent_casted, controller_casted, options_casted)
    }
    public updateCustomDialog<T>(dialogContent: object, options: promptAction.BaseDialogOptions): Promise<void> {
        const dialogContent_casted = dialogContent as (object)
        const options_casted = options as (promptAction.BaseDialogOptions)
        return this.updateCustomDialog_serialize(dialogContent_casted, options_casted)
    }
    public closeCustomDialog<T>(dialogContent: object): Promise<void> {
        const dialogContent_casted = dialogContent as (object)
        return this.closeCustomDialog0_serialize(dialogContent_casted)
    }
    public openCustomDialog(options: promptAction.CustomDialogOptions): Promise<number> {
        const options_casted = options as (promptAction.CustomDialogOptions)
        return this.openCustomDialog1_serialize(options_casted)
    }
    public presentCustomDialog(builder: object | object, controller?: promptAction.DialogController, options?: promptAction.DialogOptions): Promise<number> {
        const builder_casted = builder as (object | object)
        const controller_casted = controller as (promptAction.DialogController | undefined)
        const options_casted = options as (promptAction.DialogOptions | undefined)
        return this.presentCustomDialog_serialize(builder_casted, controller_casted, options_casted)
    }
    public closeCustomDialog(dialogId: number): void {
        const dialogId_casted = dialogId as (number)
        this.closeCustomDialog1_serialize(dialogId_casted)
        return
    }
    public getTopOrder(): LevelOrder {
        return this.getTopOrder_serialize()
    }
    public getBottomOrder(): LevelOrder {
        return this.getBottomOrder_serialize()
    }
    public openPopup<T>(content: object, target: TargetInfo, options?: object): Promise<void> {
        const content_casted = content as (object)
        const target_casted = target as (TargetInfo)
        const options_casted = options as (object | undefined)
        return this.openPopup_serialize(content_casted, target_casted, options_casted)
    }
    public updatePopup<T>(content: object, options: object, partialUpdate?: boolean): Promise<void> {
        const content_casted = content as (object)
        const options_casted = options as (object)
        const partialUpdate_casted = partialUpdate as (boolean | undefined)
        return this.updatePopup_serialize(content_casted, options_casted, partialUpdate_casted)
    }
    public closePopup<T>(content: object): Promise<void> {
        const content_casted = content as (object)
        return this.closePopup_serialize(content_casted)
    }
    public openMenu<T>(content: object, target: TargetInfo, options?: object): Promise<void> {
        const content_casted = content as (object)
        const target_casted = target as (TargetInfo)
        const options_casted = options as (object | undefined)
        return this.openMenu_serialize(content_casted, target_casted, options_casted)
    }
    public updateMenu<T>(content: object, options: object, partialUpdate?: boolean): Promise<void> {
        const content_casted = content as (object)
        const options_casted = options as (object)
        const partialUpdate_casted = partialUpdate as (boolean | undefined)
        return this.updateMenu_serialize(content_casted, options_casted, partialUpdate_casted)
    }
    public closeMenu<T>(content: object): Promise<void> {
        const content_casted = content as (object)
        return this.closeMenu_serialize(content_casted)
    }
    showToast_serialize(options: promptAction.ShowToastOptions): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        promptAction_ShowToastOptions_serializer.write(thisSerializer, options)
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_showToast(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    openToast_serialize(options: promptAction.ShowToastOptions): Promise<number> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        promptAction_ShowToastOptions_serializer.write(thisSerializer, options)
        const retval  = thisSerializer.holdAndWriteCallbackForPromise<number>()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_openToast(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    closeToast_serialize(toastId: number): void {
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_closeToast(this.peer!.ptr, toastId)
    }
    showDialog0_serialize(options: promptAction.ShowDialogOptions, callback_: AsyncCallback<promptAction.ShowDialogSuccessResponse>): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        promptAction_ShowDialogOptions_serializer.write(thisSerializer, options)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_showDialog0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    showDialog1_serialize(options: promptAction.ShowDialogOptions): Promise<promptAction.ShowDialogSuccessResponse> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        promptAction_ShowDialogOptions_serializer.write(thisSerializer, options)
        const retval  = thisSerializer.holdAndWriteCallbackForPromise<promptAction.ShowDialogSuccessResponse>()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_showDialog1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    showActionMenu0_serialize(options: promptAction.ActionMenuOptions, callback_: AsyncCallback<promptAction.ActionMenuSuccessResponse>): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        promptAction_ActionMenuOptions_serializer.write(thisSerializer, options)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_showActionMenu0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    showActionMenu1_serialize(options: promptAction.ActionMenuOptions): Promise<promptAction.ActionMenuSuccessResponse> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        promptAction_ActionMenuOptions_serializer.write(thisSerializer, options)
        const retval  = thisSerializer.holdAndWriteCallbackForPromise<promptAction.ActionMenuSuccessResponse>()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_showActionMenu1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    openCustomDialog0_serialize<T>(dialogContent: object, options?: promptAction.BaseDialogOptions): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', dialogContent)
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            promptAction_BaseDialogOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_openCustomDialog0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    openCustomDialogWithController_serialize<T>(dialogContent: object, controller: promptAction.DialogController, options?: promptAction.BaseDialogOptions): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', dialogContent)
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            promptAction_BaseDialogOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_openCustomDialogWithController(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), extractors.toPromptActionDialogControllerPtr(controller))
        thisSerializer.release()
        return retval
    }
    updateCustomDialog_serialize<T>(dialogContent: object, options: promptAction.BaseDialogOptions): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', dialogContent)
        promptAction_BaseDialogOptions_serializer.write(thisSerializer, options)
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_updateCustomDialog(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    closeCustomDialog0_serialize<T>(dialogContent: object): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', dialogContent)
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_closeCustomDialog0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    openCustomDialog1_serialize(options: promptAction.CustomDialogOptions): Promise<number> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        promptAction_CustomDialogOptions_serializer.write(thisSerializer, options)
        const retval  = thisSerializer.holdAndWriteCallbackForPromise<number>()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_openCustomDialog1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    presentCustomDialog_serialize(builder: object | object, controller?: promptAction.DialogController, options?: promptAction.DialogOptions): Promise<number> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (builder instanceof object) {
            thisSerializer.writeInt8((0).toChar())
            const builderForIdx0  = builder as object
            thisSerializer.writeCustomObject('object', builderForIdx0)
        } else if (builder instanceof object) {
            thisSerializer.writeInt8((1).toChar())
            const builderForIdx1  = builder as object
            thisSerializer.writeCustomObject('object', builderForIdx1)
        }
        if (controller !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const controllerTmpValue  = controller!
            promptAction_DialogController_serializer.write(thisSerializer, controllerTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            promptAction_DialogOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromise<number>()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_presentCustomDialog(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    closeCustomDialog1_serialize(dialogId: number): void {
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_closeCustomDialog1(this.peer!.ptr, dialogId)
    }
    getTopOrder_serialize(): LevelOrder {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_getTopOrder(this.peer!.ptr)
        const obj : LevelOrder = extractors.fromLevelOrderPtr(retval)
        return obj
    }
    getBottomOrder_serialize(): LevelOrder {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_getBottomOrder(this.peer!.ptr)
        const obj : LevelOrder = extractors.fromLevelOrderPtr(retval)
        return obj
    }
    openPopup_serialize<T>(content: object, target: TargetInfo, options?: object): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', content)
        TargetInfo_serializer.write(thisSerializer, target)
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            thisSerializer.writeCustomObject('object', optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_openPopup(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    updatePopup_serialize<T>(content: object, options: object, partialUpdate?: boolean): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', content)
        thisSerializer.writeCustomObject('object', options)
        if (partialUpdate !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const partialUpdateTmpValue  = partialUpdate!
            thisSerializer.writeBoolean(partialUpdateTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_updatePopup(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    closePopup_serialize<T>(content: object): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', content)
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_closePopup(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    openMenu_serialize<T>(content: object, target: TargetInfo, options?: object): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', content)
        TargetInfo_serializer.write(thisSerializer, target)
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            thisSerializer.writeCustomObject('object', optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_openMenu(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    updateMenu_serialize<T>(content: object, options: object, partialUpdate?: boolean): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', content)
        thisSerializer.writeCustomObject('object', options)
        if (partialUpdate !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const partialUpdateTmpValue  = partialUpdate!
            thisSerializer.writeBoolean(partialUpdateTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_updateMenu(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    closeMenu_serialize<T>(content: object): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', content)
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._PromptAction_closeMenu(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
}
export class RouterInternal {
    public static fromPtr(ptr: KPointer): Router {
        return new Router(ptr)
    }
}
export class Router implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, Router.getFinalizer())
    }
    constructor() {
        this(Router.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._Router_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._Router_getFinalizer()
    }
    public pushUrl(options: router.RouterOptions, callback_: AsyncCallback<void>): void {
        const options_casted = options as (router.RouterOptions)
        const callback__casted = callback_ as (AsyncCallback<void>)
        this.pushUrl0_serialize(options_casted, callback__casted)
        return
    }
    public pushUrl(options: router.RouterOptions): Promise<void> {
        const options_casted = options as (router.RouterOptions)
        return this.pushUrl1_serialize(options_casted)
    }
    public pushUrl(options: router.RouterOptions, mode: router.RouterMode, callback_: AsyncCallback<void>): void {
        const options_casted = options as (router.RouterOptions)
        const mode_casted = mode as (router.RouterMode)
        const callback__casted = callback_ as (AsyncCallback<void>)
        this.pushUrl2_serialize(options_casted, mode_casted, callback__casted)
        return
    }
    public pushUrl(options: router.RouterOptions, mode: router.RouterMode): Promise<void> {
        const options_casted = options as (router.RouterOptions)
        const mode_casted = mode as (router.RouterMode)
        return this.pushUrl3_serialize(options_casted, mode_casted)
    }
    public replaceUrl(options: router.RouterOptions, callback_: AsyncCallback<void>): void {
        const options_casted = options as (router.RouterOptions)
        const callback__casted = callback_ as (AsyncCallback<void>)
        this.replaceUrl0_serialize(options_casted, callback__casted)
        return
    }
    public replaceUrl(options: router.RouterOptions): Promise<void> {
        const options_casted = options as (router.RouterOptions)
        return this.replaceUrl1_serialize(options_casted)
    }
    public replaceUrl(options: router.RouterOptions, mode: router.RouterMode, callback_: AsyncCallback<void>): void {
        const options_casted = options as (router.RouterOptions)
        const mode_casted = mode as (router.RouterMode)
        const callback__casted = callback_ as (AsyncCallback<void>)
        this.replaceUrl2_serialize(options_casted, mode_casted, callback__casted)
        return
    }
    public replaceUrl(options: router.RouterOptions, mode: router.RouterMode): Promise<void> {
        const options_casted = options as (router.RouterOptions)
        const mode_casted = mode as (router.RouterMode)
        return this.replaceUrl3_serialize(options_casted, mode_casted)
    }
    public back(options?: router.RouterOptions): void {
        const options_casted = options as (router.RouterOptions | undefined)
        this.back0_serialize(options_casted)
        return
    }
    public back(index: number, params?: Object): void {
        const index_casted = index as (number)
        const params_casted = params as (Object | undefined)
        this.back1_serialize(index_casted, params_casted)
        return
    }
    public clear(): void {
        this.clear_serialize()
        return
    }
    public getLength(): string {
        return this.getLength_serialize()
    }
    public getState(): router.RouterState {
        return this.getState_serialize()
    }
    public getStateByIndex(index: number): router.RouterState | undefined {
        const index_casted = index as (number)
        return this.getStateByIndex_serialize(index_casted)
    }
    public getStateByUrl(url: string): Array<router.RouterState> {
        const url_casted = url as (string)
        return this.getStateByUrl_serialize(url_casted)
    }
    public showAlertBeforeBackPage(options: router.EnableAlertOptions): void {
        const options_casted = options as (router.EnableAlertOptions)
        this.showAlertBeforeBackPage_serialize(options_casted)
        return
    }
    public hideAlertBeforeBackPage(): void {
        this.hideAlertBeforeBackPage_serialize()
        return
    }
    public getParams(): Object {
        return this.getParams_serialize()
    }
    public pushNamedRoute(options: router.NamedRouterOptions, callback_: AsyncCallback<void>): void {
        const options_casted = options as (router.NamedRouterOptions)
        const callback__casted = callback_ as (AsyncCallback<void>)
        this.pushNamedRoute0_serialize(options_casted, callback__casted)
        return
    }
    public pushNamedRoute(options: router.NamedRouterOptions): Promise<void> {
        const options_casted = options as (router.NamedRouterOptions)
        return this.pushNamedRoute1_serialize(options_casted)
    }
    public pushNamedRoute(options: router.NamedRouterOptions, mode: router.RouterMode, callback_: AsyncCallback<void>): void {
        const options_casted = options as (router.NamedRouterOptions)
        const mode_casted = mode as (router.RouterMode)
        const callback__casted = callback_ as (AsyncCallback<void>)
        this.pushNamedRoute2_serialize(options_casted, mode_casted, callback__casted)
        return
    }
    public pushNamedRoute(options: router.NamedRouterOptions, mode: router.RouterMode): Promise<void> {
        const options_casted = options as (router.NamedRouterOptions)
        const mode_casted = mode as (router.RouterMode)
        return this.pushNamedRoute3_serialize(options_casted, mode_casted)
    }
    public replaceNamedRoute(options: router.NamedRouterOptions, callback_: AsyncCallback<void>): void {
        const options_casted = options as (router.NamedRouterOptions)
        const callback__casted = callback_ as (AsyncCallback<void>)
        this.replaceNamedRoute0_serialize(options_casted, callback__casted)
        return
    }
    public replaceNamedRoute(options: router.NamedRouterOptions): Promise<void> {
        const options_casted = options as (router.NamedRouterOptions)
        return this.replaceNamedRoute1_serialize(options_casted)
    }
    public replaceNamedRoute(options: router.NamedRouterOptions, mode: router.RouterMode, callback_: AsyncCallback<void>): void {
        const options_casted = options as (router.NamedRouterOptions)
        const mode_casted = mode as (router.RouterMode)
        const callback__casted = callback_ as (AsyncCallback<void>)
        this.replaceNamedRoute2_serialize(options_casted, mode_casted, callback__casted)
        return
    }
    public replaceNamedRoute(options: router.NamedRouterOptions, mode: router.RouterMode): Promise<void> {
        const options_casted = options as (router.NamedRouterOptions)
        const mode_casted = mode as (router.RouterMode)
        return this.replaceNamedRoute3_serialize(options_casted, mode_casted)
    }
    pushUrl0_serialize(options: router.RouterOptions, callback_: AsyncCallback<void>): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_RouterOptions_serializer.write(thisSerializer, options)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._Router_pushUrl0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    pushUrl1_serialize(options: router.RouterOptions): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_RouterOptions_serializer.write(thisSerializer, options)
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._Router_pushUrl1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    pushUrl2_serialize(options: router.RouterOptions, mode: router.RouterMode, callback_: AsyncCallback<void>): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_RouterOptions_serializer.write(thisSerializer, options)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._Router_pushUrl2(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), TypeChecker.router_RouterMode_ToNumeric(mode))
        thisSerializer.release()
    }
    pushUrl3_serialize(options: router.RouterOptions, mode: router.RouterMode): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_RouterOptions_serializer.write(thisSerializer, options)
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._Router_pushUrl3(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), TypeChecker.router_RouterMode_ToNumeric(mode))
        thisSerializer.release()
        return retval
    }
    replaceUrl0_serialize(options: router.RouterOptions, callback_: AsyncCallback<void>): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_RouterOptions_serializer.write(thisSerializer, options)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._Router_replaceUrl0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    replaceUrl1_serialize(options: router.RouterOptions): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_RouterOptions_serializer.write(thisSerializer, options)
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._Router_replaceUrl1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    replaceUrl2_serialize(options: router.RouterOptions, mode: router.RouterMode, callback_: AsyncCallback<void>): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_RouterOptions_serializer.write(thisSerializer, options)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._Router_replaceUrl2(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), TypeChecker.router_RouterMode_ToNumeric(mode))
        thisSerializer.release()
    }
    replaceUrl3_serialize(options: router.RouterOptions, mode: router.RouterMode): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_RouterOptions_serializer.write(thisSerializer, options)
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._Router_replaceUrl3(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), TypeChecker.router_RouterMode_ToNumeric(mode))
        thisSerializer.release()
        return retval
    }
    back0_serialize(options?: router.RouterOptions): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (options !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const optionsTmpValue  = options!
            router_RouterOptions_serializer.write(thisSerializer, optionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._Router_back0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    back1_serialize(index: number, params?: Object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (params !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const paramsTmpValue  = params!
            thisSerializer.holdAndWriteObject(paramsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._Router_back1(this.peer!.ptr, index, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    clear_serialize(): void {
        OHOS_ARKUI_UICONTEXTNativeModule._Router_clear(this.peer!.ptr)
    }
    getLength_serialize(): string {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._Router_getLength(this.peer!.ptr)
        return retval
    }
    getState_serialize(): router.RouterState {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._Router_getState(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : router.RouterState = router_RouterState_serializer.read(retvalDeserializer)
        return returnResult
    }
    getStateByIndex_serialize(index: number): router.RouterState | undefined {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._Router_getStateByIndex(this.peer!.ptr, index)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : router.RouterState | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = router_RouterState_serializer.read(retvalDeserializer)
        }
        const returnResult : router.RouterState | undefined = buffer
        return returnResult
    }
    getStateByUrl_serialize(url: string): Array<router.RouterState> {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._Router_getStateByUrl(this.peer!.ptr, url)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const bufferLength : int32 = retvalDeserializer.readInt32()
        let buffer : Array<router.RouterState> = new Array<router.RouterState>(bufferLength)
        for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
            buffer[bufferBufCounterI] = router_RouterState_serializer.read(retvalDeserializer)
        }
        const returnResult : Array<router.RouterState> = buffer
        return returnResult
    }
    showAlertBeforeBackPage_serialize(options: router.EnableAlertOptions): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_EnableAlertOptions_serializer.write(thisSerializer, options)
        OHOS_ARKUI_UICONTEXTNativeModule._Router_showAlertBeforeBackPage(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    hideAlertBeforeBackPage_serialize(): void {
        OHOS_ARKUI_UICONTEXTNativeModule._Router_hideAlertBeforeBackPage(this.peer!.ptr)
    }
    getParams_serialize(): Object {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._Router_getParams(this.peer!.ptr)
        return retval
    }
    pushNamedRoute0_serialize(options: router.NamedRouterOptions, callback_: AsyncCallback<void>): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_NamedRouterOptions_serializer.write(thisSerializer, options)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._Router_pushNamedRoute0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    pushNamedRoute1_serialize(options: router.NamedRouterOptions): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_NamedRouterOptions_serializer.write(thisSerializer, options)
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._Router_pushNamedRoute1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    pushNamedRoute2_serialize(options: router.NamedRouterOptions, mode: router.RouterMode, callback_: AsyncCallback<void>): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_NamedRouterOptions_serializer.write(thisSerializer, options)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._Router_pushNamedRoute2(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), TypeChecker.router_RouterMode_ToNumeric(mode))
        thisSerializer.release()
    }
    pushNamedRoute3_serialize(options: router.NamedRouterOptions, mode: router.RouterMode): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_NamedRouterOptions_serializer.write(thisSerializer, options)
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._Router_pushNamedRoute3(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), TypeChecker.router_RouterMode_ToNumeric(mode))
        thisSerializer.release()
        return retval
    }
    replaceNamedRoute0_serialize(options: router.NamedRouterOptions, callback_: AsyncCallback<void>): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_NamedRouterOptions_serializer.write(thisSerializer, options)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._Router_replaceNamedRoute0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    replaceNamedRoute1_serialize(options: router.NamedRouterOptions): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_NamedRouterOptions_serializer.write(thisSerializer, options)
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._Router_replaceNamedRoute1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    replaceNamedRoute2_serialize(options: router.NamedRouterOptions, mode: router.RouterMode, callback_: AsyncCallback<void>): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_NamedRouterOptions_serializer.write(thisSerializer, options)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._Router_replaceNamedRoute2(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), TypeChecker.router_RouterMode_ToNumeric(mode))
        thisSerializer.release()
    }
    replaceNamedRoute3_serialize(options: router.NamedRouterOptions, mode: router.RouterMode): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        router_NamedRouterOptions_serializer.write(thisSerializer, options)
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._Router_replaceNamedRoute3(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), TypeChecker.router_RouterMode_ToNumeric(mode))
        thisSerializer.release()
        return retval
    }
}
export class TextMenuControllerInternal {
    public static fromPtr(ptr: KPointer): TextMenuController {
        return new TextMenuController(ptr)
    }
}
export class TextMenuController implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, TextMenuController.getFinalizer())
    }
    constructor() {
        this(TextMenuController.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._TextMenuController_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._TextMenuController_getFinalizer()
    }
    static disableSystemServiceMenuItems_serialize(disable: boolean): void {
        OHOS_ARKUI_UICONTEXTNativeModule._TextMenuController_disableSystemServiceMenuItems(disable ? 1 : 0)
    }
    public setMenuOptions(options: object): void {
        const options_casted = options as (object)
        this.setMenuOptions_serialize(options_casted)
        return
    }
    public static disableSystemServiceMenuItems(disable: boolean): void {
        const disable_casted = disable as (boolean)
        TextMenuController.disableSystemServiceMenuItems_serialize(disable_casted)
        return
    }
    setMenuOptions_serialize(options: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', options)
        OHOS_ARKUI_UICONTEXTNativeModule._TextMenuController_setMenuOptions(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
}
export class UIContextInternal {
    public static fromPtr(ptr: KPointer): UIContext {
        return new UIContext(ptr)
    }
}
export class UIContext implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, UIContext.getFinalizer())
    }
    constructor() {
        this(UIContext.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getFinalizer()
    }
    static createUIContextWithoutWindow_serialize(context: common.UIAbilityContext | common.ExtensionContext): UIContext | undefined {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (context instanceof common.UIAbilityContext) {
            thisSerializer.writeInt8((0).toChar())
            const contextForIdx0  = context as common.UIAbilityContext
            thisSerializer.writeCustomObject('object', contextForIdx0)
        } else if (context instanceof common.ExtensionContext) {
            thisSerializer.writeInt8((1).toChar())
            const contextForIdx1  = context as common.ExtensionContext
            thisSerializer.writeCustomObject('object', contextForIdx1)
        }
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_createUIContextWithoutWindow(thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : UIContext | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (UIContext_serializer.read(retvalDeserializer) as UIContext)
        }
        const returnResult : UIContext | undefined = buffer
        return returnResult
    }
    static destroyUIContextWithoutWindow_serialize(): void {
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_destroyUIContextWithoutWindow()
    }
    static getFocusedUIContext_serialize(): UIContext | undefined {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getFocusedUIContext()
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : UIContext | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (UIContext_serializer.read(retvalDeserializer) as UIContext)
        }
        const returnResult : UIContext | undefined = buffer
        return returnResult
    }
    public getFont(): Font {
        return this.getFont_serialize()
    }
    public isAvailable(): boolean {
        return this.isAvailable_serialize()
    }
    public getMediaQuery(): MediaQuery {
        return this.getMediaQuery_serialize()
    }
    public getUIInspector(): UIInspector {
        return this.getUIInspector_serialize()
    }
    public getFilteredInspectorTree(filters?: Array<string>): string {
        const filters_casted = filters as (Array<string> | undefined)
        return this.getFilteredInspectorTree_serialize(filters_casted)
    }
    public getFilteredInspectorTreeById(id: string, depth: number, filters?: Array<string>): string {
        const id_casted = id as (string)
        const depth_casted = depth as (number)
        const filters_casted = filters as (Array<string> | undefined)
        return this.getFilteredInspectorTreeById_serialize(id_casted, depth_casted, filters_casted)
    }
    public getRouter(): Router {
        return this.getRouter_serialize()
    }
    public getPromptAction(): PromptAction {
        return this.getPromptAction_serialize()
    }
    public getComponentUtils(): ComponentUtils {
        return this.getComponentUtils_serialize()
    }
    public getUIObserver(): UIObserver {
        return this.getUIObserver_serialize()
    }
    public getOverlayManager(): OverlayManager {
        return this.getOverlayManager_serialize()
    }
    public setOverlayManagerOptions(options: OverlayManagerOptions): boolean {
        const options_casted = options as (OverlayManagerOptions)
        return this.setOverlayManagerOptions_serialize(options_casted)
    }
    public getOverlayManagerOptions(): OverlayManagerOptions {
        return this.getOverlayManagerOptions_serialize()
    }
    public createAnimator(options: AnimatorOptions | SimpleAnimatorOptions): AnimatorResult {
        const options_casted = options as (AnimatorOptions | SimpleAnimatorOptions)
        return this.createAnimator_serialize(options_casted)
    }
    public animateTo(value: object, event: (() => void)): void {
        const value_casted = value as (object)
        const event_casted = event as ((() => void))
        this.animateTo_serialize(value_casted, event_casted)
        return
    }
    public showAlertDialog(options: object | object | object): void {
        const options_casted = options as (object | object | object)
        this.showAlertDialog_serialize(options_casted)
        return
    }
    public showActionSheet(value: object): void {
        const value_casted = value as (object)
        this.showActionSheet_serialize(value_casted)
        return
    }
    public showDatePickerDialog(options: object): void {
        const options_casted = options as (object)
        this.showDatePickerDialog_serialize(options_casted)
        return
    }
    public showTimePickerDialog(options: object): void {
        const options_casted = options as (object)
        this.showTimePickerDialog_serialize(options_casted)
        return
    }
    public showTextPickerDialog(options: object): void {
        const options_casted = options as (object)
        this.showTextPickerDialog_serialize(options_casted)
        return
    }
    public runScopedTask(callback_: (() => void)): void {
        const callback__casted = callback_ as ((() => void))
        this.runScopedTask_serialize(callback__casted)
        return
    }
    public setKeyboardAvoidMode(value: KeyboardAvoidMode): void {
        const value_casted = value as (KeyboardAvoidMode)
        this.setKeyboardAvoidMode_serialize(value_casted)
        return
    }
    public getKeyboardAvoidMode(): KeyboardAvoidMode {
        return this.getKeyboardAvoidMode_serialize()
    }
    public setPixelRoundMode(mode: object): void {
        const mode_casted = mode as (object)
        this.setPixelRoundMode_serialize(mode_casted)
        return
    }
    public getPixelRoundMode(): object {
        return this.getPixelRoundMode_serialize()
    }
    public dispatchKeyEvent(node: number | string, event: object): boolean {
        const node_casted = node as (number | string)
        const event_casted = event as (object)
        return this.dispatchKeyEvent_serialize(node_casted, event_casted)
    }
    public getAtomicServiceBar(): object {
        return this.getAtomicServiceBar_serialize()
    }
    public getDragController(): DragController {
        return this.getDragController_serialize()
    }
    public getMeasureUtils(): MeasureUtils {
        return this.getMeasureUtils_serialize()
    }
    public keyframeAnimateTo(param: object, keyframes: Array<object>): void {
        const param_casted = param as (object)
        const keyframes_casted = keyframes as (Array<object>)
        this.keyframeAnimateTo_serialize(param_casted, keyframes_casted)
        return
    }
    public getFocusController(): FocusController {
        return this.getFocusController_serialize()
    }
    public animateToImmediately(param: object, event: (() => void)): void {
        const param_casted = param as (object)
        const event_casted = event as ((() => void))
        this.animateToImmediately_serialize(param_casted, event_casted)
        return
    }
    public getFrameNodeById(id: string): object | undefined {
        const id_casted = id as (string)
        return this.getFrameNodeById_serialize(id_casted)
    }
    public getAttachedFrameNodeById(id: string): object | undefined {
        const id_casted = id as (string)
        return this.getAttachedFrameNodeById_serialize(id_casted)
    }
    public getFrameNodeByUniqueId(id: number): object | undefined {
        const id_casted = id as (number)
        return this.getFrameNodeByUniqueId_serialize(id_casted)
    }
    public getPageInfoByUniqueId(id: number): PageInfo {
        const id_casted = id as (number)
        return this.getPageInfoByUniqueId_serialize(id_casted)
    }
    public getNavigationInfoByUniqueId(id: number): uiObserver.NavigationInfo | undefined {
        const id_casted = id as (number)
        return this.getNavigationInfoByUniqueId_serialize(id_casted)
    }
    public setDynamicDimming(id: string, value: number): void {
        const id_casted = id as (string)
        const value_casted = value as (number)
        this.setDynamicDimming_serialize(id_casted, value_casted)
        return
    }
    public getCursorController(): CursorController {
        return this.getCursorController_serialize()
    }
    public getContextMenuController(): ContextMenuController {
        return this.getContextMenuController_serialize()
    }
    public getComponentSnapshot(): ComponentSnapshot {
        return this.getComponentSnapshot_serialize()
    }
    public vp2px(value: number): number {
        const value_casted = value as (number)
        return this.vp2px_serialize(value_casted)
    }
    public px2vp(value: number): number {
        const value_casted = value as (number)
        return this.px2vp_serialize(value_casted)
    }
    public fp2px(value: number): number {
        const value_casted = value as (number)
        return this.fp2px_serialize(value_casted)
    }
    public px2fp(value: number): number {
        const value_casted = value as (number)
        return this.px2fp_serialize(value_casted)
    }
    public lpx2px(value: number): number {
        const value_casted = value as (number)
        return this.lpx2px_serialize(value_casted)
    }
    public px2lpx(value: number): number {
        const value_casted = value as (number)
        return this.px2lpx_serialize(value_casted)
    }
    public getSharedLocalStorage(): object | undefined {
        return this.getSharedLocalStorage_serialize()
    }
    public getHostContext(): common.Context | undefined {
        return this.getHostContext_serialize()
    }
    public getWindowName(): string | undefined {
        return this.getWindowName_serialize()
    }
    public getWindowWidthBreakpoint(): object {
        return this.getWindowWidthBreakpoint_serialize()
    }
    public getWindowHeightBreakpoint(): object {
        return this.getWindowHeightBreakpoint_serialize()
    }
    public openBindSheet<T>(bindSheetContent: object, sheetOptions?: object, targetId?: number): Promise<void> {
        const bindSheetContent_casted = bindSheetContent as (object)
        const sheetOptions_casted = sheetOptions as (object | undefined)
        const targetId_casted = targetId as (number | undefined)
        return this.openBindSheet_serialize(bindSheetContent_casted, sheetOptions_casted, targetId_casted)
    }
    public updateBindSheet<T>(bindSheetContent: object, sheetOptions: object, partialUpdate?: boolean): Promise<void> {
        const bindSheetContent_casted = bindSheetContent as (object)
        const sheetOptions_casted = sheetOptions as (object)
        const partialUpdate_casted = partialUpdate as (boolean | undefined)
        return this.updateBindSheet_serialize(bindSheetContent_casted, sheetOptions_casted, partialUpdate_casted)
    }
    public closeBindSheet<T>(bindSheetContent: object): Promise<void> {
        const bindSheetContent_casted = bindSheetContent as (object)
        return this.closeBindSheet_serialize(bindSheetContent_casted)
    }
    public postFrameCallback(frameCallback: FrameCallback): void {
        const frameCallback_casted = frameCallback as (FrameCallback)
        this.postFrameCallback_serialize(frameCallback_casted)
        return
    }
    public postDelayedFrameCallback(frameCallback: FrameCallback, delayTime: number): void {
        const frameCallback_casted = frameCallback as (FrameCallback)
        const delayTime_casted = delayTime as (number)
        this.postDelayedFrameCallback_serialize(frameCallback_casted, delayTime_casted)
        return
    }
    public requireDynamicSyncScene(id: string): Array<DynamicSyncScene> {
        const id_casted = id as (string)
        return this.requireDynamicSyncScene_serialize(id_casted)
    }
    public clearResourceCache(): void {
        this.clearResourceCache_serialize()
        return
    }
    public isFollowingSystemFontScale(): boolean {
        return this.isFollowingSystemFontScale_serialize()
    }
    public getMaxFontScale(): number {
        return this.getMaxFontScale_serialize()
    }
    public bindTabsToScrollable(tabsController: object, scroller: object): void {
        const tabsController_casted = tabsController as (object)
        const scroller_casted = scroller as (object)
        this.bindTabsToScrollable_serialize(tabsController_casted, scroller_casted)
        return
    }
    public unbindTabsFromScrollable(tabsController: object, scroller: object): void {
        const tabsController_casted = tabsController as (object)
        const scroller_casted = scroller as (object)
        this.unbindTabsFromScrollable_serialize(tabsController_casted, scroller_casted)
        return
    }
    public bindTabsToNestedScrollable(tabsController: object, parentScroller: object, childScroller: object): void {
        const tabsController_casted = tabsController as (object)
        const parentScroller_casted = parentScroller as (object)
        const childScroller_casted = childScroller as (object)
        this.bindTabsToNestedScrollable_serialize(tabsController_casted, parentScroller_casted, childScroller_casted)
        return
    }
    public unbindTabsFromNestedScrollable(tabsController: object, parentScroller: object, childScroller: object): void {
        const tabsController_casted = tabsController as (object)
        const parentScroller_casted = parentScroller as (object)
        const childScroller_casted = childScroller as (object)
        this.unbindTabsFromNestedScrollable_serialize(tabsController_casted, parentScroller_casted, childScroller_casted)
        return
    }
    public enableSwipeBack(enabled: boolean | undefined): void {
        const enabled_casted = enabled as (boolean | undefined)
        this.enableSwipeBack_serialize(enabled_casted)
        return
    }
    public openBindContentCover<T>(content: object, controller: ContentCoverController, contentCoverOptions?: object, targetId?: number): Promise<void> {
        const content_casted = content as (object)
        const controller_casted = controller as (ContentCoverController)
        const contentCoverOptions_casted = contentCoverOptions as (object | undefined)
        const targetId_casted = targetId as (number | undefined)
        return this.openBindContentCover_serialize(content_casted, controller_casted, contentCoverOptions_casted, targetId_casted)
    }
    public freezeUINode(id: string, isFrozen: boolean): void {
        const id_casted = id as (string)
        const isFrozen_casted = isFrozen as (boolean)
        this.freezeUINode0_serialize(id_casted, isFrozen_casted)
        return
    }
    public freezeUINode(uniqueId: number, isFrozen: boolean): void {
        const uniqueId_casted = uniqueId as (number)
        const isFrozen_casted = isFrozen as (boolean)
        this.freezeUINode1_serialize(uniqueId_casted, isFrozen_casted)
        return
    }
    public getTextMenuController(): TextMenuController {
        return this.getTextMenuController_serialize()
    }
    public static createUIContextWithoutWindow(context: common.UIAbilityContext | common.ExtensionContext): UIContext | undefined {
        const context_casted = context as (common.UIAbilityContext | common.ExtensionContext)
        return UIContext.createUIContextWithoutWindow_serialize(context_casted)
    }
    public static destroyUIContextWithoutWindow(): void {
        UIContext.destroyUIContextWithoutWindow_serialize()
        return
    }
    public setUIStates(callback_: object): void {
        const callback__casted = callback_ as (object)
        this.setUIStates_serialize(callback__casted)
        return
    }
    public static getFocusedUIContext(): UIContext | undefined {
        return UIContext.getFocusedUIContext_serialize()
    }
    getFont_serialize(): Font {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getFont(this.peer!.ptr)
        const obj : Font = extractors.fromFontPtr(retval)
        return obj
    }
    isAvailable_serialize(): boolean {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_isAvailable(this.peer!.ptr)
        return retval
    }
    getMediaQuery_serialize(): MediaQuery {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getMediaQuery(this.peer!.ptr)
        const obj : MediaQuery = extractors.fromMediaQueryPtr(retval)
        return obj
    }
    getUIInspector_serialize(): UIInspector {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getUIInspector(this.peer!.ptr)
        const obj : UIInspector = extractors.fromUIInspectorPtr(retval)
        return obj
    }
    getFilteredInspectorTree_serialize(filters?: Array<string>): string {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (filters !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const filtersTmpValue  = filters!
            thisSerializer.writeInt32((filtersTmpValue.length).toInt())
            for (let filtersTmpValueCounterI = 0; filtersTmpValueCounterI < filtersTmpValue.length; filtersTmpValueCounterI++) {
                const filtersTmpValueTmpElement : string = filtersTmpValue[filtersTmpValueCounterI]
                thisSerializer.writeString(filtersTmpValueTmpElement)
            }
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getFilteredInspectorTree(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    getFilteredInspectorTreeById_serialize(id: string, depth: number, filters?: Array<string>): string {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (filters !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const filtersTmpValue  = filters!
            thisSerializer.writeInt32((filtersTmpValue.length).toInt())
            for (let filtersTmpValueCounterI = 0; filtersTmpValueCounterI < filtersTmpValue.length; filtersTmpValueCounterI++) {
                const filtersTmpValueTmpElement : string = filtersTmpValue[filtersTmpValueCounterI]
                thisSerializer.writeString(filtersTmpValueTmpElement)
            }
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getFilteredInspectorTreeById(this.peer!.ptr, id, depth, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    getRouter_serialize(): Router {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getRouter(this.peer!.ptr)
        const obj : Router = extractors.fromRouterPtr(retval)
        return obj
    }
    getPromptAction_serialize(): PromptAction {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getPromptAction(this.peer!.ptr)
        const obj : PromptAction = extractors.fromPromptActionPtr(retval)
        return obj
    }
    getComponentUtils_serialize(): ComponentUtils {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getComponentUtils(this.peer!.ptr)
        const obj : ComponentUtils = extractors.fromComponentUtilsPtr(retval)
        return obj
    }
    getUIObserver_serialize(): UIObserver {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getUIObserver(this.peer!.ptr)
        const obj : UIObserver = extractors.fromUIObserverPtr(retval)
        return obj
    }
    getOverlayManager_serialize(): OverlayManager {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getOverlayManager(this.peer!.ptr)
        const obj : OverlayManager = extractors.fromOverlayManagerPtr(retval)
        return obj
    }
    setOverlayManagerOptions_serialize(options: OverlayManagerOptions): boolean {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        OverlayManagerOptions_serializer.write(thisSerializer, options)
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_setOverlayManagerOptions(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    getOverlayManagerOptions_serialize(): OverlayManagerOptions {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getOverlayManagerOptions(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : OverlayManagerOptions = OverlayManagerOptions_serializer.read(retvalDeserializer)
        return returnResult
    }
    createAnimator_serialize(options: AnimatorOptions | SimpleAnimatorOptions): AnimatorResult {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (options instanceof AnimatorOptions) {
            thisSerializer.writeInt8((0).toChar())
            const optionsForIdx0  = options as AnimatorOptions
            AnimatorOptions_serializer.write(thisSerializer, optionsForIdx0)
        } else if (options instanceof SimpleAnimatorOptions) {
            thisSerializer.writeInt8((1).toChar())
            const optionsForIdx1  = options as SimpleAnimatorOptions
            SimpleAnimatorOptions_serializer.write(thisSerializer, optionsForIdx1)
        }
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_createAnimator(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        const obj : AnimatorResult = extractors.fromAnimatorResultPtr(retval)
        return obj
    }
    animateTo_serialize(value: object, event: (() => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', value)
        thisSerializer.holdAndWriteCallback(event)
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_animateTo(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    showAlertDialog_serialize(options: object | object | object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (options instanceof object) {
            thisSerializer.writeInt8((0).toChar())
            const optionsForIdx0  = options as object
            thisSerializer.writeCustomObject('object', optionsForIdx0)
        } else if (options instanceof object) {
            thisSerializer.writeInt8((1).toChar())
            const optionsForIdx1  = options as object
            thisSerializer.writeCustomObject('object', optionsForIdx1)
        } else if (options instanceof object) {
            thisSerializer.writeInt8((2).toChar())
            const optionsForIdx2  = options as object
            thisSerializer.writeCustomObject('object', optionsForIdx2)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_showAlertDialog(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    showActionSheet_serialize(value: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', value)
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_showActionSheet(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    showDatePickerDialog_serialize(options: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', options)
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_showDatePickerDialog(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    showTimePickerDialog_serialize(options: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', options)
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_showTimePickerDialog(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    showTextPickerDialog_serialize(options: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', options)
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_showTextPickerDialog(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    runScopedTask_serialize(callback_: (() => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_runScopedTask(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    setKeyboardAvoidMode_serialize(value: KeyboardAvoidMode): void {
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_setKeyboardAvoidMode(this.peer!.ptr, TypeChecker.KeyboardAvoidMode_ToNumeric(value))
    }
    getKeyboardAvoidMode_serialize(): KeyboardAvoidMode {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getKeyboardAvoidMode(this.peer!.ptr)
        return TypeChecker.KeyboardAvoidMode_FromNumeric(retval)
    }
    setPixelRoundMode_serialize(mode: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', mode)
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_setPixelRoundMode(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    getPixelRoundMode_serialize(): object {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getPixelRoundMode(this.peer!.ptr)
        throw new Error("Object deserialization is not implemented.")
    }
    dispatchKeyEvent_serialize(node: number | string, event: object): boolean {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (node instanceof number) {
            thisSerializer.writeInt8((0).toChar())
            const nodeForIdx0  = node as number
            thisSerializer.writeNumber(nodeForIdx0)
        } else if (node instanceof string) {
            thisSerializer.writeInt8((1).toChar())
            const nodeForIdx1  = node as string
            thisSerializer.writeString(nodeForIdx1)
        }
        thisSerializer.writeCustomObject('object', event)
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_dispatchKeyEvent(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    getAtomicServiceBar_serialize(): object {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getAtomicServiceBar(this.peer!.ptr)
        throw new Error("Object deserialization is not implemented.")
    }
    getDragController_serialize(): DragController {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getDragController(this.peer!.ptr)
        const obj : DragController = extractors.fromDragControllerPtr(retval)
        return obj
    }
    getMeasureUtils_serialize(): MeasureUtils {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getMeasureUtils(this.peer!.ptr)
        const obj : MeasureUtils = extractors.fromMeasureUtilsPtr(retval)
        return obj
    }
    keyframeAnimateTo_serialize(param: object, keyframes: Array<object>): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', param)
        thisSerializer.writeInt32((keyframes.length).toInt())
        for (let keyframesCounterI = 0; keyframesCounterI < keyframes.length; keyframesCounterI++) {
            const keyframesTmpElement : object = keyframes[keyframesCounterI]
            thisSerializer.writeCustomObject('object', keyframesTmpElement)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_keyframeAnimateTo(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    getFocusController_serialize(): FocusController {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getFocusController(this.peer!.ptr)
        const obj : FocusController = extractors.fromFocusControllerPtr(retval)
        return obj
    }
    animateToImmediately_serialize(param: object, event: (() => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', param)
        thisSerializer.holdAndWriteCallback(event)
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_animateToImmediately(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    getFrameNodeById_serialize(id: string): object | undefined {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getFrameNodeById(this.peer!.ptr, id)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : object | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readCustomObject('object') as object)
        }
        const returnResult : object | undefined = buffer
        return returnResult
    }
    getAttachedFrameNodeById_serialize(id: string): object | undefined {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getAttachedFrameNodeById(this.peer!.ptr, id)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : object | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readCustomObject('object') as object)
        }
        const returnResult : object | undefined = buffer
        return returnResult
    }
    getFrameNodeByUniqueId_serialize(id: number): object | undefined {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getFrameNodeByUniqueId(this.peer!.ptr, id)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : object | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readCustomObject('object') as object)
        }
        const returnResult : object | undefined = buffer
        return returnResult
    }
    getPageInfoByUniqueId_serialize(id: number): PageInfo {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getPageInfoByUniqueId(this.peer!.ptr, id)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const returnResult : PageInfo = PageInfo_serializer.read(retvalDeserializer)
        return returnResult
    }
    getNavigationInfoByUniqueId_serialize(id: number): uiObserver.NavigationInfo | undefined {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getNavigationInfoByUniqueId(this.peer!.ptr, id)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : uiObserver.NavigationInfo | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = uiObserver_NavigationInfo_serializer.read(retvalDeserializer)
        }
        const returnResult : uiObserver.NavigationInfo | undefined = buffer
        return returnResult
    }
    setDynamicDimming_serialize(id: string, value: number): void {
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_setDynamicDimming(this.peer!.ptr, id, value)
    }
    getCursorController_serialize(): CursorController {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getCursorController(this.peer!.ptr)
        const obj : CursorController = extractors.fromCursorControllerPtr(retval)
        return obj
    }
    getContextMenuController_serialize(): ContextMenuController {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getContextMenuController(this.peer!.ptr)
        const obj : ContextMenuController = extractors.fromContextMenuControllerPtr(retval)
        return obj
    }
    getComponentSnapshot_serialize(): ComponentSnapshot {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getComponentSnapshot(this.peer!.ptr)
        const obj : ComponentSnapshot = extractors.fromComponentSnapshotPtr(retval)
        return obj
    }
    vp2px_serialize(value: number): number {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_vp2px(this.peer!.ptr, value)
        return retval
    }
    px2vp_serialize(value: number): number {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_px2vp(this.peer!.ptr, value)
        return retval
    }
    fp2px_serialize(value: number): number {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_fp2px(this.peer!.ptr, value)
        return retval
    }
    px2fp_serialize(value: number): number {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_px2fp(this.peer!.ptr, value)
        return retval
    }
    lpx2px_serialize(value: number): number {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_lpx2px(this.peer!.ptr, value)
        return retval
    }
    px2lpx_serialize(value: number): number {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_px2lpx(this.peer!.ptr, value)
        return retval
    }
    getSharedLocalStorage_serialize(): object | undefined {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getSharedLocalStorage(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : object | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readCustomObject('object') as object)
        }
        const returnResult : object | undefined = buffer
        return returnResult
    }
    getHostContext_serialize(): common.Context | undefined {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getHostContext(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : common.Context | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readCustomObject('object') as object)
        }
        const returnResult : common.Context | undefined = buffer
        return returnResult
    }
    getWindowName_serialize(): string | undefined {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getWindowName(this.peer!.ptr)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const buffer_runtimeType  = retvalDeserializer.readInt8().toInt()
        let buffer : string | undefined
        if ((buffer_runtimeType) != (RuntimeType.UNDEFINED)) {
            buffer = (retvalDeserializer.readString() as string)
        }
        const returnResult : string | undefined = buffer
        return returnResult
    }
    getWindowWidthBreakpoint_serialize(): object {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getWindowWidthBreakpoint(this.peer!.ptr)
        throw new Error("Object deserialization is not implemented.")
    }
    getWindowHeightBreakpoint_serialize(): object {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getWindowHeightBreakpoint(this.peer!.ptr)
        throw new Error("Object deserialization is not implemented.")
    }
    openBindSheet_serialize<T>(bindSheetContent: object, sheetOptions?: object, targetId?: number): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', bindSheetContent)
        if (sheetOptions !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const sheetOptionsTmpValue  = sheetOptions!
            thisSerializer.writeCustomObject('object', sheetOptionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        if (targetId !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const targetIdTmpValue  = targetId!
            thisSerializer.writeNumber(targetIdTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_openBindSheet(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    updateBindSheet_serialize<T>(bindSheetContent: object, sheetOptions: object, partialUpdate?: boolean): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', bindSheetContent)
        thisSerializer.writeCustomObject('object', sheetOptions)
        if (partialUpdate !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const partialUpdateTmpValue  = partialUpdate!
            thisSerializer.writeBoolean(partialUpdateTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_updateBindSheet(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    closeBindSheet_serialize<T>(bindSheetContent: object): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', bindSheetContent)
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_closeBindSheet(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
        return retval
    }
    postFrameCallback_serialize(frameCallback: FrameCallback): void {
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_postFrameCallback(this.peer!.ptr, extractors.toFrameCallbackPtr(frameCallback))
    }
    postDelayedFrameCallback_serialize(frameCallback: FrameCallback, delayTime: number): void {
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_postDelayedFrameCallback(this.peer!.ptr, extractors.toFrameCallbackPtr(frameCallback), delayTime)
    }
    requireDynamicSyncScene_serialize(id: string): Array<DynamicSyncScene> {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_requireDynamicSyncScene(this.peer!.ptr, id)
        let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
        const bufferLength : int32 = retvalDeserializer.readInt32()
        let buffer : Array<DynamicSyncScene> = new Array<DynamicSyncScene>(bufferLength)
        for (let bufferBufCounterI = 0; bufferBufCounterI < bufferLength; bufferBufCounterI++) {
            buffer[bufferBufCounterI] = (DynamicSyncScene_serializer.read(retvalDeserializer) as DynamicSyncScene)
        }
        const returnResult : Array<DynamicSyncScene> = buffer
        return returnResult
    }
    clearResourceCache_serialize(): void {
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_clearResourceCache(this.peer!.ptr)
    }
    isFollowingSystemFontScale_serialize(): boolean {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_isFollowingSystemFontScale(this.peer!.ptr)
        return retval
    }
    getMaxFontScale_serialize(): number {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getMaxFontScale(this.peer!.ptr)
        return retval
    }
    bindTabsToScrollable_serialize(tabsController: object, scroller: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', tabsController)
        thisSerializer.writeCustomObject('object', scroller)
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_bindTabsToScrollable(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    unbindTabsFromScrollable_serialize(tabsController: object, scroller: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', tabsController)
        thisSerializer.writeCustomObject('object', scroller)
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_unbindTabsFromScrollable(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    bindTabsToNestedScrollable_serialize(tabsController: object, parentScroller: object, childScroller: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', tabsController)
        thisSerializer.writeCustomObject('object', parentScroller)
        thisSerializer.writeCustomObject('object', childScroller)
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_bindTabsToNestedScrollable(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    unbindTabsFromNestedScrollable_serialize(tabsController: object, parentScroller: object, childScroller: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', tabsController)
        thisSerializer.writeCustomObject('object', parentScroller)
        thisSerializer.writeCustomObject('object', childScroller)
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_unbindTabsFromNestedScrollable(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    enableSwipeBack_serialize(enabled: boolean | undefined): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (enabled !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const enabledTmpValue  = enabled!
            thisSerializer.writeBoolean(enabledTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_enableSwipeBack(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    openBindContentCover_serialize<T>(content: object, controller: ContentCoverController, contentCoverOptions?: object, targetId?: number): Promise<void> {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', content)
        if (contentCoverOptions !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const contentCoverOptionsTmpValue  = contentCoverOptions!
            thisSerializer.writeCustomObject('object', contentCoverOptionsTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        if (targetId !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const targetIdTmpValue  = targetId!
            thisSerializer.writeNumber(targetIdTmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_openBindContentCover(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), extractors.toContentCoverControllerPtr(controller))
        thisSerializer.release()
        return retval
    }
    freezeUINode0_serialize(id: string, isFrozen: boolean): void {
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_freezeUINode0(this.peer!.ptr, id, isFrozen ? 1 : 0)
    }
    freezeUINode1_serialize(uniqueId: number, isFrozen: boolean): void {
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_freezeUINode1(this.peer!.ptr, uniqueId, isFrozen ? 1 : 0)
    }
    getTextMenuController_serialize(): TextMenuController {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIContext_getTextMenuController(this.peer!.ptr)
        const obj : TextMenuController = extractors.fromTextMenuControllerPtr(retval)
        return obj
    }
    setUIStates_serialize(callback_: object): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.writeCustomObject('object', callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIContext_setUIStates(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
}
export class UIInspectorInternal {
    public static fromPtr(ptr: KPointer): UIInspector {
        return new UIInspector(ptr)
    }
}
export class UIInspector implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, UIInspector.getFinalizer())
    }
    constructor() {
        this(UIInspector.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIInspector_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._UIInspector_getFinalizer()
    }
    public createComponentObserver(id: string): inspector.ComponentObserver {
        const id_casted = id as (string)
        return this.createComponentObserver_serialize(id_casted)
    }
    createComponentObserver_serialize(id: string): inspector.ComponentObserver {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIInspector_createComponentObserver(this.peer!.ptr, id)
        const obj : inspector.ComponentObserver = extractors.fromInspectorComponentObserverPtr(retval)
        return obj
    }
}
export class UIObserverInternal {
    public static fromPtr(ptr: KPointer): UIObserver {
        return new UIObserver(ptr)
    }
}
export class UIObserver implements MaterializedBase {
    peer?: Finalizable | undefined = undefined
    public getPeer(): Finalizable | undefined {
        return this.peer
    }
    constructor(peerPtr: KPointer) {
        this.peer = new Finalizable(peerPtr, UIObserver.getFinalizer())
    }
    constructor() {
        this(UIObserver.construct())
    }
    static construct(): KPointer {
        const retval  = OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_construct()
        return retval
    }
    static getFinalizer(): KPointer {
        return OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_getFinalizer()
    }
    public onNavDestinationUpdate(options: uiObserver.NavDestinationSwitchObserverOptions, callback_: ((value0: uiObserver.NavDestinationInfo) => void)): void {
        const options_casted = options as (uiObserver.NavDestinationSwitchObserverOptions)
        const callback__casted = callback_ as (((value0: uiObserver.NavDestinationInfo) => void))
        this.onNavDestinationUpdate0_serialize(options_casted, callback__casted)
        return
    }
    public offNavDestinationUpdate(options: uiObserver.NavDestinationSwitchObserverOptions, callback_?: ((value0: uiObserver.NavDestinationInfo) => void)): void {
        const options_casted = options as (uiObserver.NavDestinationSwitchObserverOptions)
        const callback__casted = callback_ as (((value0: uiObserver.NavDestinationInfo) => void) | undefined)
        this.offNavDestinationUpdate0_serialize(options_casted, callback__casted)
        return
    }
    public onNavDestinationUpdate(callback_: ((value0: uiObserver.NavDestinationInfo) => void)): void {
        const callback__casted = callback_ as (((value0: uiObserver.NavDestinationInfo) => void))
        this.onNavDestinationUpdate1_serialize(callback__casted)
        return
    }
    public offNavDestinationUpdate(callback_?: ((value0: uiObserver.NavDestinationInfo) => void)): void {
        const callback__casted = callback_ as (((value0: uiObserver.NavDestinationInfo) => void) | undefined)
        this.offNavDestinationUpdate1_serialize(callback__casted)
        return
    }
    public onScrollEvent(options: uiObserver.ObserverOptions, callback_: ((value0: uiObserver.ScrollEventInfo) => void)): void {
        const options_casted = options as (uiObserver.ObserverOptions)
        const callback__casted = callback_ as (((value0: uiObserver.ScrollEventInfo) => void))
        this.onScrollEvent0_serialize(options_casted, callback__casted)
        return
    }
    public offScrollEvent(options: uiObserver.ObserverOptions, callback_?: ((value0: uiObserver.ScrollEventInfo) => void)): void {
        const options_casted = options as (uiObserver.ObserverOptions)
        const callback__casted = callback_ as (((value0: uiObserver.ScrollEventInfo) => void) | undefined)
        this.offScrollEvent0_serialize(options_casted, callback__casted)
        return
    }
    public onScrollEvent(callback_: ((value0: uiObserver.ScrollEventInfo) => void)): void {
        const callback__casted = callback_ as (((value0: uiObserver.ScrollEventInfo) => void))
        this.onScrollEvent1_serialize(callback__casted)
        return
    }
    public offScrollEvent(callback_?: ((value0: uiObserver.ScrollEventInfo) => void)): void {
        const callback__casted = callback_ as (((value0: uiObserver.ScrollEventInfo) => void) | undefined)
        this.offScrollEvent1_serialize(callback__casted)
        return
    }
    public onRouterPageUpdate(callback_: ((value0: uiObserver.RouterPageInfo) => void)): void {
        const callback__casted = callback_ as (((value0: uiObserver.RouterPageInfo) => void))
        this.onRouterPageUpdate_serialize(callback__casted)
        return
    }
    public offRouterPageUpdate(callback_?: ((value0: uiObserver.RouterPageInfo) => void)): void {
        const callback__casted = callback_ as (((value0: uiObserver.RouterPageInfo) => void) | undefined)
        this.offRouterPageUpdate_serialize(callback__casted)
        return
    }
    public onDensityUpdate(callback_: ((value0: uiObserver.DensityInfo) => void)): void {
        const callback__casted = callback_ as (((value0: uiObserver.DensityInfo) => void))
        this.onDensityUpdate_serialize(callback__casted)
        return
    }
    public offDensityUpdate(callback_?: ((value0: uiObserver.DensityInfo) => void)): void {
        const callback__casted = callback_ as (((value0: uiObserver.DensityInfo) => void) | undefined)
        this.offDensityUpdate_serialize(callback__casted)
        return
    }
    public onWillDraw(callback_: (() => void)): void {
        const callback__casted = callback_ as ((() => void))
        this.onWillDraw_serialize(callback__casted)
        return
    }
    public offWillDraw(callback_?: (() => void)): void {
        const callback__casted = callback_ as ((() => void) | undefined)
        this.offWillDraw_serialize(callback__casted)
        return
    }
    public onDidLayout(callback_: (() => void)): void {
        const callback__casted = callback_ as ((() => void))
        this.onDidLayout_serialize(callback__casted)
        return
    }
    public offDidLayout(callback_?: (() => void)): void {
        const callback__casted = callback_ as ((() => void) | undefined)
        this.offDidLayout_serialize(callback__casted)
        return
    }
    public onNavDestinationSwitch(callback_: ((value0: uiObserver.NavDestinationSwitchInfo) => void)): void {
        const callback__casted = callback_ as (((value0: uiObserver.NavDestinationSwitchInfo) => void))
        this.onNavDestinationSwitch0_serialize(callback__casted)
        return
    }
    public offNavDestinationSwitch(callback_?: ((value0: uiObserver.NavDestinationSwitchInfo) => void)): void {
        const callback__casted = callback_ as (((value0: uiObserver.NavDestinationSwitchInfo) => void) | undefined)
        this.offNavDestinationSwitch0_serialize(callback__casted)
        return
    }
    public onNavDestinationSwitch(observerOptions: uiObserver.NavDestinationSwitchObserverOptions, callback_: ((value0: uiObserver.NavDestinationSwitchInfo) => void)): void {
        const observerOptions_casted = observerOptions as (uiObserver.NavDestinationSwitchObserverOptions)
        const callback__casted = callback_ as (((value0: uiObserver.NavDestinationSwitchInfo) => void))
        this.onNavDestinationSwitch1_serialize(observerOptions_casted, callback__casted)
        return
    }
    public offNavDestinationSwitch(observerOptions: uiObserver.NavDestinationSwitchObserverOptions, callback_?: ((value0: uiObserver.NavDestinationSwitchInfo) => void)): void {
        const observerOptions_casted = observerOptions as (uiObserver.NavDestinationSwitchObserverOptions)
        const callback__casted = callback_ as (((value0: uiObserver.NavDestinationSwitchInfo) => void) | undefined)
        this.offNavDestinationSwitch1_serialize(observerOptions_casted, callback__casted)
        return
    }
    public onWillClick(callback_: ClickEventListenerCallback): void {
        const callback__casted = callback_ as (ClickEventListenerCallback)
        this.onWillClick0_serialize(callback__casted)
        return
    }
    public offWillClick(callback_?: ClickEventListenerCallback): void {
        const callback__casted = callback_ as (ClickEventListenerCallback | undefined)
        this.offWillClick0_serialize(callback__casted)
        return
    }
    public onDidClick(callback_: ClickEventListenerCallback): void {
        const callback__casted = callback_ as (ClickEventListenerCallback)
        this.onDidClick0_serialize(callback__casted)
        return
    }
    public offDidClick(callback_?: ClickEventListenerCallback): void {
        const callback__casted = callback_ as (ClickEventListenerCallback | undefined)
        this.offDidClick0_serialize(callback__casted)
        return
    }
    public onWillClick(callback_: GestureEventListenerCallback): void {
        const callback__casted = callback_ as (GestureEventListenerCallback)
        this.onWillClick1_serialize(callback__casted)
        return
    }
    public offWillClick(callback_?: GestureEventListenerCallback): void {
        const callback__casted = callback_ as (GestureEventListenerCallback | undefined)
        this.offWillClick1_serialize(callback__casted)
        return
    }
    public onDidClick(callback_: GestureEventListenerCallback): void {
        const callback__casted = callback_ as (GestureEventListenerCallback)
        this.onDidClick1_serialize(callback__casted)
        return
    }
    public offDidClick(callback_?: GestureEventListenerCallback): void {
        const callback__casted = callback_ as (GestureEventListenerCallback | undefined)
        this.offDidClick1_serialize(callback__casted)
        return
    }
    public onBeforePanStart(callback_: PanListenerCallback): void {
        const callback__casted = callback_ as (PanListenerCallback)
        this.onBeforePanStart_serialize(callback__casted)
        return
    }
    public offBeforePanStart(callback_?: PanListenerCallback): void {
        const callback__casted = callback_ as (PanListenerCallback | undefined)
        this.offBeforePanStart_serialize(callback__casted)
        return
    }
    public onBeforePanEnd(callback_: PanListenerCallback): void {
        const callback__casted = callback_ as (PanListenerCallback)
        this.onBeforePanEnd_serialize(callback__casted)
        return
    }
    public offBeforePanEnd(callback_?: PanListenerCallback): void {
        const callback__casted = callback_ as (PanListenerCallback | undefined)
        this.offBeforePanEnd_serialize(callback__casted)
        return
    }
    public onAfterPanStart(callback_: PanListenerCallback): void {
        const callback__casted = callback_ as (PanListenerCallback)
        this.onAfterPanStart_serialize(callback__casted)
        return
    }
    public offAfterPanStart(callback_?: PanListenerCallback): void {
        const callback__casted = callback_ as (PanListenerCallback | undefined)
        this.offAfterPanStart_serialize(callback__casted)
        return
    }
    public onAfterPanEnd(callback_: PanListenerCallback): void {
        const callback__casted = callback_ as (PanListenerCallback)
        this.onAfterPanEnd_serialize(callback__casted)
        return
    }
    public offAfterPanEnd(callback_?: PanListenerCallback): void {
        const callback__casted = callback_ as (PanListenerCallback | undefined)
        this.offAfterPanEnd_serialize(callback__casted)
        return
    }
    public onNodeRenderState(nodeIdentity: NodeIdentity, callback_: NodeRenderStateChangeCallback): void {
        const nodeIdentity_casted = nodeIdentity as (NodeIdentity)
        const callback__casted = callback_ as (NodeRenderStateChangeCallback)
        this.onNodeRenderState_serialize(nodeIdentity_casted, callback__casted)
        return
    }
    public offNodeRenderState(nodeIdentity: NodeIdentity, callback_?: NodeRenderStateChangeCallback): void {
        const nodeIdentity_casted = nodeIdentity as (NodeIdentity)
        const callback__casted = callback_ as (NodeRenderStateChangeCallback | undefined)
        this.offNodeRenderState_serialize(nodeIdentity_casted, callback__casted)
        return
    }
    public onTabContentUpdate(options: uiObserver.ObserverOptions, callback_: ((value0: uiObserver.TabContentInfo) => void)): void {
        const options_casted = options as (uiObserver.ObserverOptions)
        const callback__casted = callback_ as (((value0: uiObserver.TabContentInfo) => void))
        this.onTabContentUpdate0_serialize(options_casted, callback__casted)
        return
    }
    public offTabContentUpdate(options: uiObserver.ObserverOptions, callback_?: ((value0: uiObserver.TabContentInfo) => void)): void {
        const options_casted = options as (uiObserver.ObserverOptions)
        const callback__casted = callback_ as (((value0: uiObserver.TabContentInfo) => void) | undefined)
        this.offTabContentUpdate0_serialize(options_casted, callback__casted)
        return
    }
    public onTabContentUpdate(callback_: ((value0: uiObserver.TabContentInfo) => void)): void {
        const callback__casted = callback_ as (((value0: uiObserver.TabContentInfo) => void))
        this.onTabContentUpdate1_serialize(callback__casted)
        return
    }
    public offTabContentUpdate(callback_?: ((value0: uiObserver.TabContentInfo) => void)): void {
        const callback__casted = callback_ as (((value0: uiObserver.TabContentInfo) => void) | undefined)
        this.offTabContentUpdate1_serialize(callback__casted)
        return
    }
    public addGlobalGestureListener(type: GestureListenerType, option: GestureObserverConfigs, callback_: GestureListenerCallback): void {
        const type_casted = type as (GestureListenerType)
        const option_casted = option as (GestureObserverConfigs)
        const callback__casted = callback_ as (GestureListenerCallback)
        this.addGlobalGestureListener_serialize(type_casted, option_casted, callback__casted)
        return
    }
    public removeGlobalGestureListener(type: GestureListenerType, callback_?: GestureListenerCallback): void {
        const type_casted = type as (GestureListenerType)
        const callback__casted = callback_ as (GestureListenerCallback | undefined)
        this.removeGlobalGestureListener_serialize(type_casted, callback__casted)
        return
    }
    on(type: string, options: uiObserver.NavDestinationSwitchObserverOptions, callback_: ((value0: uiObserver.NavDestinationInfo) => void)): void {
        throw new Error("Improve")
    }
    off(type: string, options: uiObserver.NavDestinationSwitchObserverOptions, callback_: ((value0: uiObserver.NavDestinationInfo) => void)): void {
        throw new Error("Improve")
    }
    onNavDestinationUpdate0_serialize(options: uiObserver.NavDestinationSwitchObserverOptions, callback_: ((value0: uiObserver.NavDestinationInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        uiObserver_NavDestinationSwitchObserverOptions_serializer.write(thisSerializer, options)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onNavDestinationUpdate0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offNavDestinationUpdate0_serialize(options: uiObserver.NavDestinationSwitchObserverOptions, callback_?: ((value0: uiObserver.NavDestinationInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        uiObserver_NavDestinationSwitchObserverOptions_serializer.write(thisSerializer, options)
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offNavDestinationUpdate0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onNavDestinationUpdate1_serialize(callback_: ((value0: uiObserver.NavDestinationInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onNavDestinationUpdate1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offNavDestinationUpdate1_serialize(callback_?: ((value0: uiObserver.NavDestinationInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offNavDestinationUpdate1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onScrollEvent0_serialize(options: uiObserver.ObserverOptions, callback_: ((value0: uiObserver.ScrollEventInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        uiObserver_ObserverOptions_serializer.write(thisSerializer, options)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onScrollEvent0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offScrollEvent0_serialize(options: uiObserver.ObserverOptions, callback_?: ((value0: uiObserver.ScrollEventInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        uiObserver_ObserverOptions_serializer.write(thisSerializer, options)
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offScrollEvent0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onScrollEvent1_serialize(callback_: ((value0: uiObserver.ScrollEventInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onScrollEvent1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offScrollEvent1_serialize(callback_?: ((value0: uiObserver.ScrollEventInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offScrollEvent1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onRouterPageUpdate_serialize(callback_: ((value0: uiObserver.RouterPageInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onRouterPageUpdate(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offRouterPageUpdate_serialize(callback_?: ((value0: uiObserver.RouterPageInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offRouterPageUpdate(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onDensityUpdate_serialize(callback_: ((value0: uiObserver.DensityInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onDensityUpdate(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offDensityUpdate_serialize(callback_?: ((value0: uiObserver.DensityInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offDensityUpdate(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onWillDraw_serialize(callback_: (() => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onWillDraw(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offWillDraw_serialize(callback_?: (() => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offWillDraw(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onDidLayout_serialize(callback_: (() => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onDidLayout(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offDidLayout_serialize(callback_?: (() => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offDidLayout(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onNavDestinationSwitch0_serialize(callback_: ((value0: uiObserver.NavDestinationSwitchInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onNavDestinationSwitch0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offNavDestinationSwitch0_serialize(callback_?: ((value0: uiObserver.NavDestinationSwitchInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offNavDestinationSwitch0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onNavDestinationSwitch1_serialize(observerOptions: uiObserver.NavDestinationSwitchObserverOptions, callback_: ((value0: uiObserver.NavDestinationSwitchInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        uiObserver_NavDestinationSwitchObserverOptions_serializer.write(thisSerializer, observerOptions)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onNavDestinationSwitch1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offNavDestinationSwitch1_serialize(observerOptions: uiObserver.NavDestinationSwitchObserverOptions, callback_?: ((value0: uiObserver.NavDestinationSwitchInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        uiObserver_NavDestinationSwitchObserverOptions_serializer.write(thisSerializer, observerOptions)
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offNavDestinationSwitch1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onWillClick0_serialize(callback_: ClickEventListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onWillClick0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offWillClick0_serialize(callback_?: ClickEventListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offWillClick0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onDidClick0_serialize(callback_: ClickEventListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onDidClick0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offDidClick0_serialize(callback_?: ClickEventListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offDidClick0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onWillClick1_serialize(callback_: GestureEventListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onWillClick1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offWillClick1_serialize(callback_?: GestureEventListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offWillClick1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onDidClick1_serialize(callback_: GestureEventListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onDidClick1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offDidClick1_serialize(callback_?: GestureEventListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offDidClick1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onBeforePanStart_serialize(callback_: PanListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onBeforePanStart(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offBeforePanStart_serialize(callback_?: PanListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offBeforePanStart(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onBeforePanEnd_serialize(callback_: PanListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onBeforePanEnd(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offBeforePanEnd_serialize(callback_?: PanListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offBeforePanEnd(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onAfterPanStart_serialize(callback_: PanListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onAfterPanStart(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offAfterPanStart_serialize(callback_?: PanListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offAfterPanStart(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onAfterPanEnd_serialize(callback_: PanListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onAfterPanEnd(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offAfterPanEnd_serialize(callback_?: PanListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offAfterPanEnd(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onNodeRenderState_serialize(nodeIdentity: NodeIdentity, callback_: NodeRenderStateChangeCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (nodeIdentity instanceof string) {
            thisSerializer.writeInt8((0).toChar())
            const nodeIdentityForIdx0  = nodeIdentity as string
            thisSerializer.writeString(nodeIdentityForIdx0)
        } else if (nodeIdentity instanceof number) {
            thisSerializer.writeInt8((1).toChar())
            const nodeIdentityForIdx1  = nodeIdentity as number
            thisSerializer.writeNumber(nodeIdentityForIdx1)
        }
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onNodeRenderState(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offNodeRenderState_serialize(nodeIdentity: NodeIdentity, callback_?: NodeRenderStateChangeCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (nodeIdentity instanceof string) {
            thisSerializer.writeInt8((0).toChar())
            const nodeIdentityForIdx0  = nodeIdentity as string
            thisSerializer.writeString(nodeIdentityForIdx0)
        } else if (nodeIdentity instanceof number) {
            thisSerializer.writeInt8((1).toChar())
            const nodeIdentityForIdx1  = nodeIdentity as number
            thisSerializer.writeNumber(nodeIdentityForIdx1)
        }
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offNodeRenderState(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onTabContentUpdate0_serialize(options: uiObserver.ObserverOptions, callback_: ((value0: uiObserver.TabContentInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        uiObserver_ObserverOptions_serializer.write(thisSerializer, options)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onTabContentUpdate0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offTabContentUpdate0_serialize(options: uiObserver.ObserverOptions, callback_?: ((value0: uiObserver.TabContentInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        uiObserver_ObserverOptions_serializer.write(thisSerializer, options)
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offTabContentUpdate0(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    onTabContentUpdate1_serialize(callback_: ((value0: uiObserver.TabContentInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_onTabContentUpdate1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    offTabContentUpdate1_serialize(callback_?: ((value0: uiObserver.TabContentInfo) => void)): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_offTabContentUpdate1(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    addGlobalGestureListener_serialize(type: GestureListenerType, option: GestureObserverConfigs, callback_: GestureListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        GestureObserverConfigs_serializer.write(thisSerializer, option)
        thisSerializer.holdAndWriteCallback(callback_)
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_addGlobalGestureListener(this.peer!.ptr, TypeChecker.GestureListenerType_ToNumeric(type), thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
    removeGlobalGestureListener_serialize(type: GestureListenerType, callback_?: GestureListenerCallback): void {
        const thisSerializer : SerializerBase = SerializerBase.hold()
        if (callback_ !== undefined) {
            thisSerializer.writeInt8(RuntimeType.OBJECT)
            const callback_TmpValue  = callback_!
            thisSerializer.holdAndWriteCallback(callback_TmpValue)
        } else {
            thisSerializer.writeInt8(RuntimeType.UNDEFINED)
        }
        OHOS_ARKUI_UICONTEXTNativeModule._UIObserver_removeGlobalGestureListener(this.peer!.ptr, TypeChecker.GestureListenerType_ToNumeric(type), thisSerializer.asBuffer(), thisSerializer.length())
        thisSerializer.release()
    }
}
export interface TargetInfo {
    id: string | number;
    componentId?: number;
}
export type ClickEventListenerCallback = (event: object, node?: object) => void;
export type PanListenerCallback = (event: object, current: object, node?: object) => void;
export type GestureEventListenerCallback = (event: object, node?: object) => void;
export interface PageInfo {
    routerPageInfo?: uiObserver.RouterPageInfo;
    navDestinationInfo?: uiObserver.NavDestinationInfo;
}
export interface OverlayManagerOptions {
    renderRootOverlay?: boolean;
    enableBackPressedEvent?: boolean;
}
export type NodeIdentity = string | number;
export enum NodeRenderState {
    ABOUT_TO_RENDER_IN = 0,
    ABOUT_TO_RENDER_OUT = 1
}
export type NodeRenderStateChangeCallback = (state: NodeRenderState, node?: object) => void;
export enum GestureActionPhase {
    WILL_START = 0,
    WILL_END = 1
}
export enum GestureListenerType {
    TAP = 0,
    LONG_PRESS = 1,
    PAN = 2,
    PINCH = 3,
    SWIPE = 4,
    ROTATION = 5
}
export interface GestureTriggerInfo {
    event: object;
    current: object;
    currentPhase: GestureActionPhase;
    node?: object;
}
export interface GestureObserverConfigs {
    actionPhases: Array<GestureActionPhase>;
}
export type GestureListenerCallback = (info: GestureTriggerInfo) => void;
export type PointerStyle = pointer.PointerStyle;
export type Context = common.Context;
export enum KeyboardAvoidMode {
    OFFSET = 0,
    RESIZE = 1,
    OFFSET_WITH_CARET = 2,
    RESIZE_WITH_CARET = 3,
    NONE = 4
}
