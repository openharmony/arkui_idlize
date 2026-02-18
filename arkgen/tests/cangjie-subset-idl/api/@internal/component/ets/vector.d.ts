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

declare type Vector1 = {
    x0: number
    x1: number
    x2: number
    x3: number
}

declare type Vector2 = {
    t: number
    x: number
    y: number
    z: number
}

declare interface VectorInterface { 
    (): VectorAttribute
}
declare const Vector: VectorInterface

declare class VectorAttribute extends CommonMethod<VectorAttribute> {

    testVector1(value: Vector1): VectorAttribute

    testVector2(value: Vector2): VectorAttribute

    testUnionVector1Number(value: Vector1 | number): VectorAttribute

    testUnionVector2Number(value: Vector2 | number): VectorAttribute
}
