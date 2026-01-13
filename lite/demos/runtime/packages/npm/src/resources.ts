/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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
import { DeserializerBase } from "@idlizer/runtime-native";

interface ManagedResourceBox {
    resourceId: number
    fnc:any
    caller: (fn:any, buffer:DeserializerBase) => void
}

export class ResourceManager {
    private static resourceId = 0
    private static resources: Map<number, ManagedResourceBox> = new Map()

    static storeCallback<Fn>(f:Fn, caller:(f:Fn, buffer:DeserializerBase) => void): number {
        const id = ResourceManager.resourceId++
        const box: ManagedResourceBox = {
            resourceId: id,
            fnc: f,
            caller: caller
        }
        ResourceManager.resources.set(id, box)
        return id
    }
    static callCallback(id:number, buffer:DeserializerBase): void {
        const found = ResourceManager.resources.get(id)
        if (found) {
            found.caller(found.fnc, buffer)
        }
    }
}
