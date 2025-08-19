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
namespace BuilderNodeAccessor {
void DestroyPeerImpl(Ark_BuilderNode peer)
{
    auto peerImpl = reinterpret_cast<BuilderNodePeerImpl *>(peer);
    if (peerImpl) {
        delete peerImpl;
    }
}
Ark_BuilderNode ConstructImpl(Ark_UIContext uiContext,
                              const Opt_RenderOptions* options)
{
    return {};
}
Ark_NativePointer GetFinalizerImpl()
{
    return reinterpret_cast<void *>(&DestroyPeerImpl);
}
void Build0Impl(Ark_BuilderNode peer,
                Ark_WrappedBuilder_Arkui_Component_Builder_CustomBuilder builder)
{
}
void Build1Impl(Ark_BuilderNode peer,
                const Ark_WrappedBuilder* builder,
                const Ark_CustomObject* arg)
{
}
void Build2Impl(Ark_BuilderNode peer,
                const Ark_WrappedBuilder* builder,
                const Ark_CustomObject* arg,
                const Ark_BuildOptions* options)
{
}
void UpdateImpl(Ark_BuilderNode peer,
                const Ark_CustomObject* arg)
{
}
Opt_FrameNode GetFrameNodeImpl(Ark_BuilderNode peer)
{
    return {};
}
Ark_Boolean PostTouchEventImpl(Ark_BuilderNode peer,
                               Ark_TouchEvent event)
{
    return {};
}
void DisposeImpl(Ark_BuilderNode peer)
{
}
void ReuseImpl(Ark_BuilderNode peer,
               const Opt_Object* param)
{
}
void RecycleImpl(Ark_BuilderNode peer)
{
}
void UpdateConfigurationImpl(Ark_BuilderNode peer)
{
}
Ark_Boolean IsDisposedImpl(Ark_BuilderNode peer)
{
    return {};
}
Ark_Boolean PostInputEventImpl(Ark_BuilderNode peer,
                               const Ark_InputEventType* event)
{
    return {};
}
void InheritFreezeOptionsImpl(Ark_BuilderNode peer,
                              Ark_Boolean enabled)
{
}
} // BuilderNodeAccessor
const GENERATED_ArkUIBuilderNodeAccessor* GetBuilderNodeAccessor()
{
    static const GENERATED_ArkUIBuilderNodeAccessor BuilderNodeAccessorImpl {
        BuilderNodeAccessor::DestroyPeerImpl,
        BuilderNodeAccessor::ConstructImpl,
        BuilderNodeAccessor::GetFinalizerImpl,
        BuilderNodeAccessor::Build0Impl,
        BuilderNodeAccessor::Build1Impl,
        BuilderNodeAccessor::Build2Impl,
        BuilderNodeAccessor::UpdateImpl,
        BuilderNodeAccessor::GetFrameNodeImpl,
        BuilderNodeAccessor::PostTouchEventImpl,
        BuilderNodeAccessor::DisposeImpl,
        BuilderNodeAccessor::ReuseImpl,
        BuilderNodeAccessor::RecycleImpl,
        BuilderNodeAccessor::UpdateConfigurationImpl,
        BuilderNodeAccessor::IsDisposedImpl,
        BuilderNodeAccessor::PostInputEventImpl,
        BuilderNodeAccessor::InheritFreezeOptionsImpl,
    };
    return &BuilderNodeAccessorImpl;
}

struct BuilderNodePeer {
    virtual ~BuilderNodePeer() = default;
};
}
