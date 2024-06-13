
    // BasicNodeAPI
    _CreateNode(type: KInt, id: KInt, flags: KInt): NodePointer
    _DisposeNode(ptr: NodePointer): void
    _ApplyModifierFinish(ptr: NodePointer): void

    // getUtilsModifier
    // getCanvasRenderingContext2DModifier

    // setCallbackMethod
    // setCustomMethodFlag

    // registerCutomNodeAsyncEvent
    // unregisterCustomNodeAsyncEvent
    // registerCustomNodeAsyncEventReceiver

    // ExtendedNodeAPI
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


    // _CheckArkoalaEvents -> checkEvent
    _CheckEvents(result: KInt32ArrayPtr, count: KInt): KInt
    // _SendArkoalaEvent -> sedEvent
    _SendEvent(event: KInt32ArrayPtr, count: KInt): void

    _SetChildTotalCount(ptr: NodePointer, value: KInt): void

    // _Dump
    _ShowCrash(messagePtr: KStringPtr): void

}