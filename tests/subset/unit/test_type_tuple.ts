import {strict as assert} from 'assert';

import {BOOL_UNDEFINED, toArray, toInt32} from "../unit_utils"
import {RuntimeType, Tags} from "../../../utils/ts/SerializerBase"
import {Serializer} from "../../../generated/subset/Serializer"

it('Should write tuple [0, false]', function () {
    let serializer = new Serializer(8)
    serializer.writeTupleInterfaceDTS({tuple: [0, false]})
    assert.deepEqual(toArray(serializer),
        [Tags.OBJECT, RuntimeType.OBJECT, Tags.INT32, ...toInt32(0), 0])
});

it('Should write tuple [0, true]', function () {
    let serializer = new Serializer(8)
    serializer.writeTupleInterfaceDTS({tuple: [0, true]})
    assert.deepEqual(toArray(serializer),
        [Tags.OBJECT, RuntimeType.OBJECT, Tags.INT32, ...toInt32(0), 1])
});

it('Should write tuple [10, false]', function () {
    let serializer = new Serializer(8)
    serializer.writeTupleInterfaceDTS({tuple: [10, false]})
    assert.deepEqual(toArray(serializer),
        [Tags.OBJECT, RuntimeType.OBJECT, Tags.INT32, ...toInt32(10), 0])
});

it('Should write tuple with optional values [undefined, undefined]', function () {
    let serializer = new Serializer(8)
    serializer.writeOptionInterfaceDTS({tuple: [undefined, undefined]})
    assert.deepEqual(toArray(serializer),
        [Tags.OBJECT, RuntimeType.OBJECT, BOOL_UNDEFINED, Tags.UNDEFINED])
});

it('Should write tuple with optional values [false, undefined]', function () {
    let serializer = new Serializer(8)
    serializer.writeOptionInterfaceDTS({tuple: [false, undefined]})
    assert.deepEqual(toArray(serializer),
        [Tags.OBJECT, RuntimeType.OBJECT, 0, Tags.UNDEFINED])
});

it('Should write tuple with optional values [false, undefined]', function () {
    let serializer = new Serializer(8)
    serializer.writeOptionInterfaceDTS({tuple: [undefined, 11]})
    assert.deepEqual(toArray(serializer),
        [Tags.OBJECT, RuntimeType.OBJECT, BOOL_UNDEFINED, Tags.INT32, ...toInt32(11)])
});

it('Should write tuple with optional values [false, 0]', function () {
    let serializer = new Serializer(8)
    serializer.writeOptionInterfaceDTS({tuple: [false, 0]})
    assert.deepEqual(toArray(serializer),
        [Tags.OBJECT, RuntimeType.OBJECT, 0, Tags.INT32, ...toInt32(0)])
});

it('Should write tuple with optional values [true, 12]', function () {
    let serializer = new Serializer(8)
    serializer.writeOptionInterfaceDTS({tuple: [true, 12]})
    assert.deepEqual(toArray(serializer),
        [Tags.OBJECT, RuntimeType.OBJECT, 1, Tags.INT32, ...toInt32(12)])
});
