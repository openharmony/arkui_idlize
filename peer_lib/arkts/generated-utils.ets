/**
 * TODO: move to compat
 */

/**
 * Only to workaround non-int enums
 */
export function unsafeCast<T>(value: Object|undefined|string|null|(() => Object)| void): T {
    return value as T
}
