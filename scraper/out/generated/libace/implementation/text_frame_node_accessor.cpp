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
namespace typeNode_TextFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_TextFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_TextFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_TextFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_TextAttribute InitializeImpl(Ark_typeNode_TextFrameNode peer,
                                 const Opt_Union_String_Resource* content,
                                 const Opt_TextOptions* value)
{
    return {};
}
} // typeNode_TextFrameNodeAccessor
const GENERATED_ArkUITypeNode_TextFrameNodeAccessor* GetTypeNode_TextFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_TextFrameNodeAccessor TypeNode_TextFrameNodeAccessorImpl {
        typeNode_TextFrameNodeAccessor::DestroyPeerImpl,
        typeNode_TextFrameNodeAccessor::ConstructImpl,
        typeNode_TextFrameNodeAccessor::GetFinalizerImpl,
        typeNode_TextFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_TextFrameNodeAccessorImpl;
}

struct TypeNode_TextFrameNodePeer {
    virtual ~TypeNode_TextFrameNodePeer() = default;
};
}
