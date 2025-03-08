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

import * as idl from '@idlizer/core/idl'
import * as path from "path"
import { renameDtsToPeer, throwException, Language, InheritanceRole, determineParentRole, isHeir, isRoot, isStructureType, isMaterializedType } from '@idlizer/core'
import { convertPeerFilenameToModule, ImportsCollector } from "../ImportsCollector"
import {
    ExpressionStatement,
    LanguageExpression,
    LanguageStatement,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature,
} from "../LanguageWriters";
import { LanguageWriter, createConstructPeerMethod, PeerClassBase, PeerClass, PeerFile, PeerMethod,
    getInternalClassName, MaterializedMethod, PeerLibrary
} from "@idlizer/core";
import { tsCopyrightAndWarning } from "../FileGenerators";
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH } from "./lang/Java";
import { TargetFile } from "./TargetFile"
import { peerGeneratorConfiguration} from "../../DefaultConfiguration";
import { collectJavaImports } from "./lang/JavaIdlUtils";
import { printJavaImports } from "./lang/JavaPrinters";
import { createOptionalType, createReferenceType, forceAsNamedNode, IDLI32Type, IDLPointerType, IDLStringType, IDLThisType, IDLType,
        IDLVoidType, isNamedNode, isPrimitiveType
} from '@idlizer/core'
import { collectDeclDependencies } from "../ImportsCollectorUtils";
import { findComponentByType } from "../ComponentsCollector";
import { NativeModule } from "../NativeModule";

export function componentToPeerClass(component: string) {
    return `Ark${component}Peer`
}

function componentToAttributesClass(component: string) {
    return `Ark${component}Attributes`
}

