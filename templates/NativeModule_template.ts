import { NativeModuleEmpty } from "./NativeModuleEmpty"
import {
  NativeStringBase,
  providePlatformDefinedData,
  nullptr,
  Access,
  withByteArray,
  CallbackRegistry,
  ArrayDecoder,
} from "@koalaui/interop"
import { callCallback } from "@koalaui/interop"

export type NodePointer = pointer
export type PipelineContext = pointer

let theModule: NativeModule | undefined = undefined

declare const LOAD_NATIVE: NativeModule

export function nativeModule(): NativeModule {
    if (theModule) return theModule
    if (%USE_EMPTY%)
        theModule = new NativeModuleEmpty()
    else
        theModule = LOAD_NATIVE as NativeModule
    if (!theModule)
        throw new Error("Cannot load native module")
    theModule._SetCallbackDispatcher(callCallback)
    return theModule
}

class NativeString extends NativeStringBase {
    constructor(ptr: KPointer) {
        super(ptr)
    }
    protected bytesLength(): int32 {
        return nativeModule()._StringLength(this.ptr)
    }
    protected getData(data: Uint8Array): void {
        withByteArray(data, Access.WRITE, (dataPtr: KUint8ArrayPtr) => {
            nativeModule()._StringData(this.ptr, dataPtr, data.length)
        })
    }
    close(): void {
        nativeModule()._InvokeFinalizer(this.ptr, nativeModule()._GetStringFinalizer())
        this.ptr = nullptr
    }
}

providePlatformDefinedData({
    nativeString(ptr: KPointer): NativeStringBase { return new NativeString(ptr) },
    nativeStringArrayDecoder(): ArrayDecoder<NativeStringBase> { throw new Error("Not implemented") },
    callbackRegistry(): CallbackRegistry | undefined { return undefined }
})

export interface InteropOps {
    _SetCallbackDispatcher(dispatcher: (id: int32, args: Uint8Array, length: int32) => int32): void
    _CleanCallbackDispatcher(): void

    _GetGroupedLog(index: KInt): KPointer
    _StartGroupedLog(index: KInt): void
    _StopGroupedLog(index: KInt): void
    _GetStringFinalizer(): KPointer
    _InvokeFinalizer(ptr: KPointer, finalizer: KPointer): void
    _GetNodeFinalizer(): KPointer
    _StringLength(ptr: KPointer): KInt
    _StringData(ptr: KPointer, buffer: KUint8ArrayPtr, length: KInt): void
    _StringMake(value: KStringPtr): KPointer
    _ManagedStringWrite(value: KStringPtr, buffer: KUint8ArrayPtr, offset: KInt): KInt
    _Test_SetEventsApi(): void
    _Test_Common_OnChildTouchTest(valueArray: Uint8Array, valueSerializerLength: KInt): void
    _Test_List_OnScrollVisibleContentChange(valueArray: Uint8Array, valueSerializerLength: KInt): void
    _Test_TextPicker_OnAccept(valueArray: Uint8Array, valueSerializerLength: KInt): void
    _TestPerfNumber(value: KInt): KInt
    _TestPerfNumberWithArray(value: KUint8ArrayPtr, length: KInt): void
    _StartPerf(traceName: KStringPtr): void
    _EndPerf(traceName: KStringPtr): void
    _DumpPerf(options: KInt): KPointer
}

export interface GraphicsOps {
    // TODO fill me if needed
}

export interface NodeOps {
    _CreateNode(type: KInt, id: KInt, flags: KInt): NodePointer
    _GetNodeByViewStack(): NodePointer
    _DisposeNode(ptr: NodePointer): void

    _AddChild(parent: NodePointer, child: NodePointer): KInt
    _RemoveChild(parent: NodePointer, child: NodePointer): void
    _InsertChildAfter(parent: NodePointer, child: NodePointer, sibling: NodePointer): KInt
    _InsertChildBefore(parent: NodePointer, child: NodePointer, sibling: NodePointer): KInt
    _InsertChildAt(parent: NodePointer, child: NodePointer,  position: KInt): KInt
    _ApplyModifierFinish(ptr: NodePointer): void
    _MarkDirty(ptr: NodePointer, flag: KUInt): void
    _IsBuilderNode(ptr: NodePointer): KBoolean
    _ConvertLengthMetricsUnit(value: KFloat, originUnit: KInt, targetUnit: KInt): KFloat
    // #endregion

    // getUtilsModifier
    // getCanvasRenderingContext2DModifier

    // setCallbackMethod
    // setCustomMethodFlag

    // registerCustomNodeAsyncEvent
    // unregisterCustomNodeAsyncEvent
    // registerCustomNodeAsyncEventReceiver

    // #region EXTENDED NODE
    _SetCustomCallback(node: NodePointer, callbackId: KInt): void
    _MeasureLayoutAndDraw(root: NodePointer): void
    _MeasureNode(root: NodePointer, data: KFloat32ArrayPtr): KInt
    _LayoutNode(root: NodePointer, data: KFloat32ArrayPtr): KInt
    _DrawNode(root: NodePointer, data: KFloat32ArrayPtr): KInt

    // setAttachNodePtr
    // getAttachNodePtr

    _SetMeasureWidth(root: NodePointer, value: KInt): void
    _GetMeasureWidth(root: NodePointer): KInt
    _SetMeasureHeight(root: NodePointer, value: KInt): void
    _GetMeasureHeight(root: NodePointer): KInt
    _SetX(root: NodePointer, value: KInt): void
    _GetX(root: NodePointer): KInt
    _SetY(root: NodePointer, value: KInt): void
    _GetY(root: NodePointer): KInt

    // getLayoutConstraint

    _SetAlignment(root: NodePointer, value: KInt): void
    _GetAlignment(root: NodePointer): KInt

    _IndexerChecker(node: NodePointer): KInt

    _SetRangeUpdater(node: NodePointer, updaterId: KInt): void
    _SetLazyItemIndexer(node: NodePointer, indexerId: KInt): KInt

    _GetPipelineContext(nodePtr:NodePointer): PipelineContext

    _SetVsyncCallback(pipelineContext: PipelineContext, callbackId: KInt): KInt
    _UnblockVsyncWait(pipelineContext: PipelineContext): KInt

    _SetChildTotalCount(ptr: NodePointer, value: KInt): void
    _ShowCrash(messagePtr: KStringPtr): void
}

export interface ComponentOps {
%GENERATED_METHODS%
}

export interface TestOps {
    _TestCallIntNoArgs(arg1: KInt): KInt
    _TestCallIntInt32ArraySum(arg1: KInt, arg2: Int32Array, arg3: KInt): KInt
    _TestCallVoidInt32ArrayPrefixSum(arg1: KInt, arg2: Int32Array, arg3: KInt): void
}

export interface NativeModuleIntegrated extends InteropOps, /*GraphicsOps, NodeOps,*/ ComponentOps {}
export interface NativeModule extends InteropOps, GraphicsOps, NodeOps, ComponentOps, TestOps {}