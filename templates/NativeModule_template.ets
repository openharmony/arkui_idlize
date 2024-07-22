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

import { callCallback } from "./CallbackRegistry"

let theModule: NativeModule

export function nativeModule(): NativeModule {
    if (theModule) return theModule
    // todo: is this code actually reachable?
    theModule = new NativeModule()
    return theModule
}

export class NativeModule {
  static {
    loadLibrary("NativeBridgeArk")
    NativeModule.init();
  }

  static native init(): void;

  static callCallbackFromNative(id: int, args: byte[], length: int): int {
    return callCallback(id, args, length)
  }

  static native _LoadVirtualMachine(classPath: String, libPath: String, kind: int): long;
  static native _RunVirtualMachine(env: long, what: int): int;

%GENERATED_METHODS%

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
  static native _StartPerf(traceName: String): void;
  static native _EndPerf(traceName: String): void;
  static native _DumpPerf(options: int): long;
  static native _GetNodeByViewStack(): long;
  static native _TestPerfNumber(arg1: int): int;
  static native _TestPerfNumberWithArray(arg1: byte[], arg2: int): void;
  static native _Test_TextPicker_OnAccept(valueArray: byte[], valueSerializerLength: int): void;
  static native _Test_SetEventsApi(): void;
  static native _Test_List_OnScrollVisibleContentChange(valueArray: byte[], valueSerializerLength: int): void;
  static native _Test_Common_OnChildTouchTest(valueArray: byte[], valueSerializerLength: int): void;
  static native _TestCallIntNoArgs(arg1: int): int
  static native _TestCallIntInt32ArraySum(arg1: int, arg2: int[], arg3: int): int
  static native _TestCallVoidInt32ArrayPrefixSum(arg1: int, arg2: int[], arg3: int): void
  static native _TestCallIntRecursiveCallback(arg1: int, arg2: byte[], arg3: int): int
  static native _TestCallIntMemory(arg1: int, arg2: int): int

  // BasicNodeAPI
  static native _CreateNode(type: int, id: int, flags: int): long
  static native _DisposeNode(ptr: long): void
  static native _ApplyModifierFinish(ptr: long): void
  static native _Dump(nodePtr: long): void
  static native _AddChild(parent: long, child: long): int
  static native _RemoveChild(parent: long, child: long): void
  static native _InsertChildAfter(parent: long, child: long, sibling: long): int
  static native _InsertChildBefore(parent: long, child: long, sibling: long): int
  static native _InsertChildAt(parent: long, child: long, position: int): int
  static native _UnRegisterNodeAsyncEvent(nodePtr: long , kind: int ): void
  static native _RegisterNodeAsyncEventReceiver(eventReceiver: long ): void
  static native _UnRegisterNodeAsyncEventReceiver(): void
  static native _MarkDirty( nodePtr:long,  dirtyFlag:int): void
  static native _IsBuilderNode( nodePtr:long): boolean
  static native _ConvertLengthMetricsUnit(value: float, originUnit: int, targetUnit: int): float

  // ExtendedNodeAPI
  static native _SetCustomCallback(node: long, callbackId: int): void
  static native _MeasureLayoutAndDraw(root: long): void
  static native _MeasureNode(root: long, data: float[]): int
  static native _LayoutNode(root: long, data: float[]): int
  static native _DrawNode(root: long, data: float[]): int

  // setAttachNodePtr
  // getAttachNodePtr

  static native _SetMeasureWidth(root: long, value: int): void
  static native _GetMeasureWidth(root: long): int
  static native _SetMeasureHeight(root: long, value: int): void
  static native _GetMeasureHeight(root: long): int
  static native _SetX(root: long, value: int): void
  static native _GetX(root: long): int
  static native _SetY(root: long, value: int): void
  static native _GetY(root: long): int

  // getLayoutConstraint

  static native _SetAlignment(root: long, value: int): void
  static native _GetAlignment(root: long): int

  static native _IndexerChecker(node: long): int

  static native _SetRangeUpdater(node: long, updaterId: int): void
  static native _SetLazyItemIndexer(node: long, indexerId: int): int

  static native _SetVsyncCallback(long: long, callbackId: int): int
  static native _UnblockVsyncWait(long: long): int


  // _CheckArkoalaEvents -> checkEvent
  static native _CheckEvents(result: int[], count: int): int
  // _SendArkoalaEvent -> sedEvent
  static native _SendEvent(event: int[], count: int): void

  static native _SetChildTotalCount(ptr: long, value: int): void

  // _Dump
  static native _ShowCrash(messagePtr: String): void

  static native _GetPipelineContext(nodePtr: long): long
}