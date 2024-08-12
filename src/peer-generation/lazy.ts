export class Lazy<T> {
    private readonly factory: () => T
    constructor(factory: () => T) {
        this.factory = factory
    }

    private instantiated: boolean = false
    private instance: T | undefined
    get value(): T {
        if (!this.instantiated) {
            this.instance = this.factory()
            this.instantiated = true
        }
        return this.instance as T
    }
}

export function lazy<T>(factory: () => T): Lazy<T> {
    return new Lazy(factory)
}

export function lazyThrow<T>(): Lazy<T> {
    return new Lazy(() => {
        throw new Error("This lazy was not expected to be called")
    })
}
