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

#define KOALA_INTEROP_MODULE NotSpecifiedInteropModule
#include "common-interop.h"
#include "ohos_data_unifieddatachannel.h"

OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryHandle unifiedDataChannel_Summary_constructImpl();
void unifiedDataChannel_Summary_destructImpl(OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryHandle thisPtr);
Map_String_Number unifiedDataChannel_Summary_getSummaryImpl(OH_NativePointer thisPtr);
OH_Number unifiedDataChannel_Summary_getTotalSizeImpl(OH_NativePointer thisPtr);
void unifiedDataChannel_Summary_setSummaryImpl(OH_NativePointer thisPtr, const Map_String_Number* value);
void unifiedDataChannel_Summary_setTotalSizeImpl(OH_NativePointer thisPtr, const OH_Number* value);
void unifiedDataChannel_UnifiedData_addRecordImpl(OH_NativePointer thisPtr, OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord record_);
OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataHandle unifiedDataChannel_UnifiedData_construct0Impl(OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecord record_);
OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataHandle unifiedDataChannel_UnifiedData_construct1Impl();
void unifiedDataChannel_UnifiedData_destructImpl(OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataHandle thisPtr);
Array_unifiedDataChannel_UnifiedRecord unifiedDataChannel_UnifiedData_getRecordsImpl(OH_NativePointer thisPtr);
OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordHandle unifiedDataChannel_UnifiedRecord_construct0Impl();
OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordHandle unifiedDataChannel_UnifiedRecord_construct1Impl(const OH_String* type, const Opt_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object* value);
void unifiedDataChannel_UnifiedRecord_destructImpl(OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordHandle thisPtr);
OH_String unifiedDataChannel_UnifiedRecord_getTypeImpl(OH_NativePointer thisPtr);
Opt_Union_Number_String_Boolean_Image_PixelMap_Want_Buffer_Object unifiedDataChannel_UnifiedRecord_getValueImpl(OH_NativePointer thisPtr);
const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryModifier* OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryModifierImpl() {
    const static OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryModifier instance = {
        &unifiedDataChannel_Summary_constructImpl,
        &unifiedDataChannel_Summary_destructImpl,
        &unifiedDataChannel_Summary_getSummaryImpl,
        &unifiedDataChannel_Summary_setSummaryImpl,
        &unifiedDataChannel_Summary_getTotalSizeImpl,
        &unifiedDataChannel_Summary_setTotalSizeImpl,
    };
    return &instance;
}
const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataModifier* OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataModifierImpl() {
    const static OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataModifier instance = {
        &unifiedDataChannel_UnifiedData_construct0Impl,
        &unifiedDataChannel_UnifiedData_construct1Impl,
        &unifiedDataChannel_UnifiedData_destructImpl,
        &unifiedDataChannel_UnifiedData_addRecordImpl,
        &unifiedDataChannel_UnifiedData_getRecordsImpl,
    };
    return &instance;
}
const OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordModifier* OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordModifierImpl() {
    const static OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordModifier instance = {
        &unifiedDataChannel_UnifiedRecord_construct0Impl,
        &unifiedDataChannel_UnifiedRecord_construct1Impl,
        &unifiedDataChannel_UnifiedRecord_destructImpl,
        &unifiedDataChannel_UnifiedRecord_getTypeImpl,
        &unifiedDataChannel_UnifiedRecord_getValueImpl,
    };
    return &instance;
}
extern "C" const OH_OHOS_DATA_UNIFIEDDATACHANNEL_API* GetOHOS_DATA_UNIFIEDDATACHANNELAPIImpl(int version) {
    const static OH_OHOS_DATA_UNIFIEDDATACHANNEL_API api = {
        1, // version
        &OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_SummaryModifierImpl,
        &OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedDataModifierImpl,
        &OH_OHOS_DATA_UNIFIEDDATACHANNEL_unifiedDataChannel_UnifiedRecordModifierImpl,
    };
    if (version != api.version) return nullptr;
    return &api;
}
const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_OHOS_DATA_UNIFIEDDATACHANNEL_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(GetOHOS_DATA_UNIFIEDDATACHANNELAPIImpl(version));
        default:
            return nullptr;
    }
}

extern "C" const OH_AnyAPI* GENERATED_GetArkAnyAPI(int kind, int version) {
    if (kind < 0 || kind > 15) return nullptr;
    if (!impls[kind]) {
        impls[kind] = GetAnyAPIImpl(kind, version);
    }
    return impls[kind];
}
