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
import { collectDeclDependencies, collectDeclItself } from "../ImportsCollectorUtils"
import { NamedMethodSignature, PeerLibrary, LanguageWriter, getInitializerDefaultValue } from "@idlizer/core"
import * as idl from '@idlizer/core'
import { collapseSameMethodsIDL, groupOverloadsIDL, OverloadsPrinter } from "./OverloadsPrinter"
import { PrinterResult } from "../LayoutManager"
import { writePeerMethod } from "./PeersPrinter"
import { NativeModule } from "../NativeModule"
import { GlobalScopePeerName, idlFreeMethodToLegacy, mangledGlobalScopeName } from "../GlobalScopeUtils"
import { peerGeneratorConfiguration } from "../../DefaultConfiguration"

export function printGlobal(library: PeerLibrary): PrinterResult[] {

    const realizationHolder = idl.createInterface(
        GlobalScopePeerName,
        idl.IDLInterfaceSubkind.Interface
    )

    const printed = library.globals.flatMap(scope => {
        const filteredScopeMethods = scope.methods.filter(it => !peerGeneratorConfiguration().isHandWritten(it.name))
        const groupedMethods = groupOverloadsIDL(filteredScopeMethods, library.language)
        const methodPrinterResults = groupedMethods.filter(it => it.length).flatMap((methods): PrinterResult[] => {
            const generate = () => {
                // imports
                const imports = new ImportsCollector()
                methods.forEach(method => {
                    collectDeclDependencies(library, method, imports, { includeMaterializedInternals: true })
                    const types = [method.returnType].concat(method.parameters.map(p => p.type))
                    types.forEach(type => {
                        if (idl.isReferenceType(type)) {
                            const decl = library.resolveTypeReference(type)
                            if (decl) {
                                // collectDeclItself(library, decl, peerImports)
                                // collectDeclDependencies(library, decl, peerImports)
                            }
                        }
                    })
                })

                // peerImports.merge(imports)
                fillCommonImports(imports, library.language)
                imports.addFeatures(
                    [realizationHolder.name],
                    library.layout.resolve({
                        node: realizationHolder,
                        role: idl.LayoutNodeRole.GLOBAL
                    })
                )

                // entities
                const method = collapseSameMethodsIDL(methods)
                const signature = NamedMethodSignature.make(method.returnType, method.parameters.map(it => ({ name: it.name, type: idl.maybeOptional(it.type, it.isOptional), })))

                // write
                const writer = library.createLanguageWriter()

                /* global scope export function */
                LanguageWriter.relativeReferences(true, () => {
                    writer.writeFunctionImplementation(method.name, signature, w => {
                        const call = w.makeMethodCall(realizationHolder.name, mangledGlobalScopeName(method.methods[0]), method.parameters.map(it => w.makeString(it.name)))
                        const statement = method.returnType !== idl.IDLVoidType
                            ? w.makeReturn(call)
                            : w.makeStatement(call)
                        w.writeStatement(statement)
                    }, method.methods[0].typeParameters)
                })

                return { content: writer, imports }
            }

            return [{
                generate,
                over: {
                    node: methods[0],
                    role: idl.LayoutNodeRole.GLOBAL
                }
            }]
        })

        const constantPrinterResults = scope.constants.flatMap((it):PrinterResult[] => {
            return [{
                generate: () => {
                    const content = library.createLanguageWriter()

                    const imports = new ImportsCollector()
                    collectDeclDependencies(library, it.type, imports)
                    const value = it.value ?? getInitializerDefaultValue(it, library.language)
                    content.writeConstant(it.name, it.type, value)
                    return { content, imports}
                },
                over: {
                    node: it,
                    role: idl.LayoutNodeRole.GLOBAL
                }
            }]
        })

        return constantPrinterResults.concat(methodPrinterResults)
    })

    if (printed.length === 0) {
        return []
    }

    const realization: PrinterResult = {
        generate: () => {
            const imports = new ImportsCollector
            fillPeerImports(imports, library)
            collectDeclItself(library, idl.createReferenceType(NativeModule.Generated.name), imports)
            library.globals.forEach(scope => {
                const groupedMethods = groupOverloadsIDL(scope.methods, library.language)
                groupedMethods.filter(it => it.length).forEach(methods => {
                    methods.forEach(method => {
                        collectDeclDependencies(library, method, imports, { includeMaterializedInternals: true })
                    })
                })
            })

            const realizationWriter = library.createLanguageWriter()
            realizationWriter.writeClass(realizationHolder.name, w => {
                w.makeStaticBlock(() => {
                    const allGroupedMethods = library.globals.flatMap(scope => {
                    const filteredScopeMethods = scope.methods.filter(it => !peerGeneratorConfiguration().isHandWritten(it.name))
                        return groupOverloadsIDL(filteredScopeMethods, library.language)
                    })
                    allGroupedMethods.forEach(methods => {
                        const peerMethods = idlFreeMethodToLegacy(methods)
                        new OverloadsPrinter(library, realizationWriter, library.language, false, library.useMemoM3)
                            .printGroupedComponentOverloads(realizationHolder.name, peerMethods)

                        peerMethods.forEach(peerMethod => {
                            writePeerMethod(
                                library,
                                realizationWriter,
                                peerMethod,
                                true,
                                false,
                                '_serialize',
                                '',
                                peerMethod.returnType,
                            )
                        })
                    })
                })
            })
            return { content: realizationWriter, imports }
        },
        over: {
            node: realizationHolder,
            role: idl.LayoutNodeRole.GLOBAL
        },
        private: true
    }

    return printed.concat(realization)
}

function fillCommonImports(collector: ImportsCollector, language: idl.Language) {
    if (language === idl.Language.TS || language === idl.Language.ARKTS) {
        collector.addFeatures(['int32', 'int64', 'float32'], '@koalaui/common')
        if (language === idl.Language.ARKTS) {
            collector.addFeature('NativeBuffer', '@koalaui/interop')
        }
    }
    if (language === idl.Language.KOTLIN) {
        collector.addFeature("NativeBuffer", "koalaui.interop")
    }
}

function fillPeerImports(collector: ImportsCollector, library: PeerLibrary) {
    fillCommonImports(collector, library.language)
    if (library.language === idl.Language.TS || library.language === idl.Language.ARKTS) {
        collector.addFeatures(['unsafeCast'], '@koalaui/common')
        collector.addFeatures([
            'Finalizable',
            'RuntimeType',
            'SerializerBase',
            'DeserializerBase',
            'MaterializedBase',
            'KPointer',
            'toPeerPtr',
        ], '@koalaui/interop')
        if (library.language === idl.Language.TS) {
            collector.addFeatures(['runtimeType', 'isInstanceOf'], '@koalaui/interop')
        }
        if (library.name === 'arkoala') {
            collector.addFeature('CallbackTransformer', './CallbackTransformer')
        }
    }
    if (library.language === idl.Language.KOTLIN) {
        collector.addFeatures([
            "Finalizable",
            "RuntimeType",
            "SerializerBase",
            "DeserializerBase",
            "MaterializedBase",
            "KPointer",
            "KNativePointer",
            "toPeerPtr",
        ], "koalaui.interop")
    }
    collectDeclItself(library, idl.createReferenceType('CallbackKind'), collector)
    collectDeclItself(library, idl.createReferenceType(NativeModule.Generated.name), collector)
}
