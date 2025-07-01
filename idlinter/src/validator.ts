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
import * as fs from "fs"
import { Parsed, locationForNode } from "./parser"
import { DuplicateIdentifier, InconsistentEnum, LoadingError, ProcessingError, UnknownError, UnresolvedReference, WrongAttributeName, WrongAttributePlacement } from "./messages"
import { idlManager } from "./idlprocessing"
import { IdlNodeAny } from "./idltypes"

const enumPass = idlManager.newPass("enumPass", [], () => ({enums: new Map<idl.IDLNode, IdlNodeAny[]>()}))
enumPass.on({kind: idl.IDLKind.Enum}).before = (node, st) => st.enums.set(node, [])
enumPass.on({kind: idl.IDLKind.EnumMember}).after = (node, st) => {
    let nodes = st.enums.get(node.parent!)!
    if (nodes.length == 0 || nodes.length == 1 && typeof nodes[0].initializer != typeof node.initializer) {
        nodes.push(node)
    }
}
enumPass.on({kind: idl.IDLKind.Enum}).after = (node, st) => {
    let nodes = st.enums.get(node)!
    if (nodes.length == 2) {
        InconsistentEnum.reportDiagnosticMessage([locationForNode(node, "name"), nodes[0], nodes[1]])
    }
}

// let namedDecls = [idl.IDLKind.Namespace, idl.IDLKind.Const, idl.IDLKind.Property, idl.IDLKind.Interface, idl.IDLKind.Method, idl.IDLKind.Callable, idl.IDLKind.Typedef, idl.IDLKind.Enum]

const resolvePass = idlManager.newPass("resolvePass", [], () => ({typeParameters: new Set<string>()}))
function extParam(param: string) {
    const extendsIdx = param.indexOf('extends')
    if (extendsIdx !== -1) {
        return param.substring(0, extendsIdx).trim()
    }
    const eqIdx = param.indexOf('=')
    if (eqIdx !== -1) {
        return param.substring(0, eqIdx).trim()
    }
    return param
}
resolvePass.on({}).before = (node, st) => {
    if (!node.typeParameters) {
        return
    }
    for (let tp of node.typeParameters) {
        st.typeParameters.add(extParam(tp))
    }
}
resolvePass.on({kind: idl.IDLKind.ReferenceType}).before = (node, st) => {
    if (!node.name || node.name == "Object" || node.name == "__TOP__" || st.typeParameters.has(node.name)) {
        return
    }
    if (!idlManager.peerlibrary.resolveTypeReference(node as idl.IDLReferenceType)) {
        UnresolvedReference.reportDiagnosticMessage(node)
    }
}
resolvePass.on({}).after = (node, st) => {
    if (!node.typeParameters) {
        return
    }
    for (let tp of node.typeParameters) {
        st.typeParameters.delete(extParam(tp))
    }
}

idlManager.newFeature("ohos", "OHOS-specific checks")
const ohosValidAttributes = new Map([
            [idl.IDLKind.Import, ["Deprecated", "Documentation"]],
            [idl.IDLKind.Namespace, ["DefaultExport", "Deprecated", "Documentation", "VerbatimDts"]],
            [idl.IDLKind.Const, ["DefaultExport", "Deprecated", "Documentation"]],
            [idl.IDLKind.Property, ["DefaultExport", "Optional", "Accessor", "Deprecated", "CommonMethod", "Protected", "DtsName", "Documentation"]],
            [idl.IDLKind.Interface, ["DefaultExport", "Predefined", "TSType", "CPPType", "Entity", "Interfaces", "ParentTypeArguments", "Component", "Synthetic", "Deprecated", "HandWrittenImplementation", "Documentation", "TypeParameters", "ComponentInterface"]],
            [idl.IDLKind.Callback, ["DefaultExport", "Deprecated", "Async", "Synthetic", "Documentation", "TypeParameters"]],
            [idl.IDLKind.Method, ["DefaultExport", "Optional", "DtsTag", "DtsName", "Throws", "Deprecated", "IndexSignature", "Protected", "Documentation", "CallSignature", "TypeParameters"]],
            [idl.IDLKind.Callable, ["DefaultExport", "CallSignature", "Deprecated", "Documentation", "CallSignature"]],
            [idl.IDLKind.Typedef, ["DefaultExport", "Deprecated", "Import", "Documentation", "TypeParameters"]],
            [idl.IDLKind.Enum, ["DefaultExport", "Deprecated", "Documentation"]],
            [idl.IDLKind.EnumMember, ["OriginalEnumMemberName", "Deprecated", "Documentation"]],
            [idl.IDLKind.Constructor, ["Deprecated", "Documentation"]]
])
const attrPass = idlManager.newPass("ohos.attrPass", [], () => {})
attrPass.on({}).before = (node, st) => {
    if(!node.extendedAttributes || node.extendedAttributes.length == 0) {
        return
    }
    let valids = ohosValidAttributes.get(node.kind)
    if (!valids) {
        WrongAttributePlacement.reportDiagnosticMessage(node, `Attributes not allowed on ${node.kind}`)
        return
    }
    for (let attr of node.extendedAttributes) {
        if (!valids.includes(attr.name)) {
            WrongAttributeName.reportDiagnosticMessage(locationForNode(node, "name"), `Attribute "${attr.name}" not allowed on ${node.kind}`)
        }
    }
}

const genPass = idlManager.newPass(".genPass", [enumPass], ()=>({lines: ([] as string[])}))
genPass.on({kind: idl.IDLKind.File}).before = (node, st) => { st.lines = [] }
genPass.on({kind: idl.IDLKind.Enum}).before = (node, st) => st.lines.push(`enum ${node.name} {`)
genPass.on({kind: idl.IDLKind.EnumMember}).after = (node, st) => st.lines.push(`    ${node.name} = ${typeof node.initializer == "string" ? '"'+node.initializer+'"' : node.initializer},`)
genPass.on({kind: idl.IDLKind.Enum}).after = (node, st) => st.lines.push("}")
genPass.on({kind: idl.IDLKind.File}).after = (node, st) => {
    fs.writeFileSync(node.fileName!.replace(".idl", ".ts"), st.lines.join("\n"))
}

const locationCheckPass = idlManager.newPass(".locationCheckPass", [], () => [0, 0] )
locationCheckPass.on({}).after = (node, st) => {
    let t = node as any
    let l = locationForNode(node)
    t.wholeLocation = l
    t.nameLocation = locationForNode(node, "name")
    st[0] += 1
    if (l.range) {
        st[1] += 1
    }
}
locationCheckPass.afterAll = (st) => {
    console.log(`Stats: ${st[1]}/${st[0]} nodes have locations`);
}
