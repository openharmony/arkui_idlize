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
import { TypeChecker, OHOS_ARKUI_DRAGCONTROLLERNativeModule, dragController_AnimationOptions_serializer } from "./ohos.arkui.dragController.INTERNAL"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
import { extractors } from "#handwritten"
import { default as unifiedDataChannel } from "@ohos.data.unifiedDataChannel"
export default dragController
export namespace dragController {
    export interface DragAction {
        startDrag(): Promise<void>
        onStatusChange(callback_: ((value0: DragAndDropInfo) => void)): void
        offStatusChange(callback_: ((value0: DragAndDropInfo) => void) | undefined): void
    }
    export class DragActionInternal implements MaterializedBase,DragAction {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, DragActionInternal.getFinalizer())
        }
        constructor() {
            this(DragActionInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_ARKUI_DRAGCONTROLLERNativeModule._dragController_DragAction_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_ARKUI_DRAGCONTROLLERNativeModule._dragController_DragAction_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): DragActionInternal {
            return new DragActionInternal(ptr)
        }
        public startDrag(): Promise<void> {
            return this.startDrag_serialize()
        }
        public onStatusChange(callback_: ((value0: DragAndDropInfo) => void)): void {
            const callback__casted = callback_ as (((value0: DragAndDropInfo) => void))
            this.onStatusChange_serialize(callback__casted)
            return
        }
        public offStatusChange(callback_?: ((value0: DragAndDropInfo) => void)): void {
            const callback__casted = callback_ as (((value0: DragAndDropInfo) => void) | undefined)
            this.offStatusChange_serialize(callback__casted)
            return
        }
        on(type: string, callback_: ((value0: DragAndDropInfo) => void)): void {
            throw new Error("Improve")
        }
        off(type: string, callback_: ((value0: DragAndDropInfo) => void)): void {
            throw new Error("Improve")
        }
        startDrag_serialize(): Promise<void> {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const retval  = thisSerializer.holdAndWriteCallbackForPromiseVoid()[0]
            OHOS_ARKUI_DRAGCONTROLLERNativeModule._dragController_DragAction_startDrag(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            return retval
        }
        onStatusChange_serialize(callback_: ((value0: DragAndDropInfo) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_ARKUI_DRAGCONTROLLERNativeModule._dragController_DragAction_onStatusChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offStatusChange_serialize(callback_?: ((value0: DragAndDropInfo) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_ARKUI_DRAGCONTROLLERNativeModule._dragController_DragAction_offStatusChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
    }
    export class DragPreviewInternal {
        public static fromPtr(ptr: KPointer): dragController.DragPreview {
            return new dragController.DragPreview(ptr)
        }
    }
    export class DragPreview implements MaterializedBase {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, DragPreview.getFinalizer())
        }
        constructor() {
            this(DragPreview.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_ARKUI_DRAGCONTROLLERNativeModule._dragController_DragPreview_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_ARKUI_DRAGCONTROLLERNativeModule._dragController_DragPreview_getFinalizer()
        }
        public setForegroundColor(color: object): void {
            const color_casted = color as (object)
            this.setForegroundColor_serialize(color_casted)
            return
        }
        public animate(options: AnimationOptions, handler: (() => void)): void {
            const options_casted = options as (AnimationOptions)
            const handler_casted = handler as ((() => void))
            this.animate_serialize(options_casted, handler_casted)
            return
        }
        setForegroundColor_serialize(color: object): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeCustomObject('object', color)
            OHOS_ARKUI_DRAGCONTROLLERNativeModule._dragController_DragPreview_setForegroundColor(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        animate_serialize(options: AnimationOptions, handler: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            dragController_AnimationOptions_serializer.write(thisSerializer, options)
            thisSerializer.holdAndWriteCallback(handler)
            OHOS_ARKUI_DRAGCONTROLLERNativeModule._dragController_DragPreview_animate(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
    }
    export enum DragStatus {
        STARTED = 0,
        ENDED = 1
    }
    export interface DragAndDropInfo {
        status: dragController.DragStatus;
        event: object;
        extraParams?: string;
    }
    export interface DragInfo {
        pointerId: number;
        data?: unifiedDataChannel.UnifiedData;
        extraParams?: string;
        touchPoint?: object;
        previewOptions?: object;
    }
    export interface AnimationOptions {
        duration?: number;
        curve?: object | object;
    }
    export interface DragEventParam {
        event: object;
        extraParams: string;
    }
    export enum DragStartRequestStatus {
        WAITING = 0,
        READY = 1
    }
}
