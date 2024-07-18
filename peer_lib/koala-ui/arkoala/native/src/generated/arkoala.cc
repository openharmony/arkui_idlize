#include <string>
#include <sstream>
#include <algorithm>
#include <chrono>
#include <iomanip>
#include <unordered_map>

#include "common-interop.h"
#include "DeserializerBase.h"

using std::string;

CustomDeserializer* DeserializerBase::customDeserializers = nullptr;

void disposeNodeTmp(KNativePointer* ptr) {
}

KNativePointer impl_GetNodeFinalizer() {
    return fnPtr<KNativePointer>(disposeNodeTmp);
}
KOALA_INTEROP_0(GetNodeFinalizer, KNativePointer)

KInt impl_TestPerfNumber(KInt value) {
    return value + 1;
}
KOALA_INTEROP_1(TestPerfNumber, KInt, KInt)

void impl_TestPerfNumberWithArray(KByte* data, KInt length) {
    if (needGroupedLog(1)) {
        string out("TestPerfNumberWithArray(");
        out.append(std::to_string(data[0]));
        out.append(", ");
        out.append(std::to_string(length));
        out.append(")");
        appendGroupedLog(1, out);
    }
}
KOALA_INTEROP_V2(TestPerfNumberWithArray, KByte*, KInt)

typedef struct PerfInfo {
    long long int start;
    long long int end;
    long long int cost;
    std::string perf_name;
    void Print(std::stringstream& result, float counterSelf = 0.0);
} PerfInfo;

class Performace {
public:
    void PrintAvgs(std::stringstream& result);
    void PrintTotals(std::stringstream& result);
    void PrintPeak(std::stringstream& result);
    void PrintDetails(std::stringstream& result);
    void FinishOne();
    void CalcSelfCost();
    void Clean();
    PerfInfo& GetCurrent();
    static Performace* GetInstance();
private:
    std::unordered_map<std::string, std::vector<PerfInfo>> perfs_;
    PerfInfo current_;
    float self_cost_;
};


Performace* Performace::GetInstance() {
    static Performace perf;
    return &perf;
}

PerfInfo& Performace::GetCurrent() {
    return current_;
}

void Performace::FinishOne() {
    perfs_[current_.perf_name].emplace_back(current_);
}

void Performace::CalcSelfCost() {
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

void Performace::PrintTotals(std::stringstream& result) {
    for (const auto& [name, perfs] : perfs_) {
        float totalCost = 0;
        for (const auto& perf : perfs) {
            totalCost += perf.cost / 1000.0 - self_cost_;
        }
        result << "Perf trace_name(" << name << ") " << perfs.size() << " call total cost " << totalCost << " us.";
    }
}

void Performace::PrintAvgs(std::stringstream& result) {
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

void Performace::PrintPeak(std::stringstream& result) {
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

void Performace::PrintDetails(std::stringstream& result) {
    for (const auto& [name, perfs] : perfs_) {
        for (auto perf : perfs) {
            perf.Print(result);
        }
    }
}

void Performace::Clean() {
    perfs_.clear();
}

void PerfInfo::Print(std::stringstream& result, float counterSelf) {
    result << "Perf trace_name(" << perf_name <<  ") cost " << (cost / 1000.0 - counterSelf) << " us.";
}

void impl_StartPerf(const KStringPtr& traceName) {
    PerfInfo& perf = Performace::GetInstance()->GetCurrent();
    perf.perf_name = traceName.c_str();
    auto now = std::chrono::high_resolution_clock::now();
    perf.start = std::chrono::time_point_cast<std::chrono::nanoseconds>(now).time_since_epoch().count();
}
KOALA_INTEROP_V1(StartPerf, KStringPtr)

void impl_EndPerf(const KStringPtr& traceName) {
    auto now = std::chrono::high_resolution_clock::now();
    PerfInfo& perf = Performace::GetInstance()->GetCurrent();
    perf.end = std::chrono::time_point_cast<std::chrono::nanoseconds>(now).time_since_epoch().count();
    perf.cost = perf.end - perf.start;
    Performace::GetInstance()->FinishOne();
}
KOALA_INTEROP_V1(EndPerf, KStringPtr)

enum DumpOptions {
  TOTAL,
  AVERAGE,
  PEAK,
  DETAILS,
  CLEAR
};

KNativePointer impl_DumpPerf(KInt options) {
    std::stringstream result;
    result << std::fixed << std::setprecision(3);
    Performace::GetInstance()->CalcSelfCost();
    switch (options) {
        case TOTAL:
            Performace::GetInstance()->PrintTotals(result);
            break;
        case AVERAGE:
            Performace::GetInstance()->PrintAvgs(result);
            break;
        case PEAK:
            Performace::GetInstance()->PrintPeak(result);
            break;
        case DETAILS:
            Performace::GetInstance()->PrintDetails(result);
            break;
        case CLEAR:
            Performace::GetInstance()->Clean();
            break;
        default:
            break;
    }
    return new std::string(result.str());
}
KOALA_INTEROP_1(DumpPerf, KNativePointer, KInt)
