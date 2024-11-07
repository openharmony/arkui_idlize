import { Point, float32 } from "@koalaui/common";
import { KFloat32ArrayPtr } from "@koalaui/interop";
export declare class Rect {
    coordinates: Float32Array;
    constructor(left: float32, top: float32, right: float32, bottom: float32);
    get left(): float32;
    get top(): float32;
    get right(): float32;
    get bottom(): float32;
    get width(): float32;
    get height(): float32;
    equals(other: Rect): boolean;
    toString(): string;
    intersects(other: Rect): boolean;
    intersect(other: Rect): Rect;
    contains(x: float32, y: float32): boolean;
    scale(scale: float32): Rect;
    scaleXY(sx: float32, sy: float32): Rect;
    offsetXY(dx: float32, dy: float32): Rect;
    /**
     * @param left - the indent from the left
     * @param top - the indent from the top
     * @param right - the indent from the right
     * @param bottom - the indent from the bottom
     * @returns Rect without the specified indents
     */
    innerRect(left: float32, top?: float32, right?: float32, bottom?: float32): Rect;
    offset(vec: Point): Rect;
    inflate(spread: float32): Rect;
    get isEmpty(): boolean;
    static makeEmpty(): Rect;
    static makeLTRB(l: float32, t: float32, r: float32, b: float32): Rect;
    static makeWH(w: float32, h: float32): Rect;
    static makeFromPoint(size: Point): Rect;
    static makeXYWH(l: float32, t: float32, w: float32, h: float32): Rect;
    static fromFloatPtr(block: (ptr: KFloat32ArrayPtr) => void): Rect;
    static fromArray(arr: Float32Array): Rect[];
}
export type Radii = [
    float32
] | [float32, float32] | [float32, float32, float32, float32] | [float32, float32, float32, float32, float32, float32, float32, float32];
export declare class RRect extends Rect {
    radii: Float32Array;
    constructor(left: float32, top: float32, right: float32, bottom: float32, radii?: Radii | Float32Array);
    inflate(spread: float32): Rect;
    static cloneWithInsets(rect: RRect, left: number, top: number, right: number, bottom: number): RRect;
    equals(other: Rect): boolean;
}
//# sourceMappingURL=Rect.d.ts.map