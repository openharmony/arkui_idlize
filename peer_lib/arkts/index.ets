/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

export class NativeModule {
    static {
        loadLibrary("NativeBridgeArk");
    }

    static native _StringLength(arg1: long): int;
    static native _StringData(arg1: long, arg2: byte[], arg3: int): void;
    static native _StringMake(arg1: String): long;
    static native _GetStringFinalizer(): long;
    static native _InvokeFinalizer(arg1: long, arg2: long): void;
    static native _GetPtrVectorSize(arg1: long): int;
    static native _GetPtrVectorElement(arg1: long, arg2: int): long;
    static native _GetGroupedLog(arg1: int): long;
    static native _ClearGroupedLog(arg1: int): void;
    static native _TestPerfNumber(arg1: int): int;
    static native _TestPerfNumberWithArray(arg1: byte[], arg2: int): void;
    static native _BlankInterface__setBlankOptions(arg1: long, arg2: byte[], arg3: int): void;
    static native _BlankAttribute_color(arg1: long, arg2: byte[], arg3: int): void;
    static native _ButtonInterface__setButtonOptions(arg1: long): void;
    static native _ButtonAttribute_type(arg1: long, arg2: int): void;
    static native _ButtonAttribute_labelStyle(arg1: long, arg2: byte[], arg3: int): void;
    static native _CalendarPickerAttribute_edgeAlign(arg1: long, arg2: int, arg3: byte[], arg4: int): void;
    static native _CalendarPickerAttribute_altEdgeAlign(arg1: long, arg2: int, arg3: byte[], arg4: int): void;
    static native _ColumnAttribute_alignItems(arg1: long, arg2: int): void;
    static native _CommonMethod_stateStyles(arg1: long, arg2: byte[], arg3: int): void;
    static native _CommonMethod_width(arg1: long, arg2: byte[], arg3: int): void;
    static native _CommonMethod_height(arg1: long, arg2: byte[], arg3: int): void;
    static native _CommonMethod_bindSheet(arg1: long, arg2: int, arg3: byte[], arg4: int, arg5: byte[], arg6: int): void;
    static native _CommonMethod_backgroundBlurStyle(arg1: long, arg2: int, arg3: byte[], arg4: int): void;
    static native _CommonMethod_dragPreviewOptions(arg1: long, arg2: byte[], arg3: int, arg4: byte[], arg5: int): void;
    static native _CommonShapeMethod_stroke(arg1: long, arg2: byte[], arg3: int): void;
    static native _ScrollableCommonMethod_scrollBarWidth(arg1: long, arg2: byte[], arg3: int): void;
    static native _FormComponentAttribute_size(arg1: long, arg2: byte[], arg3: int): void;
    static native _ListAttribute_someOptional(arg1: long, arg2: byte[], arg3: int): void;
    static native _ListAttribute_onScrollVisibleContentChange(arg1: long, arg2: byte[], arg3: int): void;
    static native _NavigationAttribute_backButtonIcon(arg1: long, arg2: byte[], arg3: int): void;
    static native _NavigationAttribute_testTuple(arg1: long, arg2: byte[], arg3: int): void;
    static native _ParticleAttribute_emitter(arg1: long, arg2: byte[], arg3: int): void;
    static native _TabsAttribute_barMode(arg1: long, arg2: int): void;
    static native _TestAttribute_testBoolean(arg1: long, arg2: int): void;
    static native _TestAttribute_testNumber(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testString(arg1: long, arg2: String): void;
    static native _TestAttribute_testEnum(arg1: long, arg2: int): void;
    static native _TestAttribute_testFunction(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testBasicMix(arg1: long, arg2: byte[], arg3: int, arg4: String, arg5: byte[], arg6: int): void;
    static native _TestAttribute_testBooleanUndefined(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testNumberUndefined(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testStringUndefined(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testEnumUndefined(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testFunctionUndefined(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testUnionNumberEnum(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testUnionBooleanString(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testUnionStringNumber(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testUnionBooleanStringNumberUndefined(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testBooleanArray(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testNumberArray(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testStringArray(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testEnumArray(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testArrayMix(arg1: long, arg2: byte[], arg3: int, arg4: byte[], arg5: int, arg6: byte[], arg7: int): void;
    static native _TestAttribute_testTupleBooleanNumber(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testTupleNumberStringEnum(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testTupleOptional(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testTupleUnion(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testArrayRefBoolean(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testArrayRefNumber(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testBooleanInterface(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testNumberInterface(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testStringInterface(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testUnionInterface(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testUnionOptional(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testTupleInterface(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testOptionInterface(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testArrayRefNumberInterface(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testBooleanInterfaceOption(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testBooleanInterfaceTuple(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testBooleanInterfaceArray(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testBooleanInterfaceArrayRef(arg1: long, arg2: byte[], arg3: int): void;
    static native _TestAttribute_testInterfaceMixed(arg1: long, arg2: byte[], arg3: int, arg4: byte[], arg5: int, arg6: byte[], arg7: int): void;
    static native _TextPickerInterface__setTextPickerOptions(arg1: long, arg2: byte[], arg3: int): void;
    static native _TextPickerAttribute_defaultPickerItemHeight(arg1: long, arg2: byte[], arg3: int): void;
    static native _TextPickerAttribute_canLoop(arg1: long, arg2: int): void;
    static native _TextPickerAttribute_onAccept(arg1: long, arg2: byte[], arg3: int): void;
    static native _TextPickerAttribute_onCancel(arg1: long, arg2: byte[], arg3: int): void;
    static native _TextPickerAttribute_onChange(arg1: long, arg2: byte[], arg3: int): void;
    static native _TextPickerAttribute_selectedIndex(arg1: long, arg2: byte[], arg3: int): void;
    static native _TextPickerAttribute_divider(arg1: long, arg2: byte[], arg3: int): void;
    static native _TextPickerAttribute_gradientHeight(arg1: long, arg2: byte[], arg3: int): void;
    static native _TextPickerDialog_show(arg1: byte[], arg2: int): void;
    static native _VectorAttribute_testVector1(arg1: long, arg2: byte[], arg3: int): void;
    static native _VectorAttribute_testVector2(arg1: long, arg2: byte[], arg3: int): void;
    static native _VectorAttribute_testUnionVector1Number(arg1: long, arg2: byte[], arg3: int): void;
    static native _VectorAttribute_testUnionVector2Number(arg1: long, arg2: byte[], arg3: int): void;

    public static run0(): void {
        let string = "HELLO"
        let value = NativeModule._StringMake(string)
        console.log("NativeModule._StringMake gave " + value + " for " + string)
        console.log("NativeModule._StringLength gave " + NativeModule._StringLength(value))
    }
    public static run(): void {
        checkPerf(10 * 1000 * 1000)
    }
}

function checkPerf(count: number) {
    let start = Date.now()
    for (let i = 0; i < count; i++) {
        NativeModule._TestPerfNumber(i)
    }
    let passed = Date.now() - start
    console.log(`NUMBER: ${passed}ms for ${count} iteration, ${Math.round(passed / count * 1000000)}ms per 1M iterations`)

    start = Date.now()
    for (let i = 0; i < count; i++) {
        let data = new byte[5]
        data[0] = 1
        data[1] = (i >> 24) as byte
        data[2] = (i >> 16) as byte
        data[3] = (i >> 8) as byte
        data[4] = (i >> 0) as byte
        NativeModule._TestPerfNumberWithArray(data, data.length)
    }
    passed = Date.now() - start
    console.log(`ARRAY: ${passed}ms for ${count} iteration, ${Math.round(passed / count * 1000000)}ms per 1M iterations`)
}
/*
V8:
NUMBER: 111.8373319990933ms for 1000000 iteration, 112ms per 1M iterations
ARRAY: 955.3288690000772ms for 1000000 iteration, 955ms per 1M iterations

PANDA:
"NUMBER: 1317ms for 10000000 iteration, 132ms per 1M iterations"
"ARRAY: 4264ms for 10000000 iteration, 426ms per 1M iterations"

JVM:
NUMBER: 162ms for 10000000 iteration, 16ms per 1M iterations
ARRAY: 241ms for 10000000 iteration, 24ms per 1M iterations
*/
export function main(): void {
    NativeModule.run()
}