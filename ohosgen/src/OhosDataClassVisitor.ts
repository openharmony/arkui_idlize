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

import { FieldModifier, IDLInterface, IDLMethod, IDLProperty, isBuilderClass, isClassSubkind, isInterface, isMaterialized, Language, LanguageWriter, LayoutNodeRole, lib, linearizeNamespaceMembers, maybeOptional, MethodModifier, NamedMethodSignature, PeerLibrary } from "@idlizer/core";
import { allowsOverloads, collapseSameMethodsIDL, collectDeclDependencies, groupOverloadsIDL, groupSameSignatureMethodsIDL, ImportsCollector, peerGeneratorConfiguration, PrinterResult } from "@idlizer/libohos";

export function printDataClasses(library:PeerLibrary): PrinterResult[] {
    return library.files.flatMap(file => {
        return linearizeNamespaceMembers(file.entries).flatMap(entry => {
            if (!isInterface(entry)) {
                return []
            }
            if (!isClassSubkind(entry)) {
                return []
            }
            if (isMaterialized(entry, library) || isBuilderClass(entry)) {
                return []
            }

            const writer = library.createLanguageWriter()
            const collector = new ImportsCollector()

            collectDeclDependencies(library, entry, collector)
            collector.addFeatures(['NativeBuffer'], '@koalaui/interop')

            writer.writeClass(entry.name, w => {
                printInterfaceBody(library, entry, w)
            })

            return [{
                collector,
                content: writer,
                over: {
                    node: entry,
                    role: LayoutNodeRole.INTERFACE
                }
            }]
        })
    })
}

function printInterfaceBody(library: PeerLibrary, entry: IDLInterface, printer: LanguageWriter): void {
    entry.properties.forEach(prop => {
        const defValue = peerGeneratorConfiguration().constants.get(`${entry.name}.${prop.name}`)
        const initExpr = defValue != undefined ? printer.makeString(defValue) : undefined
        printer.writeFieldDeclaration(prop.name, prop.type, toFieldModifiers(prop), prop.isOptional, initExpr)
    })

    const groupedMethods = groupOverloadsIDL(entry.methods, library.language)
    if (!allowsOverloads(library.language)) {
        groupedMethods.forEach(methods => {
            printCollapsedOverloads(library, methods, printer)
        })
    } else {
        // Handle special case for same name AND same signature methods.
        // Collapse same signature methods
        groupedMethods.forEach(sameNameGroup => {
            let copy = Array.from([...sameNameGroup])
            const sameSignatureMethodsGroups = groupSameSignatureMethodsIDL([...copy])
            for (let sameSignatureGroup of sameSignatureMethodsGroups) {
                printCollapsedOverloads(library, sameSignatureGroup, printer)
            }
        })
    }
}


function printCollapsedOverloads(library: PeerLibrary, methods: IDLMethod[], printer: LanguageWriter) {
    if (methods.some(it => it.isStatic))
        return
    const method = collapseSameMethodsIDL(methods, library.language)
    const signature = NamedMethodSignature.make(
        method.returnType,
        method.parameters
            .map(it => ({ name: it.name, type: maybeOptional(it.type, it.isOptional) }))
    )
    printer.writeMethodDeclaration(method.name, signature, toMethodModifiers(method.methods[0]))
}


/////////////////////////////////////////////////

function toFieldModifiers(prop: IDLProperty) {
    const modifiers: FieldModifier[] = []
    if (prop.isReadonly) {
        modifiers.push(FieldModifier.READONLY)
    }
    if (prop.isStatic) {
        modifiers.push(FieldModifier.STATIC)
    }
    return modifiers
}

function toMethodModifiers(method: IDLMethod) {
    const modifiers: MethodModifier[] = []
    if (method.isStatic) {
        modifiers.push(MethodModifier.STATIC)
    }
    return modifiers
}
