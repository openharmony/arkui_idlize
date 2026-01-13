/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

export const INTEROP_NAMES = {
    getPtr: 'koalaui.interop.getPtr'
}

export const INTEROP_TYPES = {
    pointer: 'koalaui.interop.pointer',
    finalizable: 'koalaui.interop.Finalizable'
}

export const COMMON_TYPES = {
    i32: 'koalaui.common.int32',
    u32: 'koalaui.common.int32',
    f32: 'koalaui.common.float32',
}

export const TYPES = {
    ...COMMON_TYPES,
    ...INTEROP_TYPES,
}

export function makeKnownImports() {
    return new Map([
        ['koalaui.common', '@koalaui/common'],
        ['koalaui.interop', '@koalaui/interop'],
        ['arktsx.graphics.Finalizable', '#handwritten']
    ])
}
export function makeKnownReferences() {
    return Object.values(COMMON_TYPES).map(name => [name, 'koalaui.common'])
        .concat(Object.values(INTEROP_TYPES).map(name => [name, 'koalaui.interop']))
        .concat(Object.values(INTEROP_NAMES).map(name => [name, 'koalaui.interop']))
        .reduce((r, k) => { r.set(k[0], k[1]); return r }, new Map<string, string>())
}
