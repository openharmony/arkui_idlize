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

import { pointer, nullptr, isNullPtr } from "@koalaui/interop"
import { finalizerRegister, finalizerUnregister, Thunk } from "./Finalization";
import { nativeModule } from "@koalaui/arkoala";

export abstract class FinalizableBase {
    ptr: pointer
    finalizer: pointer
    managed: boolean
    cleaner?: NativeThunk = undefined

    constructor(ptr: pointer, finalizer: pointer, managed: boolean) {
        this.ptr = ptr
        this.finalizer = finalizer
        this.managed = managed

        if (this.managed) {
            if (isNullPtr(this.ptr)) throw new Error("Can't have nullptr ptr")
            if (isNullPtr(this.finalizer)) throw new Error("Can't have nullptr finalizer")

            const handle = this.createHandle()
            const thunk = this.makeNativeThunk(ptr, finalizer, handle)
            finalizerRegister(this, thunk)
            this.cleaner = thunk
        }
    }

    abstract makeNativeThunk(ptr: pointer, finalizer: pointer, handle: string|undefined): NativeThunk

    createHandle(): string | undefined {
        return undefined
    }

    close() {
        if (isNullPtr(this.ptr)) {
            throw new Error(`Closing a closed object: ${this}`)
        } else if (this.cleaner === undefined || isNullPtr(this.cleaner.ptr) || isNullPtr(this.cleaner.finalizer)) {
            throw new Error(`No thunk assigned to ${this}`)
        }

        finalizerUnregister(this)
        this.cleaner?.clean()
        this.cleaner = undefined
        this.ptr = nullptr
    }

    release(): pointer {
        finalizerUnregister(this)
        if (this.cleaner !== undefined)
            this.cleaner.ptr = nullptr
        const result = this.ptr
        this.ptr = nullptr
        return result
    }

    resetPeer(pointer: pointer) {
        if (this.managed) throw Error(`Can only reset peer for an unmanaged object`)
        this.ptr = pointer
    }

    use<R>(body: (value: FinalizableBase) => R): R {
        const result = body(this)
        this.close()
        return result
    }
}

export class Finalizable extends FinalizableBase {
    constructor(public ptr: pointer, finalizer: pointer, managed: boolean = true) {
        super(ptr, finalizer, managed)
    }

    makeNativeThunk(ptr: pointer, finalizer: pointer, handle: string | undefined): NativeThunk {
        return new NativeThunkImpl(ptr, finalizer, handle)
    }
}

export abstract class NativeThunk implements Thunk {
    ptr:pointer
    finalizer: pointer
    name?: string

    constructor(ptr: pointer, finalizer: pointer, name?: string) {
        this.ptr = ptr;
        this.finalizer = finalizer;
        this.name = name
    }

    clean() {
        if(!isNullPtr(this.ptr)) {
            this.destroyNative(this.ptr, this.finalizer)
        }
        this.ptr = nullptr;
    }

    abstract destroyNative(ptr: pointer, finalizer: pointer) : void
}

export class NativeThunkImpl extends NativeThunk {
    constructor(ptr: pointer, finalizer: pointer, name?: string) {
        super(ptr, finalizer, name)
    }
    destroyNative(ptr: pointer, finalizer: pointer): void {
        nativeModule()._InvokeFinalizer(ptr, finalizer)
    }
}
