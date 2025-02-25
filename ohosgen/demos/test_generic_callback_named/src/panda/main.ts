import { pullEvents, init, Foo } from "./compat";
// import { Callback } from "../../dts/interfaces/callback";

function mainBody() {
    console.log('Starting demo: test_generic_callback');
    const cb /* : Callback<string> */ = {
        onSuccess: (result: string) => {
            console.log(`Success result received by TS: "${result}"`);
        },
        onFailure: (errorCode: number) => {
            console.log(`Failure result received by TS: errorCode = ${errorCode}`);
        }
    }
    const foo = new Foo();
    console.log(`foo.getValue() = ${foo.getValue()}`);
    foo.call(cb);
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
