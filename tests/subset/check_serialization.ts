import {strict as assert} from 'assert';
import {RuntimeType, Tags} from "../../utils/ts/SerializerBase"
import {Serializer} from "../../generated/subset/Serializer"

function toArray(s: Serializer): Array<number> {
    return Array.from(s.asArray().slice(0, s.length()))
}

let size: number
let serializer: Serializer

// check buffer resize
for (size = 0; size < 8; size++) {
    serializer = new Serializer(size)
    serializer.writeUndefined()
    assert.deepEqual(toArray(serializer), [Tags.UNDEFINED])
    serializer.writeBoolean(true)
    assert.deepEqual(toArray(serializer), [Tags.UNDEFINED, 1])
    serializer.writeNumber(7)
    assert.deepEqual(toArray(serializer), [Tags.UNDEFINED, 1, Tags.INT32, 0, 0, 0, 7])
    serializer.writeNumber(8)
    assert.deepEqual(toArray(serializer), [Tags.UNDEFINED, 1, Tags.INT32, 0, 0, 0, 7, Tags.INT32, 0, 0, 0, 8])
}

// LabelStyle
size = 1
serializer = new Serializer(size)
serializer.writeLabelStyle(undefined)
assert.deepEqual(toArray(serializer), [Tags.UNDEFINED])

size = 7
serializer = new Serializer(size)
// declare interface LabelStyle {
//     maxLines?: number;
// }
serializer.writeLabelStyle({maxLines: 10})
assert.deepEqual(toArray(serializer), [Tags.OBJECT, RuntimeType.NUMBER, Tags.INT32, 0, 0, 0, 10])

// TupleInterfaceDTS
size = 8
serializer = new Serializer(size)
serializer.writeTupleInterfaceDTS({tuple: [0, true]})
assert.deepEqual(toArray(serializer),
    [Tags.OBJECT, RuntimeType.OBJECT, Tags.INT32, 0, 0, 0, 0, 1])

size = 8
serializer = new Serializer(size)
serializer.writeTupleInterfaceDTS({tuple: [10, false]})
assert.deepEqual(toArray(serializer),
    [Tags.OBJECT, RuntimeType.OBJECT, Tags.INT32, 0, 0, 0, 10, 0])

// OptionInterfaceDTS
const BOOL_UNDEFINED = 2

size = 8
serializer = new Serializer(size)
serializer.writeOptionInterfaceDTS({tuple: [undefined, undefined]})
assert.deepEqual(toArray(serializer),
    [Tags.OBJECT, RuntimeType.OBJECT, BOOL_UNDEFINED, Tags.UNDEFINED])

size = 8
serializer = new Serializer(size)
serializer.writeOptionInterfaceDTS({tuple: [false, undefined]})
assert.deepEqual(toArray(serializer),
    [Tags.OBJECT, RuntimeType.OBJECT, 0, Tags.UNDEFINED])

size = 8
serializer = new Serializer(size)
serializer.writeOptionInterfaceDTS({tuple: [undefined, 11]})
assert.deepEqual(toArray(serializer),
    [Tags.OBJECT, RuntimeType.OBJECT, BOOL_UNDEFINED, Tags.INT32, 0, 0, 0, 11])

size = 8
serializer = new Serializer(size)
serializer.writeOptionInterfaceDTS({tuple: [false, 0]})
assert.deepEqual(toArray(serializer),
    [Tags.OBJECT, RuntimeType.OBJECT, 0, Tags.INT32, 0, 0, 0, 0])

size = 8
serializer = new Serializer(size)
serializer.writeOptionInterfaceDTS({tuple: [true, 12]})
assert.deepEqual(toArray(serializer),
    [Tags.OBJECT, RuntimeType.OBJECT, 1, Tags.INT32, 0, 0, 0, 12])
