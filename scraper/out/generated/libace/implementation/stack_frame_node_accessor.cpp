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
namespace typeNode_StackFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_StackFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_StackFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_StackFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_StackAttribute InitializeImpl(Ark_typeNode_StackFrameNode peer,
                                  const Opt_StackOptions* options)
{
    return {};
}
} // typeNode_StackFrameNodeAccessor
const GENERATED_ArkUITypeNode_StackFrameNodeAccessor* GetTypeNode_StackFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_StackFrameNodeAccessor TypeNode_StackFrameNodeAccessorImpl {
        typeNode_StackFrameNodeAccessor::DestroyPeerImpl,
        typeNode_StackFrameNodeAccessor::ConstructImpl,
        typeNode_StackFrameNodeAccessor::GetFinalizerImpl,
        typeNode_StackFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_StackFrameNodeAccessorImpl;
}

struct TypeNode_StackFrameNodePeer {
    virtual ~TypeNode_StackFrameNodePeer() = default;
};
}
