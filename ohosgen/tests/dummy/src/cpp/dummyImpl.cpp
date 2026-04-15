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
#include "dummy.h"

#include <iostream>
#include <cstring>

// GlobalScope

void GlobalScope_idlDummyImpl()
{
    printf("Output from IDL dummy\n");
}
void GlobalScope_dtsDummyImpl()
{
    printf("Output from DTS dummy\n");
}

// DTSDummyClass
// IDLDummyClass

// SampleI

class SampleIPeer {
public:
    OH_Boolean flag = 0;
};

void SampleI_callHolderImpl(OH_NativePointer thisPtr) {
}
OH_DUMMY_SampleIHandle SampleI_constructImpl() {
    return reinterpret_cast<OH_DUMMY_SampleIHandle>(new SampleIPeer());
}
void SampleI_destructImpl(OH_DUMMY_SampleIHandle thisPtr) {
}
OH_Boolean SampleI_getFlagImpl(OH_NativePointer thisPtr) {
    return ((SampleIPeer*)thisPtr)->flag;
}
OH_Boolean SampleI_isSupportedImpl(OH_NativePointer thisPtr) {
    return {};
}
void SampleI_setFlagImpl(OH_NativePointer thisPtr, OH_Boolean value) {
    printf("[Native] setFlag: %d\n", value);
    ((SampleIPeer*)thisPtr)->flag = value;
}

OH_DUMMY_SampleI GlobalScope_getSampleIImpl() {
    printf("[Native] getSampleI\n");
    return reinterpret_cast<OH_DUMMY_SampleI>(new SampleIPeer());
}

OH_DUMMY_SampleCHandle SampleC_constructImpl() {
    return reinterpret_cast<OH_DUMMY_SampleCHandle>(new SampleIPeer());
}
void SampleC_destructImpl(OH_DUMMY_SampleCHandle thisPtr) {
}

void SampleC_callHolderImpl(OH_NativePointer thisPtr) {
}
OH_Boolean SampleC_getFlagImpl(OH_NativePointer thisPtr) {
    return ((SampleIPeer*)thisPtr)->flag;
}
OH_Boolean SampleC_isSupportedImpl(OH_NativePointer thisPtr) {
    return {};
}
void SampleC_setFlagImpl(OH_NativePointer thisPtr, OH_Boolean value) {
    printf("[Native] setFlag: %d\n", value);
    ((SampleIPeer*)thisPtr)->flag = value;
}

OH_DUMMY_SampleC GlobalScope_getSampleCImpl() {
    printf("[Native] getSampleC\n");
    return reinterpret_cast<OH_DUMMY_SampleC>(new SampleIPeer());
}
