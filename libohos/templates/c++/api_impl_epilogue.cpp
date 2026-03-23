/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
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

const OH_AnyAPI* impls[16] = { 0 };


const OH_AnyAPI* GetAnyAPIImpl(int kind, int version) {
    switch (kind) {
        case OH_%LIBRARY_NAME%_API_KIND:
            return reinterpret_cast<const OH_AnyAPI*>(Get%LIBRARY_NAME%APIImpl(version));
        default:
            return nullptr;
    }
}

extern "C" const OH_AnyAPI* GENERATED_GetArkAnyAPI(int kind, int version) {
    int maxKind = 15;
    if (kind < 0 || kind > maxKind) {
        return nullptr;
    }
    if (!impls[kind]) {
        impls[kind] = GetAnyAPIImpl(kind, version);
    }
    return impls[kind];
}
