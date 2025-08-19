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
namespace typeNode_BlankFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_BlankFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_BlankFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_BlankFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_BlankAttribute InitializeImpl(Ark_typeNode_BlankFrameNode peer,
                                  const Opt_Union_Number_String* min)
{
    return {};
}
} // typeNode_BlankFrameNodeAccessor
const GENERATED_ArkUITypeNode_BlankFrameNodeAccessor* GetTypeNode_BlankFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_BlankFrameNodeAccessor TypeNode_BlankFrameNodeAccessorImpl {
        typeNode_BlankFrameNodeAccessor::DestroyPeerImpl,
        typeNode_BlankFrameNodeAccessor::ConstructImpl,
        typeNode_BlankFrameNodeAccessor::GetFinalizerImpl,
        typeNode_BlankFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_BlankFrameNodeAccessorImpl;
}

struct TypeNode_BlankFrameNodePeer {
    virtual ~TypeNode_BlankFrameNodePeer() = default;
};
}
