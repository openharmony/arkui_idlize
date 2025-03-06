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
import { NamedMethodSignature, getMaterializedFileName, PeerLibrary } from "@idlizer/core"
import * as idl from '@idlizer/core'
import { collapseSameMethodsIDL, groupOverloadsIDL, OverloadsPrinter } from "./OverloadsPrinter"
import { PrinterResult } from "../LayoutManager"
import { writePeerMethod } from "./PeersPrinter"
import { createOutArgConvertor } from "../PromiseConvertors"
import { NativeModule } from "../NativeModule"
import { GlobalScopePeerName, idlFreeMethodToLegacy, mangledGlobalScopeName } from "../GlobalScopeUtils"

export function printGlobal(library: PeerLibrary): PrinterResult[] {

    const realizationHolder = idl.createInterface(
        GlobalScopePeerName,
        idl.IDLInterfaceSubkind.Interface
    )

    const peerImports = new ImportsCollector()
    const peerMethodWriter = library.createLanguageWriter()

    const printed = library.globals.flatMap(scope => {

        const groupedMethods = groupOverloadsIDL(scope.methods)
        const methodPrinterResults = groupedMethods.filter(it => it.length).flatMap((methods): PrinterResult[] => {

            // imports
            const imports = new ImportsCollector()
            methods.forEach(method => {
                collectDeclDependencies(library, method, imports, { includeMaterializedInternals: true })
            })

            peerImports.merge(imports)
            imports.addFeatures([realizationHolder.name], library.layout.resolve(realizationHolder, idl.LayoutNodeRole.PEER))

            // entities
            const nsPath = idl.getNamespacesPathFor(methods[0])
            const peerMethods = idlFreeMethodToLegacy(library, methods)
            const method = collapseSameMethodsIDL(methods)
            const signature = NamedMethodSignature.make(method.returnType, method.parameters.map(it => ({ name: it.name, type: idl.maybeOptional(it.type, it.isOptional), })))

            // write
            const writer = library.createLanguageWriter()
            nsPath.forEach(it => writer.pushNamespace(it.name))

            /* global scope export function */
            writer.writeFunctionImplementation(method.name, signature, w => {
                const call = w.makeMethodCall(realizationHolder.name, mangledGlobalScopeName(method.methods[0]), method.parameters.map(it => w.makeString(it.name)))
                const statement = method.returnType !== idl.IDLVoidType
                    ? w.makeReturn(call)
                    : w.makeStatement(call)
                w.writeStatement(statement)
            })

            /* global scope peer serialize function */
            new OverloadsPrinter(library, peerMethodWriter, library.language, false)
                .printGroupedComponentOverloads(new idl.PeerClass(new idl.PeerFile(idl.createFile([])), '', ''), peerMethods)

            peerMethods.forEach(peerMethod => {
                writePeerMethod(
                    library,
                    peerMethodWriter,
                    peerMethod,
                    true,
                    false,
                    '_serialize',
                    '',
                    peerMethod.returnType,
                )
            })

            nsPath.forEach(() => writer.popNamespace())

            return [{
                collector: imports,
                content: writer,
                over: {
                    node: methods[0],
                    role: idl.LayoutNodeRole.GLOBAL
                }
            }]
        })

        const constantPrinterResults = scope.constants.flatMap((it):PrinterResult[] => {
            const nsPath = idl.getNamespacesPathFor(it)
            const writer = library.createLanguageWriter()

            const imports = new ImportsCollector()
            collectDeclDependencies(library, it.type, imports)

            nsPath.forEach(it => writer.pushNamespace(it.name))
            writer.writeConstant(it.name, it.type, it.value)
            nsPath.forEach(() => writer.popNamespace())

            return [{
                collector: imports,
                content: writer,
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

    const realizationWriter = library.createLanguageWriter()
    realizationWriter.writeClass(realizationHolder.name, w => {
        peerMethodWriter.getOutput().forEach(it => w.print(it))
    })
    fillCommonImports(peerImports, library)
    const realization: PrinterResult = {
        collector: peerImports,
        content: realizationWriter,
        over: {
            node: realizationHolder,
            role: idl.LayoutNodeRole.PEER
        },
        private: true
    }

    return printed.concat(realization)
}

function fillCommonImports(collector: ImportsCollector, library: PeerLibrary) {
    collector.addFeatures([
        'Finalizable',
        'runtimeType',
        'RuntimeType',
        'SerializerBase',
        'registerCallback',
        'wrapCallback',
        'KPointer',
        'toPeerPtr',
    ], '@koalaui/interop')
    collector.addFeatures(['MaterializedBase'], '@koalaui/interop')
    collector.addFeatures(['unsafeCast'], '@koalaui/common')
    collector.addFeatures(['Serializer'], './peers/Serializer')
    collector.addFeatures(['CallbackKind'], './peers/CallbackKind')
    collector.addFeatures(['int32', 'float32'], '@koalaui/common')
    if (library.language === idl.Language.ARKTS) {
        collector.addFeatures(['NativeBuffer'], '@koalaui/interop')
        collector.addFeatures(['Deserializer'], './peers/Deserializer')
    }
    if (library.language === idl.Language.TS) {
        collector.addFeature('isInstanceOf', '@koalaui/interop')
        collector.addFeatures(['isResource', 'isPadding'], '../utils')
        collector.addFeatures(['Deserializer', 'createDeserializer'], './peers/Deserializer')
    }
    if (library.name === 'arkoala') {
        collector.addFeatures(['CallbackTransformer'], './peers/CallbackTransformer')
        if (library.language === idl.Language.TS) {
            collector.addFeatures(['ArkUIGeneratedNativeModule'], './ArkUIGeneratedNativeModule')
        }
        if (library.language === idl.Language.ARKTS) {
            collector.addFeatures(['ArkUIGeneratedNativeModule'], '#components')
        }
    } else {
        collector.addFeatures([NativeModule.Generated.name], `./${NativeModule.Generated.name}`)
    }
}
