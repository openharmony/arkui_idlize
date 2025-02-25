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

import { ImportsCollector } from "../ImportsCollector"
import { collectDeclDependencies } from "../ImportsCollectorUtils";
import { PrinterResult } from "../LayoutManager";
import { LayoutNodeRole, PeerLibrary, isMaterialized, NamedMethodSignature } from "@idlizer/core";
import * as idl from '@idlizer/core'
import { collectProperties } from "./StructPrinter";
import { collapseSameMethodsIDL, groupOverloadsIDL } from "./OverloadsPrinter";

/**
 * Printer for OHOS interfaces
 */
export function printInterfaceData(library: PeerLibrary): PrinterResult[] {
    return library.files.flatMap(file => {
        if (library?.libraryPackages?.length && !library.libraryPackages.includes(file.packageName()))
            return []
        return file.entries
            .flatMap(it => idl.isNamespace(it) ? it.members : [it])
            .filter(it => !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Predefined))
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
    const groupedMethods = groupOverloadsIDL(entry.methods)
    groupedMethods.forEach(methods => {
        const method = collapseSameMethodsIDL(methods, library.language)
        const signature = NamedMethodSignature.make(
            method.returnType,
            method.parameters
            .map(it => ({ name: it.name, type: idl.maybeOptional(it.type, it.isOptional) })))
        printer.writeMethodDeclaration(method.name, signature, toMethodModifiers(method.methods[0]))
    })
}

class CJDeclConvertor {
    public static makeInterface(library: PeerLibrary, type: idl.IDLInterface, writer: idl.LanguageWriter) {
        const members = type.properties.map(it => {
            return {name: writer.escapeKeyword(it.name), type: idl.maybeOptional(it.type, it.isOptional), modifiers: [idl.FieldModifier.PUBLIC]}
        })
        let constructorMembers: idl.IDLProperty[] = collectProperties(type, library)

        let superName = undefined as string | undefined
        const superType = idl.getSuperType(type)
            if (superType) {
            if (idl.isReferenceType(superType)) {
                const superDecl = library.resolveTypeReference(superType)
                if (superDecl) {
                    superName = superDecl.name
                }
            } else {
                superName = idl.forceAsNamedNode(superType).name
            }
        }

        writer.writeClass(type.name, () => {
            members.forEach(it => {
                writer.writeProperty(it.name, it.type, true)
            })
            writer.writeConstructorImplementation(type.name,
                new idl.NamedMethodSignature(idl.IDLVoidType,
                    constructorMembers.map(it =>
                        idl.maybeOptional(it.type, it.isOptional)
                    ),
                    constructorMembers.map(it =>
                        writer.escapeKeyword(it.name)
                    )), () => {
                        const superType = idl.getSuperType(type)
                        const superDecl = superType ? library.resolveTypeReference(superType as idl.IDLReferenceType) : undefined
                        let superProperties = superDecl ? collectProperties(superDecl as idl.IDLInterface, library) : []
                        writer.print(`super(${superProperties.map(it => writer.escapeKeyword(it.name)).join(', ')})`)

                        for(let i of members) {
                            writer.print(`this.${i.name}_container = ${i.name}`)
                        }
                    })
        }, superName)
    }

    public static makeEnum(enumDecl: idl.IDLEnum, writer: idl.LanguageWriter) {
        const alias = enumDecl.name
        const initializers = enumDecl.elements.map(it => {
            return {name: it.name, id: it.initializer}
        })

        const isStringEnum = initializers.every(it => typeof it.id == 'string')

        let memberValue = 0
        const members: {
            name: string,
            stringId: string | undefined,
            numberId: number,
        }[] = []
        for (const initializer of initializers) {
            if (typeof initializer.id == 'string') {
                members.push({name: initializer.name, stringId: initializer.id, numberId: memberValue})
            }
            else if (typeof initializer.id == 'number') {
                memberValue = initializer.id
                members.push({name: initializer.name, stringId: undefined, numberId: memberValue})
            }
            else {
                members.push({name: initializer.name, stringId: undefined, numberId: memberValue})
            }
            memberValue += 1
        }
        writer.writeClass(alias, () => {
            const enumType = idl.createReferenceType(enumDecl)
            members.forEach(it => {
                writer.writeFieldDeclaration(it.name, enumType, [idl.FieldModifier.PUBLIC, idl.FieldModifier.STATIC, idl.FieldModifier.FINAL], false,
                    writer.makeString(`${alias}(${it.numberId})`)
                )
            })

            const value = 'value'
            const intType = idl.IDLI32Type
            writer.writeFieldDeclaration(value, intType, [idl.FieldModifier.PUBLIC, idl.FieldModifier.FINAL], false)

            const signature = new idl.MethodSignature(idl.IDLVoidType, [intType])
            writer.writeConstructorImplementation(alias, signature, () => {
                writer.writeStatement(
                    writer.makeAssign(value, undefined, writer.makeString(signature.argName(0)), false)
                )
            })
        })
    }
}

function printInterface(library: PeerLibrary, entry: idl.IDLInterface): PrinterResult {
    const printer = library.createLanguageWriter()
    const collector = new ImportsCollector()

    collectDeclDependencies(library, entry, collector)

    const ns = idl.getNamespaceName(entry)
    if (ns !== '') {
        printer.pushNamespace(ns)
    }
    if (library.language == idl.Language.CJ) {
        if (!idl.isMaterialized(entry, library)) {
            CJDeclConvertor.makeInterface(library, entry, printer)
        }
    } else {
        if (idl.isInterfaceSubkind(entry)) {
            printer.writeInterface(entry.name, w => {
                printInterfaceBody(library, entry, w)
            })
        } else if (idl.isClassSubkind(entry)) {
            printer.writeClass(entry.name, w => {
                printInterfaceBody(library, entry, w)
            })
        }
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
    const printer = library.createLanguageWriter()
    const collector = new ImportsCollector()

    collectDeclDependencies(library, entry, collector)

    if ([idl.Language.TS, idl.Language.ARKTS].includes(library.language)) {
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
    if (library.language === idl.Language.CJ) {
        CJDeclConvertor.makeEnum(entry, printer)
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
