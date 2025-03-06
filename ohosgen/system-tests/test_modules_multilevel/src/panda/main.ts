import { FooInt, BarInt, BazInt, qux } from "../../generated/arkts";
import { pullEvents, init } from "./compat";

function mainBody() {
    console.log('Starting demo: test_modules');
    console.log('======== Foo ========');
    const foo: FooInt = new FooInt(42);
    {
        const res = qux.getIntWithFoo(foo);
        console.log(`getIntWithFoo(foo) = ${res}`); // Expected: 42
    }
    const values: number[] = [2.25];
    for (const v of values) {
        const res = foo.getInt(v);
        console.log(`foo.getInt(${v}) = ${res}`); // Expected: 44.25
    }
    console.log('======== Bar ========');
    const bar: BarInt = new BarInt(1000, 1500);
    {
        const res = qux.getIntWithBar(bar, 17);
        console.log(`getIntWithBar(bar) = ${res}`); // Expected: 2517
    }
    for (const v of values) {
        const res = bar.getInt(v);
        console.log(`bar.getInt(${v}) = ${res}`); // Expected: 2502.25
    }
    console.log('======== Baz ========');
    const baz: BazInt = new BazInt(2000, 2300, 2600);
    {
        const res = qux.getIntWithBaz(baz, 34, "hello C++ from TS");
        console.log(`getIntWithBaz(baz) = ${res}`); // Expected: 6934
    }
    for (const v of values) {
        const res = baz.getInt(v);
        console.log(`baz.getInt(${v}) = ${res}`); // Expected: 6902.25
    }
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
