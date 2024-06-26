export class NativeModuleEmptyIntegrated extends NativeModuleBase implements NativeModuleIntegrated {
%GENERATED_EMPTY_METHODS%
}

export class NativeModuleEmpty extends NativeModuleBase implements NativeModule {
%GENERATED_EMPTY_METHODS%
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
}