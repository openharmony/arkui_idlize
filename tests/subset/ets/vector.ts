
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

declare class VectorAttribute extends CommonMethod<VectorAttribute> {

    testVector1(value: Vector1): VectorAttribute

    testVector2(value: Vector2): VectorAttribute
}