// For TS and ArkTS
class PeerFileVisitor {
    readonly printers = new Map<TargetFile, LanguageWriter>
    //TODO: Ignore until bugs are fixed in https://rnd-gitlab-msc.huawei.com/rus-os-team/virtual-machines-and-tools/panda/-/issues/17850

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly file: PeerFile,
        protected readonly dumpSerialized: boolean,
    ) { }

    protected generatePeerParentName(peer: PeerClass): string {
        if (!peer.originalClassName)
            throw new Error(`${peer.componentName} is not supported, use 'uselessConstructorInterfaces' for now`)
        const parentRole = determineParentRole(peer.originalClassName, peer.parentComponentName)
        if ([InheritanceRole.Finalizable, InheritanceRole.PeerNode].includes(parentRole)) {
            return InheritanceRole[parentRole]
        }
        const parent = peer.parentComponentName ?? throwException(`Expected component to have parent`)
        return componentToPeerClass(parent)
    }

    protected generateAttributesParentClass(peer: PeerClass): string | undefined {
        if (!isHeir(peer.originalClassName!)) return undefined
        return componentToAttributesClass(peer.parentComponentName!)
    }

    protected printImports(printer: LanguageWriter, targetBasename: string): void {
        this.getDefaultPeerImports(this.library.language)!.forEach(it => printer.print(it))

        const imports = new ImportsCollector()
        this.file.peersToGenerate.forEach(peer => {
            if (peer.originalParentFilename) {
                const parentModule = convertPeerFilenameToModule(peer.originalParentFilename)
                imports.addFeature(this.generatePeerParentName(peer), parentModule)
                const parentAttributesClass = this.generateAttributesParentClass(peer)
                if (parentAttributesClass)
                    imports.addFeature(parentAttributesClass, parentModule)
            }
            const component = findComponentByType(this.library, idl.createReferenceType(peer.originalClassName!))!
            collectDeclDependencies(this.library, component.attributeDeclaration, imports, { expandTypedefs: true })
            if (component.interfaceDeclaration)
                collectDeclDependencies(this.library, component.interfaceDeclaration, imports, { expandTypedefs: true })
        })
        if (this.library.language === Language.TS) {
            imports.addFeature('GestureName', './shared/generated-utils')
            imports.addFeature('GestureComponent', './shared/generated-utils')
        }

        if (this.library.language === Language.TS || this.library.language === Language.ARKTS) {
            imports.addFeature('CallbackKind', './peers/CallbackKind')
            imports.addFeature('CallbackTransformer', './peers/CallbackTransformer')
        }
        if (printer.language == Language.TS) {
            imports.addFeature("unsafeCast", "@koalaui/common")
        }
        if (printer.language == Language.ARKTS) {
            imports.addFeature("TypeChecker", "#components")
        }
        if (this.library.language !== Language.ARKTS) {
            imports.addFeature("Deserializer", "./peers/Deserializer")
            imports.addFeature("createDeserializer", "./peers/Deserializer")
        }
        imports.addFeatures(["MaterializedBase", "toPeerPtr", "wrapCallback"], "@koalaui/interop")
        // collectMaterializedImports(imports, this.library)
        Array.from(this.library.builderClasses.keys())
            .filter(it => this.library.builderClasses.get(it)?.needBeGenerated)
            .forEach((className) => imports.addFeature(className, `./Ark${className}Builder`))
        imports.print(printer, `./peers/${targetBasename}`)
    }

    protected printAttributes(peer: PeerClass, printer: LanguageWriter) {
        for (const attributeType of peer.attributesTypes)
            printer.print(attributeType.content)

        const parent = this.generateAttributesParentClass(peer)
        printer.writeInterface(componentToAttributesClass(peer.componentName), (writer) => {
            for (const field of peer.attributesFields) {
                writer.writeFieldDeclaration(
                    field.name,
                    field.type,
                    [],
                    true
                )
            }
        }, parent ? [parent] : undefined)
    }

    protected printPeerConstructor(peer: PeerClass, printer: LanguageWriter): void {
        // TODO: fully switch to writer!
        const parentRole = determineParentRole(peer.originalClassName, peer.originalParentName)
        const signature = new NamedMethodSignature(
            IDLVoidType,
            [IDLPointerType, IDLI32Type, IDLStringType, IDLI32Type],
            ['peerPtr', 'id', 'name', 'flags'],
            [undefined, undefined, '""', '0'])

        printer.writeConstructorImplementation(componentToPeerClass(peer.componentName), signature, (writer) => {
            if (parentRole === InheritanceRole.PeerNode || parentRole === InheritanceRole.Heir || parentRole === InheritanceRole.Root) {
                writer.writeSuperCall(['peerPtr', 'id', `name`, 'flags'])
            } else {
                throwException(`Unexpected parent inheritance role: ${parentRole}`)
            }
        }, undefined, [MethodModifier.PROTECTED])
    }

    protected printCreateMethod(peer: PeerClass, writer: LanguageWriter): void {
        const peerClass = componentToPeerClass(peer.componentName)
        const signature = new NamedMethodSignature(
            createReferenceType(peerClass),
            [createOptionalType(createReferenceType('ComponentBase')), IDLI32Type],
            ['component', 'flags'],
            [undefined, '0']
        )
        writer.writeMethodImplementation(new Method('create', signature, [MethodModifier.STATIC, MethodModifier.PUBLIC]), (writer) => {
            const peerId = 'peerId'
            writer.writeStatement(
                writer.makeAssign(peerId, undefined, writer.makeString('PeerNode.nextId()'), true)
            )
            const _peerPtr = '_peerPtr'
            writer.writeStatement(
                writer.makeAssign(_peerPtr, undefined, writer.makeNativeCall(
                    NativeModule.Generated,
                    `_${peer.componentName}_${createConstructPeerMethod(peer).overloadedName}`,
                    [writer.makeString(peerId), writer.makeString(signature.argName(1))]
                ), true)
            )

            const _peer = '_peer'
            writer.writeStatement(
                writer.makeAssign(_peer, undefined,
                    writer.makeNewObject(peerClass, [
                        writer.makeString(_peerPtr), 
                        writer.makeString(peerId), 
                        writer.makeString(`"${peer.componentName}"`),
                        writer.makeString('flags')]),
                    true)
            )
            writer.writeMethodCall(signature.argName(0), 'setPeer', [_peer], true)
            writer.writeStatement(writer.makeReturn(writer.makeString(_peer)))
        })
    }

    protected printPeerMethod(method: PeerMethod, printer: LanguageWriter) {
        this.library.setCurrentContext(`${method.originalParentName}.${method.overloadedName}`)
        writePeerMethod(this.library, printer, method, true, this.dumpSerialized, "Attribute", "this.peer.ptr")
        this.library.setCurrentContext(undefined)
    }

    protected printApplyMethod(peer: PeerClass, printer: LanguageWriter) {
        /* Turned off due to https://gitee.com/openharmony-sig/arkcompiler_ets_frontend/issues/IBC95C */
        return

        const name = peer.originalClassName!
        const typeParam = componentToAttributesClass(peer.componentName)
        if (isRoot(name)) {
            printer.print(`applyAttributes(attributes: ${typeParam}): void {}`)
            return
        }
        printer.print(`applyAttributes<T extends ${typeParam}>(attributes: T): ${printer.getNodeName(IDLVoidType)} {`)
        printer.pushIndent()
        printer.print(`super.applyAttributes(attributes)`)
        printer.popIndent()
        printer.print(`}`)
    }

    protected printPeer(peer: PeerClass, printer: LanguageWriter) {
        printer.writeClass(componentToPeerClass(peer.componentName), (writer) => {
            this.printPeerConstructor(peer, writer)
            this.printCreateMethod(peer, writer);
            (peer.methods as any[])
                .filter(method => !peerGeneratorConfiguration().ignoreMethod(method.overloadedName, writer.language))
                .forEach(method => this.printPeerMethod(method, writer))
            this.printApplyMethod(peer, writer)
        }, this.generatePeerParentName(peer))
    }

    printFile(): void {
        const printer = this.library.createLanguageWriter()
        const targetBasename = renameDtsToPeer(path.basename(this.file.originalFilename), this.library.language, false)
        this.printers.set(new TargetFile(targetBasename), printer)

        this.printImports(printer, targetBasename)
        this.file.peersToGenerate.forEach(peer => {
            this.printPeer(peer, printer)
            this.printAttributes(peer, printer)
        })
    }

    protected getDefaultPeerImports(lang: Language) {
        const defaultPeerImports = [
            `import { int32, float32 } from "@koalaui/common"`,
            `import { nullptr, KPointer, KInt, KBoolean, KStringPtr } from "@koalaui/interop"`,
            `import { runtimeType, RuntimeType } from "@koalaui/interop"`,
            `import { Serializer } from "./Serializer"`,
            `import { ComponentBase } from "../../ComponentBase"`,
            `import { PeerNode } from "../../PeerNode"`
        ]
        switch (lang) {
            case Language.TS: {
                return [...defaultPeerImports,
                    `import { isInstanceOf } from "@koalaui/interop"`,
                    `import { isResource, isPadding } from "../../utils"`,
                    `import { ${NativeModule.Generated.name} } from "../${NativeModule.Generated.name}"`,]
            }
            case Language.ARKTS: {
                return [...defaultPeerImports,
                    `import { ${NativeModule.Generated.name} } from "#components"`,]
            }
            default: {
                return []
            }
        }
    }
}

