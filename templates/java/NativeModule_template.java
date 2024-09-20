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

package org.koalaui.arkoala;

public class NativeModule {
  static {
    Runtime.getRuntime().loadLibrary("NativeBridgeJni");
  }

  static int callCallbackFromNative(int id, byte[] args, int length) {
    throw new Error("implement callCallbackFromNative()");
  }

%GENERATED_METHODS%

  static native long _StringMake(String string);
  static native int _StringLength(long ptr);
  static native void _StringData(long ptr, byte[] arg1, int arg2);
  static native long _GetStringFinalizer();
  static native int _GetPtrVectorSize(long ptr);
  static native long _GetGroupedLog(int kind);
  static native long _GetPtrVectorElement(long ptr, int index);
  static native void _InvokeFinalizer(long func, long obj);
  static native long _GetNodeFinalizer();
  static native void _StartGroupedLog(int index);
  static native void _StopGroupedLog(int index);
  static native int _TestPerfNumber(int value);
  static native void _TestPerfNumberWithArray(byte[] data, int length);
  static native void _StartPerf(String traceName);
  static native void _EndPerf(String traceName);
  static native long _DumpPerf(int options);
  static native int _ManagedStringWrite(String string, byte[] buffer, int offset);
  static native void _Test_SetEventsApi();
  static native void _Test_Common_OnChildTouchTest(byte[] valueArray, int valueSerializerLength);
  static native void _Test_List_OnScrollVisibleContentChange(byte[] valueArray, int valueSerializerLength);
  static native void _Test_TextPicker_OnAccept(byte[] valueArray, int valueSerializerLength);
  static native int _TestCallIntNoArgs(int arg);
  static native int _TestCallIntIntArraySum(int arg1, int[] arg2, int arg3);
  static native void _TestCallVoidIntArrayPrefixSum(int arg1, int[] arg2, int arg3);
  static native int _TestCallIntRecursiveCallback(int arg1, byte[] arg2, int arg3);
  static native int _TestCallIntMemory(int arg1, int arg2);
  static native int _CallExternalAPI(long env, int what, byte[] buffer, int length);

  static native void _SetCreateNodeDelay(int type, long nanoseconds);
  static native void _SetMeasureNodeDelay(int type, long nanoseconds);
  static native void _SetLayoutNodeDelay(int type, long nanoseconds);
  static native void _SetDrawNodeDelay(int type, long nanoseconds);

  static native long _CreateNode(int type, int id, int flags);
  static native long _GetNodeByViewStack();
  static native void _DisposeNode(long nodePtr);
  static native void _DumpTreeNode(long nodePtr);
  static native int _AddChild(long parent, long child);
  static native void _RemoveChild(long parent, long child);
  static native int _InsertChildAfter(long parent, long child, long sibling);
  static native int _InsertChildBefore(long parent, long child, long sibling);
  static native int _InsertChildAt(long parent, long child, int position);
  // static native void _RegisterNodeAsyncEvent(long nodePtr, int kind, long extraParam);
  static native void _UnRegisterNodeAsyncEvent(long nodePtr, int kind);
  static native void _RegisterNodeAsyncEventReceiver(long eventReceiver);
  static native void _UnRegisterNodeAsyncEventReceiver();
  static native void _ApplyModifierFinish(long nodePtr);
  static native void _MarkDirty(long nodePtr, int dirtyFlag);
  static native boolean _IsBuilderNode(long nodePtr);
  static native void _MeasureLayoutAndDraw(long nodePtr);
  static native int _MeasureNode(long nodePtr, float[] data);
  static native int _LayoutNode(long nodePtr, float[] data);
  static native int _DrawNode(long nodePtr, float[] data);
  static native int _IndexerChecker(long nodePtr);
  static native void _SetLazyItemIndexer(long nodePtr, int indexerId);
  static native void _SetCustomCallback(long nodePtr, int updaterId);
  static native void _SetMeasureWidth(long nodePtr, int value);
  static native int _GetMeasureWidth(long nodePtr);
  static native void _SetMeasureHeight(long nodePtr, int value);
  static native int _GetMeasureHeight(long nodePtr);
  static native void _SetX(long nodePtr, int value);
  static native int _GetX(long nodePtr);
  static native void _SetY(long nodePtr, int value);
  static native int _GetY(long nodePtr);
  static native void _SetAlignment(long nodePtr, int value);
  static native int _GetAlignment(long nodePtr);
  static native void _SetRangeUpdater(long nodePtr, int updaterId);

  static native void _SetChildTotalCount(long nodePtr, int totalCount);

  static native void _ShowCrash(String message);

  static native long _GetPipelineContext(long nodePtr);
  static native void _SetVsyncCallback(long pipelineContext, int callbackId);
  static native void _UnblockVsyncWait(long pipelineContext);
  static native float _ConvertLengthMetricsUnit(float value, int originUnit, int targetUnit);

  static native int _LoadVirtualMachine(int vmKind, String appClassPath, String appLibPath);
  static native int _StartApplication();
  static native int _RunApplication(int arg0, int arg1);
  static native void _StartNativeTest(String testName, int index);
  static native void _StopNativeTest(int index);
}
