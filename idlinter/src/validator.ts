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

import * as idl from "@idlizer/core"
import { IDLNodeUnion, IDLNodeAny } from "./idltypes"
import { ProcessingRegistry } from "./processingtypes"
import { Parsed, locationForNode } from "./parser"
import { DiagnosticResult } from "./diagnostictypes"
import { DuplicateIdentifier, InconsistentEnum, LoadingError, ProcessingError, UnknownError, UnresolvedReference } from "./messages"

export class Storage {
    entries: Parsed[] = []
    entriesByPath: Map<string, Parsed> = new Map()
    entriesToValidate: Parsed[] = []
    idlFiles: idl.IDLFile[] = []
    diagnosticResult: DiagnosticResult = new DiagnosticResult()

    // to refactor
    namedNodes: Map<string, idl.IDLNode> = new Map()
    enumModes: Map<idl.IDLNode, [idl.IDLNode, string]> = new Map()

    //@ts-ignore
    currentEntry: Parsed
    addFile(fileName: string, parseOnly?: boolean): void {
        try {
            let parsed = new Parsed(fileName)
            this.entries.push(parsed)
            this.entriesByPath.set(fileName, parsed)
            if (!parseOnly) {
                this.entriesToValidate.push(parsed)
            }
            parsed.load()
            this.idlFiles.push(parsed.idlFile)
        } catch (e: any) {
            if (e.diagnosticMessage != null) {
                this.diagnosticResult.push(e.diagnosticMessage)
            } else {
                // Something unknown
                UnknownError.pushDiagnosticMessage(this.diagnosticResult, [{documentPath: fileName}], e.message ?? "")
            }
        }
    }
    processAll(): void {
        for (let entry of this.entriesToValidate) {
            this.currentEntry = entry
            try {
                idl.forEachChild(entry.idlFile, (n) => Pass1Registry.dispatchData(n, this))
            } catch (e: any) {
                ProcessingError.pushDiagnosticMessage(this.diagnosticResult, [{documentPath: entry.idlFile.fileName!}], `Pass 1: ${e.message}`)
            }
            try {
                idl.forEachChild(entry.idlFile, (n) => Pass2Registry.dispatchData(n, this))
            } catch (e: any) {
                ProcessingError.pushDiagnosticMessage(this.diagnosticResult, [{documentPath: entry.idlFile.fileName!}], `Pass 2: ${e.message}`)
            }
        }
    }
}

let Pass1Registry = new ProcessingRegistry<Storage, IDLNodeUnion, IDLNodeAny>()
let pass1 = Pass1Registry.maker()

let Pass2Registry = new ProcessingRegistry<Storage, IDLNodeUnion, IDLNodeAny>()
let pass2 = Pass1Registry.maker()

// Example watcher with pattern. There can be any number of them for each pass.
pass1({kind: idl.IDLKind.Interface}).watcher = (node, st) => {
    // if (st.namedNodes.has(node.name!)) {
    //     let otherNode = st.namedNodes.get(node.name!)!
    //     st.diagnosticResult.push(DuplicateIdentifier.generateDiagnosticMessage([locationForNode(st.currentEntry, node), locationForNode(st.currentEntry, otherNode)]))
    // } else {
    //     st.namedNodes.set(node.name!, node)
    // }
}

// Example watcher with pattern. There can be any number of them for each pass.
pass2({_idlTypeBrand: {}}).watcher = (node, st) => {
    // if (!st.namedNodes.has(node.name!)) {
    //     st.diagnosticResult.push(UnresolvedReference.generateDiagnosticMessage([locationForNode(st.currentEntry, node)]))
    // }
}

pass1({kind: idl.IDLKind.EnumMember}).watcher = (node, st) => {
    let foundMember = st.enumModes.get(node.parent!)
    if (foundMember != null) {
        if (typeof node.initializer != foundMember[1]) {
            st.diagnosticResult.push(InconsistentEnum.generateDiagnosticMessage([locationForNode(st.currentEntry, node), locationForNode(st.currentEntry, foundMember[0])]))
        }
    } else {
        st.enumModes.set(node.parent!, [node, typeof node.initializer])
    }
}
