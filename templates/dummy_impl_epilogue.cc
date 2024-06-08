const %CPP_PREFIX%ArkUIFullNodeAPI fullAPIImpl = {
    %ARKUI_FULL_API_VERSION_VALUE%, // version
    nullptr,
    %CPP_PREFIX%GetArkUINodeModifiers,
    %CPP_PREFIX%GetArkUIAccessors,
    nullptr,
    nullptr,
    nullptr,
    nullptr
};

const %CPP_PREFIX%ArkUIExtendedAPI extendedAPIImpl = {
    %ARKUI_EXTENDED_API_VERSION_VALUE%, // version
    SetAppendGroupedLog
};

EXTERN_C IDLIZE_API_EXPORT const %CPP_PREFIX%ArkUIAnyAPI* %CPP_PREFIX%GetArkAnyAPI(
    %CPP_PREFIX%Ark_APIVariantKind kind, int version)
{
    switch (kind)
    {
        case %CPP_PREFIX%FULL:
            if (version == %ARKUI_FULL_API_VERSION_VALUE%)   {
                return reinterpret_cast<const %CPP_PREFIX%ArkUIAnyAPI*>(&fullAPIImpl);
            }
            break;
        case %CPP_PREFIX%EXTENDED:
            if (version == %ARKUI_EXTENDED_API_VERSION_VALUE%)   {
                return reinterpret_cast<const %CPP_PREFIX%ArkUIAnyAPI*>(&extendedAPIImpl);
            }
            break;
        default:
            break;
    }
    return nullptr;
}

