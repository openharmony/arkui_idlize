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

import { IDLI32Type, IDLType, IDLVoidType, toIDLType } from "../../../idl"
import { IdlPeerLibrary } from "../../idl/IdlPeerLibrary"
import { IdlPeerMethod } from "../../idl/IdlPeerMethod"
import { ImportFeature } from "../../ImportsCollector"
import { LanguageWriter, createLanguageWriter, NamedMethodSignature, Method, MethodModifier, MethodSignature, FieldModifier } from "../../LanguageWriters"
import { PeerLibrary } from "../../PeerLibrary"
import { PeerMethod } from "../../PeerMethod"
import { getReferenceResolver } from "../../ReferenceResolver"
import { generateArkComponentName } from "../ComponentsPrinter"
import { componentToPeerClass } from "../PeersPrinter"
import { PrinterContext } from "../PrinterContext"
import { writeSerializer } from "../SerializerPrinter"
import { TargetFile } from "../TargetFile"
import { IdlSyntheticTypeBase } from "./CommonUtils"
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH, ARK_UI_NODE_TYPE, ARK_BASE, ARK_OBJECTBASE, INT_VALUE_GETTER } from "./Java"
import { collectJavaImports } from "./JavaIdlUtils"


export function makeJavaSerializer(library: PeerLibrary | IdlPeerLibrary): { targetFile: TargetFile, writer: LanguageWriter } {
    let writer = createLanguageWriter(library.language, getReferenceResolver(library))
    writer.print(`package ${ARKOALA_PACKAGE};\n`)
    writeSerializer(library, writer)
    return { targetFile: new TargetFile('Serializer', ARKOALA_PACKAGE_PATH), writer: writer }
}

export function printJavaImports(printer: LanguageWriter, imports: ImportFeature[]) {
    if (imports.length == 0) {
        return
    }
    imports.forEach(it => printer.print(`import ${it.feature};`))
    printer.print('')
}

// TODO remove after migrating to IDL
function makeJavaNodeTypesOld(library: PeerLibrary): { targetFile: TargetFile, writer: LanguageWriter } {
    const componentNames = library.files.flatMap(file => {
        return Array.from(file.peers.values()).map(peer => peer.componentName)
    })
    const nodeTypesEnum = new JavaEnum(undefined, ARK_UI_NODE_TYPE, componentNames.map((it, index) => { return { name: it, id: index } }))

    let writer = createLanguageWriter(library.declarationTable.language, getReferenceResolver(library))
    writer.print(`package ${ARKOALA_PACKAGE};\n`)
    nodeTypesEnum.print(writer)

    return { targetFile: new TargetFile(ARK_UI_NODE_TYPE, ARKOALA_PACKAGE_PATH), writer: writer }
}

export function makeJavaNodeTypes(library: PeerLibrary | IdlPeerLibrary): { targetFile: TargetFile, writer: LanguageWriter } {
    if (library instanceof PeerLibrary) {
        // TODO remove after migrating to IDL
        return makeJavaNodeTypesOld(library)
    }
    const componentNames = library.files.flatMap(file => {
        return Array.from(file.peers.values()).map(peer => peer.componentName)
    })
    const nodeTypesEnum = new JavaEnum(undefined, ARK_UI_NODE_TYPE, componentNames.map((it, index) => { return { name: it, id: index } }))

    let writer = createLanguageWriter(library.language, library)
    writer.print(`package ${ARKOALA_PACKAGE};\n`)
    nodeTypesEnum.print(writer)

    return { targetFile: new TargetFile(ARK_UI_NODE_TYPE, ARKOALA_PACKAGE_PATH), writer: writer }
}


