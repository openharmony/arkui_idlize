import {strict as assert} from 'assert';

import {toArray, toInt32} from "../unit_utils"
import {Tags} from "../../../utils/ts/SerializerBase"
import {Serializer} from "../../../generated/subset/Serializer"

it('Should resize capacity', function () {
    for (let size = 0; size < 8; size++) {
        let serializer = new Serializer(size)
        serializer.writeString(undefined)
        assert.deepEqual(toArray(serializer), [Tags.UNDEFINED])
        serializer.writeBoolean(true)
        assert.deepEqual(toArray(serializer), [Tags.UNDEFINED, 1])
        serializer.writeNumber(7)
        assert.deepEqual(toArray(serializer), [Tags.UNDEFINED, 1, Tags.INT32, ...toInt32(7)])
        serializer.writeNumber(8)
        assert.deepEqual(toArray(serializer), [Tags.UNDEFINED, 1, Tags.INT32, ...toInt32(7), Tags.INT32, ...toInt32(8)])
    }
});
