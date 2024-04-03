import {strict as assert} from 'assert';
import {RuntimeType, Tags} from "../../utils/ts/SerializerBase"
import {Serializer} from "../../generated/subset/Serializer"

function toArray(s: Serializer): Array<number> {
    return Array.from(s.asArray().slice(0, s.length()))
}

let size: number
let serializer: Serializer

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
