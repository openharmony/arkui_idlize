import { init, checkEvents, Buffers, Callbacks, fp, iresize, resize, resizeAll, resize3 } from "./compat";

function testBuffers() {
    console.log('==== Buffers');
    const test = new Buffers();

    const res = test.getResult();
    console.log('Buffers.getResult():');
    console.log(`  .index = ${res.index}`);
    console.log('  .inData.length =', res.data.byteLength);

    const buf = test.getData();
    console.log('foo.getData():');
    console.log('  .length =', buf.byteLength);
}

function testCallbacks() {
    console.log('==== Callbacks');
    const test = new Callbacks();
    console.log(`foo.getX() = ${test.getX()}`);

    test.callNumber(42,
        n => console.log('Callback invoked with arg ' + n))
    test.callVoid(
        () => console.log(`Void callback invoked`))
    checkEvents()
}

export function testFqn() {
    console.log('==== FQN');
    iresize(
        { intWidth: 21, intHeight: 11 }
    )
    fp.resize(
        { floatWidth: 0.26, floatHeight: 0.23 }
    )
    resize(
        { numWidth:  6,   numHeight:  3 }
    )
    resizeAll({
        numSize:   { numWidth:  4,   numHeight:  8 },
        intSize:   { intWidth: 14,   intHeight: 18 },
        floatSize: { floatWidth: 24.0, floatHeight: 28.0 },
    })
    resize3(
        { numWidth:  6,   numHeight:  3 },
        { intWidth: 16,   intHeight: 13 },
        { floatWidth: 0.26, floatHeight: 0.23 },
    )
}

export function main() {
    console.log('Starting demo: test_ost')
    init();
    testBuffers()
    testCallbacks()
    testFqn()
}
