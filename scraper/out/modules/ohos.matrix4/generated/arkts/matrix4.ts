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
import { matrix4_TranslateOption_serializer, matrix4_ScaleOption_serializer, matrix4_RotateOption_serializer, matrix4_PolyToPolyOptions_serializer, TypeChecker, OHOS_MATRIX4NativeModule } from "./ohos.matrix4.INTERNAL"
import { extractors } from "#handwritten"
import { unsafeCast, int32, int64, float32 } from "@koalaui/common"
export default matrix4
export namespace matrix4 {
    export interface Matrix4Transit {
        copy(): Matrix4Transit
        invert(): Matrix4Transit
        combine(options: Matrix4Transit): Matrix4Transit
        translate(options: TranslateOption): Matrix4Transit
        scale(options: ScaleOption): Matrix4Transit
        skew(x: number, y: number): Matrix4Transit
        rotate(options: RotateOption): Matrix4Transit
        transformPoint(options: [ number, number ]): [ number, number ]
        setPolyToPoly(options: PolyToPolyOptions): Matrix4Transit
    }
    export class Matrix4TransitInternal implements MaterializedBase,Matrix4Transit {
        peer?: Finalizable | undefined = undefined
        public getPeer(): Finalizable | undefined {
            return this.peer
        }
        constructor(peerPtr: KPointer) {
            this.peer = new Finalizable(peerPtr, Matrix4TransitInternal.getFinalizer())
        }
        constructor() {
            this(Matrix4TransitInternal.construct())
        }
        static construct(): KPointer {
            const retval  = OHOS_MATRIX4NativeModule._matrix4_Matrix4Transit_construct()
            return retval
        }
        static getFinalizer(): KPointer {
            return OHOS_MATRIX4NativeModule._matrix4_Matrix4Transit_getFinalizer()
        }
        public static fromPtr(ptr: KPointer): Matrix4TransitInternal {
            return new Matrix4TransitInternal(ptr)
        }
        public copy(): Matrix4Transit {
            return this.copy_serialize()
        }
        public invert(): Matrix4Transit {
            return this.invert_serialize()
        }
        public combine(options: Matrix4Transit): Matrix4Transit {
            const options_casted = options as (Matrix4Transit)
            return this.combine_serialize(options_casted)
        }
        public translate(options: TranslateOption): Matrix4Transit {
            const options_casted = options as (TranslateOption)
            return this.translate_serialize(options_casted)
        }
        public scale(options: ScaleOption): Matrix4Transit {
            const options_casted = options as (ScaleOption)
            return this.scale_serialize(options_casted)
        }
        public skew(x: number, y: number): Matrix4Transit {
            const x_casted = x as (number)
            const y_casted = y as (number)
            return this.skew_serialize(x_casted, y_casted)
        }
        public rotate(options: RotateOption): Matrix4Transit {
            const options_casted = options as (RotateOption)
            return this.rotate_serialize(options_casted)
        }
        public transformPoint(options: [ number, number ]): [ number, number ] {
            const options_casted = options as ([ number, number ])
            return this.transformPoint_serialize(options_casted)
        }
        public setPolyToPoly(options: PolyToPolyOptions): Matrix4Transit {
            const options_casted = options as (PolyToPolyOptions)
            return this.setPolyToPoly_serialize(options_casted)
        }
        copy_serialize(): Matrix4Transit {
            const retval  = OHOS_MATRIX4NativeModule._matrix4_Matrix4Transit_copy(this.peer!.ptr)
            const obj : Matrix4Transit = extractors.fromMatrix4Matrix4TransitPtr(retval)
            return obj
        }
        invert_serialize(): Matrix4Transit {
            const retval  = OHOS_MATRIX4NativeModule._matrix4_Matrix4Transit_invert(this.peer!.ptr)
            const obj : Matrix4Transit = extractors.fromMatrix4Matrix4TransitPtr(retval)
            return obj
        }
        combine_serialize(options: Matrix4Transit): Matrix4Transit {
            const retval  = OHOS_MATRIX4NativeModule._matrix4_Matrix4Transit_combine(this.peer!.ptr, extractors.toMatrix4Matrix4TransitPtr(options))
            const obj : Matrix4Transit = extractors.fromMatrix4Matrix4TransitPtr(retval)
            return obj
        }
        translate_serialize(options: TranslateOption): Matrix4Transit {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            matrix4_TranslateOption_serializer.write(thisSerializer, options)
            const retval  = OHOS_MATRIX4NativeModule._matrix4_Matrix4Transit_translate(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            const obj : Matrix4Transit = extractors.fromMatrix4Matrix4TransitPtr(retval)
            return obj
        }
        scale_serialize(options: ScaleOption): Matrix4Transit {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            matrix4_ScaleOption_serializer.write(thisSerializer, options)
            const retval  = OHOS_MATRIX4NativeModule._matrix4_Matrix4Transit_scale(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            const obj : Matrix4Transit = extractors.fromMatrix4Matrix4TransitPtr(retval)
            return obj
        }
        skew_serialize(x: number, y: number): Matrix4Transit {
            const retval  = OHOS_MATRIX4NativeModule._matrix4_Matrix4Transit_skew(this.peer!.ptr, x, y)
            const obj : Matrix4Transit = extractors.fromMatrix4Matrix4TransitPtr(retval)
            return obj
        }
        rotate_serialize(options: RotateOption): Matrix4Transit {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            matrix4_RotateOption_serializer.write(thisSerializer, options)
            const retval  = OHOS_MATRIX4NativeModule._matrix4_Matrix4Transit_rotate(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            const obj : Matrix4Transit = extractors.fromMatrix4Matrix4TransitPtr(retval)
            return obj
        }
        transformPoint_serialize(options: [ number, number ]): [ number, number ] {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            const options_0  = options[0]
            thisSerializer.writeNumber(options_0)
            const options_1  = options[1]
            thisSerializer.writeNumber(options_1)
            const retval  = OHOS_MATRIX4NativeModule._matrix4_Matrix4Transit_transformPoint(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            let retvalDeserializer : DeserializerBase = new DeserializerBase(retval, retval.length)
            const bufferValue0 : number = (retvalDeserializer.readNumber() as number)
            const bufferValue1 : number = (retvalDeserializer.readNumber() as number)
            const returnResult : [ number, number ] = ([bufferValue0, bufferValue1] as [ number, number ])
            return returnResult
        }
        setPolyToPoly_serialize(options: PolyToPolyOptions): Matrix4Transit {
            const thisSerializer : SerializerBase = SerializerBase.hold()
            matrix4_PolyToPolyOptions_serializer.write(thisSerializer, options)
            const retval  = OHOS_MATRIX4NativeModule._matrix4_Matrix4Transit_setPolyToPoly(this.peer!.ptr, thisSerializer.asBuffer(), thisSerializer.length())
            thisSerializer.release()
            const obj : Matrix4Transit = extractors.fromMatrix4Matrix4TransitPtr(retval)
            return obj
        }
    }
    export interface TranslateOption {
        x?: number;
        y?: number;
        z?: number;
    }
    export interface ScaleOption {
        x?: number;
        y?: number;
        z?: number;
        centerX?: number;
        centerY?: number;
    }
    export interface RotateOption {
        x?: number;
        y?: number;
        z?: number;
        centerX?: number;
        centerY?: number;
        angle?: number;
    }
    export interface Point {
        x: number;
        y: number;
    }
    export interface PolyToPolyOptions {
        src: Array<matrix4.Point>;
        srcIndex?: number;
        dst: Array<matrix4.Point>;
        dstIndex?: number;
        pointCount?: number;
    }
}
