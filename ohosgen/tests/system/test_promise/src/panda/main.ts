import { pullEvents, init, Foo } from "./compat";

function mainBody() {
    console.log('Starting demo: test_promise');
    const foo: Foo = new Foo(42);
    foo.getNumberDelayed(3)
    .then((value: number) => {
        console.log(`Returned value = ${value}`);
    })
    .catch((e: Object | null | undefined) => {
        console.log('Error caught: ', e);
    });
    console.log('Promise created.');
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
