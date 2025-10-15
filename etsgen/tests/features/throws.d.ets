export interface ThrowableInterface {
    foo(): void

    /**
     * A fizz method.
     * @throws { Error }
     */
    fizz(): void
}

export class ThrowableClass {
    boo(): void

    /**
     * A bazz method.
     * @throws { Error }
     */
    buzz(): void
}
