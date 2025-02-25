export class Foo {
    value: number;
    constructor(value: number);
    getNumberDelayed(seconds: number): Promise<number>;
}
