import {strict as assert} from 'assert';

import {toArray, toInt32, toStr} from "../unit_utils"
import {RuntimeType, Tags} from "@arkoala/interop"
import {Serializer} from "@arkoala/arkui/peers/Serializer"

// Boolean

it('Should write boolean undefined', function () {
    let serializer = new Serializer()
    serializer.writeBoolean(undefined)
    assert.deepEqual(toArray(serializer), [RuntimeType.UNDEFINED])
});

it('Should write boolean false', function () {
    let serializer = new Serializer()
    serializer.writeBoolean(false)
    assert.deepEqual(toArray(serializer), [0])
});

it('Should write boolean false', function () {
    let serializer = new Serializer()
    serializer.writeBoolean(true)
    assert.deepEqual(toArray(serializer), [1])
});

// Number

it('Should write number undefined', function () {
    let serializer = new Serializer()
    serializer.writeNumber(undefined)
    assert.deepEqual(toArray(serializer), [Tags.UNDEFINED])
});

it('Should write number 128', function () {
    let serializer = new Serializer()
    serializer.writeNumber(128)
    assert.deepEqual(toArray(serializer), [Tags.INT32, ...toInt32(128)])
});

it('Should write number 0x89ABCDEF', function () {
    let serializer = new Serializer()
    serializer.writeNumber(0x89ABCDEF)
    assert.deepEqual(toArray(serializer), [Tags.INT32, ...toInt32(0x89ABCDEF)])
});

// String

it('Should write string empty', function () {
    let serializer = new Serializer()
    serializer.writeString("")
    assert.deepEqual(toArray(serializer), [...toStr("")])
});

it('Should write string abc', function () {
    let serializer = new Serializer()
    serializer.writeString("abc")
    assert.deepEqual(toArray(serializer), [...toStr("abc")])
});
