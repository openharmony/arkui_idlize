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
import { TypeChecker, OHOS_MEDIAQUERYNativeModule } from "./ohos.mediaquery.INTERNAL"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export default mediaquery
export namespace mediaquery {
    export interface MediaQueryListener {
        onChange(callback_: ((value0: MediaQueryResult) => void)): void
        offChange(callback_: ((value0: MediaQueryResult) => void) | undefined): void
    }
    export class MediaQueryListenerInternal implements MaterializedBase,mediaquery.MediaQueryResult,MediaQueryListener {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        readonly matches: boolean
        readonly media: string
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, MediaQueryListenerInternal.getFinalizer())
            this.matches = this.getMatches()
            this.media = this.getMedia()
        }
        constructor() {
            this(MediaQueryListenerInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_MEDIAQUERYNativeModule._mediaquery_MediaQueryListener_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_MEDIAQUERYNativeModule._mediaquery_MediaQueryListener_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): MediaQueryListenerInternal {
            return new MediaQueryListenerInternal(ptr)
        }
        public onChange(callback_: ((value0: MediaQueryResult) => void)): void {
            const callback__casted = callback_ as (((value0: MediaQueryResult) => void))
            this.onChange_serialize(callback__casted)
            return
        }
        public offChange(callback_?: ((value0: MediaQueryResult) => void)): void {
            const callback__casted = callback_ as (((value0: MediaQueryResult) => void) | undefined)
            this.offChange_serialize(callback__casted)
            return
        }
        private getMatches(): boolean {
            return this.getMatches_serialize()
        }
        private getMedia(): string {
            return this.getMedia_serialize()
        }
        on(type: string, callback_: ((value0: MediaQueryResult) => void)): void {
            throw new Error("Improve")
        }
        off(type: string, callback_: ((value0: MediaQueryResult) => void)): void {
            throw new Error("Improve")
        }
        onChange_serialize(callback_: ((value0: MediaQueryResult) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.holdAndWriteCallback(callback_)
            OHOS_MEDIAQUERYNativeModule._mediaquery_MediaQueryListener_onChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        offChange_serialize(callback_?: ((value0: MediaQueryResult) => void)): void {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            if (callback_ !== undefined) {
                thisSerializer.writeInt8(RuntimeType.OBJECT)
                const callback_TmpValue  = callback_!
                thisSerializer.holdAndWriteCallback(callback_TmpValue)
            } else {
                thisSerializer.writeInt8(RuntimeType.UNDEFINED)
            }
            OHOS_MEDIAQUERYNativeModule._mediaquery_MediaQueryListener_offChange(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
        }
        private getMatches_serialize(): boolean {
            const retval  = OHOS_MEDIAQUERYNativeModule._mediaquery_MediaQueryListener_getMatches(this.peer!.ptr)
            return retval
        }
        private getMedia_serialize(): string {
            const retval  = OHOS_MEDIAQUERYNativeModule._mediaquery_MediaQueryListener_getMedia(this.peer!.ptr)
            return retval
        }
    }
    export interface MediaQueryResult {
        readonly matches: boolean;
        readonly media: string;
    }
}
