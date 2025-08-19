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
namespace typeNode_GridItemFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_GridItemFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_GridItemFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_GridItemFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_GridItemAttribute InitializeImpl(Ark_typeNode_GridItemFrameNode peer,
                                     const Opt_GridItemOptions* options)
{
    return {};
}
} // typeNode_GridItemFrameNodeAccessor
const GENERATED_ArkUITypeNode_GridItemFrameNodeAccessor* GetTypeNode_GridItemFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_GridItemFrameNodeAccessor TypeNode_GridItemFrameNodeAccessorImpl {
        typeNode_GridItemFrameNodeAccessor::DestroyPeerImpl,
        typeNode_GridItemFrameNodeAccessor::ConstructImpl,
        typeNode_GridItemFrameNodeAccessor::GetFinalizerImpl,
        typeNode_GridItemFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_GridItemFrameNodeAccessorImpl;
}

struct TypeNode_GridItemFrameNodePeer {
    virtual ~TypeNode_GridItemFrameNodePeer() = default;
};
}
