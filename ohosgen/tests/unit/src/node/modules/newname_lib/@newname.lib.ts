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


import { SerializerBase, DeserializerBase } from "@koalaui/interop"

export interface RenamedModuleDataInterface {
    count: number;
}

export class RenamedModuleDataInterface_serializer {
    public static write(buffer: SerializerBase, value: RenamedModuleDataInterface): void {
        let valueSerializer: SerializerBase = buffer
        const value_count = value.count
        valueSerializer.writeNumber(value_count)
    }
    public static read(buffer: DeserializerBase): RenamedModuleDataInterface {
        let valueDeserializer: DeserializerBase = buffer
        const count_result: number = (valueDeserializer.readNumber() as number)
        let value: RenamedModuleDataInterface = ({count: count_result} as RenamedModuleDataInterface)
        return value
    }
}
