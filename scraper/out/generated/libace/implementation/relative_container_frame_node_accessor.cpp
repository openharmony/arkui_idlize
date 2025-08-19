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
namespace typeNode_RelativeContainerFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_RelativeContainerFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_RelativeContainerFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_RelativeContainerFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_RelativeContainerAttribute InitializeImpl(Ark_typeNode_RelativeContainerFrameNode peer)
{
    return {};
}
} // typeNode_RelativeContainerFrameNodeAccessor
const GENERATED_ArkUITypeNode_RelativeContainerFrameNodeAccessor* GetTypeNode_RelativeContainerFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_RelativeContainerFrameNodeAccessor TypeNode_RelativeContainerFrameNodeAccessorImpl {
        typeNode_RelativeContainerFrameNodeAccessor::DestroyPeerImpl,
        typeNode_RelativeContainerFrameNodeAccessor::ConstructImpl,
        typeNode_RelativeContainerFrameNodeAccessor::GetFinalizerImpl,
        typeNode_RelativeContainerFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_RelativeContainerFrameNodeAccessorImpl;
}

struct TypeNode_RelativeContainerFrameNodePeer {
    virtual ~TypeNode_RelativeContainerFrameNodePeer() = default;
};
}
