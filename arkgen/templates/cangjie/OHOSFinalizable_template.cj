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

package idlize

public abstract class MaterializedBase {
    func getPeer(): Finalizable
}

export class Finalizable {
    public var ptr: pointer
    public var finalizerPtr: pointer

    public static func Empty: Finalizable = Finalizable(0, 0)

    init (ptr: pointer, finalizerPtr: pointer) {
        this.ptr = ptr
        this.finalizerPtr = finalizerPtr
    }

    func release(): pointer {
        let result = this.ptr
        this.ptr = nullptr
        return result
    }
}
