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
namespace NodeControllerAccessor {
void DestroyPeerImpl(Ark_NodeController peer)
{
    auto peerImpl = reinterpret_cast<NodeControllerPeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_NodeController ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Opt_FrameNode MakeNodeImpl(Ark_NodeController peer,
                           Ark_UIContext uiContext)
{
    return {};
}
void AboutToResizeImpl(Ark_NodeController peer,
                       const Ark_Size* size)
{
}
void AboutToAppearImpl(Ark_NodeController peer)
{
}
void AboutToDisappearImpl(Ark_NodeController peer)
{
}
void RebuildImpl(Ark_NodeController peer)
{
}
void OnTouchEventImpl(Ark_NodeController peer,
                      Ark_TouchEvent event)
{
}
void OnAttachImpl(Ark_NodeController peer)
{
}
void OnDetachImpl(Ark_NodeController peer)
{
}
void OnWillBindImpl(Ark_NodeController peer,
                    const Ark_Number* containerId)
{
}
void OnWillUnbindImpl(Ark_NodeController peer,
                      const Ark_Number* containerId)
{
}
void OnBindImpl(Ark_NodeController peer,
                const Ark_Number* containerId)
{
}
void OnUnbindImpl(Ark_NodeController peer,
                  const Ark_Number* containerId)
{
}
} // NodeControllerAccessor
const GENERATED_ArkUINodeControllerAccessor* GetNodeControllerAccessor()
{
    static const GENERATED_ArkUINodeControllerAccessor NodeControllerAccessorImpl {
        NodeControllerAccessor::DestroyPeerImpl,
        NodeControllerAccessor::ConstructImpl,
        NodeControllerAccessor::GetFinalizerImpl,
        NodeControllerAccessor::MakeNodeImpl,
        NodeControllerAccessor::AboutToResizeImpl,
        NodeControllerAccessor::AboutToAppearImpl,
        NodeControllerAccessor::AboutToDisappearImpl,
        NodeControllerAccessor::RebuildImpl,
        NodeControllerAccessor::OnTouchEventImpl,
        NodeControllerAccessor::OnAttachImpl,
        NodeControllerAccessor::OnDetachImpl,
        NodeControllerAccessor::OnWillBindImpl,
        NodeControllerAccessor::OnWillUnbindImpl,
        NodeControllerAccessor::OnBindImpl,
        NodeControllerAccessor::OnUnbindImpl,
    };
    return &NodeControllerAccessorImpl;
}

struct NodeControllerPeer {
    virtual ~NodeControllerPeer() = default;
};
}
