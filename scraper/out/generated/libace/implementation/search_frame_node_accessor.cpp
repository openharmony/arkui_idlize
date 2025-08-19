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
namespace typeNode_SearchFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_SearchFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_SearchFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_SearchFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_SearchAttribute InitializeImpl(Ark_typeNode_SearchFrameNode peer,
                                   const Opt_SearchOptions* value)
{
    return {};
}
} // typeNode_SearchFrameNodeAccessor
const GENERATED_ArkUITypeNode_SearchFrameNodeAccessor* GetTypeNode_SearchFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_SearchFrameNodeAccessor TypeNode_SearchFrameNodeAccessorImpl {
        typeNode_SearchFrameNodeAccessor::DestroyPeerImpl,
        typeNode_SearchFrameNodeAccessor::ConstructImpl,
        typeNode_SearchFrameNodeAccessor::GetFinalizerImpl,
        typeNode_SearchFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_SearchFrameNodeAccessorImpl;
}

struct TypeNode_SearchFrameNodePeer {
    virtual ~TypeNode_SearchFrameNodePeer() = default;
};
}
