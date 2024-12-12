const %CPP_PREFIX%ArkUIBasicNodeAPI* %CPP_PREFIX%GetBasicAPI()
{
    static const %CPP_PREFIX%ArkUIBasicNodeAPI basicNodeAPIImpl = {
        %CPP_PREFIX%ARKUI_BASIC_NODE_API_VERSION, // version
        OHOS::Ace::NG::GeneratedBridge::CreateNode,
        OHOS::Ace::NG::GeneratedApiImpl::GetNodeByViewStack,
        OHOS::Ace::NG::GeneratedApiImpl::DisposeNode,
        OHOS::Ace::NG::GeneratedApiImpl::DumpTreeNode,
        OHOS::Ace::NG::GeneratedApiImpl::AddChild,
        OHOS::Ace::NG::GeneratedApiImpl::RemoveChild,
        OHOS::Ace::NG::GeneratedApiImpl::InsertChildAfter,
        OHOS::Ace::NG::GeneratedApiImpl::InsertChildBefore,
        OHOS::Ace::NG::GeneratedApiImpl::InsertChildAt,
        OHOS::Ace::NG::GeneratedApiImpl::ApplyModifierFinish,
        OHOS::Ace::NG::GeneratedApiImpl::MarkDirty,
        OHOS::Ace::NG::GeneratedApiImpl::IsBuilderNode,
        OHOS::Ace::NG::GeneratedApiImpl::ConvertLengthMetricsUnit
    };
    return &basicNodeAPIImpl;
}

const %CPP_PREFIX%ArkUIExtendedNodeAPI* %CPP_PREFIX%GetExtendedAPI()
{
    static const %CPP_PREFIX%ArkUIExtendedNodeAPI extendedNodeAPIImpl = {
        %CPP_PREFIX%ARKUI_EXTENDED_NODE_API_VERSION, // version
        OHOS::Ace::NG::GeneratedApiImpl::GetDensity,
        OHOS::Ace::NG::GeneratedApiImpl::GetFontScale,
        OHOS::Ace::NG::GeneratedApiImpl::GetDesignWidthScale,
        OHOS::Ace::NG::GeneratedApiImpl::SetCallbackMethod,
        OHOS::Ace::NG::GeneratedApiImpl::SetCustomMethodFlag,
        OHOS::Ace::NG::GeneratedApiImpl::GetCustomMethodFlag,
        OHOS::Ace::NG::GeneratedApiImpl::SetCustomCallback,
        OHOS::Ace::NG::GeneratedApiImpl::MeasureLayoutAndDraw,
        OHOS::Ace::NG::GeneratedApiImpl::MeasureNode,
        OHOS::Ace::NG::GeneratedApiImpl::LayoutNode,
        OHOS::Ace::NG::GeneratedApiImpl::DrawNode,
        OHOS::Ace::NG::GeneratedApiImpl::SetAttachNodePtr,
        OHOS::Ace::NG::GeneratedApiImpl::GetAttachNodePtr,
        OHOS::Ace::NG::GeneratedApiImpl::SetMeasureWidth,
        OHOS::Ace::NG::GeneratedApiImpl::GetMeasureWidth,
        OHOS::Ace::NG::GeneratedApiImpl::SetMeasureHeight,
        OHOS::Ace::NG::GeneratedApiImpl::GetMeasureHeight,
        OHOS::Ace::NG::GeneratedApiImpl::SetX,
        OHOS::Ace::NG::GeneratedApiImpl::GetX,
        OHOS::Ace::NG::GeneratedApiImpl::SetY,
        OHOS::Ace::NG::GeneratedApiImpl::GetY,
        OHOS::Ace::NG::GeneratedApiImpl::GetLayoutConstraint,
        OHOS::Ace::NG::GeneratedApiImpl::SetAlignment,
        OHOS::Ace::NG::GeneratedApiImpl::GetAlignment,
        OHOS::Ace::NG::GeneratedApiImpl::IndexerChecker,
        OHOS::Ace::NG::GeneratedApiImpl::SetRangeUpdater,
        OHOS::Ace::NG::GeneratedApiImpl::SetLazyItemIndexer,
        OHOS::Ace::NG::GeneratedApiImpl::GetPipelineContext,
        OHOS::Ace::NG::GeneratedApiImpl::SetVsyncCallback,
        OHOS::Ace::NG::GeneratedApiImpl::SetChildTotalCount,
        OHOS::Ace::NG::GeneratedApiImpl::ShowCrash
    };
    return &extendedNodeAPIImpl;
}

// TODO: remove me!
const %CPP_PREFIX%ArkUIFullNodeAPI* %CPP_PREFIX%GetFullAPI()
{
    static const %CPP_PREFIX%ArkUIFullNodeAPI fullAPIImpl = {
        %CPP_PREFIX%ARKUI_FULL_API_VERSION, // version
        %CPP_PREFIX%GetArkUINodeModifiers,
        %CPP_PREFIX%GetArkUIAccessors,
        nullptr,
        OHOS::Ace::NG::GeneratedEvents::%CPP_PREFIX%GetArkUiEventsAPI,
        OHOS::Ace::NG::GeneratedEvents::%CPP_PREFIX%SetArkUiEventsAPI
    };
    return &fullAPIImpl;
}

void setLogger(const ServiceLogger* logger) {
    SetDummyLogger(reinterpret_cast<const GroupLogger*>(logger));
}


const GenericServiceAPI* GetServiceAPI()
{
    static const GenericServiceAPI serviceAPIImpl = {
        GENERIC_SERVICE_API_VERSION, // version
        setLogger
    };
    return &serviceAPIImpl;
}

EXTERN_C IDLIZE_API_EXPORT const %CPP_PREFIX%ArkUIAnyAPI* %CPP_PREFIX%GetArkAnyAPI(
    %CPP_PREFIX%Ark_APIVariantKind kind, int version)
{
    switch (kind) {
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
        case GENERIC_SERVICE:
            if (version == GENERIC_SERVICE_API_VERSION)   {
                return reinterpret_cast<const %CPP_PREFIX%ArkUIAnyAPI*>(GetServiceAPI());
            }
            break;
        default:
            break;
    }
    return nullptr;
}
