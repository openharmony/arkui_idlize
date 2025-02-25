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
    console.log('======== Extra: get property ========');
    for (const v of values) {
        {
            bar.x = new FooInt(10000);
            console.log('Set property bar.x done.');
            console.log(`bar.getInt(${v}) after setting bar.x = ${bar.getInt(v)}`); // Expected: 11502.25
            const barX = bar.x;
            console.log('Get property bar.x done.');
            const resX = barX.getInt(v);
            console.log(`bar.x.getInt(${v}) = ${resX}`); // Expected: 10002.25
            const resY = bar.y.getInt(v);
            console.log(`bar.y.getInt(${v}) = ${resY}`); // Expected: 1502.25
        }
        {
            const resFoo = baz.foo.getInt(v);
            console.log(`baz.foo.getInt(${v}) = ${resFoo}`); // Expected: 2002.25
            const resBar = baz.bar.getInt(v);
            console.log(`baz.bar.getInt(${v}) = ${resBar}`); // Expected: 4902.25
        }
        {
            const resX = baz.bar.x.getInt(v);
            console.log(`baz.bar.x.getInt(${v}) = ${resX}`); // Expected: 2302.25
            const resY = baz.bar.y.getInt(v);
            console.log(`baz.bar.y.getInt(${v}) = ${resY}`); // Expected: 2602.25
        }
    }
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
