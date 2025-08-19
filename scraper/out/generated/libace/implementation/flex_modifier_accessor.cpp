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
namespace FlexModifierAccessor {
void DestroyPeerImpl(Ark_FlexModifier peer)
{
    auto peerImpl = reinterpret_cast<FlexModifierPeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_FlexModifier ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
} // FlexModifierAccessor
const GENERATED_ArkUIFlexModifierAccessor* GetFlexModifierAccessor()
{
    static const GENERATED_ArkUIFlexModifierAccessor FlexModifierAccessorImpl {
        FlexModifierAccessor::DestroyPeerImpl,
        FlexModifierAccessor::ConstructImpl,
        FlexModifierAccessor::GetFinalizerImpl,
    };
    return &FlexModifierAccessorImpl;
}

struct FlexModifierPeer {
    virtual ~FlexModifierPeer() = default;
};
}
