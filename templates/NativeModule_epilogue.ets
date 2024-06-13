    // BasicNodeAPI
    static native _CreateNode(type: int, id: int, flags: int): long
    static native _DisposeNode(ptr: long): void
    static native _ApplyModifierFinish(ptr: long): void

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

    static native _GetPipelineContext(nodePtr:long): long
    static native _SetVsyncCallback(long: long, callbackId: int): int
    static native _UnblockVsyncWait(long: long): int


    // _CheckArkoalaEvents -> checkEvent
    static native _CheckEvents(result: int[], count: int): int
    // _SendArkoalaEvent -> sedEvent
    static native _SendEvent(event: int[], count: int): void

    static native _SetChildTotalCount(ptr: long, value: int): void

    // _Dump
    static native _ShowCrash(messagePtr: String): void

    static native _GetPipelineContext(nodePtr: long ): long
}