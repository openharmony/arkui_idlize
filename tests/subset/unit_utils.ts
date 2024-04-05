import {Serializer} from "@arkoala/arkui/Serializer"

export const BOOL_UNDEFINED = 2

export function toInt32(value: number, littleEndian: boolean = true): number[] {
    const b0 = (value >> 0 & 0xFF)
    const b1 = (value >> 8 & 0xFF)
    const b2 = (value >> 16 & 0xFF)
    const b3 = (value >> 24 & 0xFF)
    return (littleEndian) ? [b0, b1, b2, b3] : [b3, b2, b1, b0]
}

export function toChars(value: string): number[] {
    return [...value].map(it => it.charCodeAt(0))
}

export function toArray(s: Serializer): Array<number> {
    return Array.from(s.asArray().slice(0, s.length()))
}
