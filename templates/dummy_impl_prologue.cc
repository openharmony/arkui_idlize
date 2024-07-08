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
#include "Serializers.h"
#include "arkoala-logging.h"
#include "common-interop.h"
#include "arkoala-macros.h"

typedef void (*AppendGroupedLogSignature)(int32_t, const std::string&);

AppendGroupedLogSignature appendGroupedLogPtr = nullptr;

void SetAppendGroupedLog(void* logger) {
    if (logger) appendGroupedLogPtr = reinterpret_cast<AppendGroupedLogSignature>(logger);
}

void dummyClassFinalizer(KNativePointer* ptr) {
    char hex[20];
    std::snprintf(hex, sizeof(hex), "0x%llx", (long long)ptr);
    string out("dummyClassFinalizer(");
    out.append(hex);
    out.append(")");
    appendGroupedLog(1, out);
}

namespace OHOS::Ace::NG {
namespace Bridge {
Ark_NodeHandle CreateNode(GENERATED_Ark_NodeType type, Ark_Int32 id, Ark_Int32 flags) {
    static uintptr_t peer_num = 1;
    Ark_NodeHandle result = (Ark_NodeHandle) peer_num++;

    if (needGroupedLog(2)) {
        std::string _logData;
        _logData.append("  Ark_NodeHandle peer" + std::to_string((uintptr_t)result) + " = GetBasicNodeApi()->createNode(GENERATED_Ark_NodeType("
            + std::to_string(type) + "), " + std::to_string(id) + ", " + std::to_string(flags) + ");\n");
        appendGroupedLog(2, _logData);
    }

    if (!needGroupedLog(1)) {
        return result;
    }
    string out("createNode(");
    WriteToString(&out, (Ark_Int32)type);
    out.append(", ");
    WriteToString(&out, id);
    out.append(", ");
    WriteToString(&out, flags);
    out.append(")");
    appendGroupedLog(1, out);
    return result;
}

void SetCallbackMethod(%CPP_PREFIX%Ark_APICallbackMethod* method) {}
void RegisterCustomNodeEventReceiver(%CPP_PREFIX%CustomEventReceiver eventReceiver) {}
int CheckEvent(%CPP_PREFIX%Ark_NodeEvent* event) {
    return 0;
}
void SendAsyncEvent(%CPP_PREFIX%Ark_NodeEvent* event) {}
void CallContinuation(Ark_Int32 continuationId, Ark_Int32 argCount, %CPP_PREFIX%Ark_EventCallbackArg* args) {}
}

Ark_Float32 GetDensity(Ark_Int32 deviceId) {
    Ark_Float32 result = 1.0f;

    if (!needGroupedLog(1)) {
        return result;
    }

    string out("getDensity(");
    WriteToString(&out, deviceId);
    out.append(")");
    appendGroupedLog(1, out);

    return result;
}

Ark_Float32 GetFontScale(Ark_Int32 deviceId) {
    Ark_Float32 result = 1.0f;

    if (!needGroupedLog(1)) {
        return result;
    }

    string out("getFontScale(");
    WriteToString(&out, deviceId);
    out.append(")");
    appendGroupedLog(1, out);

    return result;
}

Ark_Float32 GetDesignWidthScale(Ark_Int32 deviceId) {
    Ark_Float32 result = 1.0f;

    if (!needGroupedLog(1)) {
        return result;
    }

    string out("getDesignWidthScale(");
    WriteToString(&out, deviceId);
    out.append(")");
    appendGroupedLog(1, out);

    return result;
}

namespace ApiImpl {
Ark_NodeHandle GetNodeByViewStack() {
    Ark_NodeHandle result = (Ark_NodeHandle) 234;
    if (!needGroupedLog(1)) {
        return result;
    }
    string out("getNodeByViewStack()");
    appendGroupedLog(1, out);
    return result;
}

void DisposeNode(Ark_NodeHandle node) {
    if (!needGroupedLog(1)) {
        return;
    }

    string out("disposeNode(");
    WriteToString(&out, node);
    out.append(")");
    appendGroupedLog(1, out);
}

Ark_Int32 AddChild(Ark_NodeHandle parent, Ark_NodeHandle child) {
    if (!needGroupedLog(1)) {
        return 0;
    }

    string out("addChild(");
    WriteToString(&out, parent);
    out.append(", ");
    WriteToString(&out, child);
    out.append(")");
    appendGroupedLog(1, out);

    // TODO: implement test
    return 0; // ERROR_CODE_NO_ERROR
}

void RemoveChild(Ark_NodeHandle parent, Ark_NodeHandle child) {
    if (!needGroupedLog(1)) {
        return;
    }

    string out("removeChild(");
    WriteToString(&out, parent);
    out.append(", ");
    WriteToString(&out, child);
    out.append(")");
    appendGroupedLog(1, out);
}

Ark_Int32 InsertChildAfter(Ark_NodeHandle parent, Ark_NodeHandle child, Ark_NodeHandle sibling) {
    if (!needGroupedLog(1)) {
        return 0;
    }

    string out("insertChildAfter(");
    WriteToString(&out, parent);
    out.append(", ");
    WriteToString(&out, child);
    out.append(", ");
    WriteToString(&out, sibling);
    out.append(")");
    appendGroupedLog(1, out);
    return 0;
}

Ark_Int32 InsertChildBefore(Ark_NodeHandle parent, Ark_NodeHandle child, Ark_NodeHandle sibling) {
    if (!needGroupedLog(1)) {
        return 0;
    }

    string out("insertChildBefore(");
    WriteToString(&out, parent);
    out.append(", ");
    WriteToString(&out, child);
    out.append(", ");
    WriteToString(&out, sibling);
    out.append(")");
    appendGroupedLog(1, out);
    return 0;
}

Ark_Int32 InsertChildAt(Ark_NodeHandle parent, Ark_NodeHandle child, Ark_Int32 position) {
    if (!needGroupedLog(1)) {
        return 0;
    }

    string out("insertChildAt(");
    WriteToString(&out, parent);
    out.append(", ");
    WriteToString(&out, child);
    out.append(", ");
    WriteToString(&out, position);
    out.append(")");
    appendGroupedLog(1, out);
    return 0;
}

void ApplyModifierFinish(Ark_NodeHandle node) {
    if (!needGroupedLog(1)) {
        return;
    }
    string out("applyModifierFinish(");
    WriteToString(&out, node);
    out.append(")");
    appendGroupedLog(1, out);
}

void MarkDirty(Ark_NodeHandle node, Ark_UInt32 flag) {
    if (!needGroupedLog(1)) {
        return;
    }
    string out("markDirty(");
    WriteToString(&out, node);
    out.append(", ");
    WriteToString(&out, flag);
    out.append(")");
    appendGroupedLog(1, out);
}

Ark_Boolean IsBuilderNode(Ark_NodeHandle node) {
    Ark_Boolean result = true;
    if (!needGroupedLog(1)) {
        return result;
    }
    string out("isBuilderNode(");
    WriteToString(&out, node);
    out.append(")");
    appendGroupedLog(1, out);
    return result;
}

Ark_Float32 ConvertLengthMetricsUnit(Ark_Float32 value, Ark_Int32 originUnit, Ark_Int32 targetUnit) {
    Ark_Float32 result = value * originUnit;
    if (!needGroupedLog(1)) {
        return result;
    }

    string out("convertLengthMetricsUnit(");
    WriteToString(&out, value);
    out.append(", ");
    WriteToString(&out, originUnit);
    out.append(", ");
    WriteToString(&out, targetUnit);
    out.append(")");
    appendGroupedLog(1, out);
    return result;
}

void SetCustomMethodFlag(Ark_NodeHandle node, Ark_Int32 flag) {}
Ark_Int32 GetCustomMethodFlag(Ark_NodeHandle node) {
    return 0;
}
void RegisterCustomNodeAsyncEvent(Ark_NodeHandle node, Ark_Int32 eventType, void* extraParam) {}
Ark_Int32 UnregisterCustomNodeEvent(Ark_NodeHandle node, Ark_Int32 eventType) {
    return 0;
}

void SetCustomCallback(Ark_VMContext context, Ark_NodeHandle node, Ark_Int32 callback) {}

Ark_Int32 MeasureLayoutAndDraw(Ark_VMContext vmContext, Ark_NodeHandle rootPtr) {
    return 0;
}

Ark_Int32 MeasureNode(Ark_VMContext vmContext, Ark_NodeHandle node, Ark_Float32* data) {
    return 0;
}

Ark_Int32 LayoutNode(Ark_VMContext vmContext, Ark_NodeHandle node, Ark_Float32* data) {
    return 0;
}

Ark_Int32 DrawNode(Ark_VMContext vmContext, Ark_NodeHandle node, Ark_Float32* data) {
    return 0;
}

void SetAttachNodePtr(Ark_NodeHandle node, void* value) {}
void* GetAttachNodePtr(Ark_NodeHandle node) {
    return nullptr;
}
void SetMeasureWidth(Ark_NodeHandle node, Ark_Int32 value) {}

Ark_Int32 GetMeasureWidth(Ark_NodeHandle node) {
    return 0;
}

void SetMeasureHeight(Ark_NodeHandle node, Ark_Int32 value) {}
Ark_Int32 GetMeasureHeight(Ark_NodeHandle node) {
    return 0;
}
void SetX(Ark_NodeHandle node, Ark_Int32 value) {}
void SetY(Ark_NodeHandle node, Ark_Int32 value) {}
Ark_Int32 GetX(Ark_NodeHandle node) {
    return 0;
}
Ark_Int32 GetY(Ark_NodeHandle node) {
    return 0;
}
void SetAlignment(Ark_NodeHandle node, Ark_Int32 value) {}
Ark_Int32 GetAlignment(Ark_NodeHandle node) {
    return 0;
}
void GetLayoutConstraint(Ark_NodeHandle node, Ark_Int32* value) {}
Ark_Int32 IndexerChecker(Ark_VMContext vmContext, Ark_NodeHandle nodePtr) {
    return 0;
}
void SetRangeUpdater(Ark_NodeHandle nodePtr, Ark_Int32 updaterId) {}
void SetLazyItemIndexer(Ark_VMContext vmContext, Ark_NodeHandle nodePtr, Ark_Int32 indexerId) {}
Ark_PipelineContext GetPipelineContext(Ark_NodeHandle node) {
    return nullptr;
}
void SetVsyncCallback(Ark_VMContext vmContext, Ark_PipelineContext pipelineContext, Ark_Int32 callbackId) {}
void UnblockVsyncWait(Ark_VMContext vmContext, Ark_PipelineContext pipelineContext) {}
void SetChildTotalCount(Ark_NodeHandle node, Ark_Int32 totalCount) {}
void ShowCrash(Ark_CharPtr message) {}
}

namespace GeneratedEvents {
    const %CPP_PREFIX%ArkUIEventsAPI* g_OverriddenEventsImpl = nullptr;
    const %CPP_PREFIX%ArkUIEventsAPI* %CPP_PREFIX%GetArkUiEventsAPI() { return g_OverriddenEventsImpl; }
    void %CPP_PREFIX%SetArkUiEventsAPI(const %CPP_PREFIX%ArkUIEventsAPI* api) { g_OverriddenEventsImpl = api; }
}
}