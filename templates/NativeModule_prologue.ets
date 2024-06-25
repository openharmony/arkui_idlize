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

let theModule: NativeModule

export function nativeModule(): NativeModule {
    if (theModule) return theModule

    theModule = new NativeModule()
    return theModule
}

export class NativeModule {
  static {
    loadLibrary("NativeBridgeArk")
    NativeModule.init()
  }
  // TODO: shall be done in static initializer instead
  static native init(): void;

  static native _StringLength(arg1: long): int;
  static native _StringData(arg1: long, arg2: byte[], arg3: int): void;
  static native _StringMake(arg1: String): long;
  static native _ManagedStringWrite(value: String, arg1: byte[], arg2: int): int;
  static native _GetStringFinalizer(): long;
  static native _InvokeFinalizer(arg1: long, arg2: long): void;
  static native _GetNodeFinalizer(): long;
  static native _GetPtrVectorSize(arg1: long): int;
  static native _GetPtrVectorElement(arg1: long, arg2: int): long;
  static native _GetGroupedLog(arg1: int): long;
  static native _StartGroupedLog(arg1: int): void;
  static native _StopGroupedLog(arg1: int): void;
  static native _TestPerfNumber(arg1: int): int;
  static native _TestPerfNumberWithArray(arg1: byte[], arg2: int): void;
  static native _Test_TextPicker_OnAccept(valueArray: byte[], valueSerializerLength: int): void;
  static native _StartPerf(traceName: String): void;
  static native _EndPerf(traceName: String): void;
  static native _DumpPerf(options: int): long;
  static native _Test_List_OnScrollVisibleContentChange(valueArray: byte[], valueSerializerLength: int): void;
  static native _Test_Common_OnChildTouchTest(valueArray: byte[], valueSerializerLength: int): void;
  static native _GetNodeByViewStack(): long;
