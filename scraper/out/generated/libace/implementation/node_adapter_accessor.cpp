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
namespace NodeAdapterAccessor {
void DestroyPeerImpl(Ark_NodeAdapter peer)
{
    auto peerImpl = reinterpret_cast<NodeAdapterPeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_NodeAdapter ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
void DisposeImpl(Ark_NodeAdapter peer)
{
}
Ark_Boolean IsDisposedImpl(Ark_NodeAdapter peer)
{
    return {};
}
void ReloadAllItemsImpl(Ark_NodeAdapter peer)
{
}
void ReloadItemImpl(Ark_NodeAdapter peer,
                    const Ark_Number* start,
                    const Ark_Number* count)
{
}
void RemoveItemImpl(Ark_NodeAdapter peer,
                    const Ark_Number* start,
                    const Ark_Number* count)
{
}
void InsertItemImpl(Ark_NodeAdapter peer,
                    const Ark_Number* start,
                    const Ark_Number* count)
{
}
void MoveItemImpl(Ark_NodeAdapter peer,
                  const Ark_Number* from,
                  const Ark_Number* to)
{
}
Array_FrameNode GetAllAvailableItemsImpl(Ark_NodeAdapter peer)
{
    return {};
}
void OnAttachToNodeImpl(Ark_NodeAdapter peer,
                        Ark_FrameNode target)
{
}
void OnDetachFromNodeImpl(Ark_NodeAdapter peer)
{
}
Ark_Number OnGetChildIdImpl(Ark_NodeAdapter peer,
                            const Ark_Number* index)
{
    return {};
}
Ark_FrameNode OnCreateChildImpl(Ark_NodeAdapter peer,
                                const Ark_Number* index)
{
    return {};
}
void OnDisposeChildImpl(Ark_NodeAdapter peer,
                        const Ark_Number* id,
                        Ark_FrameNode node)
{
}
void OnUpdateChildImpl(Ark_NodeAdapter peer,
                       const Ark_Number* id,
                       Ark_FrameNode node)
{
}
Ark_Boolean AttachNodeAdapterImpl(Ark_NodeAdapter adapter,
                                  Ark_FrameNode node)
{
    return {};
}
void DetachNodeAdapterImpl(Ark_FrameNode node)
{
}
Ark_Number GetTotalNodeCountImpl(Ark_NodeAdapter peer)
{
    return {};
}
void SetTotalNodeCountImpl(Ark_NodeAdapter peer,
                           const Ark_Number* totalNodeCount)
{
}
} // NodeAdapterAccessor
const GENERATED_ArkUINodeAdapterAccessor* GetNodeAdapterAccessor()
{
    static const GENERATED_ArkUINodeAdapterAccessor NodeAdapterAccessorImpl {
        NodeAdapterAccessor::DestroyPeerImpl,
        NodeAdapterAccessor::ConstructImpl,
        NodeAdapterAccessor::GetFinalizerImpl,
        NodeAdapterAccessor::DisposeImpl,
        NodeAdapterAccessor::IsDisposedImpl,
        NodeAdapterAccessor::ReloadAllItemsImpl,
        NodeAdapterAccessor::ReloadItemImpl,
        NodeAdapterAccessor::RemoveItemImpl,
        NodeAdapterAccessor::InsertItemImpl,
        NodeAdapterAccessor::MoveItemImpl,
        NodeAdapterAccessor::GetAllAvailableItemsImpl,
        NodeAdapterAccessor::OnAttachToNodeImpl,
        NodeAdapterAccessor::OnDetachFromNodeImpl,
        NodeAdapterAccessor::OnGetChildIdImpl,
        NodeAdapterAccessor::OnCreateChildImpl,
        NodeAdapterAccessor::OnDisposeChildImpl,
        NodeAdapterAccessor::OnUpdateChildImpl,
        NodeAdapterAccessor::AttachNodeAdapterImpl,
        NodeAdapterAccessor::DetachNodeAdapterImpl,
        NodeAdapterAccessor::GetTotalNodeCountImpl,
        NodeAdapterAccessor::SetTotalNodeCountImpl,
    };
    return &NodeAdapterAccessorImpl;
}

struct NodeAdapterPeer {
    virtual ~NodeAdapterPeer() = default;
};
}
