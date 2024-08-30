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

import { LanguageWriter, createLanguageWriter, Type, NamedMethodSignature, Method, MethodModifier, MethodSignature, FieldModifier } from "../../LanguageWriters"
import { PeerLibrary } from "../../PeerLibrary"
import { PeerMethod } from "../../PeerMethod"
import { generateArkComponentName } from "../ComponentsPrinter"
import { componentToPeerClass } from "../PeersPrinter"
import { PrinterContext } from "../PrinterContext"
import { writeSerializer } from "../SerializerPrinter"
import { TargetFile } from "../TargetFile"
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH, ARK_UI_NODE_TYPE, ARK_BASE, ARK_OBJECTBASE, INT_VALUE_GETTER } from "./Java"


export function makeJavaSerializer(library: PeerLibrary): { targetFile: TargetFile, writer: LanguageWriter } {
    let writer = createLanguageWriter(library.declarationTable.language)
    writer.print(`package ${ARKOALA_PACKAGE};\n`)
    writeSerializer(library, writer)
    return { targetFile: new TargetFile('Serializer', ARKOALA_PACKAGE_PATH), writer: writer }
}


export function makeJavaNodeTypes(library: PeerLibrary): { targetFile: TargetFile, writer: LanguageWriter } {
    const componentNames = library.files.flatMap(file => {
        return Array.from(file.peers.values()).map(peer => peer.componentName)
    })
    const nodeTypesEnum = new JavaEnum(ARK_UI_NODE_TYPE, componentNames.map((it, index) => { return { name: it, id: index } }))

    let writer = createLanguageWriter(library.declarationTable.language)
    writer.print(`package ${ARKOALA_PACKAGE};\n`)
    printJavaEnum(nodeTypesEnum, writer)

    return { targetFile: new TargetFile(ARK_UI_NODE_TYPE, ARKOALA_PACKAGE_PATH), writer: writer }
}


export function makeJavaArkComponents(library: PeerLibrary, printerContext: PrinterContext): { targetFile: TargetFile, writer: LanguageWriter } {
    const ark = 'Ark'
    const receiver = 'receiver'
    const create = 'create'
    const update = 'update'
    const usedTypes: Type[] = [new Type('Consumer'), new Type('Supplier')]
    const writer = createLanguageWriter(library.declarationTable.language)

    writer.writeClass(ark, writer => {
        library.files.forEach(file => {
            file.peersToGenerate.forEach(peer => {
                const arkComponent = generateArkComponentName(peer.componentName)
                const arkPeer = componentToPeerClass(peer.componentName)
                const arkPeerType = new Type(`${arkPeer}`)

                const paramTypes = [new Type(`Consumer<${arkComponent}>`), new Type('Runnable')]
                const paramNames = ['style', 'content']
                const callableMethods = peer.methods.filter(it => it.isCallSignature)
                let callableMethod: PeerMethod | undefined
                if (callableMethods.length > 1) {
                    throw new Error(`More than 1 method with callSignature in ${peer.componentName}`)
                }
                else if (callableMethods.length == 1) {
                    callableMethod = callableMethods[0]
                    const callableSignature = callableMethod.method.signature
                    callableMethod.declarationTargets.forEach((it, index) => {
                        const javaType = printerContext.synthesizedTypes!.getTargetType(it, callableSignature.args[index].nullable)
                        usedTypes.push(javaType)
                        paramTypes.push(javaType)
                        paramNames.push(callableSignature.argName(index))
                    })
                }

                const signature = new NamedMethodSignature(Type.Void, paramTypes, paramNames)
                const method = new Method(`Ark${peer.componentName}`, signature, [MethodModifier.PUBLIC, MethodModifier.STATIC])
                writer.writeMethodImplementation(method, writer => {
                    writer.writeStatement(
                        writer.makeAssign(receiver, undefined, writer.makeFunctionCall('remember', [
                            writer.makeLambda(new MethodSignature(new Type(arkComponent), []), [
                                writer.makeReturn(writer.makeString(`new ${arkComponent}()`))
                            ])
                        ]), true))
                    writer.writeStatement(
                        writer.makeAssign(create, new Type(`Supplier<${arkPeer}>`),
                            writer.makeLambda(new MethodSignature(arkPeerType, []), [
                                writer.makeReturn(writer.makeString(`${arkPeer}.create(${ARK_UI_NODE_TYPE}.${peer.componentName}, ${receiver}, 0)`))
                            ]), true))
                    writer.writeStatement(
                        writer.makeAssign(update, new Type(`Consumer<${arkPeer}>`),
                            writer.makeLambda(new NamedMethodSignature(Type.Void, [arkPeerType], ['peer']), (callableMethod ?
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

    const result = createLanguageWriter(library.declarationTable.language)
    result.print(`package ${ARKOALA_PACKAGE};\n`)
    printerContext.imports!.printImportsForTypes(usedTypes, result)
    result.concat(writer)

    return { targetFile: new TargetFile(ark, ARKOALA_PACKAGE_PATH), writer: result }
}


export class JavaEnum {
    constructor(public name: string, public members: { name: string, id: number }[]) { }
}

export function printJavaEnum(javaEnum: JavaEnum, writer: LanguageWriter) {
    writer.writeClass(javaEnum.name, () => {
        const enumType = new Type(javaEnum.name)
        javaEnum.members.forEach(it => {
            writer.writeFieldDeclaration(it.name, enumType, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                writer.makeString(`new ${javaEnum.name}(${it.id})`)
            )
        })

        const value = 'value'
        const intType = new Type('int')
        writer.writeFieldDeclaration(value, intType, [FieldModifier.PUBLIC, FieldModifier.FINAL], false)

        const signature = new MethodSignature(Type.Void, [intType])
        writer.writeConstructorImplementation(javaEnum.name, signature, () => {
            writer.writeStatement(
                writer.makeAssign(value, undefined, writer.makeString(signature.argName(0)), false)
            )
        })

        const getIntValue = new Method('getIntValue', new MethodSignature(intType, []), [MethodModifier.PUBLIC])
        writer.writeMethodImplementation(getIntValue, () => {
            writer.writeStatement(
                writer.makeReturn(writer.makeString(value))
            )
        })
    }, ARK_OBJECTBASE, [INT_VALUE_GETTER])
}
