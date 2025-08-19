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
namespace DrawContextAccessor {
void DestroyPeerImpl(Ark_DrawContext peer)
{
    auto peerImpl = reinterpret_cast<DrawContextPeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_DrawContext ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
Ark_Size GetSizeImpl(Ark_DrawContext peer)
{
    return {};
}
void SetSizeImpl(Ark_DrawContext peer,
                 const Ark_Size* size)
{
}
Ark_Size GetSizeInPixelImpl(Ark_DrawContext peer)
{
    return {};
}
void SetSizeInPixelImpl(Ark_DrawContext peer,
                        const Ark_Size* sizeInPixel)
{
}
Ark_drawing_Canvas GetCanvasImpl(Ark_DrawContext peer)
{
    return {};
}
void SetCanvasImpl(Ark_DrawContext peer,
                   Ark_drawing_Canvas canvas)
{
}
} // DrawContextAccessor
const GENERATED_ArkUIDrawContextAccessor* GetDrawContextAccessor()
{
    static const GENERATED_ArkUIDrawContextAccessor DrawContextAccessorImpl {
        DrawContextAccessor::DestroyPeerImpl,
        DrawContextAccessor::ConstructImpl,
        DrawContextAccessor::GetFinalizerImpl,
        DrawContextAccessor::GetSizeImpl,
        DrawContextAccessor::SetSizeImpl,
        DrawContextAccessor::GetSizeInPixelImpl,
        DrawContextAccessor::SetSizeInPixelImpl,
        DrawContextAccessor::GetCanvasImpl,
        DrawContextAccessor::SetCanvasImpl,
    };
    return &DrawContextAccessorImpl;
}

struct DrawContextPeer {
    virtual ~DrawContextPeer() = default;
};
}
