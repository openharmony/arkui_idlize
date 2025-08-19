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
namespace typeNode_ScrollFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_ScrollFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_ScrollFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_ScrollFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_ScrollAttribute InitializeImpl(Ark_typeNode_ScrollFrameNode peer,
                                   const Opt_Scroller* scroller)
{
    return {};
}
} // typeNode_ScrollFrameNodeAccessor
const GENERATED_ArkUITypeNode_ScrollFrameNodeAccessor* GetTypeNode_ScrollFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_ScrollFrameNodeAccessor TypeNode_ScrollFrameNodeAccessorImpl {
        typeNode_ScrollFrameNodeAccessor::DestroyPeerImpl,
        typeNode_ScrollFrameNodeAccessor::ConstructImpl,
        typeNode_ScrollFrameNodeAccessor::GetFinalizerImpl,
        typeNode_ScrollFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_ScrollFrameNodeAccessorImpl;
}

struct TypeNode_ScrollFrameNodePeer {
    virtual ~TypeNode_ScrollFrameNodePeer() = default;
};
}
