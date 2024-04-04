import {strict as assert} from 'assert';

import {toArray, toInt32} from "../unit_utils"
import {RuntimeType, Tags} from "../../../utils/ts/SerializerBase"
import {Serializer} from "../../../generated/subset/Serializer"


it('Should write LabelStyle undefined', function () {
    let serializer = new Serializer(1)
    serializer.writeLabelStyle(undefined)
    assert.deepEqual(toArray(serializer), [Tags.UNDEFINED])
});

it('Should write LabelStyle maxLines: 10', function () {
    let serializer = new Serializer(7)
    let labelStyle: LabelStyle = {maxLines: 10}
    serializer.writeLabelStyle(labelStyle)
    assert.deepEqual(toArray(serializer), [Tags.OBJECT, RuntimeType.NUMBER, Tags.INT32, ...toInt32(10)])
});