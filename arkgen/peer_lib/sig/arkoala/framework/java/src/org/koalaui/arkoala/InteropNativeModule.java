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

public class InteropNativeModule {
    static int callCallbackFromNative(int id, byte[] args, int length) {
        throw new Error("implement callCallbackFromNative()");
    }

    // interop
    static native long   _GetGroupedLog(int index);
    static native void   _StartGroupedLog(int index);
    static native void   _StopGroupedLog(int index);
    static native void   _PrintGroupedLog(int index);
    static native void   _AppendGroupedLog(int index, String message);
    static native long   _GetStringFinalizer();
    static native void   _InvokeFinalizer(long ptr1, long ptr2);
    static native long   _GetPtrVectorElement(long ptr1, int arg);
    static native int    _StringLength(long ptr1);
    static native void   _StringData(long ptr1, byte[] arr, int i);
    static native byte[] _StringDataBytes(long ptr1);
    static native long   _StringMake(String str1);
    static native int    _GetPtrVectorSize(long ptr1);
    static native int    _ManagedStringWrite(String str1, byte[] arr, int arg);
    static native void   _NativeLog(String str1);
    static native String _Utf8ToString(byte[] data, int offset, int length);
    static native String _StdStringToString(long ptr1);
    static native byte[] _RawReturnData(int length, int filler);

    static native void   _CallCallback(int callbackKind, byte[] args, int argsSize);
    static native void   _CallCallbackSync(int callbackKind, byte[] args, int argsSize);
    static native void   _CallCallbackResourceHolder(long holder, int resourceId);
    static native void   _CallCallbackResourceReleaser(long releaser, int resourceId);
    static native int    _CallForeignVM(long context, int kind, byte[] data, int length);
    static native int    _CheckCallbackEvent(byte[] data, int length);
    static native void   _ReleaseCallbackResource(int id);
    static native void   _HoldCallbackResource(int id);

    // loader
    static native int     _LoadVirtualMachine(int arg0, String arg1, String arg2);
    static native boolean _RunApplication(int arg0, int arg1);
    static native long    _StartApplication(String appUrl, String appParams);
    static native String  _EmitEvent(int type, int target, int arg0, int arg1);
    static native void    _RestartWith(String page);
}

