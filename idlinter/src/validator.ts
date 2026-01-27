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
import { idlManager } from "./idlprocessing"
import { IdlNodeAny } from "./idltypes"

export enum KnownFeatures {
    ohos = 'ohos',
    arkui = 'arkui',
}

function nodeLoc(...nodes: idl.IDLNode[]): idl.Location[] {
    return nodes.map(x => x.nodeLocation ?? {documentPath: "<unknown>"})
}

function nameLoc(...nodes: idl.IDLNode[]): idl.Location[] {
    return nodes.map(x => x.nameLocation ?? x.nodeLocation ?? {documentPath: "<unknown>"})
}

const UnresolvedReference = new idl.DiagnosticMessageGroup("error", "UnresolvedReference", "Unresolved reference")
const DuplicateIdentifier = new idl.DiagnosticMessageGroup("error", "DuplicateIdentifier", "Duplicate identifier", undefined, "Duplicate of")
const InconsistentEnum = new idl.DiagnosticMessageGroup("error", "InconsistentEnum", "Enum includes both string and number values", undefined, "Conflicting value")

const WrongAttributeName = new idl.DiagnosticMessageGroup("error", "WrongAttributeName", "Wrong attribute name")
const WrongAttributePlacement = new idl.DiagnosticMessageGroup("error", "WrongAttributePlacement", "Wrong attribute placement")

const CyclicInheritance = new idl.DiagnosticMessageGroup("error", "CyclicInheritance", "Cyclic inheritance")
const WrongEntityName = new idl.DiagnosticMessageGroup("error", "WrongEntityName", "Name is not allowed")
const WrongType = new idl.DiagnosticMessageGroup("error", "WrongType", "Type is not allowed")
const TypeWarning = new idl.DiagnosticMessageGroup("warning", "TypeWarning", "Consider using another type")
const AnonymousType = new idl.DiagnosticMessageGroup("error", "AnonymousType", "Anonymous types are not allowed")
const WrongComponentPropertyType = new idl.DiagnosticMessageGroup("error", "WrongComponentPropertyType", "Component property type should allow undefined")

idlManager.newFeature(KnownFeatures.arkui, 'ArkUI-specific checks')

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
        InconsistentEnum.reportDiagnosticMessage(nameLoc(node, nodes[0], nodes[1]))
    }
}

const resolvePass = idlManager.newPass("resolvePass", [], () => ({typeParameters: new Set<string>(), resolvedNodes: new Map<IdlNodeAny, IdlNodeAny>()}))
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
    const resolved = idlManager.library.resolveTypeReference(node as idl.IDLReferenceType)
    if (resolved) {
        st.resolvedNodes.set(node, resolved)
    } else {
        UnresolvedReference.reportDiagnosticMessage(nodeLoc(node), `Unresolved reference "${node.name}"`)
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

function appendTo<K, V>(map: Map<K, V[]>, key: K, value: V): void {
    if (map.has(key)) {
        map.get(key)!.push(value)
    } else {
        map.set(key, [value])
    }
}

const uniquelyNamed = new Set([idl.IDLKind.Const, idl.IDLKind.Property, idl.IDLKind.Interface, idl.IDLKind.Method, idl.IDLKind.Callable, idl.IDLKind.Typedef, idl.IDLKind.Enum])

const checkDuplicates = idlManager.newPass("checkDuplicates", [], () => ({byName: new Map<string, IdlNodeAny[]>()}))
checkDuplicates.on({}).before = (node, st) => {
    if (!uniquelyNamed.has(node.kind)) {
        return
    }
    let name = idl.getFQName(node)
    if (node.parent?.kind == idl.IDLKind.Interface) {
        // To remove false positives for now, before permanent fix in getFQName
        name = `${idl.getFQName(node.parent)}/${name}`
        if (node.kind == idl.IDLKind.Method)
            return
    }

    appendTo(st.byName, name, node)
}
checkDuplicates.afterAll = (st) => {
    for (const [name, nodes] of st.byName) {
        if (nodes.length === 1) {
            continue // ok, continue
        }

        if (nodes.every(m => idl.isMethod(m) || idl.isCallable(m))) {
            continue // just overloads
        }
        if (nodes.length === 2) {
            const getter = nodes.find(x => idl.getExtAttribute(x, idl.IDLExtendedAttributes.Accessor) === idl.IDLAccessorAttribute.Getter)
            const setter = nodes.find(x => idl.getExtAttribute(x, idl.IDLExtendedAttributes.Accessor) === idl.IDLAccessorAttribute.Setter)

            if (getter !== setter) {
                continue // it is just setter and getter
            }
        }
        if (idlManager.activeFeatures.has(KnownFeatures.arkui)) {
            if (nodes.every(m => idl.hasExtAttribute(m, idl.IDLExtendedAttributes.CommonMethod))) {
                continue // it is just component attributes overloads
            }
        }

        // real redefinition, let's report it!
        DuplicateIdentifier.reportDiagnosticMessage(nameLoc(...nodes), `Duplicate identifier "${nodes[0].name}"`)
    }
}

idlManager.newFeature(KnownFeatures.ohos, "OHOS-specific checks")
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
        WrongAttributePlacement.reportDiagnosticMessage(nameLoc(node), `Attributes not allowed on ${node.kind}`)
        return
    }
    for (let attr of node.extendedAttributes) {
        if (!valids.includes(attr.name)) {
            WrongAttributeName.reportDiagnosticMessage(nameLoc(node), `Attribute "${attr.name}" not allowed on ${node.kind}`)
        }
    }
}

