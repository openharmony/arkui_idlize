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
import { int32 } from "@koalaui/common"
import { KInt, KPointer, KStringPtr, KUint8ArrayPtr } from "@koalaui/interop"

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

  static callCallbackFromNative(id: KInt, args: KUint8ArrayPtr, length: KInt): KInt {
    return callCallback(id, args, length)
  }

  static native _LoadVirtualMachine(vmKind: int, appClassPath: String, appLibPath: String): int;
  static native _StartApplication(): int;
  static native _RunApplication(arg0: int, arg1: int): int;

%GENERATED_METHODS%

  static native _StringLength(arg1: long): KInt;
  static native _StringData(arg1: long, arg2: KUint8ArrayPtr, arg3: KInt): void;
  static native _StringMake(arg1: String): long;
  static native _ManagedStringWrite(value: String, arg1: KUint8ArrayPtr, arg2: KInt): KInt;
  static native _GetStringFinalizer(): long;
  static native _InvokeFinalizer(arg1: long, arg2: long): void;
  static native _GetNodeFinalizer(): long;
  static native _GetPtrVectorSize(arg1: long): KInt;
  static native _GetPtrVectorElement(arg1: long, arg2: KInt): long;
  static native _GetGroupedLog(arg1: KInt): long;
  static native _StartGroupedLog(arg1: KInt): void;
  static native _StopGroupedLog(arg1: KInt): void;
  static native _StartPerf(traceName: String): void;
  static native _EndPerf(traceName: String): void;
  static native _DumpPerf(options: KInt): long;
  static native _GetNodeByViewStack(): long;

  static native _TestPerfNumber(arg1: KInt): KInt;
  static native _TestPerfNumberWithArray(arg1: KUint8ArrayPtr, arg2: KInt): void;
  static native _Test_TextPicker_OnAccept(valueArray: KUint8ArrayPtr, valueSerializerLength: KInt): void;
  static native _Test_SetEventsApi(): void;
  static native _Test_List_OnScrollVisibleContentChange(valueArray: KUint8ArrayPtr, valueSerializerLength: KInt): void;
  static native _Test_Common_OnChildTouchTest(valueArray: KUint8ArrayPtr, valueSerializerLength: KInt): void;
  static native _TestCallIntNoArgs(arg1: KInt): KInt
  static native _TestCallIntIntArraySum(arg1: KInt, arg2: KInt[], arg3: KInt): KInt
  static native _TestCallVoidIntArrayPrefixSum(arg1: KInt, arg2: KInt[], arg3: KInt): void
  static native _TestCallIntRecursiveCallback(arg1: KInt, arg2: KUint8ArrayPtr, arg3: KInt): KInt
  static native _TestCallIntMemory(arg1: KInt, arg2: KInt): KInt

  static native _SetCreateNodeDelay(type: KInt, nanoseconds: long): void
  static native _SetMeasureNodeDelay(type: KInt, nanoseconds: long): void
  static native _SetLayoutNodeDelay(type: KInt, nanoseconds: long): void
  static native _SetDrawNodeDelay(type: KInt, nanoseconds: long): void

  // BasicNodeAPI
  static native _CreateNode(type: KInt, id: KInt, flags: KInt): long
  static native _DisposeNode(ptr: long): void
  static native _DumpTreeNode(ptr: long): void
  static native _ApplyModifierFinish(ptr: long): void
  static native _Dump(nodePtr: long): void
  static native _AddChild(parent: long, child: long): KInt
  static native _RemoveChild(parent: long, child: long): void
  static native _InsertChildAfter(parent: long, child: long, sibling: long): KInt
  static native _InsertChildBefore(parent: long, child: long, sibling: long): KInt
  static native _InsertChildAt(parent: long, child: long, position: KInt): KInt
  static native _UnRegisterNodeAsyncEvent(nodePtr: long , kind: KInt ): void
  static native _RegisterNodeAsyncEventReceiver(eventReceiver: long ): void
  static native _UnRegisterNodeAsyncEventReceiver(): void
  static native _MarkDirty( nodePtr:long,  dirtyFlag:int): void
  static native _IsBuilderNode( nodePtr:long): boolean
  static native _ConvertLengthMetricsUnit(value: float, originUnit: KInt, targetUnit: KInt): float

  // ExtendedNodeAPI
  static native _SetCustomCallback(node: long, callbackId: KInt): void
  static native _MeasureLayoutAndDraw(root: long): void
  static native _MeasureNode(root: long, data: float[]): KInt
  static native _LayoutNode(root: long, data: float[]): KInt
  static native _DrawNode(root: long, data: float[]): KInt

  // setAttachNodePtr
  // getAttachNodePtr

  static native _SetMeasureWidth(root: long, value: KInt): void
  static native _GetMeasureWidth(root: long): KInt
  static native _SetMeasureHeight(root: long, value: KInt): void
  static native _GetMeasureHeight(root: long): KInt
  static native _SetX(root: long, value: KInt): void
  static native _GetX(root: long): KInt
  static native _SetY(root: long, value: KInt): void
  static native _GetY(root: long): KInt

  // getLayoutConstraint

  static native _SetAlignment(root: long, value: KInt): void
  static native _GetAlignment(root: long): KInt

  static native _IndexerChecker(node: long): KInt

  static native _SetRangeUpdater(node: long, updaterId: KInt): void
  static native _SetLazyItemIndexer(node: long, indexerId: KInt): KInt

  static native _SetVsyncCallback(long: long, callbackId: KInt): KInt
  static native _UnblockVsyncWait(long: long): int

  // _CheckArkoalaEvents -> checkEvent
  static native _CheckEvents(result: KUint8ArrayPtr, count: KInt): KInt
  // _SendArkoalaEvent -> sedEvent
  static native _SendEvent(event: KUint8ArrayPtr, count: KInt): void

  static native _SetChildTotalCount(ptr: long, value: KInt): void

  // _Dump
  static native _ShowCrash(messagePtr: String): void

  static native _GetPipelineContext(nodePtr: long): long
}