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
#include "library.h"
#include "common-interop.h"
#include "arkoala_api_generated.h"
#include "Serializers.h"
#include "arkoala-logging.h"

const %CPP_PREFIX%ArkUIBasicNodeAPI* GetArkUIBasicNodeAPI() {
    return reinterpret_cast<const %CPP_PREFIX%ArkUIBasicNodeAPI*>(
        GetAnyImpl(static_cast<ArkUIAPIVariantKind>(%CPP_PREFIX%Ark_APIVariantKind::%CPP_PREFIX%BASIC), 
        %CPP_PREFIX%ARKUI_BASIC_NODE_API_VERSION));
}

const %CPP_PREFIX%ArkUIExtendedNodeAPI* GetArkUIExtendedNodeAPI() {
    return reinterpret_cast<const %CPP_PREFIX%ArkUIExtendedNodeAPI*>(
        GetAnyImpl(static_cast<ArkUIAPIVariantKind>(%CPP_PREFIX%Ark_APIVariantKind::%CPP_PREFIX%EXTENDED), 
        %CPP_PREFIX%ARKUI_EXTENDED_NODE_API_VERSION));
}

void impl_ShowCrash(const KStringPtr& messagePtr) {
    GetArkUIExtendedNodeAPI()->showCrash(messagePtr.c_str());
}
KOALA_INTEROP_V1(ShowCrash, KStringPtr)

Ark_Int32 impl_LayoutNode(KVMContext vmContext, Ark_NativePointer nodePtr, KFloatArray data) {
    return GetArkUIExtendedNodeAPI()->layoutNode((Ark_VMContext)vmContext, (Ark_NodeHandle)nodePtr, (Ark_Float32(*)[2])data);
}
KOALA_INTEROP_CTX_2(LayoutNode, Ark_Int32, Ark_NativePointer, KFloatArray)