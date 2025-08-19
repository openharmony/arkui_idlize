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
namespace SymbolGlyphModifierAccessor {
void DestroyPeerImpl(Ark_SymbolGlyphModifier peer)
{
    auto peerImpl = reinterpret_cast<SymbolGlyphModifierPeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_SymbolGlyphModifier ConstructImpl(const Opt_Resource* src)
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
} // SymbolGlyphModifierAccessor
const GENERATED_ArkUISymbolGlyphModifierAccessor* GetSymbolGlyphModifierAccessor()
{
    static const GENERATED_ArkUISymbolGlyphModifierAccessor SymbolGlyphModifierAccessorImpl {
        SymbolGlyphModifierAccessor::DestroyPeerImpl,
        SymbolGlyphModifierAccessor::ConstructImpl,
        SymbolGlyphModifierAccessor::GetFinalizerImpl,
    };
    return &SymbolGlyphModifierAccessorImpl;
}

struct SymbolGlyphModifierPeer {
    virtual ~SymbolGlyphModifierPeer() = default;
};
}
