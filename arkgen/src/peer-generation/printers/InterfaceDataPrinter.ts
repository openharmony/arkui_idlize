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

import { ImportsCollector } from "@idlizer/libohos"
import { collectDeclDependencies } from "../ImportsCollectorUtils";
import { createLanguageWriter } from "../LanguageWriters";
import { PrinterResult } from "../LayoutManager";
import { LayoutNodeRole, PeerLibrary, isMaterialized } from "@idlizer/core";
import * as idl from '@idlizer/core'

/**
 * Printer for OHOS interfaces
 */
export function printInterfaceData(library: PeerLibrary): PrinterResult[] {
    return library.files.flatMap(file => {
        if (file.isPredefined) {
            return []
        }
        return file.entries
            .flatMap(it => idl.isNamespace(it) ? it.members : [it])
            .flatMap(entry => {
                if (idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.GlobalScope)) {
                    return []
                }
                if (idl.isInterface(entry)) {
                    if (isMaterialized(entry, library) && idl.isClassSubkind(entry)) {
                        return []
                    }
                    if (idl.isBuilderClass(entry)) {
                        return []
                    }
                    return [printInterface(library, entry)]
                }
                if (idl.isEnum(entry)) {
                    return [printEnum(library, entry)]
                }
                return []
            })
    })
}

function printInterfaceBody(library: PeerLibrary, entry: idl.IDLInterface, printer: idl.LanguageWriter): void {
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
}

function printInterface(library: PeerLibrary, entry: idl.IDLInterface): PrinterResult {
    const printer = createLanguageWriter(library.language, library)
    const collector = new ImportsCollector()

    collectDeclDependencies(library, entry, collector)

    const ns = idl.getNamespaceName(entry)
    if (ns !== '') {
        printer.pushNamespace(ns)
    }
    if (idl.isInterfaceSubkind(entry)) {
        printer.writeInterface(entry.name, w => {
            printInterfaceBody(library, entry, w)
        })
    } else if (idl.isClassSubkind(entry)) {
        printer.writeClass(entry.name, w => {
            printInterfaceBody(library, entry, w)
        })
    }
    if (ns !== '') {
        printer.popNamespace()
    }

    return {
        over: {
            node: entry,
            role: LayoutNodeRole.INTERFACE
        },
        collector,
        content: printer
    }
}

function printEnum(library: PeerLibrary, entry: idl.IDLEnum): PrinterResult {
    const printer = createLanguageWriter(library.language, library)
    const collector = new ImportsCollector()

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

    return {
        over: {
            node: entry,
            role: LayoutNodeRole.INTERFACE
        },
        collector,
        content: printer
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
