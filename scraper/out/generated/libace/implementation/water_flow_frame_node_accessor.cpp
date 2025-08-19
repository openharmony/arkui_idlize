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
namespace typeNode_WaterFlowFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_WaterFlowFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_WaterFlowFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_WaterFlowFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_WaterFlowAttribute InitializeImpl(Ark_typeNode_WaterFlowFrameNode peer,
                                      const Opt_WaterFlowOptions* options)
{
    return {};
}
} // typeNode_WaterFlowFrameNodeAccessor
const GENERATED_ArkUITypeNode_WaterFlowFrameNodeAccessor* GetTypeNode_WaterFlowFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_WaterFlowFrameNodeAccessor TypeNode_WaterFlowFrameNodeAccessorImpl {
        typeNode_WaterFlowFrameNodeAccessor::DestroyPeerImpl,
        typeNode_WaterFlowFrameNodeAccessor::ConstructImpl,
        typeNode_WaterFlowFrameNodeAccessor::GetFinalizerImpl,
        typeNode_WaterFlowFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_WaterFlowFrameNodeAccessorImpl;
}

struct TypeNode_WaterFlowFrameNodePeer {
    virtual ~TypeNode_WaterFlowFrameNodePeer() = default;
};
}
