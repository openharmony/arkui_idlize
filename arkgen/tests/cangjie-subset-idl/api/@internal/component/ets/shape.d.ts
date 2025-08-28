
interface ShapeInterface {
    (): ShapeAttribute
}

declare class ShapeAttribute extends CommonMethod<ShapeAttribute> {
}

declare const Shape: ShapeInterface;

declare const ShapeInstance: ShapeAttribute;
