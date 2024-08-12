
Ark_Float32 GetDensity(Ark_Int32 deviceId);
Ark_Float32 GetFontScale(Ark_Int32 deviceId);
Ark_Float32 GetDesignWidthScale(Ark_Int32 deviceId);

namespace NodeEvent {
    int CheckEvent(ArkUINodeEvent* event);
    void SendArkUIAsyncEvent(ArkUINodeEvent* event);
}
namespace ApiImpl {
    // Basic API
    Ark_NodeHandle GetNodeByViewStack();
    void DisposeNode(Ark_NodeHandle node);
    void DumpTreeNode(ArkUINodeHandle node);
    Ark_Int32 AddChild(Ark_NodeHandle parent, Ark_NodeHandle child);
    void RemoveChild(Ark_NodeHandle parent, Ark_NodeHandle child);
    Ark_Int32 InsertChildAfter(Ark_NodeHandle parent, Ark_NodeHandle child, Ark_NodeHandle sibling);
    Ark_Int32 InsertChildBefore(Ark_NodeHandle parent, Ark_NodeHandle child, Ark_NodeHandle sibling);
    Ark_Int32 InsertChildAt(Ark_NodeHandle parent, Ark_NodeHandle child, Ark_Int32 position);
    void ApplyModifierFinish(Ark_NodeHandle node);
    void MarkDirty(Ark_NodeHandle node, Ark_UInt32 flag);
    Ark_Boolean IsBuilderNode(Ark_NodeHandle node);
    Ark_Float32 ConvertLengthMetricsUnit(Ark_Float32 value, Ark_Int32 originUnit, Ark_Int32 targetUnit);

    // Extended API
    void SetCustomMethodFlag(Ark_NodeHandle node, Ark_Int32 flag);
    Ark_Int32 GetCustomMethodFlag(Ark_NodeHandle node);
    void RegisterCustomNodeAsyncEvent(Ark_NodeHandle node, Ark_Int32 eventType, void* extraParam);
    Ark_Int32 UnregisterCustomNodeEvent(Ark_NodeHandle node, Ark_Int32 eventType);
    void RegisterCustomNodeEventReceiver(CustomEventReceiver eventReceiver);
    void SetCustomCallback(Ark_VMContext context, Ark_NodeHandle node, Ark_Int32 callback);
    Ark_Int32 MeasureLayoutAndDraw(Ark_VMContext vmContext, Ark_NodeHandle rootPtr);
    Ark_Int32 MeasureNode(Ark_VMContext vmContext, Ark_NodeHandle node, Ark_Float32* data);
    Ark_Int32 LayoutNode(Ark_VMContext vmContext, Ark_NodeHandle node, Ark_Float32 (*data)[2]);
    Ark_Int32 DrawNode(Ark_VMContext vmContext, Ark_NodeHandle node, Ark_Float32* data);
    void SetAttachNodePtr(Ark_NodeHandle node, void* value);
    void* GetAttachNodePtr(Ark_NodeHandle node);
    void SetMeasureWidth(Ark_NodeHandle node, Ark_Int32 value);
    Ark_Int32 GetMeasureWidth(Ark_NodeHandle node);
    void SetMeasureHeight(Ark_NodeHandle node, Ark_Int32 value);
    Ark_Int32 GetMeasureHeight(Ark_NodeHandle node);
    void SetX(Ark_NodeHandle node, Ark_Int32 value);
    void SetY(Ark_NodeHandle node, Ark_Int32 value);
    Ark_Int32 GetX(Ark_NodeHandle node);
    Ark_Int32 GetY(Ark_NodeHandle node);
    void SetAlignment(Ark_NodeHandle node, Ark_Int32 value);
    Ark_Int32 GetAlignment(Ark_NodeHandle node);
    void GetLayoutConstraint(Ark_NodeHandle node, Ark_Int32* value);
    Ark_Int32 IndexerChecker(Ark_VMContext vmContext, Ark_NodeHandle nodePtr);
    void SetRangeUpdater(Ark_NodeHandle nodePtr, Ark_Int32 updaterId);
    void SetLazyItemIndexer(Ark_VMContext vmContext, Ark_NodeHandle nodePtr, Ark_Int32 indexerId);
    Ark_PipelineContext GetPipelineContext(Ark_NodeHandle node);
    void SetVsyncCallback(Ark_VMContext vmContext, Ark_PipelineContext pipelineContext, Ark_Int32 callbackId);
    void UnblockVsyncWait(Ark_VMContext vmContext, Ark_PipelineContext pipelineContext);
    void CallContinuation(Ark_Int32 continuationId, Ark_Int32 argCount, ArkUIEventCallbackArg* args);
    void SetChildTotalCount(Ark_NodeHandle node, Ark_Int32 totalCount);
    void ShowCrash(Ark_CharPtr message);
} // namespace OHOS::Ace::NG::ApiImpl

namespace Bridge {
    Ark_NodeHandle CreateNode(%CPP_PREFIX%Ark_NodeType type, Ark_Int32 id, Ark_Int32 flags);
    void SetCallbackMethod(%CPP_PREFIX%Ark_APICallbackMethod* method);
    void RegisterCustomNodeEventReceiver(%CPP_PREFIX%CustomEventReceiver eventReceiver)
    {
        ApiImpl::RegisterCustomNodeEventReceiver(reinterpret_cast<CustomEventReceiver>(eventReceiver));
    }
    int CheckEvent(%CPP_PREFIX%Ark_NodeEvent* event)
    {
        return NodeEvent::CheckEvent(reinterpret_cast<ArkUINodeEvent*>(event));
    }
    void SendAsyncEvent(%CPP_PREFIX%Ark_NodeEvent* event)
    {
        NodeEvent::SendArkUIAsyncEvent(reinterpret_cast<ArkUINodeEvent*>(event));
    }
    void CallContinuation(Ark_Int32 continuationId, Ark_Int32 argCount, %CPP_PREFIX%Ark_EventCallbackArg* args)
    {
        ApiImpl::CallContinuation(continuationId, argCount, reinterpret_cast<ArkUIEventCallbackArg*>(args));
    }
}

namespace GeneratedEvents {
    const %CPP_PREFIX%ArkUIEventsAPI* %CPP_PREFIX%GetArkUiEventsAPI();
    void %CPP_PREFIX%SetArkUiEventsAPI(const %CPP_PREFIX%ArkUIEventsAPI* api);
}