class JavaPeerFileVisitor extends PeerFileVisitor {
    constructor(
        protected readonly library: PeerLibrary,
        protected readonly file: PeerFile,
        dumpSerialized: boolean,
    ) {
        super(library, file, dumpSerialized)
    }

    private printPackage(printer: LanguageWriter): void {
        printer.print(`package ${ARKOALA_PACKAGE};\n`)
    }

    protected printApplyMethod(peer: PeerClass, printer: LanguageWriter) {
        // TODO: attributes
        // const name = peer.originalClassName!
        // const typeParam = componentToAttributesClass(peer.componentName)
        // if (isRoot(name)) {
        //     printer.print(`void applyAttributes(${typeParam} attributes) {}`)
        //     return
        // }

        // printer.print(`void applyAttributes(${typeParam} attributes) {`)
        // printer.pushIndent()
        // printer.print(`super.applyAttributes(attributes)`)
        // printer.popIndent()
        // printer.print(`}`)
    }

    printFile(): void {
        this.file.peers.forEach(peer => {
            let printer = this.library.createLanguageWriter()
            const peerName = componentToPeerClass(peer.componentName)
            this.printers.set(new TargetFile(peerName, ARKOALA_PACKAGE_PATH), printer)

            this.printPackage(printer)

            const idlPeer = peer as PeerClass
            const imports = collectJavaImports(idlPeer.methods.flatMap(method => method.method.signature.args))
            printJavaImports(printer, imports)


            this.printPeer(peer, printer)

            // TODO: attributes
            // printer = createLanguageWriter(this.library.declarationTable.language)
            // const attributesName = componentToAttributesClass(peer.componentName)
            // this.printers.set(new TargetFile(attributesName, ARKOALA_PACKAGE_PATH), printer)

            // this.printPackage(printer)
            // this.printAttributes(peer, printer)
        })
    }
}

