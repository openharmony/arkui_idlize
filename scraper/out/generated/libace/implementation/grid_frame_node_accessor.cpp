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
namespace typeNode_GridFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_GridFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_GridFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_GridFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_GridAttribute InitializeImpl(Ark_typeNode_GridFrameNode peer,
                                 const Opt_Scroller* scroller,
                                 const Opt_GridLayoutOptions* layoutOptions)
{
    return {};
}
} // typeNode_GridFrameNodeAccessor
const GENERATED_ArkUITypeNode_GridFrameNodeAccessor* GetTypeNode_GridFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_GridFrameNodeAccessor TypeNode_GridFrameNodeAccessorImpl {
        typeNode_GridFrameNodeAccessor::DestroyPeerImpl,
        typeNode_GridFrameNodeAccessor::ConstructImpl,
        typeNode_GridFrameNodeAccessor::GetFinalizerImpl,
        typeNode_GridFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_GridFrameNodeAccessorImpl;
}

struct TypeNode_GridFrameNodePeer {
    virtual ~TypeNode_GridFrameNodePeer() = default;
};
}
