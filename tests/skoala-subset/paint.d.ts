/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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

export declare class Paint {
    static GetFinalizer(): KNativePointer;
    static Make(): KNativePointer;
    static MakeClone(paintPtr: KNativePointer): KNativePointer;
    static Equals(aPtr: KNativePointer, bPtr: KNativePointer): boolean;
    static Reset(paintPtr: KNativePointer): void;
    static IsAntiAlias(paintPtr: KNativePointer): boolean;
    static SetAntiAlias(paintPtr: KNativePointer, value: boolean): void;
    static IsDither(paintPtr: KNativePointer): boolean;
    static SetDither(paintPtr: KNativePointer, value: boolean): void;
    static GetColor(paintPtr: KNativePointer): number;
    static SetColor(paintPtr: KNativePointer, color: number): void;
    static GetColor4f(paintPtr: KNativePointer, resultPtr: Float32Array): void;
    static SetColor4f(paintPtr: KNativePointer, r: number, g: number, b: number, a: number, colorSpacePtr: KNativePointer): void;
    static GetAlpha(paintPtr: KNativePointer): number;
    static SetAlpha(paintPtr: KNativePointer, alpha: number): void;
    static GetMode(paintPtr: KNativePointer): number;
    static SetMode(paintPtr: KNativePointer, mode: number): void;
    static GetStrokeWidth(paintPtr: KNativePointer): number;
    static SetStrokeWidth(paintPtr: KNativePointer, width: number): void;
    static GetStrokeMiter(paintPtr: KNativePointer): number;
    static SetStrokeMiter(paintPtr: KNativePointer, miter: number): void;
    static GetStrokeCap(paintPtr: KNativePointer): number;
    static SetStrokeCap(paintPtr: KNativePointer, cap: number): void;
    static GetStrokeJoin(paintPtr: KNativePointer): number;
    static SetStrokeJoin(paintPtr: KNativePointer, join: number): void;
    static GetFillPath(paintPtr: KNativePointer, srcPtr: KNativePointer, resScale: number): KNativePointer;
    static GetFillPathCull(paintPtr: KNativePointer, srcPtr: KNativePointer, left: number, top: number, right: number, bottom: number, resScale: number): KNativePointer;
    static GetMaskFilter(paintPtr: KNativePointer): KNativePointer;
    static SetMaskFilter(paintPtr: KNativePointer, filterPtr: KNativePointer): void;
    static GetImageFilter(paintPtr: KNativePointer): KNativePointer;
    static SetImageFilter(paintPtr: KNativePointer, filterPtr: KNativePointer): void;
    static GetBlendMode(paintPtr: KNativePointer): number;
    static SetBlendMode(paintPtr: KNativePointer, mode: number): void;
    static GetBlender(paintPtr: KNativePointer): KNativePointer;
    static SetBlender(paintPtr: KNativePointer, blenderPtr: KNativePointer): void;
    static GetPathEffect(paintPtr: KNativePointer): KNativePointer;
    static SetPathEffect(paintPtr: KNativePointer, pathEffectPtr: KNativePointer): void;
    static GetShader(paintPtr: KNativePointer): KNativePointer;
    static SetShader(paintPtr: KNativePointer, shaderPtr: KNativePointer): void;
    static GetColorFilter(paintPtr: KNativePointer): KNativePointer;
    static SetColorFilter(paintPtr: KNativePointer, colorFilterPtr: KNativePointer): void;
    static HasNothingToDraw(paintPtr: KNativePointer): boolean;
}

// Types used in the Paint class
export type KNativePointer = any;
export type KBoolean = boolean;
export type KInt = number;
export type KFloat = number;
