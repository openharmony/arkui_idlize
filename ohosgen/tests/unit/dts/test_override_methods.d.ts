export class PersonInfo {
    name: string
    age: number
    Myfunc(a: number): number
}

export interface MyPersonHandler {
    Myfunc1(a: number, b?: PersonInfo): number
    Myfunc1(a: number, ...b: PersonInfo[]): number
    Myfunc1(a: PersonInfo): number

    MyFunc2(b: number, c?: boolean): void
    MyFunc2(b: number, c?: string): void
    MyFunc2(b: number, c?: number): void
}