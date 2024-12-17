/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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

import { pointer, FinalizableBase, NativeThunk } from "@koalaui/interop"
import { nativeModule } from "./generated/NativeModule"

export class NativeThunkImpl extends NativeThunk {
    constructor(obj: pointer, finalizer: pointer, name?: string) {
        super(obj, finalizer, name)
    }
    destroyNative(ptr: pointer, finalizer: pointer): void {
        nativeModule()._InvokeFinalizer(ptr, finalizer)
    }
}

export class Finalizable extends FinalizableBase {
    constructor(ptr: pointer, finalizer: pointer, managed: boolean = true) {
        super(ptr, finalizer, managed)
    }

    override makeNativeThunk(ptr: pointer, finalizer: pointer, handle: string | undefined): NativeThunk {
        return new NativeThunkImpl(ptr, finalizer, handle)
    }

    override createHandle(): string | undefined {
        return undefined
    }
}
