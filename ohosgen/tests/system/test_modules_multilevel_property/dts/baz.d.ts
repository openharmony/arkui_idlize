import { BarInt } from "./bar";
import { FooInt } from "./foo";

export class BazInt {
    foo: FooInt;
    bar: BarInt;
    constructor(f: number, bx: number, by: number);
    getInt(offset: number): number;
}
