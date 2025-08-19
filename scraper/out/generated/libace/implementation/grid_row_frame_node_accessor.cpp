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
namespace typeNode_GridRowFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_GridRowFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_GridRowFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_GridRowFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_GridRowAttribute InitializeImpl(Ark_typeNode_GridRowFrameNode peer,
                                    const Opt_GridRowOptions* options)
{
    return {};
}
} // typeNode_GridRowFrameNodeAccessor
const GENERATED_ArkUITypeNode_GridRowFrameNodeAccessor* GetTypeNode_GridRowFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_GridRowFrameNodeAccessor TypeNode_GridRowFrameNodeAccessorImpl {
        typeNode_GridRowFrameNodeAccessor::DestroyPeerImpl,
        typeNode_GridRowFrameNodeAccessor::ConstructImpl,
        typeNode_GridRowFrameNodeAccessor::GetFinalizerImpl,
        typeNode_GridRowFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_GridRowFrameNodeAccessorImpl;
}

struct TypeNode_GridRowFrameNodePeer {
    virtual ~TypeNode_GridRowFrameNodePeer() = default;
};
}
