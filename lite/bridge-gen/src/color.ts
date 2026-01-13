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

import { createReferenceType, getFQName, IDLInterface, IDLReferenceType, isInterface, linearizeNamespaceMembers } from "@idlizer/core/idl";
import { ColoredLibrary, InputLibrary } from "./library";

type ColorIndex = ColoredLibrary['color']

function forEachInterface(library: InputLibrary, op: (e: IDLInterface) => void) {
    linearizeNamespaceMembers(library.files.flatMap(file => file.entries))
        .forEach(entry => {
            if (isInterface(entry)) {
                op(entry)
            }
        })
}

function findMaterializedRoots(library: InputLibrary, colors: ColorIndex) {
    forEachInterface(library, entry => {
        if (entry.methods.length || entry.constructors.length) {
            colors.set(getFQName(entry), 'materialized')
        }
    })
}
function markTransitiveMaterialized(ref:IDLReferenceType, library: InputLibrary, colors: ColorIndex): boolean {
    const found = library.index.get(ref.name)
    if (!found) {
        return false
    }
    if (!isInterface(found)) {
        return false
    }
    if (colors.get(getFQName(found)) === 'materialized') {
        return true
    }
    if (found.inheritance.some(ref => markTransitiveMaterialized(ref, library, colors))) {
        colors.set(getFQName(found), 'materialized')
        return true
    }
    return false
}
function spreadMaterializedRoots(library: InputLibrary, colors: ColorIndex) {
    forEachInterface(library, entry => {
        const name = getFQName(entry)
        if (colors.has(name)) {
            return
        }
        markTransitiveMaterialized(createReferenceType(entry), library, colors)
    })
}
function treatRestAs(what:string, library: InputLibrary, colors: ColorIndex) {
    forEachInterface(library, entry => {
        const name = getFQName(entry)
        if (!colors.has(name)) {
            colors.set(name, what)
        }
    })
}

export function colorLibrary(library: InputLibrary): ColoredLibrary {
    const color: ColorIndex = new Map()
    findMaterializedRoots(library, color)
    spreadMaterializedRoots(library, color)
    treatRestAs('structure', library, color)
    return {
        ...library,
        color,
    }
}