// TODO remove after migrating to IDL
function makeJavaArkComponentsOld(library: PeerLibrary, printerContext: PrinterContext): { targetFile: TargetFile, writer: LanguageWriter } {
    const ark = 'Ark'
    const receiver = 'receiver'
    const create = 'create'
    const update = 'update'
    const usedTypes: IDLType[] = [toIDLType('Consumer'), toIDLType('Supplier')]
    const writer = createLanguageWriter(library.declarationTable.language, getReferenceResolver(library))

    writer.writeClass(ark, writer => {
        library.files.forEach(file => {
            file.peersToGenerate.forEach(peer => {
                const arkComponent = generateArkComponentName(peer.componentName)
                const arkPeer = componentToPeerClass(peer.componentName)
                const arkPeerType = toIDLType(`${arkPeer}`)

                const paramTypes = [toIDLType(`Consumer<${arkComponent}>`), toIDLType('Runnable')]
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
                        const javaType = printerContext.synthesizedTypes!.getTargetType(it, !!callableSignature.args[index].optional)
                        usedTypes.push(javaType)
                        paramTypes.push(javaType)
                        paramNames.push(callableSignature.argName(index))
                    })
                }

                const signature = new NamedMethodSignature(IDLVoidType, paramTypes, paramNames)
                const method = new Method(`Ark${peer.componentName}`, signature, [MethodModifier.PUBLIC, MethodModifier.STATIC])
                writer.writeMethodImplementation(method, writer => {
                    writer.writeStatement(
                        writer.makeAssign(receiver, undefined, writer.makeFunctionCall('remember', [
                            writer.makeLambda(new MethodSignature(toIDLType(arkComponent), []), [
                                writer.makeReturn(writer.makeString(`new ${arkComponent}()`))
                            ])
                        ]), true))
                    writer.writeStatement(
                        writer.makeAssign(create, toIDLType(`Supplier<${arkPeer}>`),
                            writer.makeLambda(new MethodSignature(arkPeerType, []), [
                                writer.makeReturn(writer.makeString(`${arkPeer}.create(${ARK_UI_NODE_TYPE}.${peer.componentName}, ${receiver}, 0)`))
                            ]), true))
                    writer.writeStatement(
                        writer.makeAssign(update, toIDLType(`Consumer<${arkPeer}>`),
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

    const result = createLanguageWriter(library.declarationTable.language, getReferenceResolver(library))
    result.print(`package ${ARKOALA_PACKAGE};\n`)
    printerContext.imports!.printImportsForTypes(usedTypes, result)
    result.concat(writer)

    return { targetFile: new TargetFile(ark, ARKOALA_PACKAGE_PATH), writer: result }
}

export function makeJavaArkComponents(library: PeerLibrary | IdlPeerLibrary, printerContext: PrinterContext): { targetFile: TargetFile, writer: LanguageWriter } {
    if (library instanceof PeerLibrary) {
        // TODO remove after migrating to IDL
        return makeJavaArkComponentsOld(library, printerContext)
    }
    const ark = 'Ark'
    const receiver = 'receiver'
    const create = 'create'
    const update = 'update'

    const imports = [
        {feature: 'java.util.function.Consumer', module: ''},
        {feature: 'java.util.function.Supplier', module: ''},
    ]
    const writer = createLanguageWriter(library.language, getReferenceResolver(library))

    writer.writeClass(ark, writer => {
        library.files.forEach(file => {
            file.peersToGenerate.forEach(peer => {
                const arkComponent = generateArkComponentName(peer.componentName)
                const arkPeer = componentToPeerClass(peer.componentName)
                const arkPeerType = toIDLType(`${arkPeer}`)

                const paramTypes = [toIDLType(`Consumer<${arkComponent}>`), toIDLType('Runnable')]
                const paramNames = ['style', 'content']
                const callableMethods = peer.methods.filter(it => it.isCallSignature)
                let callableMethod: IdlPeerMethod | undefined
                if (callableMethods.length > 1) {
                    throw new Error(`More than 1 method with callSignature in ${peer.componentName}`)
                }
                else if (callableMethods.length == 1) {
                    callableMethod = callableMethods[0]
                    imports.push(...collectJavaImports(callableMethod.declarationTargets))
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
                            writer.makeLambda(new MethodSignature(toIDLType(arkComponent), []), [
                                writer.makeReturn(writer.makeString(`new ${arkComponent}()`))
                            ])
                        ]), true))
                    writer.writeStatement(
                        writer.makeAssign(create, toIDLType(`Supplier<${arkPeer}>`),
                            writer.makeLambda(new MethodSignature(arkPeerType, []), [
                                writer.makeReturn(writer.makeString(`${arkPeer}.create(${ARK_UI_NODE_TYPE}.${peer.componentName}, ${receiver}, 0)`))
                            ]), true))
                    writer.writeStatement(
                        writer.makeAssign(update, toIDLType(`Consumer<${arkPeer}>`),
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

    const result = createLanguageWriter(library.language, getReferenceResolver(library))
    result.print(`package ${ARKOALA_PACKAGE};\n`)
    printJavaImports(result, imports)
    result.concat(writer)

    return { targetFile: new TargetFile(ark, ARKOALA_PACKAGE_PATH), writer: result }
}

export class JavaUnion extends IdlSyntheticTypeBase {
    constructor(source: Object | undefined, public name: string, public readonly members: IDLType[], public readonly imports: ImportFeature[]) {
        super(source)
    }

    print(writer: LanguageWriter): void {
        printJavaImports(writer, this.imports)

        writer.writeClass(this.name, () => {
            const intType = IDLI32Type
            const selector = 'selector'
            writer.writeFieldDeclaration(selector, intType, [FieldModifier.PRIVATE], false)
            writer.writeMethodImplementation(new Method('getSelector', new MethodSignature(intType, []), [MethodModifier.PUBLIC]), () => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(selector)
                    )
                )
            })

            const param = 'param'
            for (const [index, memberType] of this.members.entries()) {
                const memberName = `value${index}`
                writer.writeFieldDeclaration(memberName, memberType, [FieldModifier.PRIVATE], false)

                writer.writeConstructorImplementation(
                    this.name,
                    new NamedMethodSignature(IDLVoidType, [memberType], [param]),
                    () => {
                        writer.writeStatement(
                            writer.makeAssign(memberName, undefined, writer.makeString(param), false)
                        )
                        writer.writeStatement(
                            writer.makeAssign(selector, undefined, writer.makeString(index.toString()), false)
                        )
                    }
                )

                writer.writeMethodImplementation(
                    new Method(`getValue${index}`, new MethodSignature(memberType, []), [MethodModifier.PUBLIC]),
                    () => {
                        writer.writeStatement(
                            writer.makeReturn(
                                writer.makeString(memberName)
                            )
                        )
                    }
                )
            }
        }, ARK_OBJECTBASE)
    }
}

export class JavaTuple extends IdlSyntheticTypeBase {
    constructor(source: Object | undefined, readonly name: string, public readonly members: IDLType[], public readonly imports: ImportFeature[]) {
        super(source)
    }

    print(writer: LanguageWriter): void {
        printJavaImports(writer, this.imports)

        const memberNames: string[] = this.members.map((_, index) => `value${index}`)
        writer.writeClass(this.name, () => {
            for (let i = 0; i < memberNames.length; i++) {
                writer.writeFieldDeclaration(memberNames[i], this.members[i], [FieldModifier.PUBLIC], false)
            }

            const signature = new MethodSignature(IDLVoidType, this.members)
            writer.writeConstructorImplementation(this.name, signature, () => {
                for (let i = 0; i < memberNames.length; i++) {
                    writer.writeStatement(
                        writer.makeAssign(memberNames[i], this.members[i], writer.makeString(signature.argName(i)), false)
                    )
                }
            })
        }, ARK_OBJECTBASE)
    }
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
            const enumType = toIDLType(this.name)
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

export class JavaDataClass extends IdlSyntheticTypeBase {
    constructor(
        source: Object | undefined,
        readonly name: string,
        public readonly baseClass: string | undefined,
        public readonly members: {name: string, type: IDLType, modifiers: FieldModifier[]}[],
        public readonly imports: ImportFeature[],
    ) {
        super(source)
    }

    print(writer: LanguageWriter): void {
        printJavaImports(writer, this.imports)

        writer.writeClass(this.name, () => {
            this.members.forEach(it => {
                writer.writeFieldDeclaration(it.name, it.type, it.modifiers, false)
            })
        }, this.baseClass ?? ARK_OBJECTBASE)
    }
}
