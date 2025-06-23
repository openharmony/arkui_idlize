import { FooInt, BarInt, BazInt, qux } from "../../generated/arkts";
import { pullEvents, init } from "./compat";

function mainBody() {
    console.log('Starting demo: test_modules_multilevel_property');
    const bar: BarInt = new BarInt(1000, 1500);
    const baz: BazInt = new BazInt(2000, 2300, 2600);
    const v = 2.25;
    {
        bar.x = new FooInt(10000 as number);
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

export function main() {
    init();
    mainBody();
    pullEvents();
}
