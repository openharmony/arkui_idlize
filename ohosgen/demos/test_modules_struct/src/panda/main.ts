import { BarInt, FooInt } from "../../generated/arkts";
import { pullEvents, init, baz } from "./compat";

function mainBody() {
    console.log('Starting demo: test_modules');
    const foo: FooInt = new FooInt(42);
    {
        const res = baz.getIntWithFoo(foo);
        console.log(`getNumberWithFoo(foo) = ${res}`); // Expected: 42
    }
    const values: number[] = [1, 2.25];
    for (const v of values) {
        const res = foo.getInt(v);
        console.log(`getNumber(${v}) = ${res}`); // Expected: 43, 45.25
    }
    // The following line fails as well:
    // const bar: BarInt = { fooA: new FooInt(142), fooB: new FooInt(242) };
    const bar: BarInt = new BarInt();
    bar.fooA = new FooInt(142);
    bar.fooB = new FooInt(242);
    const resBar = baz.getIntWithBar(bar);
    console.log(`getIntWithBar(bar) = ${resBar}`);
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
