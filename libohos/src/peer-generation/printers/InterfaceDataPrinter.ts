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
import { LayoutNodeRole, PeerLibrary, isMaterialized, NamedMethodSignature, forceAsNamedNode, isInIdlizeInternal } from "@idlizer/core";
import * as idl from '@idlizer/core'
import { collectAllProperties, collectProperties } from "./StructPrinter";
import { collapseSameMethodsIDL, groupOverloadsIDL, groupSameSignatureMethodsIDL } from "./OverloadsPrinter";
import { peerGeneratorConfiguration } from "../../DefaultConfiguration";
import { isComponentDeclaration } from "../ComponentsCollector";

/**
 * Printer for OHOS interfaces
 */
export function printInterfaceData(library: PeerLibrary): PrinterResult[] {
    return library.files.flatMap(file => {
        if (!idl.isInCurrentModule(file.file) || idl.isInIdlize(file.file))
            return []
        return idl.linearizeNamespaceMembers(file.entries)
            .filter(it => !isInIdlizeInternal(it))
            .flatMap(entry => {
                if (idl.isInterface(entry)) {
                    if (isMaterialized(entry, library) && idl.isClassSubkind(entry)) {
                        return []
                    }
                    if (idl.isBuilderClass(entry)) {
                        return []
                    }
                    if (!isMaterialized(entry, library)) {
                        return [printInterface(library, entry)]
                    }
                    return []
                }
                if (idl.isEnum(entry)) {
                    return [printEnum(library, entry)]
                }
                if (idl.isTypedef(entry)) {
                    if (!idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.Import))
                        return [printTypedef(library, entry)]
                }
                return []
            })
    })
}

function printInterfaceBody(library: PeerLibrary, entry: idl.IDLInterface, printer: idl.LanguageWriter): void {
    entry.properties.forEach(prop => {
        const defValue = peerGeneratorConfiguration().constants.get(`${entry.name}.${prop.name}`)
        const initExpr = defValue != undefined ? printer.makeString(defValue) : undefined
        printer.writeFieldDeclaration(prop.name, prop.type, toFieldModifiers(prop), prop.isOptional, initExpr)
    })

    const groupedMethods = groupOverloadsIDL(entry.methods)
    if (library.language != idl.Language.ARKTS || peerGeneratorConfiguration().CollapseOverloadsARKTS) {
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

function printCollapsedOverloads(library: PeerLibrary, methods: idl.IDLMethod[], printer: idl.LanguageWriter) {
    if (methods.some(it => it.isStatic))
        return
    const method = collapseSameMethodsIDL(methods, library.language)
    const signature = NamedMethodSignature.make(
        method.returnType,
        method.parameters
            .map(it => ({ name: it.name, type: idl.maybeOptional(it.type, it.isOptional) }))
    )
    printer.writeMethodDeclaration(method.name, signature, toMethodModifiers(method.methods[0]))
}

class CJDeclConvertor {
    public static makeInterface(library: PeerLibrary, type: idl.IDLInterface, writer: idl.LanguageWriter) {
        const alias = type.name
        const superNames = idl.getSuperTypes(type)

        const members = isComponentDeclaration(library, type) ? []
        : type.properties.map(it => {
            return {name: writer.escapeKeyword(it.name), type: idl.maybeOptional(it.type, it.isOptional), modifiers: [idl.FieldModifier.PUBLIC]}
        })
        let allProperties: idl.IDLProperty[] = collectAllProperties(type, library)
        writer.writeInterface(`${alias}${isMaterialized(type, library) ? '' : 'Interface'}`, writer => {
            for (const p of type.properties) {
                const modifiers: idl.FieldModifier[] = []
                if (p.isReadonly) modifiers.push(idl.FieldModifier.READONLY)
                if (p.isStatic) modifiers.push(idl.FieldModifier.STATIC)
                writer.writeProperty(p.name, idl.maybeOptional(p.type, p.isOptional), modifiers)
            }
            for (const m of type.methods) {
                if (m.isStatic) {
                    continue
                }
                writer.writeMethodDeclaration(m.name,
                    new NamedMethodSignature(
                        m.returnType,
                        m.parameters.map(it => it.type),
                        m.parameters.map(it => it.name)));
            }
        }, superNames ? superNames.map(it => `${writer.getNodeName(it)}Interface`) : undefined)
        if (!isMaterialized(type, library)) {
            writer.writeClass(alias, () => {
                allProperties.forEach(it => {
                    let modifiers: idl.FieldModifier[] = []
                    if (it.isReadonly) modifiers.push(idl.FieldModifier.READONLY)
                    if (it.isStatic) modifiers.push(idl.FieldModifier.STATIC)
                    writer.writeProperty(it.name, idl.maybeOptional(it.type, it.isOptional), modifiers, { method: new idl.Method(it.name, new NamedMethodSignature(it.type, [it.type], [it.name])) })
                })
                writer.writeConstructorImplementation(alias,
                    new NamedMethodSignature(idl.IDLVoidType,
                        allProperties.map(it => idl.maybeOptional(it.type, it.isOptional)),
                        allProperties.map(it => writer.escapeKeyword(it.name))), () => {
                            for(let i of allProperties) {
                                writer.print(`this.${i.name}_container = ${writer.escapeKeyword(i.name)}`)
                            }
                        })
            }, undefined, [`${type.name}Interface`])
        }
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
    if (library.language === idl.Language.ARKTS) {
        collector.addFeatures(['NativeBuffer'], '@koalaui/interop')
    }

    if (idl.isInterfaceSubkind(entry)) {
        if(library.language == idl.Language.CJ) {
            if (!['RuntimeType', 'CallbackResource', 'Materialized'].includes(entry.name))
                CJDeclConvertor.makeInterface(library, entry, printer)
        } else {
            printer.writeInterface(entry.name, w => {
                printInterfaceBody(library, entry, w)
            }, undefined, entry.typeParameters)
        }
    } else if (idl.isClassSubkind(entry)) {
        printer.writeClass(entry.name, w => {
            printInterfaceBody(library, entry, w)
        })
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
        printer.writeEnum(entry.name, entry.elements.map((it, idx) => ({
            name: it.name,
            numberId: typeof it.initializer === 'number' ? it.initializer : idx,
            stringId: typeof it.initializer === 'string' ? it.initializer : undefined
        })))
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

function printTypedef(library: PeerLibrary, entry: idl.IDLTypedef): PrinterResult {
    const printer = library.createLanguageWriter()
    const collector = new ImportsCollector()

    collectDeclDependencies(library, entry, collector)

    if ([idl.Language.TS, idl.Language.ARKTS].includes(library.language)) {
        printer.writeTypeDeclaration(entry)
    }
    if (library.language === idl.Language.CJ) {
        printer.writeTypeDeclaration(entry)
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
