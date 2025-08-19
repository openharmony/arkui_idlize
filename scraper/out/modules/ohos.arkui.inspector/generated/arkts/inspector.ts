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
import { TypeChecker, OHOS_ARKUI_INSPECTORNativeModule } from "./ohos.arkui.inspector.INTERNAL"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export default inspector
export namespace inspector {
    export interface ComponentObserver {
        onLayoutLayout(callback_: (() => void)): void
        offLayoutLayout(callback_: (() => void) | undefined): void
        onDrawDraw(callback_: (() => void)): void
        offDrawDraw(callback_: (() => void) | undefined): void
        onDrawChildrenDrawChildren(callback_: (() => void)): void
        offDrawChildrenDrawChildren(callback_: (() => void) | undefined): void
    }
    export class ComponentObserverInternal implements MaterializedBase,ComponentObserver {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, ComponentObserverInternal.getFinalizer())
        }
        constructor() {
            this(ComponentObserverInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_ARKUI_INSPECTORNativeModule._inspector_ComponentObserver_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_ARKUI_INSPECTORNativeModule._inspector_ComponentObserver_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): ComponentObserverInternal {
            return new ComponentObserverInternal(ptr)
        }
        public onLayoutLayout(callback_: (() => void)): void {
            const callback__casted = callback_ as ((() => void))
            this.onLayoutLayout_serialize(callback__casted)
            return
        }
        public offLayoutLayout(callback_?: (() => void)): void {
            const callback__casted = callback_ as ((() => void) | undefined)
            this.offLayoutLayout_serialize(callback__casted)
            return
        }
        public onDrawDraw(callback_: (() => void)): void {
            const callback__casted = callback_ as ((() => void))
            this.onDrawDraw_serialize(callback__casted)
            return
        }
        public offDrawDraw(callback_?: (() => void)): void {
            const callback__casted = callback_ as ((() => void) | undefined)
            this.offDrawDraw_serialize(callback__casted)
            return
        }
        public onDrawChildrenDrawChildren(callback_: (() => void)): void {
            const callback__casted = callback_ as ((() => void))
            this.onDrawChildrenDrawChildren_serialize(callback__casted)
            return
        }
        public offDrawChildrenDrawChildren(callback_?: (() => void)): void {
            const callback__casted = callback_ as ((() => void) | undefined)
            this.offDrawChildrenDrawChildren_serialize(callback__casted)
            return
        }
        onLayout(type: string, callback_: (() => void)): void {
            throw new Error("Improve")
        }
        offLayout(type: string, callback_: (() => void)): void {
            throw new Error("Improve")
        }
        onDraw(type: string, callback_: (() => void)): void {
            throw new Error("Improve")
        }
        offDraw(type: string, callback_: (() => void)): void {
            throw new Error("Improve")
        }
        onDrawChildren(type: string, callback_: (() => void)): void {
            throw new Error("Improve")
        }
        offDrawChildren(type: string, callback_: (() => void)): void {
            throw new Error("Improve")
        }
        onLayoutLayout_serialize(callback_: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_ARKUI_INSPECTORNativeModule._inspector_ComponentObserver_onLayoutLayout(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offLayoutLayout_serialize(callback_?: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_ARKUI_INSPECTORNativeModule._inspector_ComponentObserver_offLayoutLayout(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onDrawDraw_serialize(callback_: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_ARKUI_INSPECTORNativeModule._inspector_ComponentObserver_onDrawDraw(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offDrawDraw_serialize(callback_?: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_ARKUI_INSPECTORNativeModule._inspector_ComponentObserver_offDrawDraw(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        onDrawChildrenDrawChildren_serialize(callback_: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_ARKUI_INSPECTORNativeModule._inspector_ComponentObserver_onDrawChildrenDrawChildren(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offDrawChildrenDrawChildren_serialize(callback_?: (() => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_ARKUI_INSPECTORNativeModule._inspector_ComponentObserver_offDrawChildrenDrawChildren(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
    }
}
