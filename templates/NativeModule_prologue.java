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
  static native void _StartGroupedLog(int index);
  static native void _StopGroupedLog(int index);
  static native int _TestPerfNumber(int value);
  static native void _TestPerfNumberWithArray(byte[] data, int length);
  static native void _StartPerf(String traceName);
  static native void _EndPerf(String traceName);
  static native long _DumpPerf(int options);
  static native int _ManagedStringWrite(String string, byte[] buffer, int offset);
  static native void _Test_TextPicker_OnAccept(byte[] valueArray, int valueSerializerLength);
