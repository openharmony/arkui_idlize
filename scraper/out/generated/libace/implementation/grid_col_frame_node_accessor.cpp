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
namespace typeNode_GridColFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_GridColFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_GridColFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_GridColFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_GridColAttribute InitializeImpl(Ark_typeNode_GridColFrameNode peer,
                                    const Opt_GridColOptions* options)
{
    return {};
}
} // typeNode_GridColFrameNodeAccessor
const GENERATED_ArkUITypeNode_GridColFrameNodeAccessor* GetTypeNode_GridColFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_GridColFrameNodeAccessor TypeNode_GridColFrameNodeAccessorImpl {
        typeNode_GridColFrameNodeAccessor::DestroyPeerImpl,
        typeNode_GridColFrameNodeAccessor::ConstructImpl,
        typeNode_GridColFrameNodeAccessor::GetFinalizerImpl,
        typeNode_GridColFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_GridColFrameNodeAccessorImpl;
}

struct TypeNode_GridColFrameNodePeer {
    virtual ~TypeNode_GridColFrameNodePeer() = default;
};
}
