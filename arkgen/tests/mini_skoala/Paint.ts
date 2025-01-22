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

import { Finalizable } from "./Finalizable"
import { pointer, KNativePointer, KPointer } from "./utils"
import { nativeModule } from "@koalaui/arkoala"
import { int32 } from "./utils"

export class Paint extends Finalizable {
    constructor(ptr: pointer) { super(ptr, Paint.getFinalizer()) }

    public static getFinalizer(): KNativePointer {
        return nativeModule()._skoala_Paint__1nGetFinalizer()
    }

    public set antiAlias(value: boolean) {
        nativeModule()._skoala_Paint__1nSetAntiAlias(this.ptr, +value)
    }

    public set color(color: int32) {
        nativeModule()._skoala_Paint__1nSetColor(this.ptr, color)
    }

    public static make(): Paint {
        const ptr = nativeModule()._skoala_Paint__1nMake()
        if (!ptr) throw new TypeError("can not create an instance of type Paint")
        let result = new Paint(ptr)
        // We want antialiasing by default.
        result.antiAlias = true
        return result
    }
}