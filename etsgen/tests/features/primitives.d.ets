export interface Iface {
    foo(value: any): void
    foo(): this
    foo(value: object): void
    foo(value: Object): void
    foo(value: string | undefined): void
    foo(value: string): void
    foo(value: number): void
    foo(value: int): void
    foo(value: float): void
    foo(value: long): void
    foo(value: short): void
    foo(value: double): void
    foo(value: boolean): void
    foo(value: char): void
    foo(value: Array<string>): void
    foo(value: null): void
    foo(value: Map<string, number>): void
    foo(value: Date): void
    foo(value: ArrayBuffer): void
    foo(value: Required<string>): void
    foo(value: Readonly<string>): void
    foo(value: Optional<string>): void
}