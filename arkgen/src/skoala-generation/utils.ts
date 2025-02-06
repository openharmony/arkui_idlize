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

import { ImportFeature } from '@idlizer/libohos'

export namespace Skoala {
    export enum BaseClasses {
        Finalizable = "Finalizable",
        RefCounted = "RefCounted"
    }
    export const NativeModuleImportFeature: ImportFeature = {
        module: "@koalaui/arkoala",
        feature: "nativeModule"
    }
    export const getFinalizer = "getFinalizer"
    export function nativeMethod(className: string, methodName: string) {
        return `_skoala_${className}_${methodName}`
    }

    export function isBaseClass(name: string): boolean {
        return name in BaseClasses
    }
}
