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

import { FinalizableBase, NativeThunk, pointer } from "@koalaui/interop"
import { getXMLNativeModule } from "./xmlNative"

export interface MaterializedBase {
    getPeer(): Finalizable
}

export class Finalizable extends FinalizableBase {
    createHandle(): string | undefined {
        return undefined
    }
    constructor(public ptr: pointer, finalizer: pointer, managed: boolean = true) {
        super(ptr, finalizer, managed)
    }

    makeNativeThunk(ptr: pointer, finalizer: pointer, handle: string | undefined): NativeThunk {
        return new NativeThunkImpl(ptr, finalizer, handle)
    }
}


export class NativeThunkImpl extends NativeThunk {
    constructor(ptr: pointer, finalizer: pointer, name?: string) {
        super(ptr, finalizer, name)
    }
    destroyNative(ptr: pointer, finalizer: pointer): void {
        getXMLNativeModule()._InvokeFinalizer(ptr, finalizer)
    }
}
