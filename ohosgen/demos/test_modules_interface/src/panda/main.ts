import { pullEvents, init, bar } from "./compat";
import { IFooInt } from "../../generated/arkts";

class MyFoo implements IFooInt {
    getInt(index: number): number {
        return index + 1000;
    }
}

function mainBody() {
    console.log('Starting demo: test_modules');
    const foo : IFooInt = new MyFoo();
    const inputs = [1, 2.25, 8.5];
    for (const v of inputs) {
        const res = bar.getIntWithFoo(v, foo);
        console.log(`getNumberWithFoo(foo) = ${res}`);
    }
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
