import { CommonMethod } from "./root_components"

export interface ButtonAttribute extends CommonMethod {
    label(value: string | undefined): this
}

@memo
@ComponentBuilder
export function Button(
    @memo
    content_?: () => void
): ButtonAttribute

@memo
@ComponentBuilder
export function Button(
    label: string,
    @memo
    content_?: () => void
): ButtonAttribute

// must be removed by the etsgen
@memo
export function ButtonImpl(
    style: () => void,
    content_: () => void,
): void
@Builder
export function Button(
    style: () => void,
): ButtonAttribute