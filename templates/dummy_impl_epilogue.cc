
const %CPP_PREFIX%ArkUIFullNodeAPI fullAPIImpl = {
    %CPP_PREFIX%ARKUI_FULL_API_VERSION, // version
    %CPP_PREFIX%GetArkUINodeModifiers,
    %CPP_PREFIX%GetArkUIAccessors,
    nullptr,
    nullptr,
    nullptr,
    nullptr
};
const %CPP_PREFIX%ArkUIFullNodeAPI* %CPP_PREFIX%GetFullAPI() { return &fullAPIImpl; }

const %CPP_PREFIX%ArkUIBasicNodeAPI basicNodeAPIImpl = {
    %CPP_PREFIX%ARKUI_BASIC_NODE_API_VERSION, // version
    OHOS::Ace::NG::CreateNode
};
const %CPP_PREFIX%ArkUIBasicNodeAPI* %CPP_PREFIX%GetBasicAPI() { return &basicNodeAPIImpl; }

const %CPP_PREFIX%ArkUIExtendedNodeAPI extendedNodeAPIImpl = {
    %CPP_PREFIX%ARKUI_EXTENDED_NODE_API_VERSION, // version
    SetAppendGroupedLog
};
const %CPP_PREFIX%ArkUIExtendedNodeAPI* %CPP_PREFIX%GetExtendedAPI() { return &extendedNodeAPIImpl; }

EXTERN_C IDLIZE_API_EXPORT const %CPP_PREFIX%ArkUIAnyAPI* %CPP_PREFIX%GetArkAnyAPI(
    %CPP_PREFIX%Ark_APIVariantKind kind, int version)
{
    switch (kind)
    {
        case %CPP_PREFIX%FULL:
            if (version == %CPP_PREFIX%ARKUI_FULL_API_VERSION)   {
                return reinterpret_cast<const %CPP_PREFIX%ArkUIAnyAPI*>(%CPP_PREFIX%GetFullAPI());
            }
            break;
        case %CPP_PREFIX%BASIC:
            if (version == %CPP_PREFIX%ARKUI_BASIC_NODE_API_VERSION)   {
                return reinterpret_cast<const %CPP_PREFIX%ArkUIAnyAPI*>(%CPP_PREFIX%GetBasicAPI());
            }
            break;
        case %CPP_PREFIX%EXTENDED:
            if (version == %CPP_PREFIX%ARKUI_EXTENDED_NODE_API_VERSION)   {
                return reinterpret_cast<const %CPP_PREFIX%ArkUIAnyAPI*>(%CPP_PREFIX%GetExtendedAPI());
            }
            break;
        default:
            break;
    }
    return nullptr;
}
