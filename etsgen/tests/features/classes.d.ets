export class ClassWithConstructor {
    constructor()
}

export class ClassWithoutConstructor {}

export class ClassWithMethods {
    field1: number
    field2: number
    get field3(): number
    set field3(value: number)
    get field4(): number
    set field5(value: number)
    boo(): number
    boo(value: number): number
    static foo(): void
    static foo(value: number): void
}
