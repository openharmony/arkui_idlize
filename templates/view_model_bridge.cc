namespace ViewModel {
    Ark_NodeHandle createRootNode(Ark_Int32 nodeId);
%CREATE_NODE_METHODS%
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