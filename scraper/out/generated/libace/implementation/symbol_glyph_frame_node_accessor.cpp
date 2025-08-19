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
namespace typeNode_SymbolGlyphFrameNodeAccessor {
void DestroyPeerImpl(Ark_typeNode_SymbolGlyphFrameNode peer)
{
    auto peerImpl = reinterpret_cast<typeNode_SymbolGlyphFrameNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_typeNode_SymbolGlyphFrameNode ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_SymbolGlyphAttribute InitializeImpl(Ark_typeNode_SymbolGlyphFrameNode peer,
                                        const Opt_Resource* value)
{
    return {};
}
} // typeNode_SymbolGlyphFrameNodeAccessor
const GENERATED_ArkUITypeNode_SymbolGlyphFrameNodeAccessor* GetTypeNode_SymbolGlyphFrameNodeAccessor()
{
    static const GENERATED_ArkUITypeNode_SymbolGlyphFrameNodeAccessor TypeNode_SymbolGlyphFrameNodeAccessorImpl {
        typeNode_SymbolGlyphFrameNodeAccessor::DestroyPeerImpl,
        typeNode_SymbolGlyphFrameNodeAccessor::ConstructImpl,
        typeNode_SymbolGlyphFrameNodeAccessor::GetFinalizerImpl,
        typeNode_SymbolGlyphFrameNodeAccessor::InitializeImpl,
    };
    return &TypeNode_SymbolGlyphFrameNodeAccessorImpl;
}

struct TypeNode_SymbolGlyphFrameNodePeer {
    virtual ~TypeNode_SymbolGlyphFrameNodePeer() = default;
};
}
