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

import * as idl from "../idl"
import { warn } from "../util"
import { DiagnosticMessageGroup } from "../diagnosticmessages"
import { Parser } from "./parser"
import { outputDiagnosticMessageFormatted } from "../formatter"

const syntheticTypes = new Map<string, idl.IDLEntry>()

export function addSyntheticType(name: string, type: idl.IDLEntry) {
    if (syntheticTypes.has(name)) {
        warn(`duplicate synthetic type name "${name}"`)
    }
    syntheticTypes.set(name, type)
} // check

export function resolveSyntheticType(type: idl.IDLReferenceType): idl.IDLEntry | undefined {
    return syntheticTypes.get(type.name)
}

export function toIdlType(fileName: string, content: string): idl.IDLType {
    const previousDiagnosticsCount = DiagnosticMessageGroup.allGroupsEntries.length
    try {
        const idlType = new Parser(fileName, content).parseIDLType()
        idlType.fileName = fileName
        return idlType
    } finally {
        if (DiagnosticMessageGroup.allGroupsEntries.length != previousDiagnosticsCount) {
            DiagnosticMessageGroup.allGroupsEntries.slice(previousDiagnosticsCount).map(it => outputDiagnosticMessageFormatted(it))
        }
    }
}

export function toIdlTypeList(fileName: string, content: string): idl.IDLType[] {
    const previousDiagnosticsCount = DiagnosticMessageGroup.allGroupsEntries.length
    try {
        return new Parser(fileName, content).parseIDLTypeList()
    } finally {
        if (DiagnosticMessageGroup.allGroupsEntries.length != previousDiagnosticsCount) {
            DiagnosticMessageGroup.allGroupsEntries.slice(previousDiagnosticsCount).map(it => outputDiagnosticMessageFormatted(it))
        }
    }
}

const DifferenceFound = new DiagnosticMessageGroup("error", "DifferenceFound", "Difference found")

interface Diff {
    path: string
    oldValue: any
    newValue: any
}

const noCompare = new Set(["parent", "fileName", "nodeLocation", "nameLocation", "valueLocation", "typesValue", "text"])
const canContainMoreCompare = new Set(["extendedAttributes", "typeParameters", "typeArguments"])

function safeString(value: any) {
    if (typeof value == "symbol") {
        return String(value)
    }
    return JSON.stringify(value, (k, v) => { return noCompare.has(k) ? undefined : v})
}

function joinPath(left: string, right?: string) {
    if (!right) {
        return left
    }
    return `${left}.${right}`
}

function compareDeep(oldData: any, newData: any, paths: Set<string>): Diff[] {
    const location = newData?.kind && (newData?.nameLocation ?? newData?.nodeLocation)
    const diffs: Diff[] = []
    if (typeof oldData != typeof newData) {
        diffs.push({path: "", oldValue: safeString(oldData), newValue: safeString(newData)})
    } else if (Array.isArray(oldData) && Array.isArray(newData)) {
        const len = Math.max(oldData.length, newData.length)
        if (oldData.length != newData.length) {
            diffs.push({path: "", oldValue: `(length=${oldData.length})`, newValue: `(length=${newData.length})`})
        }
        for (let i = 0; i < len; ++i) {
            const deeperDiffs = compareDeep(oldData[i], newData[i], paths)
            if (deeperDiffs.length > 0) {
                diffs.push(...deeperDiffs.map(x => {x.path = joinPath("" + i, x.path); return x}))
            }
        }
    } else if (typeof newData == "object") {
        const keys = [...new Set([...Object.getOwnPropertyNames(oldData), ...Object.getOwnPropertyNames(newData)])].filter(x => !noCompare.has(x))
        for (const k of keys) {
            let oldValue = oldData[k]
            let newValue = newData[k]
            if (canContainMoreCompare.has(k)) {
                if (newValue == null && Array.isArray(oldValue) && oldValue.length == 0) {
                    continue
                }
                if (oldValue == null && Array.isArray(newValue)) {
                    continue
                }
                if (Array.isArray(oldValue) && Array.isArray(newValue)) {
                    if (newValue.length > oldValue.length) {
                        // Cases when old parser takes attributes from outer declaration and ignores the right ones
                        newValue = newValue.slice(newValue.length - oldValue.length)
                    } else  if (oldValue.length > newValue.length) {
                        // Cases when types in parentheses have own attributes, but old parser adds attributes from outer declaration
                        oldValue = oldValue.slice(0, newValue.length)
                    }
                } 
            }
            const deeperDiffs = compareDeep(oldValue, newValue, paths)
            if (deeperDiffs.length > 0) {
                diffs.push(...deeperDiffs.map(x => {x.path = joinPath(k, x.path); return x}))
            }
        }
    } else {
        if (oldData != newData) {
            diffs.push({path: "", oldValue: safeString(oldData), newValue: safeString(newData)})
        }
    }
    if (!location) {
        return diffs
    }
    for (const diff of diffs) {
        paths.add(diff.path)
        DifferenceFound.reportDiagnosticMessage([location], `path: ${diff.path} oldValue: ${diff.oldValue} newValue: ${diff.newValue}`)
    }
    return []
}

export function compareParsingResults(oldFile: idl.IDLFile, newFile: idl.IDLFile): boolean {
    const paths = new Set<string>()
    compareDeep(oldFile, newFile, paths)
    if (paths.size > 0) {
        DifferenceFound.reportDiagnosticMessage([newFile.nodeLocation!], "Differences found in those paths:\n" + [...paths].join("\n"))
    }
    return paths.size == 0
}

export function parseIDLFile(fileName: string, content?: string, quiet?: boolean): idl.IDLFile {
    const previousDiagnosticsCount = DiagnosticMessageGroup.allGroupsEntries.length
    try {
        return parseIDLFileNew(fileName, content)
    } finally {
        if (!quiet && DiagnosticMessageGroup.allGroupsEntries.length != previousDiagnosticsCount) {
            DiagnosticMessageGroup.allGroupsEntries.slice(previousDiagnosticsCount).forEach(it => outputDiagnosticMessageFormatted(it))
        }
    }
}

export function parseIDLFileNew(fileName: string, content?: string) {
    let file = new Parser(fileName, content).parseIDLFile()
    const ancestors: idl.IDLNode[] = []
    const namespaces: string[] = []
    // Mimic old parser and deserialize.ts behavior:
    // 1. Add `fileName`.
    // 2. Add `parent`.
    // 3. Possibly register node with `addSyntheticType` if "Synthetic" is in attributes
    idl.forEachChild(file, (node) => {
        if (idl.isPrimitiveType(node)) {
            return
        }
        node.fileName = fileName
        if (ancestors.length) {
            node.parent = ancestors[ancestors.length - 1]
        }
        if (idl.isNamespace(node)) {
            namespaces.push(node.name)
        }
        ancestors.push(node)
    }, (node) => {
        if (idl.isPrimitiveType(node)) {
            return
        }
        if (idl.isNamespace(node)) {
            namespaces.pop()
        }
        ancestors.pop()
    })
    return file
}
