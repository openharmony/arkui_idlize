/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

import { pointer, nullptr } from "./utils"
import { nativeModule } from "@koalaui/arkoala";
import { Thunk } from "./Finalization";
import { isNullPtr } from "@koalaui/interop"

export abstract class FinalizableBase {
    createHandle(): string | undefined
    close(): void
    release(): pointer
    resetPeer(pointer: pointer): void
    use<R>(body: (value: FinalizableBase) => R): R
}

export class Finalizable extends FinalizableBase {
    makeNativeThunk(ptr: pointer, finalizer: pointer, handle: string | undefined): NativeThunk 
}

export abstract class NativeThunk implements Thunk {
    ptr:pointer
    finalizer: pointer
    name?: string
    clean(): void
    abstract destroyNative(ptr: pointer, finalizer: pointer): void
}

declare class NativeThunkImpl extends NativeThunk {
    destroyNative(ptr: pointer, finalizer: pointer): void
}