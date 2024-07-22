export class NativeModuleEmptyIntegrated implements NativeModuleIntegrated {
%GENERATED_EMPTY_METHODS%
    _SetCallbackDispatcher(dispatcher: (id: int32, args: Uint8Array, length: int32) => int32): void {
        throw new Error("_SetCallbackDispatcher")
    }
    _CleanCallbackDispatcher(): void {
        throw new Error("_CleanCallbackDispatcher")
    }
    _GetGroupedLog(index: KInt): KPointer {
        throw new Error("_GetResultString")
    }
    _StartGroupedLog(index: KInt): void  {
        throw new Error("_StartGroupedLog")
    }
    _StopGroupedLog(index: KInt): void  {
        throw new Error("_StopGroupedLog")
    }
    _GetStringFinalizer(): KPointer  {
        throw new Error("_GetStringFinalizer")
    }
    _InvokeFinalizer(ptr: KPointer, finalizer: KPointer): void  {
        throw new Error("_InvokeFinalizer")
    }
    _GetNodeFinalizer(): KPointer  {
        throw new Error("_InvokeFinalizer")
    }
    _StringLength(ptr: KPointer): KInt  {
        throw new Error("_StringLength")
    }
    _StringData(ptr: KPointer, buffer: KUint8ArrayPtr, length: KInt): void  {
        throw new Error("_StringLength")
    }
    _StringMake(value: KStringPtr): KPointer {
        throw new Error("_StringMake")
    }
    _ManagedStringWrite(value: KStringPtr, buffer: KUint8ArrayPtr, offset: KInt): KInt {
        throw new Error("_ManagedStringWrite")
    }
    _Test_SetEventsApi(): void {
        throw new Error("_Test_Common_OnChildTouchTest")
    }
    _Test_Common_OnChildTouchTest(valueArray: Uint8Array, valueSerializerLength: KInt): void {
        throw new Error("_Test_Common_OnChildTouchTest")
    }
    _Test_List_OnScrollVisibleContentChange(valueArray: Uint8Array, valueSerializerLength: KInt): void {
        throw new Error("_Test_List_OnScrollVisibleContentChange")
    }
    _Test_TextPicker_OnAccept(valueArray: Uint8Array, valueSerializerLength: KInt): void {
        throw new Error("_Test_TextPicker_OnAccept")
    }
    _TestPerfNumber(value: KInt): KInt { return 0 }
    _TestPerfNumberWithArray(value: KUint8ArrayPtr, length: KInt): void {}
    _StartPerf(traceName: KStringPtr): void {}
    _EndPerf(traceName: KStringPtr): void {}
    _DumpPerf(options: KInt): KPointer { return 0 }
}

export class NativeModuleEmpty extends NativeModuleEmptyIntegrated implements NativeModule {
    // BasicNodeAPI
    _CreateNode(type: KInt, id: KInt, flags: KInt): NodePointer { return nullptr }
    _GetNodeByViewStack(): NodePointer { return nullptr }
    _DisposeNode(ptr: NodePointer): void {}
    _AddChild(parent: NodePointer, child: NodePointer): KInt { return 0 }
    _RemoveChild(parent: NodePointer, child: NodePointer): void {}
    _InsertChildAfter(parent: NodePointer, child: NodePointer, sibling: NodePointer): KInt { return 0 }
    _InsertChildBefore(parent: NodePointer, child: NodePointer, sibling: NodePointer): KInt { return 0 }
    _InsertChildAt(parent: NodePointer, child: NodePointer,  position: KInt): KInt { return 0 }
    _ApplyModifierFinish(ptr: NodePointer): void {}
    _MarkDirty(ptr: NodePointer, flag: KUInt): void {}
    _IsBuilderNode(ptr: NodePointer): KBoolean { return 0 }
    _ConvertLengthMetricsUnit(value: KFloat, originUnit: KInt, targetUnit: KInt): KFloat { return 0 }

    // ExtendedNodeAPI
    _SetCustomCallback(node: NodePointer, callbackId: KInt): void {}
    _MeasureLayoutAndDraw(root: NodePointer): void {}
    _MeasureNode(root: NodePointer, data: KFloat32ArrayPtr): KInt { return -1 }
    _LayoutNode(root: NodePointer, data: KFloat32ArrayPtr): KInt { return -1 }
    _DrawNode(root: NodePointer, data: KFloat32ArrayPtr): KInt { return -1 }
    _SetMeasureWidth(root: NodePointer, value: KInt): void {}
    _GetMeasureWidth(root: NodePointer): KInt { return -1 }
    _SetMeasureHeight(root: NodePointer, value: KInt): void {}
    _GetMeasureHeight(root: NodePointer): KInt { return -1 }
    _SetX(root: NodePointer, value: KInt): void {}
    _GetX(root: NodePointer): KInt{ return -1 }
    _SetY(root: NodePointer, value: KInt): void {}
    _GetY(root: NodePointer): KInt { return -1 }
    _SetAlignment(root: NodePointer, value: KInt): void {}
    _GetAlignment(root: NodePointer): KInt { return -1 }

    _IndexerChecker(node: NodePointer): KInt { return -1 }

    _SetRangeUpdater(node: NodePointer, updaterId: KInt): void {}
    _SetLazyItemIndexer(node: NodePointer, indexerId: KInt): KInt { return -1 }


    _GetPipelineContext(nodePtr: NodePointer): PipelineContext { return 0 }
    _SetVsyncCallback(pipelineContext: PipelineContext, callbackId: KInt): KInt { return -1 }
    _UnblockVsyncWait(pipelineContext: PipelineContext): KInt { return -1 }

    _CheckEvents(result: KInt32ArrayPtr, count: KInt): KInt { return -1 }
    _SendEvent(event: KInt32ArrayPtr, count: KInt): void {}

    _SetChildTotalCount(ptr: NodePointer, value: KInt): void {}

    _ShowCrash(messagePtr: KStringPtr): void {}

    _TestCallIntNoArgs(arg1: KInt): KInt { return -1 }
    _TestCallIntInt32ArraySum(arg1: KInt, arg2: Int32Array, arg3: KInt): KInt { return -1 }
    _TestCallVoidInt32ArrayPrefixSum(arg1: KInt, arg2: Int32Array, arg3: KInt): void {}
    _TestCallIntRecursiveCallback(arg1: KInt, arg2: Uint8Array, arg3: KInt): KInt { return -1 }
    _TestCallIntMemory(arg1: KInt, arg2: KInt): KInt { return -1 }

    _LoadVirtualMachine(classPath: string, libPath: string, kind: KInt): pointer { throw new Error("unsupported") }
    _RunVirtualMachine(env: pointer, what: KInt): KInt { throw new Error("unsupported") }
}