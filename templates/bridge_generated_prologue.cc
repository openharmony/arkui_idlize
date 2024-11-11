/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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
#include <vector>
#include <string>

#include "common-interop.h"
#include "arkoala_api_generated.h"
#include "Serializers.h"

const %CPP_PREFIX%ArkUIAnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);

static const %CPP_PREFIX%ArkUIFullNodeAPI* GetFullImpl() {
    return reinterpret_cast<const %CPP_PREFIX%ArkUIFullNodeAPI*>(
        GetAnyImpl(static_cast<int>(%CPP_PREFIX%Ark_APIVariantKind::%CPP_PREFIX%FULL),
        %CPP_PREFIX%ARKUI_FULL_API_VERSION, nullptr));
}

static const %CPP_PREFIX%ArkUINodeModifiers* GetNodeModifiers() {
    return GetFullImpl()->getNodeModifiers();
}

static const %CPP_PREFIX%ArkUIAccessors* GetAccessors() {
    return GetFullImpl()->getAccessors();
}

void impl_EmulateClickEvent(KInt nodeId, KFloat x, KFloat y) {
    // TODO: proper fill all by default values for Ark_ClickEvent
    /*
    Ark_ClickEvent event;
    event.target.area.width.type = 0;
    event.target.area.width.value = 0;
    event.target.area.width.unit = 1;
    event.target.area.width.resource = 0;
    event.target.area.height.type = 0;
    event.target.area.height.value = 0;
    event.target.area.height.unit = 1;
    event.target.area.height.resource = 0;
    event.target.area.position.x.tag = ARK_TAG_UNDEFINED;
    event.target.area.position.y.tag = ARK_TAG_UNDEFINED;
    event.target.area.globalPosition.x.tag = ARK_TAG_UNDEFINED;
    event.target.area.globalPosition.y.tag = ARK_TAG_UNDEFINED;
    event.timestamp.tag = ARK_TAG_INT32;
    event.timestamp.i32 = 100;
    event.source = ARK_SOURCE_TYPE_MOUSE;
    event.axisHorizontal.tag = ARK_TAG_UNDEFINED;
    event.axisVertical.tag = ARK_TAG_UNDEFINED;
    event.pressure.tag = ARK_TAG_FLOAT32;
    event.pressure.f32 = 0.0f;
    event.tiltX.tag = ARK_TAG_FLOAT32;
    event.tiltX.f32 = 0.0f;
    event.tiltY.tag = ARK_TAG_FLOAT32;
    event.tiltY.f32 = 0.0f;
    event.sourceTool = ARK_SOURCE_TOOL_MOUSE;
    event.deviceId.value.tag = ARK_TAG_INT32;
    event.deviceId.value.i32 = 0;
    event.displayX.tag = ARK_TAG_FLOAT32;
    event.displayX.f32 = 0.0f;
    event.displayY.tag = ARK_TAG_FLOAT32;
    event.displayY.f32 = 0.0f;
    event.windowX.tag = ARK_TAG_FLOAT32;
    event.windowX.f32 = 0.0f;
    event.windowY.tag = ARK_TAG_FLOAT32;
    event.windowY.f32 = 0.0f;
    event.screenX.tag = ARK_TAG_FLOAT32;
    event.screenX.f32 = 0.0f;
    event.screenY.tag = ARK_TAG_FLOAT32;
    event.screenY.f32 = 0.0f;
    event.x.tag = ARK_TAG_FLOAT32;
    event.x.f32 = x;
    event.y.tag = ARK_TAG_FLOAT32;
    event.y.f32 = y;
    event.preventDefault.resource.resourceId = 0;
    event.preventDefault.resource.hold = [](KInt id){};
    event.preventDefault.resource.release = [](KInt id){};
    event.preventDefault.call = [](KInt id){};

    GetFullImpl()->getEventsAPI()->getCommonMethodEventsReceiver()->onClick0(nodeId, event);
    */
}
KOALA_INTEROP_V3(EmulateClickEvent, KInt, KFloat, KFloat)

void impl_EmulateTextInputEvent(KInt nodeId, const KStringPtr& text) {
    /*
    Ark_String str {
        .chars = text.c_str(),
        .length = static_cast<Ark_Int32>(text.length())
    };
    Opt_PreviewText preview;
    preview.tag = ARK_TAG_UNDEFINED;
    GetFullImpl()->getEventsAPI()->getTextInputEventsReceiver()->onChange(nodeId, str, preview);
    */
}
KOALA_INTEROP_V2(EmulateTextInputEvent, KInt, KStringPtr)
