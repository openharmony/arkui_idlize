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
namespace TextModifierAccessor {
void DestroyPeerImpl(Ark_TextModifier peer)
{
    auto peerImpl = reinterpret_cast<TextModifierPeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_TextModifier ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
} // TextModifierAccessor
const GENERATED_ArkUITextModifierAccessor* GetTextModifierAccessor()
{
    static const GENERATED_ArkUITextModifierAccessor TextModifierAccessorImpl {
        TextModifierAccessor::DestroyPeerImpl,
        TextModifierAccessor::ConstructImpl,
        TextModifierAccessor::GetFinalizerImpl,
    };
    return &TextModifierAccessorImpl;
}

struct TextModifierPeer {
    virtual ~TextModifierPeer() = default;
};
}
