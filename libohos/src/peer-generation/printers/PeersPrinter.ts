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
import {
    throwException,
    Language,
    InheritanceRole,
    determineParentRole,
    isHeir,
    isRoot,
    isStructureType,
    isMaterializedType,
    MaterializedClass,
    qualifiedName,
    generatorHookName,
    generatorConfiguration,
    LayoutNodeRole,
    CustomTypeConvertor,
    ArgumentModifier,
    capitalize,
    InteropReturnTypeConvertor
} from '@idlizer/core'
import { ImportsCollector } from "../ImportsCollector"
import {
    ExpressionStatement,
    LanguageExpression,
    LanguageStatement,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature,
} from "../LanguageWriters";
import { LanguageWriter, createConstructPeerMethod, PeerClass, PeerMethod,
    getInternalClassName, MaterializedMethod, PeerLibrary
} from "@idlizer/core";
import { tsCopyrightAndWarning } from "../FileGenerators";
import { ARKOALA_PACKAGE, ARKOALA_PACKAGE_PATH } from "./lang/Java";
import { TargetFile } from "./TargetFile"
import { peerGeneratorConfiguration} from "../../DefaultConfiguration";
import { collectJavaImports } from "./lang/JavaIdlUtils";
import { printJavaImports } from "./lang/JavaPrinters";
import { createReferenceType, IDLI32Type, IDLPointerType, IDLStringType, IDLThisType, IDLType,
        IDLVoidType, isNamedNode, isPrimitiveType
} from '@idlizer/core'
import { collectDeclDependencies, collectDeclItself } from "../ImportsCollectorUtils";
import { findComponentByName, findComponentByType } from "../ComponentsCollector";
import { NativeModule } from "../NativeModule";
import { PrinterFunction, PrinterResult } from '../LayoutManager';
import { collectPeersForFile } from '../PeersCollector';

export function componentToPeerClass(component: string) {
    return `Ark${component}Peer`
}

export function componentToStyleClass(component: string) {
    if (component.endsWith("Attribute"))
        component = component.substring(0, component.length - 9)
    return `Ark${component}Style`
}

export function componentToAttributesInterface(component: string) {
    return `${component}`
}

