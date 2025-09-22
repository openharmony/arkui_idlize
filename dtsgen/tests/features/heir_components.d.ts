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