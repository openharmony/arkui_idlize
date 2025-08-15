// import { pointer } from "@koalaui/interop";
// import { Canvas } from "./Canvas";
// import { Picture } from "./Picture";
// import { Rect } from "./Rect";
// import { RefCounted } from "./RefCounted";
// import { int32, Matrix33 } from "@koalaui/common";
/**
 * The base abstraction for object which can draw into canvas.
 */
export declare class Drawable extends RefCounted {
    constructor(ptr: pointer);
    /**
     * Draws this drawable into given canvas.
     *
     * @param canvas - canvas to draw into
     * @param matrix - matrix to draw with
     *
     */
    draw(canvas: Canvas, matrix: Matrix33 | undefined): void;
    /**
     * Records drawable to picture.
     *
     * @returns the new picture
     *
     */
    makePictureSnapshot(): Picture;
    /**
     * Returns the unique id of drawable instance.
     * Id is updated to new unique value on each notifyDrawingChanged call.
     *
     * @returns the drawable id
     *
     */
    get generationId(): int32;
    /**
     * Invalidates this drawable generation Id.
     * Should be called each time the drawable invalidates (drawing changes).
     */
    notifyDrawingChanged(): void;
}
/**
 * Base class for custom drawable.
 * onDraw and onGetBounds should be implemented for custom drawing
 */
export declare abstract class CustomDrawable extends Drawable {
    boundsRect?: Rect;
    /**
     * Contains custom drawing implementation.
     *
     * @param canvas - canvas to draw into
     *
     */
    abstract onDraw(canvas: Canvas): void;
    /**
     * Returns custom drawable bounds.
     *
     * @returns the custom drawable bounds
     *
     */
    abstract onGetBounds(): Rect;
    constructor(ptr: pointer);
    onDrawCallback(thiz: CustomDrawable): void;
    onGetBoundsCallback(thiz: CustomDrawable): void;
    /**
     * Returns drawable bounds.
     *
     * @returns the custom drawable bounds
     *
     */
    get bounds(): Rect | undefined;
    /**
     * Drawable factory to create custom drawable.
     *
     * @typeParam CustomDrawableType - type of custom drawable to create
     * @returns the new drawable
     *
     */
    static make<CustomDrawableType extends CustomDrawable>(drawableType: new (ptr: pointer) => CustomDrawableType): CustomDrawableType;
    /**
     * Invalidates this drawable generation Id.
     * Should be called each time the drawable invalidates (drawing changes).
     */
    notifyDrawingChanged(): void;
}
//# sourceMappingURL=Drawable.d.ts.map