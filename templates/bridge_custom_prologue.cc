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

#include <string>
#include <sstream>
#include <algorithm>
#include <chrono>
#include <iomanip>
#include <unordered_map>

#include "common-interop.h"
#include "interop-logging.h"

#include "arkoala_api_generated.h"
#include "Serializers.h"

const %CPP_PREFIX%ArkUIAnyAPI* GetAnyImpl(int kind, int version, std::string* result = nullptr);

const %CPP_PREFIX%ArkUIBasicNodeAPI* GetArkUIBasicNodeAPI() {
    return reinterpret_cast<const %CPP_PREFIX%ArkUIBasicNodeAPI*>(
        GetAnyImpl(static_cast<int>(%CPP_PREFIX%Ark_APIVariantKind::%CPP_PREFIX%BASIC),
        %CPP_PREFIX%ARKUI_BASIC_NODE_API_VERSION));
}

const %CPP_PREFIX%ArkUIExtendedNodeAPI* GetArkUIExtendedNodeAPI() {
    return reinterpret_cast<const %CPP_PREFIX%ArkUIExtendedNodeAPI*>(
        GetAnyImpl(static_cast<int>(%CPP_PREFIX%Ark_APIVariantKind::%CPP_PREFIX%EXTENDED),
        %CPP_PREFIX%ARKUI_EXTENDED_NODE_API_VERSION));
}

CustomDeserializer* DeserializerBase::customDeserializers = nullptr;

// set delay API

// TODO: remove or properly implement for dummy case.
namespace TreeNodeDelays {
    void SetCreateNodeDelay(GENERATED_Ark_NodeType type, Ark_Int64 nanoseconds) {}
    void SetMeasureNodeDelay(GENERATED_Ark_NodeType type, Ark_Int64 nanoseconds) {}
    void SetLayoutNodeDelay(GENERATED_Ark_NodeType type, Ark_Int64 nanoseconds) {}
    void SetDrawNodeDelay(GENERATED_Ark_NodeType type, Ark_Int64 nanoseconds) {}
}

void impl_SetCreateNodeDelay(Ark_Int32 type, Ark_Int64 nanoseconds) {
    GENERATED_Ark_NodeType typeCast = GENERATED_Ark_NodeType(type);
    TreeNodeDelays::SetCreateNodeDelay(typeCast, nanoseconds);
}
KOALA_INTEROP_V2(SetCreateNodeDelay, Ark_Int32, Ark_Int64)

void impl_SetMeasureNodeDelay(Ark_Int32 type, Ark_Int64 nanoseconds) {
    GENERATED_Ark_NodeType typeCast = GENERATED_Ark_NodeType(type);
    TreeNodeDelays::SetMeasureNodeDelay(typeCast, nanoseconds);
}
KOALA_INTEROP_V2(SetMeasureNodeDelay, Ark_Int32, Ark_Int64)

void impl_SetLayoutNodeDelay(Ark_Int32 type, Ark_Int64 nanoseconds) {
    GENERATED_Ark_NodeType typeCast = GENERATED_Ark_NodeType(type);
    TreeNodeDelays::SetLayoutNodeDelay(typeCast, nanoseconds);
}
KOALA_INTEROP_V2(SetLayoutNodeDelay, Ark_Int32, Ark_Int64)

void impl_SetDrawNodeDelay(Ark_Int32 type, Ark_Int64 nanoseconds) {
    GENERATED_Ark_NodeType typeCast = GENERATED_Ark_NodeType(type);
    TreeNodeDelays::SetDrawNodeDelay(typeCast, nanoseconds);
}
KOALA_INTEROP_V2(SetDrawNodeDelay, Ark_Int32, Ark_Int64)

// TODO: Remove all this.
void disposeNode(KNativePointer* ptr) {
    GetArkUIBasicNodeAPI()->disposeNode((Ark_NodeHandle)ptr);
}
KNativePointer impl_GetNodeFinalizer() {
    return fnPtr<KNativePointer>(disposeNode);
}
KOALA_INTEROP_0(GetNodeFinalizer, KNativePointer)

// custom methods
void impl_ShowCrash(const KStringPtr& messagePtr) {
    GetArkUIExtendedNodeAPI()->showCrash(messagePtr.c_str());
}
KOALA_INTEROP_V1(ShowCrash, KStringPtr)

Ark_Int32 impl_LayoutNode(KVMContext vmContext, Ark_NativePointer nodePtr, KFloatArray data) {
    return GetArkUIExtendedNodeAPI()->layoutNode((Ark_VMContext)vmContext, (Ark_NodeHandle)nodePtr, (Ark_Float32(*)[2])data);
}
KOALA_INTEROP_CTX_2(LayoutNode, Ark_Int32, Ark_NativePointer, KFloatArray)

