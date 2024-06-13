
// BasicNodeAPI
_CreateNode(type: KInt, id: KInt, flags: KInt): NodePointer { return nullptr }
_DisposeNode(ptr: NodePointer): void {}
_ApplyModifierFinish(ptr: NodePointer): void {}

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
}