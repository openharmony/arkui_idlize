/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
