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
namespace typeNode_XComponentFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_XComponentFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_XComponentFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_XComponentFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_XComponentAttribute Initialize0Impl(Ark_typeNode_XComponentFrameNode peer,
                                        const Ark_XComponentParameters* value)
{
    return {};
}
Ark_XComponentAttribute Initialize1Impl(Ark_typeNode_XComponentFrameNode peer,
                                        const Ark_XComponentOptions* value)
{
    return {};
}
Ark_XComponentAttribute Initialize2Impl(Ark_typeNode_XComponentFrameNode peer,
                                        const Ark_NativeXComponentParameters* params)
{
    return {};
}
} // typeNode_XComponentFrameNodeAccessor
const GENERATED_ArkUITypeNode_XComponentFrameNodeAccessor* GetTypeNode_XComponentFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_XComponentFrameNodeAccessor TypeNode_XComponentFrameNodeAccessorImpl {
        typeNode_XComponentFrameNodeAccessor::DestroyPeerImpl,
        typeNode_XComponentFrameNodeAccessor::ConstructImpl,
        typeNode_XComponentFrameNodeAccessor::GetFinalizerImpl,
        typeNode_XComponentFrameNodeAccessor::Initialize0Impl,
        typeNode_XComponentFrameNodeAccessor::Initialize1Impl,
        typeNode_XComponentFrameNodeAccessor::Initialize2Impl,
    };
    return &TypeNode_XComponentFrameNodeAccessorImpl;
}

struct TypeNode_XComponentFrameNodePeer {
    virtual ~TypeNode_XComponentFrameNodePeer() = default;
};
}