class CJPeerFileVisitor extends PeerFileVisitor {
    constructor(
        protected readonly library: PeerLibrary,
        protected readonly file: PeerFile,
        dumpSerialized: boolean,
    ) {
        super(library, file, dumpSerialized)
    }

    private printPackage(printer: LanguageWriter): void {
        printer.print(`package idlize\n`)
    }

    protected printApplyMethod(peer: PeerClass, printer: LanguageWriter) {
    }

    printFile(): void {
        const printer = this.library.createLanguageWriter()
        const targetBasename = renameDtsToPeer(path.basename(this.file.originalFilename), this.library.language, false)
        this.printers.set(new TargetFile(targetBasename), printer)

        this.printPackage(printer)

        printer.print("import std.collection.*")
        printer.print("import Interop.*")
        this.file.peersToGenerate.forEach(peer => {
            this.printPeer(peer, printer)
        })
    }
}

class PeersVisitor {
    readonly peers: Map<TargetFile, string[]> = new Map()

    constructor(
        private readonly library: PeerLibrary,
        private readonly dumpSerialized: boolean,
    ) { }

    printPeers(): void {
        for (const file of this.library.files.values()) {
            if (!file.peersToGenerate.length)
                continue
            const visitor = this.library.language == Language.JAVA
                ? new JavaPeerFileVisitor(this.library, file, this.dumpSerialized)
                : this.library.language == Language.CJ
                ? new CJPeerFileVisitor(this.library, file, this.dumpSerialized)
                : new PeerFileVisitor(this.library, file, this.dumpSerialized)
            visitor.printFile()
            visitor.printers.forEach((printer, targetFile) => {
                this.peers.set(targetFile, printer.getOutput())
            })
        }
    }
}

const returnValName = "retval"  // make sure this doesn't collide with parameter names!

export function printPeers(peerLibrary: PeerLibrary, dumpSerialized: boolean): Map<TargetFile, string> {
    const visitor = new PeersVisitor(peerLibrary, dumpSerialized)
    visitor.printPeers()
    const result = new Map<TargetFile, string>()
    for (const [key, content] of visitor.peers) {
        if (content.length === 0) continue
        const text = tsCopyrightAndWarning(content.join('\n'))
        result.set(key, text)
    }
    return result
}

