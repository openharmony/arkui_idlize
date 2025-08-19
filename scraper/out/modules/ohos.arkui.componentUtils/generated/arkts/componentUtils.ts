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
import { KInt, KPointer, KBoolean, NativeBuffer, KStringPtr } from "@koalaui/interop"
export default componentUtils
export namespace componentUtils {
    export interface ComponentInfo {
        size: componentUtils.Size;
        localOffset: componentUtils.Offset;
        windowOffset: componentUtils.Offset;
        screenOffset: componentUtils.Offset;
        translate: componentUtils.TranslateResult;
        scale: componentUtils.ScaleResult;
        rotate: componentUtils.RotateResult;
        transform: componentUtils.Matrix4Result;
    }
    export interface Size {
        width: number;
        height: number;
    }
    export interface Offset {
        x: number;
        y: number;
    }
    export interface TranslateResult {
        x: number;
        y: number;
        z: number;
    }
    export interface ScaleResult {
        x: number;
        y: number;
        z: number;
        centerX: number;
        centerY: number;
    }
    export interface RotateResult {
        x: number;
        y: number;
        z: number;
        centerX: number;
        centerY: number;
        angle: number;
    }
    export type Matrix4Result = [
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number,
        number
    ]
}
