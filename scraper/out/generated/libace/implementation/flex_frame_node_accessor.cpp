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
namespace typeNode_FlexFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_FlexFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_FlexFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_FlexFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_FlexAttribute InitializeImpl(Ark_typeNode_FlexFrameNode peer,
                                 const Opt_FlexOptions* value)
{
    return {};
}
} // typeNode_FlexFrameNodeAccessor
const GENERATED_ArkUITypeNode_FlexFrameNodeAccessor* GetTypeNode_FlexFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_FlexFrameNodeAccessor TypeNode_FlexFrameNodeAccessorImpl {
        typeNode_FlexFrameNodeAccessor::DestroyPeerImpl,
        typeNode_FlexFrameNodeAccessor::ConstructImpl,
        typeNode_FlexFrameNodeAccessor::GetFinalizerImpl,
        typeNode_FlexFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_FlexFrameNodeAccessorImpl;
}

struct TypeNode_FlexFrameNodePeer {
    virtual ~TypeNode_FlexFrameNodePeer() = default;
};
}
