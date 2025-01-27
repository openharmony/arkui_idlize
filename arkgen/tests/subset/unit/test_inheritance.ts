import {strict as assert} from 'assert';

import {toArray, toStr, toInt32} from "../unit_utils"
import {RuntimeType, Tags} from "@arkoala/interop"
import {Serializer} from "@arkoala/arkui/peers/Serializer"

enum AdaptiveColor {
    DEFAULT
}

enum ThemeColorMode {
    SYSTEM,
    LIGHT,
    DARK
}

it('Test BackgroundBlurStyleOptions serializer has superclass', function () {
    let serializer = new Serializer()
    let blurOptions: BlurOptions = {
        grayscale: [2, 3]
    }
    let backgroundBlurStyleOptions: BackgroundBlurStyleOptions = {
        colorMode: ThemeColorMode.SYSTEM,
        adaptiveColor: AdaptiveColor.DEFAULT,
        scale: 1,
        blurOptions: blurOptions,
    }
    serializer.writeBackgroundBlurStyleOptions(backgroundBlurStyleOptions)
    assert.deepEqual(toArray(serializer), [
        RuntimeType.NUMBER, ...toInt32(ThemeColorMode.SYSTEM),
        RuntimeType.NUMBER, ...toInt32(AdaptiveColor.DEFAULT),
        RuntimeType.NUMBER, Tags.INT32, ...toInt32(1),
        RuntimeType.OBJECT, RuntimeType.OBJECT, Tags.INT32, ...toInt32(2), Tags.INT32, ...toInt32(3)
    ])
});

it('Test bindSheet serializer has superclass', function () {
    let serializer = new Serializer()
    let resource: Resource = { id: 43, bundleName: "MyApp", moduleName: "MyApp" }
    let sheetTitle: SheetTitleOptions = {
        title: resource
    }
    serializer.writeSheetOptions({
        backgroundColor: '#00ffffff',
        title: sheetTitle
    })
    assert.deepEqual(toArray(serializer), [
        RuntimeType.STRING, RuntimeType.STRING, ...toStr("#00ffffff"),
        RuntimeType.OBJECT,
        RuntimeType.OBJECT, ...toStr(JSON.stringify(resource)),
        RuntimeType.UNDEFINED,
        RuntimeType.UNDEFINED
    ])
})
