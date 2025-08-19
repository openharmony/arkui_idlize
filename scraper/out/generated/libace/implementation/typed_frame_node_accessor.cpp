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
namespace TypedFrameNodeAccessor {
void DestroyPeerImpl(Ark_TypedFrameNode peer)
{
    auto peerImpl = reinterpret_cast<TypedFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_TypedFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_CustomObject GetAttribute_Impl(Ark_TypedFrameNode peer)
{
    return {};
}
void SetAttribute_Impl(Ark_TypedFrameNode peer,
                       const Ark_CustomObject* attribute_)
{
}
} // TypedFrameNodeAccessor
const GENERATED_ArkUITypedFrameNodeAccessor* GetTypedFrameNodeAccessor()
{
    static const GENERATED_ArkUITypedFrameNodeAccessor TypedFrameNodeAccessorImpl {
        TypedFrameNodeAccessor::DestroyPeerImpl,
        TypedFrameNodeAccessor::ConstructImpl,
        TypedFrameNodeAccessor::GetFinalizerImpl,
        TypedFrameNodeAccessor::GetAttribute_Impl,
        TypedFrameNodeAccessor::SetAttribute_Impl,
    };
    return &TypedFrameNodeAccessorImpl;
}

struct TypedFrameNodePeer {
    virtual ~TypedFrameNodePeer() = default;
};
}