const inheritancePass = idlManager.newPass("inheritancePass", [resolvePass], ()=>({checked: new Set<IdlNodeAny>(), resolvedNodes: resolvePass.state.resolvedNodes}))
inheritancePass.on({kind: idl.IDLKind.Interface}).before = (node, st) => {
    const checking = new Set<IdlNodeAny>()
    const findCycle: (cnode: IdlNodeAny) => boolean = (cnode) => {
        if (idl.isTypedef(cnode)) {
            const resolved = st.resolvedNodes.get(cnode.type)!
            return findCycle(resolved)
        }
        if (st.checked.has(cnode)) {
            return false
        }
        if (checking.has(cnode)) {
            return true
        }
        checking.add(cnode)
        let found = false
        for (const inh of cnode.inheritance!) {
            const resolved = st.resolvedNodes.get(inh)
            if (!resolved) {
                // Already handled as unresolved
                continue
            }
            found = found || findCycle(resolved)
        }
        checking.delete(cnode)
        if (found && !st.checked.has(cnode)) {
            CyclicInheritance.reportDiagnosticMessage(nameLoc(cnode))
        }
        st.checked.add(cnode)
        return found
    }
    findCycle(node)
}

// const reexportNamePass = idlManager.newPass("sameNameCheck", [], () => ({ index: new Map<string, string[]>() }))
// reexportNamePass.on({}).before = (node, st) => {
//     if ([idl.IDLKind.Callback, idl.IDLKind.Typedef, idl.IDLKind.Interface, idl.IDLKind.Namespace].includes(node.kind)) {
//         appendTo(st.index, node.name, idl.getFileFor(node)?.fileName ?? '')
//     }
// }
// reexportNamePass.afterAll = ({ index }) => {
//     for (const [name, files] of index) {
//         if (files.length > 1) {
//             console.error(name, files)
//         }
//     }
// }

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
    let l = nodeLoc(node)
    st[0] += 1
    if (l[0].range) {
        st[1] += 1
    }
}
locationCheckPass.afterAll = (st) => {
    console.log(`Stats: ${st[1]}/${st[0]} nodes have locations`);
}