struct PerfInfo {
    int64_t start;
    int64_t end;
    int64_t cost;
    std::string perf_name;
    void Print(std::stringstream& result, float counterSelf = 0.0) {
        result << "Perf trace_name(" << perf_name <<  ") cost " << (cost / 1000.0 - counterSelf) << " us.";
    }
};

class Performance {
  public:
    void PrintAvgs(std::stringstream& result) {
        for (const auto& [name, perfs] : perfs_) {
            if (name == "perf_counter_self_cost") continue;
            float totalCost = 0;
            for (const auto& perf : perfs) {
                totalCost += perf.cost / 1000.0 - self_cost_;
            }
            auto avg = totalCost / perfs.size();
            result << "Perf trace_name(" << name << ") " << perfs.size() << " call avg cost " << avg << " us.";
        }
    }
    void PrintTotals(std::stringstream& result) {
        for (const auto& [name, perfs] : perfs_) {
            float totalCost = 0;
            for (const auto& perf : perfs) {
                totalCost += perf.cost / 1000.0 - self_cost_;
            }
            result << "Perf trace_name(" << name << ") " << perfs.size() << " call total cost " << totalCost << " us.";
        }
    }
    void PrintPeak(std::stringstream& result) {
        for(auto &kv : perfs_) {
            std::sort(kv.second.begin(), kv.second.end(), [](const PerfInfo &perf1, const PerfInfo &perf2) {
                return perf1.cost > perf2.cost;
            });
            auto maxCost = kv.second.front().cost / 1000.0 - self_cost_;
            auto minCost = kv.second.back().cost / 1000.0 - self_cost_;
            result << "Perf trace_name(" << kv.first << ") " << " maxCost = " << maxCost << " us, ";
            result << "minCost = " << minCost << " us.";
        }
    }
    void PrintDetails(std::stringstream& result) {
        for (const auto& [name, perfs] : perfs_) {
            for (auto perf : perfs) {
                perf.Print(result);
            }
        }
    }
    void FinishOne() {
        perfs_[current_.perf_name].emplace_back(current_);
    }
    void CalcSelfCost() {
        float totalCost = 0.0;
        auto it = perfs_.find("perf_counter_self_cost");
        if (it == perfs_.end()) {
            self_cost_ = totalCost;
            return;
        }
        for (const auto& perf : it->second) {
            totalCost += perf.cost / 1000.0;
        }
        self_cost_ = totalCost / it->second.size();
    }
    void Clean() {
        perfs_.clear();
    }
    PerfInfo* GetCurrent() { return &current_; }
    static Performance* GetInstance() {
        static Performance perf;
        return &perf;
    }
private:
    std::unordered_map<std::string, std::vector<PerfInfo>> perfs_;
    PerfInfo current_;
    float self_cost_;
};

void impl_StartPerf(const KStringPtr& traceName) {
    PerfInfo* perf = Performance::GetInstance()->GetCurrent();
    perf->perf_name = traceName.c_str();
    auto now = std::chrono::high_resolution_clock::now();
    perf->start = std::chrono::time_point_cast<std::chrono::nanoseconds>(now).time_since_epoch().count();
}
KOALA_INTEROP_V1(StartPerf, KStringPtr)

void impl_EndPerf(const KStringPtr& traceName) {
    auto now = std::chrono::high_resolution_clock::now();
    PerfInfo* perf = Performance::GetInstance()->GetCurrent();
    perf->end = std::chrono::time_point_cast<std::chrono::nanoseconds>(now).time_since_epoch().count();
    perf->cost = perf->end - perf->start;
    Performance::GetInstance()->FinishOne();
}
KOALA_INTEROP_V1(EndPerf, KStringPtr)

enum DumpOptions {
    TOTAL = 0,
    AVERAGE = 1,
    PEAK = 2,
    DETAILS = 3,
    CLEAR = 4
};

KNativePointer impl_DumpPerf(KInt options) {
    std::stringstream result;
    result << std::fixed << std::setprecision(3);
    auto perf = Performance::GetInstance();
    perf->CalcSelfCost();
    switch (options) {
        case TOTAL:
            perf->PrintTotals(result);
            break;
        case AVERAGE:
            perf->PrintAvgs(result);
            break;
        case PEAK:
            perf->PrintPeak(result);
            break;
        case DETAILS:
            perf->PrintDetails(result);
            break;
        case CLEAR:
            perf->Clean();
            break;
        default:
            break;
    }
    return new std::string(result.str());
}
KOALA_INTEROP_1(DumpPerf, KNativePointer, KInt)
