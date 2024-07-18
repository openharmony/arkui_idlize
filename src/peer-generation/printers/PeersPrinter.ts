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

import * as path from "path"
import { PeerFile } from "../PeerFile";
import { PeerLibrary } from "../PeerLibrary";
import { Language, renameDtsToPeer, throwException } from "../../util";
import { convertPeerFilenameToModule, ImportsCollector } from "../ImportsCollector";
import { PeerClass, PeerClassBase } from "../PeerClass";
import { InheritanceRole, determineParentRole, isHeir, isRoot } from "../inheritance";
import { PeerMethod } from "../PeerMethod";
import {
    LanguageExpression,
    LanguageWriter,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature,
    Type,
    createLanguageWriter
} from "../LanguageWriters";
import { MaterializedMethod } from "../Materialized";
import { collectDtsImports } from "../DtsImportsGenerator";
import { tsCopyrightAndWarning } from "../FileGenerators";
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH } from "./lang/Java";
import { TargetFile } from "./TargetFile";
import { PrinterContext } from "./PrinterContext";

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
    private static readonly ArkTsIgnoredMethods = ["testTupleNumberStringEnum", "testTupleOptional", "testTupleUnion"]

    constructor(
        protected readonly library: PeerLibrary,
        protected readonly file: PeerFile,
        protected readonly printerContext: PrinterContext,
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
        this.getDefaultPeerImports(this.file.declarationTable.language)!.forEach(it => printer.print(it))

        const imports = new ImportsCollector()
        this.file.peersToGenerate.forEach(peer => {
            if (determineParentRole(peer.originalClassName, peer.parentComponentName) === InheritanceRole.PeerNode)
                imports.addFeature('PeerNode', './PeerNode')
            if (peer.originalParentFilename) {
                const parentModule = convertPeerFilenameToModule(peer.originalParentFilename)
                imports.addFeature(this.generatePeerParentName(peer), parentModule)
                const parentAttributesClass = this.generateAttributesParentClass(peer)
                if (parentAttributesClass)
                    imports.addFeature(parentAttributesClass, parentModule)
            }
        })
        if (this.file.declarationTable.language === Language.TS
            || this.file.declarationTable.language === Language.ARKTS) {
            this.file.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
            this.file.serializeImportFeatures.forEach(it => imports.addFeature(it.feature, it.module))
            imports.addFeature('GestureName', './shared/generated-utils')
            imports.addFeature('GestureComponent', './shared/generated-utils')
        }
        imports.addFeature("unsafeCast", "./shared/generated-utils")
        imports.addFeature("registerCallback", "./peers/SerializerBase")
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
            for (const field of peer.attributesFields)
                writer.print(field)
        }, parent ? [parent] : undefined)
    }

    protected printPeerConstructor(peer: PeerClass, printer: LanguageWriter): void {
        // TODO: fully switch to writer!
        const parentRole = determineParentRole(peer.originalClassName, peer.originalParentName)
        const isNode = parentRole !== InheritanceRole.Finalizable
        const signature = new NamedMethodSignature(
            Type.Void,
            [new Type('ArkUINodeType', !isNode), new Type('ComponentBase', true), new Type('int32')],
            ['type', 'component', 'flags'],
            [undefined, undefined, '0'])

        printer.writeConstructorImplementation(componentToPeerClass(peer.componentName), signature, (writer) => {
            if (parentRole === InheritanceRole.PeerNode) {
                writer.writeSuperCall([`type`, 'flags'])
                writer.writeMethodCall('component', 'setPeer', ['this'], true)
            } else if (parentRole === InheritanceRole.Heir || parentRole === InheritanceRole.Root) {
                writer.writeSuperCall([`type`, 'component', 'flags'])
            } else {
                throwException(`Unexpected parent inheritance role: ${parentRole}`)
            }
        })
    }

    protected printPeerMethod(method: PeerMethod, printer: LanguageWriter) {
        this.library.declarationTable.setCurrentContext(`${method.originalParentName}.${method.overloadedName}`)
        writePeerMethod(printer, method, this.printerContext, this.dumpSerialized, "Attribute", "this.peer.ptr")
        this.library.declarationTable.setCurrentContext(undefined)
    }

    protected printApplyMethod(peer: PeerClass, printer: LanguageWriter) {
        const name = peer.originalClassName!
        const typeParam = componentToAttributesClass(peer.componentName)
        if (isRoot(name)) {
            printer.print(`applyAttributes(attributes: ${typeParam}): void {}`)
            return
        }

        printer.print(`applyAttributes<T extends ${typeParam}>(attributes: T): void {`)
        printer.pushIndent()
        printer.print(`super.applyAttributes(attributes)`)
        printer.popIndent()
        printer.print(`}`)
    }

    protected printPeer(peer: PeerClass, printer: LanguageWriter) {
        printer.writeClass(componentToPeerClass(peer.componentName), (writer) => {
            this.printPeerConstructor(peer, writer)
            peer.methods.filter((method) =>
                writer.language == Language.ARKTS ? !PeerFileVisitor.ArkTsIgnoredMethods.includes(method.overloadedName) : true
            ).forEach((method) => this.printPeerMethod(method, writer))
            this.printApplyMethod(peer, writer)
        }, this.generatePeerParentName(peer))
    }

    printFile(): void {
        const printer = createLanguageWriter(this.library.declarationTable.language)
        const targetBasename = renameDtsToPeer(path.basename(this.file.originalFilename), this.file.declarationTable.language, false)
        this.printers.set(new TargetFile(targetBasename), printer)

        this.printImports(printer, targetBasename)
        this.file.peersToGenerate.forEach(peer => {
            this.printPeer(peer, printer)
            this.printAttributes(peer, printer)
        })
    }

    protected getDefaultPeerImports(lang: Language) {
        switch(lang) {
            case Language.TS: {
                return [
                    `import { int32 } from "@koalaui/common"`,
                    `import { nullptr, KPointer } from "@koalaui/interop"`,
                    `import { isPixelMap, isResource, isInstanceOf, runtimeType, RuntimeType, SerializerBase } from "./SerializerBase"`,
                    `import { createSerializer, Serializer } from "./Serializer"`,
                    `import { nativeModule } from "@koalaui/arkoala"`,
                    `import { ArkUINodeType } from "./ArkUINodeType"`,
                    `import { ComponentBase } from "../ComponentBase"`,
                ]
            }
            case Language.ARKTS: {
                return [
                    `import { int32 } from "@koalaui/common"`,
                    `import { nullptr, KPointer } from "@koalaui/interop"`,
                    `import { isPixelMap, isResource, isInstanceOf, runtimeType, RuntimeType, SerializerBase } from "./SerializerBase"`,
                    `import { createSerializer, Serializer } from "./Serializer"`,
                    `import { ArkUINodeType } from "./ArkUINodeType"`,
                    `import { ComponentBase } from "../ComponentBase"`,
                    `import { NativeModule } from "../NativeModule"`,
                    `${collectDtsImports('..').trim()}`
                ]
            }
        }
    }
}

