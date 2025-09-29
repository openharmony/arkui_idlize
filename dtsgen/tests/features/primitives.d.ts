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
    foo(value: double): void
    foo(value: boolean): void
    foo(value: Array<string>): void
    foo(value: null): void
    foo(value: Map<string, number>): void
    foo(value: Date): void
    foo(value: ArrayBuffer): void
    foo(value: Required<string>): void
    foo(value: Readonly<string>): void
    foo(value: Optional<string>): void
    bar01(): any
    bar02(): object
    bar03(): Object
    bar04(): string | undefined
    bar05(): string
    bar06(): number
    bar07(): int
    bar08(): float
    bar00(): long
    bar10(): short
    bar11(): void
    bar12(): boolean
    bar13(): char
    bar14(): Array<string>
    bar15(): void
    bar16(): Date
    bar17(): ArrayBuffer
    bar18(): Required<string>
    bar19(): Readonly<string>
    bar20(): Optional<string>
}