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

import { isMaterialized } from "../idl/IdlPeerGeneratorVisitor";
import { collectDeclDependencies } from "../ImportsCollectorUtils";
import { LayoutNodeRole } from "../LayoutManager";
import { PeerLibrary } from "../PeerLibrary";
import * as idl from '@idlizer/core'

/**
 * Printer for OHOS interfaces
 */
export function printInterfaceData(library: PeerLibrary) {
    library.files.forEach(file => {
        if (file.isPredefined) {
            return
        }
        file.entries.flatMap(it => idl.isNamespace(it) ? it.members : [it]).forEach(entry => {
            if (idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.GlobalScope)) {
                return
            }
            if (idl.isInterface(entry)) {
                if (isMaterialized(entry, library) && idl.isClassSubkind(entry)) {
                    return
                }
                if (idl.isBuilderClass(entry)) {
                    return
                }
                printInterface(library, entry)
            }
            if (idl.isEnum(entry)) {
                printEnum(library, entry)
            }
        })
    })
}

function printInterface(library: PeerLibrary, entry: idl.IDLInterface) {
    const { printer, collector } = library.layout.allocate(entry, LayoutNodeRole.INTERFACE)
    collectDeclDependencies(library, entry, collector)

    const ns = idl.getNamespaceName(entry)
    if (ns !== '') {
        printer.pushNamespace(ns)
    }
    printer.writeInterface(entry.name, w => {
        entry.properties.forEach(prop => {
            printer.writeFieldDeclaration(prop.name, prop.type, toFieldModifiers(prop), prop.isOptional)
        })
        entry.methods.forEach(method => {
            printer.writeMethodDeclaration(
                method.name,
                idl.NamedMethodSignature.make(
                    method.returnType,
                    method.parameters
                        .map(it => ({ name: it.name, type: idl.maybeOptional(it.type, it.isOptional) }))
                ),
                toMethodModifiers(method)
            )
        })
    })
    if (ns !== '') {
        printer.popNamespace()
    }
}

function printEnum(library: PeerLibrary, entry: idl.IDLEnum) {
    const { printer, collector } = library.layout.allocate(entry, LayoutNodeRole.INTERFACE)
    collectDeclDependencies(library, entry, collector)

    if (library.language === idl.Language.TS) {
        const ns = idl.getNamespaceName(entry)
        if (ns !== '') {
            printer.pushNamespace(ns)
        }
        printer.writeEnum(entry.name, entry.elements.map((it, idx) => ({
            name: it.name,
            numberId: typeof it.initializer === 'number' ? it.initializer : idx,
            stringId: typeof it.initializer === 'string' ? it.initializer : undefined
        })))
        if (ns !== '') {
            printer.popNamespace()
        }
    }
    if (library.language === idl.Language.ARKTS) {
        let ns = idl.getNamespaceName(entry).split('.').join('_')
        if (ns !== '') {
            ns += '_'
        }
        printer.writeEnum(`${ns}${entry.name}`, entry.elements.map((it, idx) => ({
            name: it.name,
            numberId: typeof it.initializer === 'number' ? it.initializer : idx,
            stringId: typeof it.initializer === 'string' ? it.initializer : undefined
        })))
    }
}

/////////////////////////////////////////////////

function toFieldModifiers(prop: idl.IDLProperty) {
    const modifiers: idl.FieldModifier[] = []
    if (prop.isReadonly) {
        modifiers.push(idl.FieldModifier.READONLY)
    }
    if (prop.isStatic) {
        modifiers.push(idl.FieldModifier.STATIC)
    }
    return modifiers
}

function toMethodModifiers(method: idl.IDLMethod) {
    const modifiers: idl.MethodModifier[] = []
    if (method.isStatic) {
        modifiers.push(idl.MethodModifier.STATIC)
    }
    return modifiers
}
