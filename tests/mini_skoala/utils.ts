/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

type int = number
type float = number
type double = number

export type uint8 = int
export type int32 = int
export type uint32 = int
export type float32 = float
export type float64 = double

export type KPointer = number | bigint
export type pointer = KPointer
export type KNativePointer = KPointer
export type KFloat32ArrayPtr = int32 | Float32Array | null

export type TypedArray =
    Uint8Array
    | Int8Array
    | Uint16Array
    | Int16Array
    | Uint32Array
    | Int32Array
    | Float32Array
    | Float64Array
    
export type ExecWithLength<P, R> = (pointer: P, length: int32) => R
function withArray<C extends TypedArray, R>(
    data: C | undefined,
    exec: ExecWithLength<C | null, R>
): R {
    return exec(data ?? null, data?.length ?? 0)
}
export function withInt32Array<T>(data: Int32Array | undefined, access: Access, exec: ExecWithLength<Int32Array | null, T>) {
    return withArray(data, exec)
}
export function withFloat32Array<T>(data: Float32Array | undefined, access: Access, exec: ExecWithLength<Float32Array | null, T>) {
    return withArray(data, exec)
}

export const nullptr = BigInt(0)

export enum Access {
    READ = 1, // 1 << 0,
    WRITE = 2, // 1 << 1,
    READWRITE = 3, // READ | WRITE
}

export class Point {
    coordinates: Float32Array

    constructor (x: float32, y: float32) {
        this.coordinates = new Float32Array(2)
        this.coordinates[0] = x
        this.coordinates[1] = y
    }

    get x(): float32 {
        return this.coordinates[0] as float32
    }

    get y(): float32 {
        return this.coordinates[1] as float32
    }

    offsetXY(dx: float32, dy: float32): Point {
        return new Point(this.x + dx, this.y + dy)
    }

    offset(vec: Point): Point {
        return this.offsetXY(vec.x, vec.y)
    }

    scale(scale: float32): Point {
        return this.scaleXY(scale, scale)
    }

    scaleXY(sx: float32, sy: float32): Point {
        return new Point(this.x * sx, this.y * sy)
    }

    static ZERO = new Point(0.0 as float32, 0.0 as float32)

    toArray(): Float32Array {
        return this.coordinates
    }

    static flattenArray(points: Array<Point>): Float32Array {
        let array = new Float32Array(points.length * 2)
        for (let i = 0; i < points.length; i++) {
            array[i * 2] = points[i].x
            array[i * 2 + 1] = points[i].y
        }
        return array
    }

    static fromArray(points: Float32Array): Array<Point> {
        if (points.length % 2 != 0)
            throw new Error("Expected " + points.length + " % 2 == 0")

        let array = new Array<Point>(points.length / 2)
        for (let i = 0; i < points.length / 2; i++) {
            array[i] = new Point(points[i * 2] as float32, points[i * 2 + 1] as float32)
        }
        return array
    }
}

function Array_from_number(data: float64[]): Array<float64> {
    return data
}

const tolerance: float32 = (1.0 / (1 << 12))
export class Matrix33 {
    public readonly array: Float32Array
    constructor (array: Float32Array = new Float32Array(Array_from_number([
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0
    ]))) {
        this.array = array.slice()
    }

    static zero(): Matrix33 {
        return new Matrix33(new Float32Array(Array_from_number([0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0])))
    }

    static makeTranslate(dx: float32, dy: float32): Matrix33 {
        return new Matrix33(new Float32Array(Array_from_number([1.0, 0.0, dx as float64, 0.0, 1.0, dy as float64, 0.0, 0.0, 1.0])))
    }

    static makeScale(dx: float32, dy: float32 = dx): Matrix33 {
        return new Matrix33(new Float32Array(Array_from_number([dx as float64, 0.0, 0.0, 0.0, dy as float64, 0.0, 0.0, 0.0, 1.0])))
    }

    static makeRotate(degrees: float32, pivotX?: float32, pivotY?: float32): Matrix33 {
        let rads = degrees * Math.PI / 180
        let cos = Math.cos(rads)
        let sin = Math.sin(rads)
        if (Math.abs(sin) <= tolerance) sin = 0.0
        if (Math.abs(cos) <= tolerance) cos = 0.0
        if (pivotX !== undefined && pivotY != undefined) {
            let dx = pivotX - pivotX * cos + pivotY * sin
            let dy = pivotY - pivotY * cos - pivotX * sin
            return new Matrix33(new Float32Array(Array_from_number([cos, -sin, dx, sin, cos, dy, 0.0, 0.0, 1.0])))
        } else {
            return new Matrix33(new Float32Array(Array_from_number([cos, -sin, 0.0, sin, cos, 0.0, 0.0, 0.0, 1.0])))
        }
    }

    static makeSkew(sx: float32, sy: float32): Matrix33 {
        return new Matrix33(new Float32Array(Array_from_number([1.0, sx, 0.0, sy, 1.0, 0.0, 0.0, 0.0, 1.0])))
    }

    makeConcat(rhs: Matrix33): Matrix33 {
        return new Matrix33(new Float32Array(Array_from_number([
            this.array[0] * rhs.array[0] + this.array[1] * rhs.array[3] + this.array[2] * rhs.array[6],
            this.array[0] * rhs.array[1] + this.array[1] * rhs.array[4] + this.array[2] * rhs.array[7],
            this.array[0] * rhs.array[2] + this.array[1] * rhs.array[5] + this.array[2] * rhs.array[8],
            this.array[3] * rhs.array[0] + this.array[4] * rhs.array[3] + this.array[5] * rhs.array[6],
            this.array[3] * rhs.array[1] + this.array[4] * rhs.array[4] + this.array[5] * rhs.array[7],
            this.array[3] * rhs.array[2] + this.array[4] * rhs.array[5] + this.array[5] * rhs.array[8],
            this.array[6] * rhs.array[0] + this.array[7] * rhs.array[3] + this.array[8] * rhs.array[6],
            this.array[6] * rhs.array[1] + this.array[7] * rhs.array[4] + this.array[8] * rhs.array[7],
            this.array[6] * rhs.array[2] + this.array[7] * rhs.array[5] + this.array[8] * rhs.array[8],
        ])))
    }

    makeTranspose(): Matrix33{
        return new Matrix33(new Float32Array(Array_from_number([
            this.array[0], this.array[3], this.array[6],
            this.array[1], this.array[4], this.array[7],
            this.array[2], this.array[5], this.array[8]
        ])))
    }
}

export function ptrToString(ptr: KPointer) {
    return `0x${ptr!.toString(16).padStart(8, "0")}`
}
export function className(object?: Object): string {
    return object?.constructor.name ?? "<null>"
}
export class Wrapper {
    ptr: KPointer
    constructor(ptr: KPointer) {
        if (ptr == null)
            throw new Error(`Init <${className(this)}> with null native peer`)
        this.ptr = ptr
    }
    toString(): string {
        return `[native object <${className(this)}> at ${ptrToString(this.ptr)}]`
    }
}
export function getPtr(value: Wrapper|undefined): KPointer {
    return value?.ptr ?? nullptr
}