export function printPeerFinalizer(peerClassBase: PeerClassBase, writer: LanguageWriter): void {
    const className = peerClassBase.getComponentName()
    const finalizer = new Method(
        "getFinalizer",
        new MethodSignature(IDLPointerType, []),
        // TODO: private static getFinalizer() method conflicts with its implementation in the parent class
        [MethodModifier.STATIC])
    writer.writeMethodImplementation(finalizer, writer => {
        writer.writeStatement(
            writer.makeReturn(
                writer.makeNativeCall(NativeModule.Generated, `_${className}_getFinalizer`, [])))
    })
}

export function writePeerMethod(library: PeerLibrary, printer: LanguageWriter, method: PeerMethod, isIDL: boolean, dumpSerialized: boolean,
    methodPostfix: string, ptr: string, returnType: IDLType = IDLVoidType, generics?: string[]
) {
    const signature = method.method.signature as NamedMethodSignature
    let peerMethod = new Method(
        `${method.overloadedName}${methodPostfix}`,
        new NamedMethodSignature(returnType, signature.args, signature.argsNames),
        method.method.modifiers, method.method.generics
    )
    printer.writeMethodImplementation(peerMethod, (writer) => {
        let scopes = method.argAndOutConvertors.filter(it => it.isScoped)
        scopes.forEach(it => {
            writer.pushIndent()
        })
        let serializerCreated = false
        let returnValueFilledThroughOutArg = false
        method.argAndOutConvertors.forEach((it, index) => {
            if (it.useArray) {
                if (!serializerCreated) {
                    writer.writeStatement(
                        writer.makeAssign(`thisSerializer`, createReferenceType('Serializer'),
                            writer.makeMethodCall('Serializer', 'hold', []), true)
                    )
                    serializerCreated = true
                }
                if (it.isOut) {
                    returnValueFilledThroughOutArg = true
                    it.convertorSerialize(`this`, returnValName, writer)
                } else
                    it.convertorSerialize(`this`, it.param, writer)
            }
        })
        // Enable to see serialized data.
        if (dumpSerialized) {
            let arrayNum = 0
            method.argAndOutConvertors.forEach((it, index) => {
                if (it.useArray) {
                    writer.writePrintLog(`"${it.param}:", thisSerializer.asArray(), thisSerializer.length())`)
                }
            })
        }
        let params: LanguageExpression[] = []
        if (method.hasReceiver()) {
            params.push(writer.makeString(ptr))
        }
        let serializerPushed = false
        method.argAndOutConvertors.forEach(it => {
            if (it.useArray) {
                if (!serializerPushed) {
                    params.push(writer.makeMethodCall(`thisSerializer`, 'asArray', []))
                    params.push(writer.makeMethodCall(`thisSerializer`, 'length', []))
                    serializerPushed = true
                }
            } else {
                params.push(writer.makeString(it.convertorArg(it.param, writer)))
            }
        })
        let call = writer.makeNativeCall(
            NativeModule.Generated,
            `_${method.originalParentName}_${method.overloadedName}`,
            params)

        if (!returnValueFilledThroughOutArg && returnType != IDLVoidType) {
            writer.writeStatement(writer.makeAssign(returnValName, undefined, call, true))
        } else {
            writer.writeStatement(writer.makeStatement(call))
        }
        if (serializerPushed)
            writer.writeStatement(new ExpressionStatement(
                writer.makeMethodCall('thisSerializer', 'release', [])))
        scopes.reverse().forEach(it => {
            writer.popIndent()
        })
        // TODO: refactor
        if (returnType != IDLVoidType) {
            let result: LanguageStatement[] = [writer.makeReturn(writer.makeString(returnValName))]
            if (returnValueFilledThroughOutArg) {
                // keep result
            } else if (returnsThis(method, returnType)) {
                result = [writer.makeReturn(writer.makeString("this"))]
            } else if (method instanceof MaterializedMethod && method.peerMethodName !== "ctor") {
                if (isNamedNode(returnType)
                    && (returnType.name === method.originalParentName || isMaterializedType(returnType, writer.resolver))) {
                    result = [
                        ...constructMaterializedObject(writer, signature, "obj", returnValName),
                        writer.makeReturn(writer.makeString("obj"))
                    ]

                } else if (!isPrimitiveType(returnType)) {
                    if ((idl.IDLContainerUtils.isSequence(returnType) || idl.IDLContainerUtils.isRecord(returnType)) && writer.language != Language.JAVA) {
                        result = makeDeserializedReturn(library, printer, returnType)
                    } else if (isStructureType(returnType, writer.resolver) && writer.language != Language.JAVA) {
                        result = makeDeserializedReturn(library, printer, returnType)
                    } else {
                        // todo: implement other types deserialization!!!!
                        result = [writer.makeThrowError("Object deserialization is not implemented.")]
                    }
                } else if (returnType === idl.IDLBufferType && writer.language !== Language.JAVA) {
                    const instance = makeDeserializerInstance(returnValName, writer.language)
                    result = [
                        writer.makeReturn(
                            writer.makeMethodCall(
                                instance, 'readBuffer', []
                            )
                        )
                    ]
                }
            }
            for (const stmt of result) {
                writer.writeStatement(stmt)
            }
        }
    })
}

