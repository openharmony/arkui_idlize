import { pullEvents, init, FooObject, BarObject } from "./compat";

function mainBody() {
    console.log('Starting demo: test_package');
    const foo = new FooObject();
    foo.echo("Hello C++ from foo");
    console.log(`foo.toInt32() = ${foo.toInt32()}`);

    const bar = new BarObject();
    const testBar = (prompt: string) => {
        console.log(`testBar(prompt="${prompt}")`);
        bar.echo("Hello C++ from bar");
        console.log(`bar.toInt32() = ${bar.toInt32()}`);
    }
    testBar("Initial");
    bar.fooObj = new FooObject();
    testBar("After assigning bar.fooObj to new value");
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
