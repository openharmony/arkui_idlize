import { pullEvents, init, Foo } from "./compat";

function mainBody() {
    console.log('Starting demo: test_generic_callback');
    const cb = (x: number) => {
        console.log(`Callback invoked From TS: x = ${x}`);
    };
    const cbVoid = () => {
        console.log(`Void callback invoked From TS`);
    };
    const foo = new Foo();
    console.log(`foo.getX() = ${foo.getX()}`);

    foo.callCB(42, cb);
    foo.callCBVoid(cbVoid)
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
