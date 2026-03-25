export declare class ComponentContent<T extends Object> {
    update(value: T): void
}

export declare class ComponentWithComponentContentAttribute {
    overlay<T extends Object>(content: ComponentContent<T> | string | undefined): void
}

@memo
@ComponentBuilder
export declare function ComponentWithComponentContent(): ComponentWithComponentContentAttribute