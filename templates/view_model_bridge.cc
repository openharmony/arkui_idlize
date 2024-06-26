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

  void SetCallbackMethod(ArkUIAPICallbackMethod* method);
} // namespace ViewModel

using FrameNodeCreator = Ark_NodeHandle(Ark_Int32 nodeId);

namespace Bridge {
  Ark_NodeHandle CreateNode(%CPP_PREFIX%Ark_NodeType type, Ark_Int32 id, Ark_Int32 flags) {
      if (id == %CPP_PREFIX%ARKUI_AUTO_GENERATE_NODE_ID) {
          id = ElementRegister::GetInstance()->MakeUniqueId();
      }

      switch (type) {
          case %CPP_PREFIX%ARKUI_TEXT: return ViewModel::createTextNode(id);
          case %CPP_PREFIX%ARKUI_SPAN: return ViewModel::createSpanNode(id);
          case %CPP_PREFIX%ARKUI_IMAGE_SPAN: return ViewModel::createImageSpanNode(id);
          case %CPP_PREFIX%ARKUI_IMAGE: return ViewModel::createImageNode(id);
          case %CPP_PREFIX%ARKUI_TOGGLE: return ViewModel::createToggleNode(id);
          case %CPP_PREFIX%ARKUI_LOADING_PROGRESS: return ViewModel::createLoadingProgress(id);
          case %CPP_PREFIX%ARKUI_TEXT_INPUT: return ViewModel::createTextInputNode(id);
          case %CPP_PREFIX%ARKUI_STACK: return ViewModel::createStackNode(id);
          case %CPP_PREFIX%ARKUI_SCROLL: return ViewModel::createScrollNode(id);
          case %CPP_PREFIX%ARKUI_LIST: return ViewModel::createListNode(id);
          case %CPP_PREFIX%ARKUI_SWIPER: return ViewModel::createSwiperNode(id);
          case %CPP_PREFIX%ARKUI_TEXTAREA: return ViewModel::createTextAreaNode(id);
          case %CPP_PREFIX%ARKUI_BUTTON: return ViewModel::createButtonNode(id);
          case %CPP_PREFIX%ARKUI_PROGRESS: return ViewModel::createProgressNode(id);
          case %CPP_PREFIX%ARKUI_CHECKBOX: return ViewModel::createCheckBoxNode(id);
          case %CPP_PREFIX%ARKUI_COLUMN: return ViewModel::createColumnNode(id);
          case %CPP_PREFIX%ARKUI_ROW: return ViewModel::createRowNode(id);
          case %CPP_PREFIX%ARKUI_FLEX: return ViewModel::createFlexNode(id);
          case %CPP_PREFIX%ARKUI_LIST_ITEM: return ViewModel::createListItemNode(id);
          case %CPP_PREFIX%ARKUI_REFRESH: return ViewModel::createRefreshNode(id);
          case %CPP_PREFIX%ARKUI_ROOT: return ViewModel::createRootNode(id);
          case %CPP_PREFIX%ARKUI_COMPONENT_ROOT: return ViewModel::createComponentRootNode(id);
          #ifdef XCOMPONENT_SUPPORTED
          case %CPP_PREFIX%ARKUI_XCOMPONENT: return ViewModel::createXComponentNode(id);
          #endif
          case %CPP_PREFIX%ARKUI_LIST_ITEM_GROUP: return ViewModel::createListItemGroupNode(id);
          case %CPP_PREFIX%ARKUI_SLIDER: return ViewModel::createSliderNode(id);
          case %CPP_PREFIX%ARKUI_CANVAS: return ViewModel::createCanvasNode(id);
          case %CPP_PREFIX%ARKUI_DATE_PICKER: return ViewModel::createDatePickerNode(id);
          case %CPP_PREFIX%ARKUI_TIME_PICKER: return ViewModel::createTimePickerNode(id);
          case %CPP_PREFIX%ARKUI_TEXT_PICKER: return ViewModel::createTextPickerNode(id);
          case %CPP_PREFIX%ARKUI_CALENDAR_PICKER: return ViewModel::createCalendarPickerNode(id);
          case %CPP_PREFIX%ARKUI_CUSTOM: return ViewModel::createCustomNode(id);
          case %CPP_PREFIX%ARKUI_NAVIGATION: return ViewModel::createNavigationNode(id);
          case %CPP_PREFIX%ARKUI_WATER_FLOW: return ViewModel::createWaterFlowNode(id);
          case %CPP_PREFIX%ARKUI_FLOW_ITEM: return ViewModel::createFlowItemNode(id);
          case %CPP_PREFIX%ARKUI_CIRCLE: return ViewModel::createCircleNode(id);
          case %CPP_PREFIX%ARKUI_RELATIVE_CONTAINER: return ViewModel::createRelativeContainerNode(id);
          case %CPP_PREFIX%ARKUI_GRID: return ViewModel::createGridNode(id);
          case %CPP_PREFIX%ARKUI_TABS: return ViewModel::createTabsNode(id);
          case %CPP_PREFIX%ARKUI_GRID_ITEM: return ViewModel::createGridItemNode(id);
          case %CPP_PREFIX%ARKUI_BLANK: return ViewModel::createBlankNode(id);
          case %CPP_PREFIX%ARKUI_DIVIDER: return ViewModel::createDividerNode(id);
          case %CPP_PREFIX%ARKUI_ALPHABET_INDEXER: return ViewModel::createAlphabetIndexerNode(id);
          case %CPP_PREFIX%ARKUI_SEARCH: return ViewModel::createSearchNode(id);
          case %CPP_PREFIX%ARKUI_GRID_ROW: return ViewModel::createGridRowNode(id);
          case %CPP_PREFIX%ARKUI_GRID_COL: return ViewModel::createGridColNode(id);
          case %CPP_PREFIX%ARKUI_RADIO: return ViewModel::createRadioNode(id);
          case %CPP_PREFIX%ARKUI_TABCONTENT: return ViewModel::createTabContentNode(id);
          default: return nullptr;
      }
  }

  void SetCallbackMethod(%CPP_PREFIX%Ark_APICallbackMethod* method)
  {
      ViewModel::SetCallbackMethod(reinterpret_cast<ArkUIAPICallbackMethod*>(method));
  }
}