// For TS and ArkTS
class PeerFileVisitor {
    constructor(
        protected readonly library: PeerLibrary,
        protected readonly file: idl.IDLFile,
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

    protected printImports(peer: PeerClass, imports: ImportsCollector): void {
        this.getDefaultPeerImports(this.library.language, imports)
        if (peer.originalParentFilename) {
            const parentComponent = findComponentByName(this.library, peer.parentComponentName!)
            imports.addFeature(this.generatePeerParentName(peer), this.library.layout.resolve({node: parentComponent!.attributeDeclaration, role: LayoutNodeRole.PEER}))
        }
        const component = findComponentByType(this.library, idl.createReferenceType(peer.originalClassName!))!
        collectDeclDependencies(this.library, component.attributeDeclaration, imports, { expandTypedefs: true })
        component.attributeDeclaration.methods.forEach(method => {
            method.parameters.map(p => p.type).concat([method.returnType]).forEach(type => {
                collectDeclDependencies(this.library, type, (dep) => {
                    collectDeclDependencies(this.library, dep, imports, { expandTypedefs: true })
                }, { expandTypedefs: true })
            })
        })
        if (component.interfaceDeclaration)
            collectDeclDependencies(this.library, component.interfaceDeclaration, imports, { expandTypedefs: true })
        if (this.library.language === Language.TS) {
            imports.addFeature('GestureName', './shared/generated-utils')
            imports.addFeature('GestureComponent', './shared/generated-utils')
            imports.addFeatures(['isResource', 'isPadding'], '../utils')
        }

        if (this.library.language === Language.TS || this.library.language === Language.ARKTS) {
            collectDeclItself(this.library, idl.createReferenceType("CallbackKind"), imports)
            imports.addFeature('CallbackTransformer', '../CallbackTransformer')
            collectDeclItself(this.library, idl.createReferenceType(NativeModule.Generated.name), imports)

            const hookMethods = generatorConfiguration().hooks.get(peer.componentName)
            if (hookMethods) {
                for (const [methodName, hook] of hookMethods.entries()) {
                    const hookName = hook ? hook.hookName : `hook${peer.componentName}${capitalize(methodName)}`
                    imports.addFeature(hookName, "./../handwritten")
                }
            }
        }
        if (this.library.language == Language.TS) {
            imports.addFeature("unsafeCast", "@koalaui/common")
        }
        if (this.library.language == Language.ARKTS) {
            imports.addFeature("TypeChecker", "#components")
        }
        if (this.library.language !== Language.ARKTS) {
            collectDeclItself(this.library, idl.createReferenceType("Deserializer"), imports)
        }
        imports.addFeatures(["MaterializedBase", "toPeerPtr", "wrapCallback"], "@koalaui/interop")
        // collectMaterializedImports(imports, this.library)
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
        }, {superArgs: ['peerPtr', 'id', 'name', 'flags'], superName: peer.parentComponentName}, [MethodModifier.PROTECTED])
    }

    protected printCreateMethod(peer: PeerClass, writer: LanguageWriter): void {
        const peerClass = componentToPeerClass(peer.componentName)
        const signature = new NamedMethodSignature(
            createReferenceType(peerClass),
            [createReferenceType('ComponentBase'), IDLI32Type],
            ['component', 'flags'],
            [undefined, '0'],
            [[ArgumentModifier.OPTIONAL], undefined]
        )
        writer.makeStaticBlock(() => {
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
        })
    }

    protected printPeerMethod(method: PeerMethod, printer: LanguageWriter) {
        this.library.setCurrentContext(`${method.originalParentName}.${method.overloadedName}`)
        writePeerMethod(this.library, printer, method, true, this.dumpSerialized, "Attribute", "this.peer.ptr")
        this.library.setCurrentContext(undefined)
    }

    protected printPeer(peer: PeerClass, printer: LanguageWriter) {
        printer.writeClass(componentToPeerClass(peer.componentName), (writer) => {
            this.printPeerConstructor(peer, writer)
            this.printCreateMethod(peer, writer);
            (peer.methods as any[])
                .filter(method => !peerGeneratorConfiguration().ignoreMethod(method.overloadedName, writer.language))
                .forEach(method => this.printPeerMethod(method, writer))
        }, this.generatePeerParentName(peer))
    }

    printFile(): PrinterResult[] {
        return collectPeersForFile(this.library, this.file).map(peer => {
            const component = findComponentByName(this.library, peer.componentName)
            const imports = new ImportsCollector()
            const content = this.library.createLanguageWriter(this.library.language)
            this.printImports(peer, imports)
            this.printPeer(peer, content)
            return {
                over: {
                    node: component!.attributeDeclaration,
                    role: LayoutNodeRole.PEER,
                },
                collector: imports,
                content
            }
        })
    }

    protected getDefaultPeerImports(lang: Language, imports: ImportsCollector) {
        if (lang !== Language.TS && lang !== Language.ARKTS) return

        imports.addFeatures(['int32', 'int64', 'float32'], "@koalaui/common")
        imports.addFeatures(['nullptr', 'KPointer', 'KInt', 'KBoolean', 'KStringPtr', 'runtimeType', 'RuntimeType'], "@koalaui/interop")
        // TODO Check the usage of relative path imports
        imports.addFeatures(['Serializer'], "./peers/Serializer")
        // TODO Remove unnecessary imports for ohos libraries
        imports.addFeatures(['ComponentBase'], "./peers/../../ComponentBase")
        imports.addFeatures(['PeerNode'], "./peers/../../PeerNode")
        switch (lang) {
            case Language.TS: {
                imports.addFeature('isInstanceOf', "@koalaui/interop")
                break
            }
            case Language.ARKTS: {
                imports.addFeature(NativeModule.Generated.name, "#components")
                break;
            }
        }
    }
}

