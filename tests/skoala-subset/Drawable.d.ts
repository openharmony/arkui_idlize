import { pointer } from "@koalaui/interop";
import { Rect } from "./Rect";
import { RefCounted } from "./RefCounted";
import { int32, Matrix33 } from "@koalaui/common";
/**
 * The base abstraction for object which can draw into canvas.
 */
export declare class Drawable extends RefCounted {
    constructor(ptr: pointer);
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
     * Returns custom drawable bounds.
     *
     * @returns the custom drawable bounds
     *
     */
    abstract onGetBounds(): Rect;
    constructor(ptr: pointer);
    onDrawCallback(instance: CustomDrawable): void;
    onGetBoundsCallback(instance: CustomDrawable): void;
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
    static make<CustomDrawableType extends CustomDrawable>(): CustomDrawableType;
    // static make<CustomDrawableType extends CustomDrawable>(drawableType: new (ptr: pointer) => CustomDrawableType): CustomDrawableType;
    /**
     * Invalidates this drawable generation Id.
     * Should be called each time the drawable invalidates (drawing changes).
     */
    notifyDrawingChanged(): void;
}
//# sourceMappingURL=Drawable.d.ts.map