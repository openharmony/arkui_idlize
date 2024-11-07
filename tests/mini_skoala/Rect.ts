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

import { Point, float32 } from "./utils"
import { Access, KFloat32ArrayPtr, withFloat32Array } from "./utils"

export class Rect {
    coordinates: Float32Array

    constructor(left: float32, top: float32, right: float32, bottom: float32) {
        this.coordinates = new Float32Array(4)
        this.coordinates[0] = left
        this.coordinates[1] = top
        this.coordinates[2] = right
        this.coordinates[3] = bottom
    }

    get left(): float32 {
        return this.coordinates[0]
    }

    get top(): float32 {
        return this.coordinates[1]
    }

    get right(): float32 {
        return this.coordinates[2]
    }

    get bottom(): float32 {
        return this.coordinates[3]
    }

    get width(): float32 {
        return this.right - this.left
    }

    get height(): float32 {
        return this.bottom - this.top
    }

    equals(other: Rect): boolean {
        return this.left == other.left && this.top == other.top && this.right == other.right && this.bottom == other.bottom
    }

    toString(): string {
        return "Rect [x = " + this.left + " y = " + this.top + " w = " + this.width + " h = " + this.height + "]"
    }

    intersects(other: Rect): boolean {
        return !(this.right <= other.left || other.right <= this.left || this.bottom <= other.top || other.bottom <= this.top)
    }

    intersect(other: Rect): Rect {
        if (this.intersects(other)) {
            return new Rect(
                Math.max(this.left, other.left),
                Math.max(this.top, other.top),
                Math.min(this.right, other.right),
                Math.min(this.bottom, other.bottom)
            )
        } else {
            return Rect.makeEmpty()
        }
    }

    contains(x: float32, y: float32): boolean {
        return x >= this.left && x <= this.right && y >= this.top && y <= this.bottom
    }

    scale(scale: float32): Rect {
        return this.scaleXY(scale, scale)
    }

    scaleXY(sx: float32, sy: float32): Rect {
        return new Rect(this.left * sx, this.top * sy, this.right * sx, this.bottom * sy)
    }

    offsetXY(dx: float32, dy: float32): Rect {
        return new Rect(this.left + dx, this.top + dy, this.right + dx, this.bottom + dy)
    }

    /**
     * @param left - the indent from the left
     * @param top - the indent from the top
     * @param right - the indent from the right
     * @param bottom - the indent from the bottom
     * @returns Rect without the specified indents
     */
    innerRect(left: float32, top: float32 = left, right: float32 = left, bottom: float32 = top): Rect {
        if (left == 0 && top == 0 && right == 0 && bottom == 0) return this
        top = this.top + top
        left = this.left + left
        right = this.right - right
        bottom = this.bottom - bottom
        return new Rect(left, top, left < right ? right : left, top < bottom ? bottom : top)
    }

    offset(vec: Point): Rect {
        return this.offsetXY(vec.x, vec.y)
    }

    /* TODO: uncomment when IRect is implemented.
    toIRect(): IRect {
        return new IRect(this.left, this.top, this.right, this.bottom)
    }
    */

    inflate(spread: float32): Rect {
        if (spread <= 0) {
            return Rect.makeLTRB(
                this.left - spread,
                this.top - spread,
                Math.max(this.left - spread, this.right + spread),
                Math.max(this.top - spread, this.bottom + spread)
            )
        } else {
            return new RRect(
                this.left - spread,
                this.top - spread,
                Math.max(this.left - spread, this.right + spread),
                Math.max(this.top - spread, this.bottom + spread), [spread]
            )
        }
    }

    get isEmpty(): boolean {
        return this.right == this.left || this.top == this.bottom
    }

    static makeEmpty(): Rect {
        return new Rect(0, 0, 0, 0)
    }

    static makeLTRB(l: float32, t: float32, r: float32, b: float32): Rect {
        if (l > r) throw new Error(`Rect::makeLTRB expected l <= r, got ${l} > ${r}`)
        if (t > b) throw new Error(`Rect::makeLTRB expected t <= b, got ${t} > ${b}`)
        return new Rect(l, t, r, b)
    }

    static makeWH(w: float32, h: float32): Rect {
        if (w < 0) throw new Error(`Rect::makeWH expected w >= 0, got: ${w}`)
        if (h < 0) throw new Error(`Rect::makeWH expected h >= 0, got: ${h}`)
        return new Rect(0.0, 0.0, w, h)
    }

    static makeFromPoint(size: Point): Rect {
        return Rect.makeWH(size.x, size.y)
    }

    static makeXYWH(l: float32, t: float32, w: float32, h: float32): Rect {
        if (w < 0) throw new Error(`Rect::makeXYWH expected w >= 0, got: ${w}`)
        if (h < 0) throw new Error(`Rect::makeXYWH expected h >= 0, got: ${h}`)
        return new Rect(l, t, l + w, t + h)
    }

