/**
 * TODO: move to compat
 */

/**
 * Only to workaround non-int enums
 */
export function unsafeCast<T>(value: unknown): T {
    return value as unknown as T
}

export enum GestureName {
    Tap,
    LongPress,
    Pan,
    Pinch,
    Swipe,
    Rotation,
    Group
}

export class GestureComponent<T> {
    public type?: GestureName
    public value?: T
    public hasEvent?: Int32Array
}
