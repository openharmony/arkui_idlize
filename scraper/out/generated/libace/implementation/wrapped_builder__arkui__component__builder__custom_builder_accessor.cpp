/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#include "core/components_ng/base/frame_node.h"
#include "core/interfaces/native/utility/converter.h"
#include "arkoala_api_generated.h"

namespace OHOS::Ace::NG::GeneratedModifier {
namespace WrappedBuilder_Arkui_Component_Builder_CustomBuilderAccessor {
void DestroyPeerImpl(Ark_WrappedBuilder_Arkui_Component_Builder_CustomBuilder peer)
{
    auto peerImpl = reinterpret_cast<WrappedBuilder_Arkui_Component_Builder_CustomBuilderPeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_WrappedBuilder_Arkui_Component_Builder_CustomBuilder ConstructImpl(const CustomNodeBuilder* builder)
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
CustomNodeBuilder GetBuilderImpl(Ark_WrappedBuilder_Arkui_Component_Builder_CustomBuilder peer)
{
    return {};
}
void SetBuilderImpl(Ark_WrappedBuilder_Arkui_Component_Builder_CustomBuilder peer,
                    const CustomNodeBuilder* builder)
{
}
} // WrappedBuilder_Arkui_Component_Builder_CustomBuilderAccessor
const GENERATED_ArkUIWrappedBuilder_Arkui_Component_Builder_CustomBuilderAccessor* GetWrappedBuilder_Arkui_Component_Builder_CustomBuilderAccessor()
{
    static const GENERATED_ArkUIWrappedBuilder_Arkui_Component_Builder_CustomBuilderAccessor WrappedBuilder_Arkui_Component_Builder_CustomBuilderAccessorImpl {
        WrappedBuilder_Arkui_Component_Builder_CustomBuilderAccessor::DestroyPeerImpl,
        WrappedBuilder_Arkui_Component_Builder_CustomBuilderAccessor::ConstructImpl,
        WrappedBuilder_Arkui_Component_Builder_CustomBuilderAccessor::GetFinalizerImpl,
        WrappedBuilder_Arkui_Component_Builder_CustomBuilderAccessor::GetBuilderImpl,
        WrappedBuilder_Arkui_Component_Builder_CustomBuilderAccessor::SetBuilderImpl,
    };
    return &WrappedBuilder_Arkui_Component_Builder_CustomBuilderAccessorImpl;
}

struct WrappedBuilder_Arkui_Component_Builder_CustomBuilderPeer {
    virtual ~WrappedBuilder_Arkui_Component_Builder_CustomBuilderPeer() = default;
};
}
