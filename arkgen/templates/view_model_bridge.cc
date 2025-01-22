namespace GeneratedViewModel {
%CREATE_NODE_METHODS%
} // namespace GeneratedViewModel

using FrameNodeCreator = Ark_NodeHandle(Ark_Int32 nodeId);

namespace GeneratedBridge {
    Ark_NodeHandle CreateNode(%CPP_PREFIX%Ark_NodeType type, Ark_Int32 id, Ark_Int32 flags)
    {
        LOGI("Arkoala: Bridge::CreateNode: type=%{public}d, id=%{public}d", type, id);

        if (id == %CPP_PREFIX%ARKUI_AUTO_GENERATE_NODE_ID) {
            id = ElementRegister::GetInstance()->MakeUniqueId();
        }

        switch (type) {
%CREATE_NODE_SWITCH%
            default: return nullptr;
        }
    }
}
