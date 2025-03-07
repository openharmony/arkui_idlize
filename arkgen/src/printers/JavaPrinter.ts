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

import * as idl from "@idlizer/core/idl"
import { LanguageWriter, Method, MethodModifier, MethodSignature, NamedMethodSignature, PeerLibrary, PeerMethod } from "@idlizer/core"
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH, collectFilePeers, collectJavaImports, componentToPeerClass, printJavaImports, TargetFile, ARK_BASE } from "@idlizer/libohos"
import { generateArkComponentName } from "./ComponentsPrinter"

export function makeJavaArkComponents(library: PeerLibrary): { targetFile: TargetFile, writer: LanguageWriter } {
    const ark = 'Ark'
    const receiver = 'receiver'
    const create = 'create'
    const update = 'update'

    const imports = [
        {feature: 'java.util.function.Consumer', module: ''},
        {feature: 'java.util.function.Supplier', module: ''},
    ]
    const writer = library.createLanguageWriter()

    writer.writeClass(ark, writer => {
        library.files.forEach(file => {
            collectFilePeers(library, file).forEach(peer => {
                const arkComponent = generateArkComponentName(peer.componentName)
                const arkPeer = componentToPeerClass(peer.componentName)
                const arkPeerType = idl.createReferenceType(arkPeer)

                const paramTypes: idl.IDLType[] = [idl.createReferenceType(`Consumer<${arkComponent}>`), idl.createReferenceType('Runnable')]
                const paramNames = ['style', 'content']
                const callableMethods = peer.methods.filter(it => it.isCallSignature)
                let callableMethod: PeerMethod | undefined
                if (callableMethods.length > 1) {
                    throw new Error(`More than 1 method with callSignature in ${peer.componentName}`)
                }
                else if (callableMethods.length == 1) {
                    callableMethod = callableMethods[0]
                    imports.push(...collectJavaImports(callableMethod.method.signature.args))
                    const callableSignature = callableMethod.method.signature
                    callableSignature.args.forEach((it, index) => {
                        paramTypes.push(it)
                        paramNames.push(callableSignature.argName(index))
                    })
                }

                const signature = new NamedMethodSignature(idl.IDLVoidType, paramTypes, paramNames)
                const method = new Method(`Ark${peer.componentName}`, signature, [MethodModifier.PUBLIC, MethodModifier.STATIC])
                writer.writeMethodImplementation(method, writer => {
                    writer.writeStatement(
                        writer.makeAssign(receiver, undefined, writer.makeFunctionCall('remember', [
                            writer.makeLambda(new MethodSignature(idl.createReferenceType(arkComponent), []), [
                                writer.makeReturn(writer.makeString(`new ${arkComponent}()`))
                            ])
                        ]), true))
                    writer.writeStatement(
                        writer.makeAssign(create, idl.createReferenceType(`Supplier<${arkPeer}>`),
                            writer.makeLambda(new MethodSignature(arkPeerType, []), [
                                writer.makeReturn(writer.makeString(`${arkPeer}.create(${receiver}, 0)`))
                            ]), true))
                    writer.writeStatement(
                        writer.makeAssign(update, idl.createReferenceType(`Consumer<${arkPeer}>`),
                            writer.makeLambda(new NamedMethodSignature(idl.IDLVoidType, [arkPeerType], ['peer']), (callableMethod ?
                                [writer.makeStatement(writer.makeMethodCall(receiver, callableMethod.method.name,
                                    signature.argsNames.slice(2).map(it => writer.makeString(it))))] : []).concat(
                                        writer.makeCondition(writer.makeDefinedCheck(signature.argName(0)),
                                            writer.makeStatement(writer.makeMethodCall(signature.argName(0), 'accept', [writer.makeString(receiver)]))),
                                        writer.makeCondition(writer.makeDefinedCheck(signature.argName(1)),
                                            writer.makeStatement(writer.makeMethodCall(signature.argName(1), 'run', []))),
                                        writer.makeStatement(writer.makeMethodCall(receiver, 'applyAttributesFinish', []))
                                    )), true)
                    )
                    writer.writeStatement(
                        writer.makeStatement(
                            writer.makeFunctionCall('nodeAttach', [create, update].map(it => writer.makeString(it))))
                    )
                })
            })
        })
    }, ARK_BASE)

    const result = library.createLanguageWriter()
    result.print(`package ${ARKOALA_PACKAGE};\n`)
    printJavaImports(result, imports)
    result.concat(writer)

    return { targetFile: new TargetFile(ark, ARKOALA_PACKAGE_PATH), writer: result }
}
