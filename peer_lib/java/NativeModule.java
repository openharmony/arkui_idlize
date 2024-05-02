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
public class NativeModule {
    static {
        Runtime.getRuntime().loadLibrary("NativeBridgeJni");
    }
    static native long _StringMake(String string);
    static native int _StringLength(long ptr);
    static native void _StringData(long ptr, byte[] arg1, int arg2);
    static native long _GetStringFinalizer();
    static native int _GetPtrVectorSize(long ptr);
    static native long _GetGroupedLog(int kind);
    static native long _GetPtrVectorElement(long ptr, int index);
    static native void _InvokeFinalizer(long func, long obj);
    static native void _ClearGroupedLog(int index);

    static native void _AbilityComponentInterface__setAbilityComponentOptions(long arg1, byte[] arg2, int arg3);
    static native void _AbilityComponentAttribute_onConnect(long arg1, byte[] arg2, int arg3);
    static native void _AbilityComponentAttribute_onDisconnect(long arg1, byte[] arg2, int arg3);
    static native void _BlankInterface__setBlankOptions(long arg1, byte[] arg2, int arg3);
    static native void _BlankAttribute_color(long arg1, byte[] arg2, int arg3);
    static native void _ButtonInterface__setButtonOptions(long arg1);
    static native void _ButtonAttribute_type(long arg1, int arg2);
    static native void _ButtonAttribute_labelStyle(long arg1, byte[] arg2, int arg3);
    static native void _CalendarPickerAttribute_edgeAlign(long arg1, int arg2, byte[] arg3, int arg4);
    static native void _CalendarPickerAttribute_altEdgeAlign(long arg1, int arg2, byte[] arg3, int arg4);
    static native void _ColumnAttribute_alignItems(long arg1, int arg2);
    static native void _CommonMethod_stateStyles(long arg1, byte[] arg2, int arg3);
    static native void _CommonMethod_width(long arg1, byte[] arg2, int arg3);
    static native void _CommonMethod_height(long arg1, byte[] arg2, int arg3);
    static native void _CommonMethod_backgroundBlurStyle(long arg1, int arg2, byte[] arg3, int arg4);
    static native void _CommonShapeMethod_stroke(long arg1, byte[] arg2, int arg3);
    static native void _ScrollableCommonMethod_scrollBarWidth(long arg1, byte[] arg2, int arg3);
    static native void _FormComponentAttribute_size(long arg1, byte[] arg2, int arg3);
    static native void _ListAttribute_someOptional(long arg1, byte[] arg2, int arg3);
    static native void _ListAttribute_onScrollVisibleContentChange(long arg1, byte[] arg2, int arg3);
    static native void _NavigationAttribute_backButtonIcon(long arg1, byte[] arg2, int arg3);
    static native void _NavigationAttribute_testTuple(long arg1, byte[] arg2, int arg3);
    static native void _ParticleAttribute_emitter(long arg1, byte[] arg2, int arg3);
    static native void _TabsAttribute_barMode(long arg1, int arg2);
    static native void _TestAttribute_testBoolean(long arg1, int arg2);
    static native void _TestAttribute_testNumber(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testString(long arg1, String arg2);
    static native void _TestAttribute_testEnum(long arg1, int arg2);
    static native void _TestAttribute_testFunction(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testBooleanUndefined(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testNumberUndefined(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testStringUndefined(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testEnumUndefined(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testFunctionUndefined(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testUnionNumberEnum(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testUnionBooleanString(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testUnionStringNumber(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testUnionBooleanStringNumberUndefined(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testBooleanArray(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testNumberArray(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testStringArray(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testEnumArray(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testTupleBooleanNumber(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testTupleNumberStringEnum(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testTupleOptional(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testTupleUnion(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testArrayRefBoolean(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testArrayRefNumber(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testBooleanInterface(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testNumberInterface(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testStringInterface(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testUnionInterface(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testUnionOptional(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testTupleInterface(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testOptionInterface(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testArrayRefNumberInterface(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testBooleanInterfaceOption(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testBooleanInterfaceTuple(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testBooleanInterfaceArray(long arg1, byte[] arg2, int arg3);
    static native void _TestAttribute_testBooleanInterfaceArrayRef(long arg1, byte[] arg2, int arg3);
    static native void _TextPickerInterface__setTextPickerOptions(long arg1, byte[] arg2, int arg3);
    static native void _TextPickerAttribute_defaultPickerItemHeight(long arg1, byte[] arg2, int arg3);
    static native void _TextPickerAttribute_canLoop(long arg1, int arg2);
    static native void _TextPickerAttribute_onAccept(long arg1, byte[] arg2, int arg3);
    static native void _TextPickerAttribute_onCancel(long arg1, byte[] arg2, int arg3);
    static native void _TextPickerAttribute_onChange(long arg1, byte[] arg2, int arg3);
    static native void _TextPickerAttribute_selectedIndex(long arg1, byte[] arg2, int arg3);
    static native void _TextPickerAttribute_divider(long arg1, byte[] arg2, int arg3);
    static native void _TextPickerAttribute_gradientHeight(long arg1, byte[] arg2, int arg3);
    static native void _TextPickerDialog_show(byte[] arg1, int arg2);
    static native void _VectorAttribute_testVector1(long arg1, byte[] arg2, int arg3);
    static native void _VectorAttribute_testVector2(long arg1, byte[] arg2, int arg3);
    static native void _VectorAttribute_testUnionVector1Number(long arg1, byte[] arg2, int arg3);
    static native void _VectorAttribute_testUnionVector2Number(long arg1, byte[] arg2, int arg3);
}
