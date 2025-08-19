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
namespace DismissDialogActionAccessor {
void DestroyPeerImpl(Ark_DismissDialogAction peer)
{
    auto peerImpl = reinterpret_cast<DismissDialogActionPeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_DismissDialogAction ConstructImpl()
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
void DismissImpl(Ark_DismissDialogAction peer)
{
}
Ark_DismissReason GetReasonImpl(Ark_DismissDialogAction peer)
{
    return {};
}
void SetReasonImpl(Ark_DismissDialogAction peer,
                   Ark_DismissReason reason)
{
}
} // DismissDialogActionAccessor
const GENERATED_ArkUIDismissDialogActionAccessor* GetDismissDialogActionAccessor()
{
    static const GENERATED_ArkUIDismissDialogActionAccessor DismissDialogActionAccessorImpl {
        DismissDialogActionAccessor::DestroyPeerImpl,
        DismissDialogActionAccessor::ConstructImpl,
        DismissDialogActionAccessor::GetFinalizerImpl,
        DismissDialogActionAccessor::DismissImpl,
        DismissDialogActionAccessor::GetReasonImpl,
        DismissDialogActionAccessor::SetReasonImpl,
    };
    return &DismissDialogActionAccessorImpl;
}

struct DismissDialogActionPeer {
    virtual ~DismissDialogActionPeer() = default;
};
}
