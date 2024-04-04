import {Serializer} from "../../generated/subset/Serializer"

export const BOOL_UNDEFINED = 2

export function toInt32(value: number): number[] {
    return [0, 0, 0, value]
}

export function toChars(value: string): number[] {
    return [...value].map(it => it.charCodeAt(0))
}

export function toArray(s: Serializer): Array<number> {
    return Array.from(s.asArray().slice(0, s.length()))
}
