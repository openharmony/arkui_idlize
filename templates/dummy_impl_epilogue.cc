const %CPP_PREFIX%ArkUIBasicNodeAPI* %CPP_PREFIX%GetBasicAPI()
{
    static const %CPP_PREFIX%ArkUIBasicNodeAPI basicNodeAPIImpl = {
        %CPP_PREFIX%ARKUI_BASIC_NODE_API_VERSION, // version
        OHOS::Ace::NG::Bridge::CreateNode,
        OHOS::Ace::NG::ApiImpl::GetNodeByViewStack,
        OHOS::Ace::NG::ApiImpl::DisposeNode,
        OHOS::Ace::NG::ApiImpl::DumpTreeNode,
        OHOS::Ace::NG::ApiImpl::AddChild,
        OHOS::Ace::NG::ApiImpl::RemoveChild,
        OHOS::Ace::NG::ApiImpl::InsertChildAfter,
        OHOS::Ace::NG::ApiImpl::InsertChildBefore,
        OHOS::Ace::NG::ApiImpl::InsertChildAt,
        OHOS::Ace::NG::ApiImpl::ApplyModifierFinish,
        OHOS::Ace::NG::ApiImpl::MarkDirty,
        OHOS::Ace::NG::ApiImpl::IsBuilderNode,
        OHOS::Ace::NG::ApiImpl::ConvertLengthMetricsUnit,
        OHOS::Ace::NG::ApiImpl::EmitOnClick,
    };
    return &basicNodeAPIImpl;
}

const %CPP_PREFIX%ArkUIExtendedNodeAPI* %CPP_PREFIX%GetExtendedAPI()
{
    static const %CPP_PREFIX%ArkUIExtendedNodeAPI extendedNodeAPIImpl = {
        %CPP_PREFIX%ARKUI_EXTENDED_NODE_API_VERSION, // version
        OHOS::Ace::NG::GetDensity,
        OHOS::Ace::NG::GetFontScale,
        OHOS::Ace::NG::GetDesignWidthScale,
        OHOS::Ace::NG::Bridge::SetCallbackMethod,
        OHOS::Ace::NG::ApiImpl::SetCustomMethodFlag,
        OHOS::Ace::NG::ApiImpl::GetCustomMethodFlag,
        OHOS::Ace::NG::ApiImpl::SetCustomCallback,
        OHOS::Ace::NG::ApiImpl::MeasureLayoutAndDraw,
        OHOS::Ace::NG::ApiImpl::MeasureNode,
        OHOS::Ace::NG::ApiImpl::LayoutNode,
        OHOS::Ace::NG::ApiImpl::DrawNode,
        OHOS::Ace::NG::ApiImpl::SetAttachNodePtr,
        OHOS::Ace::NG::ApiImpl::GetAttachNodePtr,
        OHOS::Ace::NG::ApiImpl::SetMeasureWidth,
        OHOS::Ace::NG::ApiImpl::GetMeasureWidth,
        OHOS::Ace::NG::ApiImpl::SetMeasureHeight,
        OHOS::Ace::NG::ApiImpl::GetMeasureHeight,
        OHOS::Ace::NG::ApiImpl::SetX,
        OHOS::Ace::NG::ApiImpl::GetX,
        OHOS::Ace::NG::ApiImpl::SetY,
        OHOS::Ace::NG::ApiImpl::GetY,
        OHOS::Ace::NG::ApiImpl::GetLayoutConstraint,
        OHOS::Ace::NG::ApiImpl::SetAlignment,
        OHOS::Ace::NG::ApiImpl::GetAlignment,
        OHOS::Ace::NG::ApiImpl::IndexerChecker,
        OHOS::Ace::NG::ApiImpl::SetRangeUpdater,
        OHOS::Ace::NG::ApiImpl::SetLazyItemIndexer,
        OHOS::Ace::NG::ApiImpl::GetPipelineContext,
        OHOS::Ace::NG::ApiImpl::SetVsyncCallback,
        OHOS::Ace::NG::ApiImpl::SetChildTotalCount,
        OHOS::Ace::NG::ApiImpl::ShowCrash
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
