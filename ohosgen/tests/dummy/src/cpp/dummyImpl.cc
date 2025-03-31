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
#include <string.h>

// GlobalScope

void GlobalScope_idlDummyImpl() {
    printf("Output from IDL dummy\n");
}
void GlobalScope_dtsDummyImpl() {
    printf("Output from DTS dummy\n");
}

/*
// DTSDummyClass
class DTSDummyClassPeer
{
};

OH_DUMMY_DTSDummyClassHandle DTSDummyClass_constructImpl() {
    return (OH_DUMMY_DTSDummyClassHandle) new DTSDummyClassPeer();
}
void DTSDummyClass_destructImpl(OH_DUMMY_DTSDummyClassHandle thisPtr) {
}
void DTSDummyClass_dummyImpl(OH_NativePointer thisPtr) {
    printf("Call DTS dummy impl method!\n");
}
*/

/*
// IDLDummyClass
class IDLDummyClassPeer
{
};

OH_DUMMY_IDLDummyClassHandle IDLDummyClass_constructImpl() {
    return (OH_DUMMY_IDLummyClassHandle) new IDLDummyClassPeer();
}
void IDLDummyClass_destructImpl(OH_DUMMY_IDLDummyClassHandle thisPtr) {
}
void IDLDummyClass_dummyImpl(OH_NativePointer thisPtr) {
    printf("Call dummy impl method!\n");
}
*/