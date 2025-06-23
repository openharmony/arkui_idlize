import { bar, FooInt } from "../../generated/arkts";
import { pullEvents, init } from "./compat";

function mainBody() {
    console.log('Starting demo: test_modules');
    const foo: FooInt = new FooInt(42 as number);
    {
        const res = bar.getIntWithFoo(foo);
        console.log(`getNumberWithFoo(foo) = ${res}`); // Expected: 42
    }
    const values: number[] = [1, 2.25];
    for (const v of values) {
        const res = foo.getInt(v);
        console.log(`getNumber(${v}) = ${res}`); // Expected: 43, 44.25
    }
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
