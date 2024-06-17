import {strict as assert} from 'assert';

import {toArray, toInt32} from "../unit_utils"
import {RuntimeType, Tags} from "@arkoala/arkui/SerializerBase"
import {Serializer} from "@arkoala/arkui/Serializer"


it('Should write LabelStyle maxLines: 10', function () {
    let serializer = new Serializer()
    let labelStyle: LabelStyle = {maxLines: 10}
    serializer.writeLabelStyle(labelStyle)
    assert.deepEqual(toArray(serializer), [RuntimeType.NUMBER, Tags.INT32, ...toInt32(10)])
});