class JavaPeerFileVisitor extends PeerFileVisitor {
    constructor(
        library: PeerLibrary,
        file: PeerFile,
        printerContext: PrinterContext,
        dumpSerialized: boolean,
    ) {
        super(library, file, printerContext, dumpSerialized)
    }

    private printPackage(printer: LanguageWriter): void {
        if (this.file.declarationTable.language == Language.JAVA) {
            printer.print(`package ${ARKOALA_PACKAGE};\n`)
        }
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
            let printer = createLanguageWriter(this.library.declarationTable.language)
            const peerName = componentToPeerClass(peer.componentName)
            this.printers.set(new TargetFile(peerName, ARKOALA_PACKAGE_PATH), printer)

            const allTypesInPeer = peer.methods.flatMap((method) => {
                return method.declarationTargets.map(target => this.printerContext.synthesizedTypes!.getTargetType(target, false))
            })

            this.printPackage(printer)
            this.printerContext.imports?.printImportsForTypes(allTypesInPeer, printer)
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

class PeersVisitor {
    readonly peers: Map<TargetFile, string[]> = new Map()

    constructor(
        private readonly library: PeerLibrary,
        private readonly printerContext: PrinterContext,
        private readonly dumpSerialized: boolean,
    ) { }

    printPeers(): void {
        for (const file of this.library.files.values()) {
            if (!file.peersToGenerate.length)
                continue
            const visitor = this.printerContext.language == Language.JAVA ?
                new JavaPeerFileVisitor(this.library, file, this.printerContext, this.dumpSerialized) :
                new PeerFileVisitor(this.library, file, this.printerContext, this.dumpSerialized)
            visitor.printFile()
            visitor.printers.forEach((printer, targetFile) => {
                this.peers.set(targetFile, printer.getOutput())
            })
        }
    }
}

const returnValName = "retval"  // make sure this doesn't collide with parameter names!

export function printPeers(peerLibrary: PeerLibrary, printerContext: PrinterContext, dumpSerialized: boolean): Map<TargetFile, string> {
    const visitor = new PeersVisitor(peerLibrary, printerContext, dumpSerialized)
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
        new MethodSignature(Type.Pointer, []),
        // TODO: private static getFinalizer() method conflicts with its implementation in the parent class
        [MethodModifier.STATIC])
    writer.writeMethodImplementation(finalizer, writer => {
        writer.writeStatement(
            writer.makeReturn(
                writer.makeMethodCall("nativeModule()", `_${className}_getFinalizer`, [])))
    })
}

export function writePeerMethod(printer: LanguageWriter, method: PeerMethod, printerContext: PrinterContext, dumpSerialized: boolean,
    methodPostfix: string, ptr: string, returnType: Type = Type.Void, generics?: string[]
) {
    const signature = method.method.signature as NamedMethodSignature
    let peerMethod: Method
    if ([Language.ARKTS, Language.TS].includes(printerContext.language)) {
        peerMethod = new Method(
            `${method.overloadedName}${methodPostfix}`,
            new NamedMethodSignature(returnType, signature.args, signature.argsNames),
            method.method.modifiers, method.method.generics)
    }
    else if (printerContext.language == Language.JAVA) {
        const args = method.declarationTargets.map(declarationTarget => printerContext.synthesizedTypes!.getTargetType(declarationTarget, false))
        peerMethod = new Method(
            `${method.overloadedName}${methodPostfix}`,
            new NamedMethodSignature(returnType, args, signature.argsNames),
            method.method.modifiers, method.method.generics)
    }
    else {
        return
    }
    printer.writeMethodImplementation(peerMethod, (writer) => {
        let scopes = method.argConvertors.filter(it => it.isScoped)
        scopes.forEach(it => {
            writer.pushIndent()
            writer.print(it.scopeStart?.(it.param, printer.language))
        })
        let serializerCreated = false
        method.argConvertors.forEach((it, index) => {
            if (it.useArray) {
                if (!serializerCreated) {
                    writer.writeStatement(
                        writer.makeAssign(`thisSerializer`, new Type('Serializer'),
                            writer.makeMethodCall('SerializerBase', 'get', [
                                writer.makeSerializerCreator(), writer.makeString(index.toString())
                            ]), true)
                    )
                    serializerCreated = true
                }
                it.convertorSerialize(`this`, it.param, writer)
            }
        })
        // Enable to see serialized data.
        if (dumpSerialized) {
            let arrayNum = 0
            method.argConvertors.forEach((it, index) => {
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
        method.argConvertors.forEach(it => {
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
            `_${method.originalParentName}_${method.overloadedName}`,
            params)
        if (returnType != Type.Void) {
            writer.writeStatement(writer.makeAssign(returnValName, undefined, call, true))
        } else {
            writer.writeStatement(writer.makeStatement(call))
        }
        scopes.reverse().forEach(it => {
            writer.popIndent()
            writer.print(it.scopeEnd!(it.param, writer.language))
        })
        // TODO: refactor
        if (returnType != Type.Void) {
            let result = returnValName
            if (method.hasReceiver() && returnType === Type.This) {
                result = `this`
            } else if (method instanceof MaterializedMethod && method.peerMethodName !== "ctor") {
                const isStatic = method.method.modifiers?.includes(MethodModifier.STATIC)
                if (!method.hasReceiver()) {
                    const retType = signature.returnType
                    const obj = `new ${retType.name}(${signature.argsNames.map(it => "undefined").join(", ")})`
                    writer.writeStatement(writer.makeAssign("obj", retType, writer.makeString(obj), true))
                    writer.writeStatement(
                        writer.makeAssign("obj.peer", new Type("Finalizable"),
                            writer.makeString(`new Finalizable(${returnValName}, ${method.originalParentName}.getFinalizer())`), false))
                    result = "obj"
                }
            }
            writer.writeStatement(writer.makeReturn(writer.makeString(result)))
        }
    })
}
