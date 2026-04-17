/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

import { SerializerBase, DeserializerBase, } from "@koalaui/interop"

export interface DataView_ {}

export class DataView__serializer {
    public static write(buffer: SerializerBase, value: DataView): void {
        // Improve: serialize DataView
    }
    public static read(buffer: DeserializerBase): DataView {
        // Improve: deserialize DataView
        let value : DataView = new DataView(new ArrayBuffer(1))
        return value
    }
}

