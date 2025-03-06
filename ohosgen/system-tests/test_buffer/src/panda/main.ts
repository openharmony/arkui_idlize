import { pullEvents, init, Foo, FooResult } from "./compat";
import { NativeBuffer } from '@koalaui/interop';

function mainBody() {
    console.log('Starting demo: test_buffer');
    const foo: Foo = new Foo();

    const res: FooResult = foo.getResult();
    console.log('foo.getResult() done. Let res be the result:');
    console.log(`  res.index = ${res.index}`);
    console.log('  res.inData.length =', res.inData.length);

    const buf: NativeBuffer = foo.getInData();
    console.log('foo.getInData() done. Let buf be the result:');
    console.log('  buf.length =', buf.length);
}

export function main() {
    init();
    mainBody();
    pullEvents();
}