class JavaPeerFileVisitor extends PeerFileVisitor {
    constructor(
        protected readonly library: PeerLibrary,
        protected readonly file: idl.IDLFile,
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

    printFile(): PrinterResult[] {
        return Array.from(collectPeersForFile(this.library, this.file).values()).map(peer => {
            let printer = this.library.createLanguageWriter()
            this.printPackage(printer)

            const idlPeer = peer as PeerClass
            const imports = collectJavaImports(idlPeer.methods.flatMap(method => method.method.signature.args))
            printJavaImports(printer, imports)


            this.printPeer(peer, printer)

            const component = findComponentByName(this.library, peer.componentName)
            return {
                over: {
                    node: component!.attributeDeclaration,
                    role: LayoutNodeRole.PEER,
                },
                content: printer,
                collector: new ImportsCollector()
            }

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
        protected readonly file: idl.IDLFile,
        dumpSerialized: boolean,
    ) {
        super(library, file, dumpSerialized)
    }

    protected printApplyMethod(peer: PeerClass, printer: LanguageWriter) {
    }

    printFile(): PrinterResult[] {
        return collectPeersForFile(this.library, this.file).map(peer => {
            const component = findComponentByName(this.library, peer.componentName)
            const printer = this.library.createLanguageWriter()
            this.printPeer(peer, printer)
            return {
                over: {
                    node: component!.attributeDeclaration,
                    role: LayoutNodeRole.PEER,
                },
                content: printer,
                collector: new ImportsCollector()
            }
        })
    }
}

class KotlinPeerFileVisitor extends PeerFileVisitor {
    constructor(
        protected readonly library: PeerLibrary,
        protected readonly file: idl.IDLFile,
        dumpSerialized: boolean,
    ) {
        super(library, file, dumpSerialized)
    }

    printFile(): PrinterResult[] {
        return collectPeersForFile(this.library, this.file).map(peer => {
            const component = findComponentByName(this.library, peer.componentName)
            const printer = this.library.createLanguageWriter()
            this.printPeer(peer, printer)
            return {
                over: {
                    node: component!.attributeDeclaration,
                    role: LayoutNodeRole.PEER,
                },
                content: printer,
                collector: new ImportsCollector()
            }
        })
    }
}

class PeersVisitor {
    readonly peers: Map<TargetFile, string[]> = new Map()

    constructor(
        private readonly library: PeerLibrary,
        private readonly dumpSerialized: boolean,
    ) { }

    printPeers(): PrinterResult[] {
        const results: PrinterResult[] = []
        for (const file of this.library.files.values()) {
            if (!collectPeersForFile(this.library, file).length)
                continue
            const visitor = this.library.language == Language.JAVA
                ? new JavaPeerFileVisitor(this.library, file, this.dumpSerialized)
                : this.library.language == Language.CJ
                ? new CJPeerFileVisitor(this.library, file, this.dumpSerialized)
                : this.library.language == Language.KOTLIN
                ? new KotlinPeerFileVisitor(this.library, file, this.dumpSerialized)
                : new PeerFileVisitor(this.library, file, this.dumpSerialized)
            results.push(...visitor.printFile())
        }
        return results
    }
}

const returnValName = "retval"  // make sure this doesn't collide with parameter names!

export function createPeersPrinter(dumpSerialized: boolean): PrinterFunction {
    return (library: PeerLibrary) => new PeersVisitor(library, dumpSerialized).printPeers()
}

export function printPeerFinalizer(clazz: MaterializedClass, writer: LanguageWriter): void {
    const finalizer = new Method(
        "getFinalizer",
        new MethodSignature(IDLPointerType, []),
        // TODO: private static getFinalizer() method conflicts with its implementation in the parent class
        [MethodModifier.STATIC])
    writer.writeMethodImplementation(finalizer, writer => {
        writer.writeStatement(
            writer.makeReturn(
                writer.makeNativeCall(NativeModule.Generated, `_${qualifiedName(clazz.decl, "_", "namespace.name")}_getFinalizer`, [])))
    })
}

export function writePeerMethod(library: PeerLibrary, printer: LanguageWriter, method: PeerMethod, isIDL: boolean, dumpSerialized: boolean,
    methodPostfix: string, ptr: string, returnType: IDLType = IDLVoidType, generics?: string[]
) {
    if (generatorHookName(method.originalParentName, method.method.name)) return
    const signature = method.method.signature as NamedMethodSignature
    let peerMethod = new Method(
        `${method.overloadedName}${methodPostfix}`,
        new NamedMethodSignature(returnType, signature.args, signature.argsNames, signature.defaults, signature.argsModifiers),
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
                    writer.writePrintLog(`"${it.param}:", thisSerializer.asBuffer(), thisSerializer.length())`)
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
                    params.push(writer.makeSerializedBufferGetter(`thisSerializer`))
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

        if (!returnValueFilledThroughOutArg && returnType != IDLVoidType && returnType !== IDLThisType) {
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
                } else if (returnType == idl.IDLAnyType) {
                    // Read as resource
                    // Change any return type to the serializer buffer in NativeModule
                    // result = makeDeserializedReturn(library, printer, returnType)
                } else if (!isPrimitiveType(returnType)) {
                    const returnTypeConvertor = new InteropReturnTypeConvertor(library)
                    if ((idl.IDLContainerUtils.isSequence(returnType) || idl.IDLContainerUtils.isRecord(returnType)) && writer.language != Language.JAVA) {
                        result = makeDeserializedReturn(library, printer, returnType)
                    } else if (returnTypeConvertor.isReturnInteropBuffer(returnType)
                        && !(library.typeConvertor(returnValName, returnType) instanceof CustomTypeConvertor)
                        && writer.language != Language.JAVA) {
                        result = makeDeserializedReturn(library, printer, returnType)
                    } else {
                        // todo: implement deserialization for types other than enum
                        result = [writer.makeThrowError("Object deserialization is not implemented.")]

                        if (idl.isReferenceType(returnType)) {
                            const enumEntry = library.resolveTypeReference(returnType)
                            if (enumEntry && idl.isEnum(enumEntry))
                                result = [
                                    writer.makeReturn(writer.enumFromI32(writer.makeString(returnValName), enumEntry))
                                ]
                        }
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
        return `Deserializer(${returnValName}, Int32(${returnValName}.size))`
    } else if (language === Language.KOTLIN) {
        return `Deserializer(${returnValName}, ${returnValName}.size)`
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
    const internalClassName = getInternalClassName(writer.language == Language.CJ ? writer.getNodeName(decl) : idl.getQualifiedName(decl, "namespace.name")) // here
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

export function generateStyleParentClass(peer: PeerClass): string | undefined {
     if (!isHeir(peer.originalClassName!)) return undefined
     return componentToStyleClass(peer.parentComponentName!)
}

export function parentToAttributesInterface(peer: PeerClass): string | undefined {
    if (!isHeir(peer.originalClassName!)) return undefined
    return componentToAttributesInterface(peer.originalParentName!)
}
