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

import { createReferenceType, IDLI32Type, IDLType, IDLVoidType } from "@idlizer/core/idl"
import { ImportFeature } from "../../ImportsCollector"
import { LanguageWriter, NamedMethodSignature, Method, MethodModifier, MethodSignature,
    FieldModifier, PeerMethod, PeerLibrary
} from "@idlizer/core"
import { generateArkComponentName } from "../ComponentsPrinter"
import { componentToPeerClass } from "../PeersPrinter"
import { writeSerializer } from "../SerializerPrinter"
import { TargetFile } from "../TargetFile"
import { IdlSyntheticTypeBase } from "./CommonUtils"
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH, ARK_BASE, ARK_OBJECTBASE, INT_VALUE_GETTER } from "./Java"
import { collectJavaImports } from "./JavaIdlUtils"

export function makeJavaSerializer(library: PeerLibrary): { targetFile: TargetFile, writer: LanguageWriter } {
    let writer = library.createLanguageWriter()
    writer.print(`package ${ARKOALA_PACKAGE};\n`)
    writeSerializer(library, writer, "")
    return { targetFile: new TargetFile('Serializer', ARKOALA_PACKAGE_PATH), writer: writer }
}

export function printJavaImports(printer: LanguageWriter, imports: ImportFeature[]) {
    if (imports.length == 0) {
        return
    }
    imports
        .filter(it => it.module === "")  // ignore imports from local package
        .forEach(it => printer.print(`import ${it.feature};`))
    printer.print('')
}

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
            file.peersToGenerate.forEach(peer => {
                const arkComponent = generateArkComponentName(peer.componentName)
                const arkPeer = componentToPeerClass(peer.componentName)
                const arkPeerType = createReferenceType(arkPeer)

                const paramTypes: IDLType[] = [createReferenceType(`Consumer<${arkComponent}>`), createReferenceType('Runnable')]
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

                const signature = new NamedMethodSignature(IDLVoidType, paramTypes, paramNames)
                const method = new Method(`Ark${peer.componentName}`, signature, [MethodModifier.PUBLIC, MethodModifier.STATIC])
                writer.writeMethodImplementation(method, writer => {
                    writer.writeStatement(
                        writer.makeAssign(receiver, undefined, writer.makeFunctionCall('remember', [
                            writer.makeLambda(new MethodSignature(createReferenceType(arkComponent), []), [
                                writer.makeReturn(writer.makeString(`new ${arkComponent}()`))
                            ])
                        ]), true))
                    writer.writeStatement(
                        writer.makeAssign(create, createReferenceType(`Supplier<${arkPeer}>`),
                            writer.makeLambda(new MethodSignature(arkPeerType, []), [
                                writer.makeReturn(writer.makeString(`${arkPeer}.create(${receiver}, 0)`))
                            ]), true))
                    writer.writeStatement(
                        writer.makeAssign(update, createReferenceType(`Consumer<${arkPeer}>`),
                            writer.makeLambda(new NamedMethodSignature(IDLVoidType, [arkPeerType], ['peer']), (callableMethod ?
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

export class JavaEnum extends IdlSyntheticTypeBase {
    public readonly isStringEnum: boolean
    public readonly members: {
        name: string,
        stringId: string | undefined,
        numberId: number,
    }[] = []
    constructor(source: Object | undefined, public name: string, members: { name: string, id: string | number | undefined }[]) {
        super(source)
        this.isStringEnum = members.every(it => typeof it.id == 'string')
        // TODO: string enums
        if (this.isStringEnum) {
            throw new Error(`String enum ${this.name} not supported yet in Java`)
        }

        let memberValue = 0
        for (const member of members) {
            if (typeof member.id == 'string') {
                this.members.push({name: member.name, stringId: member.id, numberId: memberValue})
            }
            else if (typeof member.id == 'number') {
                memberValue = member.id
                this.members.push({name: member.name, stringId: undefined, numberId: memberValue})
            }
            else {
                this.members.push({name: member.name, stringId: undefined, numberId: memberValue})
            }
            memberValue += 1
        }
    }

    print(writer: LanguageWriter): void {
        writer.writeClass(this.name, () => {
            const enumType = createReferenceType(this.name)
            this.members.forEach(it => {
                writer.writeFieldDeclaration(it.name, enumType, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                    writer.makeString(`new ${this.name}(${it.numberId})`)
                )
            })

            const value = 'value'
            const intType = IDLI32Type
            writer.writeFieldDeclaration(value, intType, [FieldModifier.PUBLIC, FieldModifier.FINAL], false)

            const signature = new MethodSignature(IDLVoidType, [intType])
            writer.writeConstructorImplementation(this.name, signature, () => {
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
}
