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


// WARNING! THIS FILE IS AUTO-GENERATED, DO NOT MAKE CHANGES, THEY WILL BE LOST ON NEXT GENERATION!

import { int32, int64, float32 } from "@koalaui/common"
import { KInt, KPointer, KBoolean, NativeBuffer } from "@koalaui/interop"
import { memo, memo_stable } from "@koalaui/runtime/annotations"
import { ComponentBuilder, Builder } from "@koalaui/builderLambda"
import { LengthMetricsUnit } from "./../Graphics"
export declare class Matrix2D {
    constructor()
    constructor(unit: LengthMetricsUnit)
    get scaleX():number | undefined;
    set scaleX(val:number | undefined);
    get scaleY():number | undefined;
    set scaleY(val:number | undefined);
    get rotateX():number | undefined;
    set rotateX(val:number | undefined);
    get rotateY():number | undefined;
    set rotateY(val:number | undefined);
    get translateX():number | undefined;
    set translateX(val:number | undefined);
    get translateY():number | undefined;
    set translateY(val:number | undefined);
    identity(): Matrix2D
    invert(): Matrix2D
    rotate(degree: number, rx?: number, ry?: number): Matrix2D
    translate(tx?: number, ty?: number): Matrix2D
    scale(sx?: number, sy?: number): Matrix2D
}