function makeDeserializedReturn(library: PeerLibrary, writer: LanguageWriter, returnType: IDLType): LanguageStatement[] {
    const deserializerName = `${returnValName}Deserializer`
    writer.writeStatement(
        writer.makeAssign(
            deserializerName,
            idl.createReferenceType("Deserializer"),
            writer.makeString(makeDeserializerInstance(returnValName, writer.language)),
            true,
            false,
            { assignRef: true }
        )
    )

    const returnConvertor = library.typeConvertor(returnValName, returnType)
    const returnResultValName = "returnResult"
    return [
        returnConvertor.convertorDeserialize(
            'buffer',
            deserializerName,
            (expr) => writer.makeAssign(returnResultValName, returnType, expr, true),
            writer
        ),
        writer.makeReturn(writer.makeString(returnResultValName))
    ]
}

function makeDeserializerInstance(returnValName: string, language: Language) {
    if (language === Language.TS) {
        return `new Deserializer(${returnValName}.buffer, ${returnValName}.byteLength)`
    } else if (language === Language.ARKTS) {
        return `new Deserializer(${returnValName}, ${returnValName}.length)`
    } else if (language === Language.JAVA) {
        return `new Deserializer(${returnValName}, ${returnValName}.length)`
    } else if (language === Language.CJ) {
        return `Deserializer(${returnValName}, Int64(${returnValName}.size))`
    } else {
        throw "not implemented"
    }
}

function returnsThis(method: PeerMethod, returnType: IDLType) {
    return method.hasReceiver() && returnType === IDLThisType
}

function constructMaterializedObject(writer: LanguageWriter, signature: MethodSignature,
    resultName: string, peerPtrName: string): LanguageStatement[] {
    const retType = signature.returnType
    if (!idl.isReferenceType(retType)) {
        throw new Error("Method returns wrong value")
    }
    // TODO: Use "ClassNameInternal.fromPtr(ptr)"
    // once java is generated in the same way as typescript for materialized classes
    const decl = writer.resolver.resolveTypeReference(retType)
    if (!decl) {
        throw new Error("Can not resolve materialized class")
    }
    const internalClassName = getInternalClassName(idl.getFQName(decl))
    return [
        writer.makeAssign(
            `${resultName}`,
            retType,
            writer.makeMethodCall(internalClassName, "fromPtr", [writer.makeString(peerPtrName)]),
            true),
    ]
    /*
    return [
        writer.makeAssign(`${resultName}`, retType, writer.makeNewObject(forceAsNamedNode(retType).name), true),
-        writer.makeAssign(`${resultName}.peer`, createReferenceType("Finalizable"),
            writer.makeNewObject('Finalizable', [writer.makeString(peerPtrName), writer.makeString(`${forceAsNamedNode(retType).name}.getFinalizer()`)]),
            false),
    ]
    */
}
