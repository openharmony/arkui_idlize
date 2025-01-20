/**
 * TODO: move to compat
 */

import { int32 } from "@koalaui/common"

export class GestureName {
    static readonly Tap = 0
    static readonly LongPress = 1
    static readonly Pan = 2
    static readonly Pinch = 3
    static readonly Swipe = 4
    static readonly Rotation = 5
    static readonly Group = 6
}

export class GestureComponent<T> {
    public type?: int32
    public value?: T
    public hasEvent?: Int32Array
}

export function unsafeCast<T>(value: Object): T {
    return value as T
}