    static fromFloatPtr(block: (ptr: KFloat32ArrayPtr) => void): Rect {
        let result = new Rect(0, 0, 0, 0)
        withFloat32Array(result.coordinates, Access.WRITE, block)
        return result
    }

    static fromArray(arr: Float32Array): Rect[] {
        if (arr.length % 4 != 0) {
            throw "Expected " + arr.length + " % 4 == 0"
        }

        let result = new Array<Rect>(arr.length / 4)
        for (let i = 0; i < result.length; ++i) {
            const arrBegin = i * 4
            result[i] = new Rect(arr[arrBegin + 0], arr[arrBegin + 1], arr[arrBegin + 2], arr[arrBegin + 3])
        }
        return result
    }
}

export type Radii =
    [float32] // All sides
    | [float32, float32] // All sides, different x and y
    | [float32, float32, float32, float32] // Each size, x == y
    | [float32, float32, float32, float32, float32, float32, float32, float32] // Each side, different x and y

export class RRect extends Rect {
    public radii: Float32Array

    constructor(
        left: float32,
        top: float32,
        right: float32,
        bottom: float32,
        radii: Radii | Float32Array = [0]
    ) {
        super(left, top, right, bottom)
        if (radii instanceof Array) {
            radii = new Float32Array(radii)
        }
        this.radii = radii
    }

    inflate(spread: float32): Rect {

        let becomesRect = this.radii.find(
            (value) => value + spread < 0.0
        )

        if (becomesRect) {
            return Rect.makeLTRB(
                this.left - spread,
                this.top - spread,
                Math.max(this.left - spread, this.right + spread),
                Math.max(this.top - spread, this.bottom + spread)
            )
        } else {
            let newRadii = this.radii.map(
                (value) => Math.max(0.0, value + spread)
            )
            return new RRect(
                this.left - spread,
                this.top - spread,
                Math.max(this.left - spread, this.right + spread),
                Math.max(this.top - spread, this.bottom + spread),
                newRadii
            )
        }
    }

    static cloneWithInsets(rect: RRect, left: number, top: number, right: number, bottom: number): RRect {
        let radii: Radii = [0, 0, 0, 0, 0, 0, 0, 0]
        let l = rect.left + left
        let r = rect.right - right
        let t = rect.top + top
        let b = rect.bottom - bottom

        let rs = rect.radii
        switch (rs.length) {
            case 1:
                radii[0] += rs[0]
                radii[1] += rs[0]
                radii[2] += rs[0]
                radii[3] += rs[0]
                radii[4] += rs[0]
                radii[5] += rs[0]
                radii[6] += rs[0]
                radii[7] += rs[0]
                break
            case 2:
                radii[0] += rs[0]!
                radii[1] += rs[1]!
                radii[2] += rs[0]!
                radii[3] += rs[1]!
                radii[4] += rs[0]!
                radii[5] += rs[1]!
                radii[6] += rs[0]!
                radii[7] += rs[1]!
                break
            case 4:
                radii[0] += rs[0]!
                radii[1] += rs[0]!
                radii[2] += rs[1]!
                radii[3] += rs[1]!
                radii[4] += rs[2]!
                radii[5] += rs[2]!
                radii[6] += rs[3]!
                radii[7] += rs[3]!
                break
            case 8:
                radii[0] += rs[0]!
                radii[1] += rs[1]!
                radii[2] += rs[2]!
                radii[3] += rs[3]!
                radii[4] += rs[4]!
                radii[5] += rs[5]!
                radii[6] += rs[6]!
                radii[7] += rs[7]!
                break
        }

        radii[0] = radii[0] === 0 ? 0 : Math.max(0, radii[0] - left)
        radii[1] = radii[1] === 0 ? 0 : Math.max(0, radii[1] - top)
        radii[2] = radii[2] === 0 ? 0 : Math.max(0, radii[2] - right)
        radii[3] = radii[3] === 0 ? 0 : Math.max(0, radii[3] - top)
        radii[4] = radii[4] === 0 ? 0 : Math.max(0, radii[4] - right)
        radii[5] = radii[5] === 0 ? 0 : Math.max(0, radii[5] - bottom)
        radii[6] = radii[6] === 0 ? 0 : Math.max(0, radii[6] - left)
        radii[7] = radii[7] === 0 ? 0 : Math.max(0, radii[7] - bottom)

        return new RRect(l, t, r, b, radii)
    }


    override equals(other: Rect): boolean {
        if (other instanceof RRect && super.equals(other)) {
            const length = this.radii.length
            if (length == other.radii.length) {
                for (let i = 0; i < length; i++) {
                    if (this.radii[i] != other.radii[i]) return false
                }
                return true
            }
        }
        return false
    }
}
