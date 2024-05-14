/**
 * TODO: move to compat
 */

/**
 * Only to workaround non-int enums
 */
export function unsafeCast<T>(value: unknown): T {
    return value as unknown as T
}
