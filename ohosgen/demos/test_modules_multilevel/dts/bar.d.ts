import { FooInt } from "./foo";

export class BarInt {
    x: FooInt;
    y: FooInt;
    constructor(vx: number, vy: number);
    getInt(offset: number): number;
}
