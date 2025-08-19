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
namespace typeNode_ColumnFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_ColumnFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_ColumnFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_ColumnFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_ColumnAttribute InitializeImpl(Ark_typeNode_ColumnFrameNode peer,
                                   const Opt_Union_ColumnOptions_ColumnOptionsV2* options)
{
    return {};
}
} // typeNode_ColumnFrameNodeAccessor
const GENERATED_ArkUITypeNode_ColumnFrameNodeAccessor* GetTypeNode_ColumnFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_ColumnFrameNodeAccessor TypeNode_ColumnFrameNodeAccessorImpl {
        typeNode_ColumnFrameNodeAccessor::DestroyPeerImpl,
        typeNode_ColumnFrameNodeAccessor::ConstructImpl,
        typeNode_ColumnFrameNodeAccessor::GetFinalizerImpl,
        typeNode_ColumnFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_ColumnFrameNodeAccessorImpl;
}

struct TypeNode_ColumnFrameNodePeer {
    virtual ~TypeNode_ColumnFrameNodePeer() = default;
};
}
