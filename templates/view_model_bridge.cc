namespace ViewModel {
    Ark_NodeHandle createTextNode(Ark_Int32 nodeId);
    Ark_NodeHandle createSpanNode(Ark_Int32 nodeId);
    Ark_NodeHandle createImageSpanNode(Ark_Int32 nodeId);
    Ark_NodeHandle createImageNode(Ark_Int32 nodeId);
    Ark_NodeHandle createToggleNode(Ark_Int32 nodeId);
    Ark_NodeHandle createLoadingProgress(Ark_Int32 nodeId);
    Ark_NodeHandle createTextInputNode(Ark_Int32 nodeId);
    Ark_NodeHandle createStackNode(Ark_Int32 nodeId);
    Ark_NodeHandle createScrollNode(Ark_Int32 nodeId);
    Ark_NodeHandle createListNode(Ark_Int32 nodeId);
    Ark_NodeHandle createSwiperNode(Ark_Int32 nodeId);
    Ark_NodeHandle createTextAreaNode(Ark_Int32 nodeId);
    Ark_NodeHandle createButtonNode(Ark_Int32 nodeId);
    Ark_NodeHandle createProgressNode(Ark_Int32 nodeId);
    Ark_NodeHandle createCheckBoxNode(Ark_Int32 nodeId);
    Ark_NodeHandle createColumnNode(Ark_Int32 nodeId);
    Ark_NodeHandle createRowNode(Ark_Int32 nodeId);
    Ark_NodeHandle createFlexNode(Ark_Int32 nodeId);
    Ark_NodeHandle createListItemNode(Ark_Int32 nodeId);
    Ark_NodeHandle createRefreshNode(Ark_Int32 nodeId);
    Ark_NodeHandle createRootNode(Ark_Int32 nodeId);
    Ark_NodeHandle createComponentRootNode(Ark_Int32 nodeId);
#ifdef XCOMPONENT_SUPPORTED
    Ark_NodeHandle createXComponentNode(Ark_Int32 nodeId);
#endif
    Ark_NodeHandle createListItemGroupNode(Ark_Int32 nodeId);
    Ark_NodeHandle createSliderNode(Ark_Int32 nodeId);
    Ark_NodeHandle createCanvasNode(Ark_Int32 nodeId);
    Ark_NodeHandle createDatePickerNode(Ark_Int32 nodeId);
    Ark_NodeHandle createTimePickerNode(Ark_Int32 nodeId);
    Ark_NodeHandle createTextPickerNode(Ark_Int32 nodeId);
    Ark_NodeHandle createCalendarPickerNode(Ark_Int32 nodeId);
    Ark_NodeHandle createCustomNode(Ark_Int32 nodeId);
    Ark_NodeHandle createNavigationNode(Ark_Int32 nodeId);
    Ark_NodeHandle createWaterFlowNode(Ark_Int32 nodeId);
    Ark_NodeHandle createFlowItemNode(Ark_Int32 nodeId);
    Ark_NodeHandle createCircleNode(Ark_Int32 nodeId);
    Ark_NodeHandle createRelativeContainerNode(Ark_Int32 nodeId);
    Ark_NodeHandle createGridNode(Ark_Int32 nodeId);
    Ark_NodeHandle createTabsNode(Ark_Int32 nodeId);
    Ark_NodeHandle createGridItemNode(Ark_Int32 nodeId);
    Ark_NodeHandle createBlankNode(Ark_Int32 nodeId);
    Ark_NodeHandle createDividerNode(Ark_Int32 nodeId);
    Ark_NodeHandle createAlphabetIndexerNode(Ark_Int32 nodeId);
    Ark_NodeHandle createSearchNode(Ark_Int32 nodeId);
    Ark_NodeHandle createGridRowNode(Ark_Int32 nodeId);
    Ark_NodeHandle createGridColNode(Ark_Int32 nodeId);
    Ark_NodeHandle createRadioNode(Ark_Int32 nodeId);
    Ark_NodeHandle createTabContentNode(Ark_Int32 nodeId);
    Ark_NodeHandle createQRCodeNode(Ark_Int32 nodeId);

    void SetCallbackMethod(ArkUIAPICallbackMethod* method);
} // namespace ViewModel

using FrameNodeCreator = Ark_NodeHandle(Ark_Int32 nodeId);

namespace Bridge {
    Ark_NodeHandle CreateNode(%CPP_PREFIX%Ark_NodeType type, Ark_Int32 id, Ark_Int32 flags)
    {
        if (id == %CPP_PREFIX%ARKUI_AUTO_GENERATE_NODE_ID) {
            id = ElementRegister::GetInstance()->MakeUniqueId();
        }

        switch (type) {
            case %CPP_PREFIX%ARKUI_ROOT: return ViewModel::createRootNode(id);
%CREATE_NODE_SWITCH%
            default: return nullptr;
        }
    }

    void SetCallbackMethod(%CPP_PREFIX%Ark_APICallbackMethod* method)
    {
        ViewModel::SetCallbackMethod(reinterpret_cast<ArkUIAPICallbackMethod*>(method));
    }
}