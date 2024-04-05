import {strict as assert} from 'assert';

import {BOOL_UNDEFINED, toArray, toInt32, toChars} from "../unit_utils"
import {RuntimeType, Tags} from "@arkoala/arkui/utils/ts/SerializerBase"
import {Serializer} from "@arkoala/arkui/Serializer"

// Boolean

it('Should write boolean undefined', function () {
    let serializer = new Serializer(1)
    serializer.writeBoolean(undefined)
    assert.deepEqual(toArray(serializer), [BOOL_UNDEFINED])
});

it('Should write boolean false', function () {
    let serializer = new Serializer(1)
    serializer.writeBoolean(false)
    assert.deepEqual(toArray(serializer), [0])
});

it('Should write boolean false', function () {
    let serializer = new Serializer(1)
    serializer.writeBoolean(true)
    assert.deepEqual(toArray(serializer), [1])
});

// Number

it('Should write number undefined', function () {
    let serializer = new Serializer(1)
    serializer.writeNumber(undefined)
    assert.deepEqual(toArray(serializer), [Tags.UNDEFINED])
});

it('Should write number 128', function () {
    let serializer = new Serializer(5)
    serializer.writeNumber(128)
    assert.deepEqual(toArray(serializer), [Tags.INT32, ...toInt32(128)])
});

it('Should write number 0x89ABCDEF', function () {
    let serializer = new Serializer(5)
    serializer.writeNumber(0x89ABCDEF)
    assert.deepEqual(toArray(serializer), [Tags.INT32, ...toInt32(0x89ABCDEF)])
});

// String

it('Should write string undefined', function () {
    let serializer = new Serializer(1024)
    serializer.writeString(undefined)
    assert.deepEqual(toArray(serializer), [Tags.UNDEFINED])
});

it('Should write string empty', function () {
    let serializer = new Serializer(1024)
    serializer.writeString("")
    assert.deepEqual(toArray(serializer), [Tags.STRING, ...toInt32(0)])
});

it('Should write string abc', function () {
    let serializer = new Serializer(1024)
    serializer.writeString("abc")
    assert.deepEqual(toArray(serializer),
        [Tags.STRING, ...toInt32(3), ...toChars("abc")])
});
