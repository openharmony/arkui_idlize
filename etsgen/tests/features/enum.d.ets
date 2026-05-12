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
export enum EnumWithoutInitializers {
    Value1,
    Value2,
}

export enum NumberEnum {
    Value1 = 0,
    Value2 = 1,
    Value3 = 3,
    Value4 = 8,
    Value5,
    Value6 = 13,
}

export enum StringEnum {
    Value1 = "one",
    Value2 = "two",
    Value2 = "three",
}

export namespace ns {
    export enum EnumInNamespace {
        Value1 = "one",
        Value2 = "two",
        Value2 = "three",
    }
}