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

import { SerializerBase, DeserializerBase, Finalizable, runtimeType, RuntimeType, toPeerPtr, KPointer, MaterializedBase, NativeBuffer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"
import { extractors } from "#handwritten"
import { TypeChecker, OHOS_GRAPHICS_UIEFFECTNativeModule, uiEffect_BrightnessBlender_serializer } from "./ohos.graphics.uiEffect.INTERNAL"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export default uiEffect
export namespace uiEffect {
    export interface Filter {
        pixelStretch(stretchSizes: Array<double>, tileMode: TileMode): Filter
        blur(blurRadius: double): Filter
        waterRipple(progress: double, waveCount: int32, x: double, y: double, rippleMode: WaterRippleMode): Filter
        flyInFlyOutEffect(degree: double, flyMode: FlyMode): Filter
        distort(distortionK: double): Filter
    }
    export class FilterInternal implements MaterializedBase,Filter {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, FilterInternal.getFinalizer())
        }
        constructor() {
            this(FilterInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_GRAPHICS_UIEFFECTNativeModule._uiEffect_Filter_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_GRAPHICS_UIEFFECTNativeModule._uiEffect_Filter_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): FilterInternal {
            return new FilterInternal(ptr)
        }
        public pixelStretch(stretchSizes: Array<double>, tileMode: TileMode): Filter {
            const stretchSizes_casted = stretchSizes as (Array<double>)
            const tileMode_casted = tileMode as (TileMode)
            return this.pixelStretch_serialize(stretchSizes_casted, tileMode_casted)
        }
        public blur(blurRadius: double): Filter {
            const blurRadius_casted = blurRadius as (double)
            return this.blur_serialize(blurRadius_casted)
        }
        public waterRipple(progress: double, waveCount: int32, x: double, y: double, rippleMode: WaterRippleMode): Filter {
            const progress_casted = progress as (double)
            const waveCount_casted = waveCount as (int32)
            const x_casted = x as (double)
            const y_casted = y as (double)
            const rippleMode_casted = rippleMode as (WaterRippleMode)
            return this.waterRipple_serialize(progress_casted, waveCount_casted, x_casted, y_casted, rippleMode_casted)
        }
        public flyInFlyOutEffect(degree: double, flyMode: FlyMode): Filter {
            const degree_casted = degree as (double)
            const flyMode_casted = flyMode as (FlyMode)
            return this.flyInFlyOutEffect_serialize(degree_casted, flyMode_casted)
        }
        public distort(distortionK: double): Filter {
            const distortionK_casted = distortionK as (double)
            return this.distort_serialize(distortionK_casted)
        }
        pixelStretch_serialize(stretchSizes: Array<double>, tileMode: TileMode): Filter {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            thisSerializer.writeInt32((stretchSizes.length).toInt())
            for (let stretchSizesCounterI = 0; stretchSizesCounterI < stretchSizes.length; stretchSizesCounterI++) {
                const stretchSizesTmpElement : double = stretchSizes[stretchSizesCounterI]
                thisSerializer.writeFloat64(stretchSizesTmpElement)
            }
            const retval  = OHOS_GRAPHICS_UIEFFECTNativeModule._uiEffect_Filter_pixelStretch(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length(), TypeChecker.uiEffect_TileMode_ToNumeric(tileMode))
            thisSerializer.release()
            const obj : Filter = extractors.fromUiEffectFilterPtr(retval)
            return obj
        }
        blur_serialize(blurRadius: double): Filter {
            const retval  = OHOS_GRAPHICS_UIEFFECTNativeModule._uiEffect_Filter_blur(this.peer!.ptr, blurRadius)
            const obj : Filter = extractors.fromUiEffectFilterPtr(retval)
            return obj
        }
        waterRipple_serialize(progress: double, waveCount: int32, x: double, y: double, rippleMode: WaterRippleMode): Filter {
            const retval  = OHOS_GRAPHICS_UIEFFECTNativeModule._uiEffect_Filter_waterRipple(this.peer!.ptr, progress, waveCount, x, y, TypeChecker.uiEffect_WaterRippleMode_ToNumeric(rippleMode))
            const obj : Filter = extractors.fromUiEffectFilterPtr(retval)
            return obj
        }
        flyInFlyOutEffect_serialize(degree: double, flyMode: FlyMode): Filter {
            const retval  = OHOS_GRAPHICS_UIEFFECTNativeModule._uiEffect_Filter_flyInFlyOutEffect(this.peer!.ptr, degree, TypeChecker.uiEffect_FlyMode_ToNumeric(flyMode))
            const obj : Filter = extractors.fromUiEffectFilterPtr(retval)
            return obj
        }
        distort_serialize(distortionK: double): Filter {
            const retval  = OHOS_GRAPHICS_UIEFFECTNativeModule._uiEffect_Filter_distort(this.peer!.ptr, distortionK)
            const obj : Filter = extractors.fromUiEffectFilterPtr(retval)
            return obj
        }
    }
    export interface VisualEffect {
        backgroundColorBlender(blender: BrightnessBlender): VisualEffect
    }
    export class VisualEffectInternal implements MaterializedBase,VisualEffect {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, VisualEffectInternal.getFinalizer())
        }
        constructor() {
            this(VisualEffectInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_GRAPHICS_UIEFFECTNativeModule._uiEffect_VisualEffect_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_GRAPHICS_UIEFFECTNativeModule._uiEffect_VisualEffect_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): VisualEffectInternal {
            return new VisualEffectInternal(ptr)
        }
        public backgroundColorBlender(blender: BrightnessBlender): VisualEffect {
            const blender_casted = blender as (BrightnessBlender)
            return this.backgroundColorBlender_serialize(blender_casted)
        }
        backgroundColorBlender_serialize(blender: BrightnessBlender): VisualEffect {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            uiEffect_BrightnessBlender_serializer.write(thisSerializer, blender)
            const retval  = OHOS_GRAPHICS_UIEFFECTNativeModule._uiEffect_VisualEffect_backgroundColorBlender(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            const obj : VisualEffect = extractors.fromUiEffectVisualEffectPtr(retval)
            return obj
        }
    }
    export enum TileMode {
        CLAMP = 0,
        REPEAT = 1,
        MIRROR = 2,
        DECAL = 3
    }
    export enum WaterRippleMode {
        SMALL2MEDIUM_RECV = 0,
        SMALL2MEDIUM_SEND = 1,
        SMALL2SMALL = 2,
        MINI_RECV = 3
    }
    export enum FlyMode {
        BOTTOM = 0,
        TOP = 1
    }
    export type Blender = uiEffect.BrightnessBlender;
    export interface BrightnessBlender {
        cubicRate: double;
        quadraticRate: double;
        linearRate: double;
        degree: double;
        saturation: double;
        positiveCoefficient: [ double, double, double ];
        negativeCoefficient: [ double, double, double ];
        fraction: double;
    }
}
