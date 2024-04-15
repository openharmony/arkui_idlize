import {Serializer} from "@arkoala/arkui/Serializer"

export function toInt32(value: number, littleEndian: boolean = true): number[] {
    const b0 = (value >> 0 & 0xFF)
    const b1 = (value >> 8 & 0xFF)
    const b2 = (value >> 16 & 0xFF)
    const b3 = (value >> 24 & 0xFF)
    return (littleEndian) ? [b0, b1, b2, b3] : [b3, b2, b1, b0]
}

export function toStr(value: string): number[] {
    let chars = [...value].map(it => it.charCodeAt(0))
    return [...toInt32(value.length + 1), ...chars, 0] // zero terminated string
}

export function toArray(s: Serializer): Array<number> {
    return Array.from(s.asArray().slice(0, s.length()))
}
