import { pullEvents, init, FooWork } from "./compat";

type RejectCallback = (error: Object | null | undefined) => void;

function asyncDemo(execIndex: number, execLimit: number) {
    console.log(`---- Starting demo: test_promise_idl (execIndex = ${execIndex}, execLimit = ${execLimit}) ----`);
    let p = new Promise<number>((resolve: (v: number) => void, reject: RejectCallback) => {
        const work = new FooWork();
        work.Create();
        const r = taskpool.execute(work.Execute, 42, "Hello world");
        // const r = taskpool.execute(() => work.Execute(42, "Hello world"));
        console.log('Inner Promise r created.');
        r.then((e: Object | null | undefined) => {
            console.log('r.then(): e = ', e);
            const result = work.Complete();
            if (result.state) {
                console.log('resolve() called in r.then()');
                resolve(result.returnValue);
            } else {
                console.log('reject() called in r.then()');
                reject(result.returnValue);
            }
        });
    });
    console.log('Outer Promise p created.');
    p.then((ret: number) => {
        console.log('Outer promise p.then() returns ', ret);
    }).catch((ret: Object | null | undefined) => {
        console.log('Output promise p.catch() returns ', ret);
    }).finally(() => {
        if (execIndex + 1 < execLimit) {
            asyncDemo(execIndex + 1, execLimit);
        }
    });
}

function asyncMainBody() {
    asyncDemo(0, 2);
}

export function main() {
    init();
    asyncMainBody();
    pullEvents();
    console.log('main() done.');
}