const keywords = new Set([
    "abstract", "alignas", "alignof", "and", "and_eq", "any", "as", "asm", "asserts", "async",
    "atomic_cancel", "atomic_commit", "atomic_noexcept", "auto", "await", "bigint", "bitand", "bitor", "bool",
    "boolean", "break", "case", "catch", "char", "char16_t", "char32_t", "char8_t", "class", "co_await",
    "co_return", "co_yield", "compl", "concept", "const", "const_cast", "consteval", "constexpr", "constinit",
    "constructor", "continue", "debugger", "declare", "decltype", "default", "delete", "do", "double", "dynamic_cast",
    "else", "enum", "explicit", "export", "extends", "extern", "false", "finally", "float", "for", "friend", "from",
    "function", "get", "global", "goto", "if", "implements", "import", "in", "infer", "inline", "instanceof", "int",
    "interface", "is", "keyof", "let", "long", "module", "mutable", "namespace", "never", "new", "noexcept",
    "not", "not_eq", "null", "nullptr", "number", "object", "of", "operator", "or", "or_eq", "package",
    "private", "protected", "public", "readonly", "reflexpr", "register", "reinterpret_cast", "require", "requires",
    "return", "set", "short", "signed", "sizeof", "static", "static_assert", "static_cast", "string", "struct",
    "super", "switch", "symbol", "synchronized", "template", "this", "thread_local", "throw", "true", "try", "type",
    "typedef", "typeid", "typename", "typeof", "undefined", "union", "unique", "unknown", "unsigned", "using", "var",
    "virtual", "void", "volatile", "wchar_t", "while", "with", "xor", "xor_eq", "yield", "_Alignas", "_Alignof",
    "_Atomic", "_Bool", "_Complex", "_Generic", "_Imaginary", "_Noreturn", "_Static_assert", "_Thread_local"
])

const keywordKinds = new Set([
     idl.IDLKind.Interface, idl.IDLKind.Const, idl.IDLKind.Property, idl.IDLKind.Method, idl.IDLKind.Parameter,
     idl.IDLKind.Enum, idl.IDLKind.EnumMember, idl.IDLKind.Typedef, idl.IDLKind.TypeParameterType, idl.IDLKind.Namespace
])
const keywordPass = idlManager.newPass("arkui.keywordPass", [], () => {})
keywordPass.on({}).before = (node, _) => {
    if (keywordKinds.has(node.kind) && node.name) {
        if (keywords.has(node.name))
            WrongEntityName.reportDiagnosticMessage(nameLoc(node), `Identifier "${node.name}" is a reserved keyword`)
        else if (node.name == "RecordData")
            WrongEntityName.reportDiagnosticMessage(nameLoc(node), "`RecordData` should not be redefined")
    }
}

const typeWarnings = new Set([
    idl.IDLObjectType,
    idl.IDLAnyType,
    idl.IDLUnknownType
])
function checkType(node: idl.IDLNode, type: idl.IDLType | undefined) {
    if (type) {
        if (type === idl.IDLNumberType)
            WrongType.reportDiagnosticMessage(nameLoc(node), "Usage of the number type")
        else if (idl.isPrimitiveType(type) && typeWarnings.has(type))
            TypeWarning.reportDiagnosticMessage(nameLoc(node), `Usage of the ${type.name} type`)
    }
}
const typePass = idlManager.newPass("arkui.typePass", [], () => ({}))
typePass.on({}).before = (node, _) => {
    if (idl.isEnumMember(node))
        return
    checkType(node, node.type)
    checkType(node, node.returnType)
    if (idl.isContainerType(node))
        node.elementType.forEach(ty => checkType(node, ty))
    if (idl.isUnionType(node))
        node.types.forEach(ty => checkType(node, ty))
}

const anonymousTypePass = idlManager.newPass("arkui.anonymousTypePass", [], () => ({}))
anonymousTypePass.on({kind: idl.IDLKind.Interface}).before = (node, _) => {
    if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Synthetic))
        AnonymousType.reportDiagnosticMessage(nameLoc(node), "Anonymous type")
}

function isValidComponentPropertyType(type: idl.IDLType) {
    return idl.isOptionalType(type)
        || idl.isUnionType(type) && type.types.includes(idl.IDLUndefinedType)
}
const attributeTypePass = idlManager.newPass("arkui.attributeTypePass", [], () => ({}))
attributeTypePass.on({kind: idl.IDLKind.Interface}).before = (node, _) => {
    if (idl.hasExtAttribute(node, idl.IDLExtendedAttributes.Component)) {
        node.properties?.forEach(prop => {
            if (!isValidComponentPropertyType(prop.type))
                WrongComponentPropertyType.reportDiagnosticMessage(nameLoc(prop), "Component property type does not allow undefined")
        })
    }
}
