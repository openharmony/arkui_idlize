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

import * as idl from '@idlizer/core/idl'
import {
    throwException,
    Language,
    InheritanceRole,
    determineParentRole,
    isHeir,
    generatorConfiguration,
    LayoutNodeRole,
    ArgumentModifier,
    capitalize,
    LanguageWriter,
    createConstructPeerMethod,
    PeerClass,
    PeerMethod,
    PeerLibrary,
    Method,
    MethodModifier,
    NamedMethodSignature,
    createReferenceType,
    IDLI32Type,
    IDLPointerType,
    IDLStringType,
    IDLVoidType,
} from '@idlizer/core'
import {
    ImportsCollector,
    ARKOALA_PACKAGE,
    TargetFile,
    collectJavaImports,
    printJavaImports,
    collectDeclDependencies,
    collectDeclItself,
    findComponentByName,
    findComponentByType,
    NativeModule,
    PrinterFunction,
    PrinterResult,
    collectPeersForFile,
    writePeerMethod
} from "@idlizer/libohos";

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
            imports.addFeature('GestureName', './generated/shared/generated-utils')
            imports.addFeature('GestureComponent', './generated/shared/generated-utils')
            imports.addFeatures(['isResource', 'isPadding'], './utils')
        }

        if (this.library.language === Language.TS || this.library.language === Language.ARKTS) {
            collectDeclItself(this.library, idl.createReferenceType("CallbackKind"), imports)
            imports.addFeature('CallbackTransformer', './CallbackTransformer')
            collectDeclItself(this.library, idl.createReferenceType(NativeModule.Generated.name), imports)

            const hookMethods = generatorConfiguration().hooks.get(peer.componentName)
            if (hookMethods) {
                for (const [methodName, hook] of hookMethods.entries()) {
                    const hookName = hook ? hook.hookName : `hook${peer.componentName}${capitalize(methodName)}`
                    imports.addFeature(hookName, "./handwritten")
                }
            }
        }
        if (this.library.language == Language.TS) {
            imports.addFeature("unsafeCast", "@koalaui/common")
        }
        if (this.library.language == Language.ARKTS) {
            imports.addFeature("TypeChecker", "#components")
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

        printer.writeConstructorImplementation(componentToPeerClass(peer.componentName), signature, (writer) => { },
            { delegationArgs: ['peerPtr', 'id', 'name', 'flags'].map(it => printer.makeString(it)), delegationName: peer.parentComponentName },
            [MethodModifier.PROTECTED])
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
                        `_${peer.componentName}_${createConstructPeerMethod(peer).sig.name}`,
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
        this.library.setCurrentContext(`${method.originalParentName}.${method.sig.name}`)
        writePeerMethod(this.library, printer, method, true, this.dumpSerialized, "Attribute", "this.peer.ptr")
        this.library.setCurrentContext(undefined)
    }

    protected printPeer(peer: PeerClass, printer: LanguageWriter) {
        printer.writeClass(componentToPeerClass(peer.componentName), (writer) => {
            this.printPeerConstructor(peer, writer)
            this.printCreateMethod(peer, writer);
            (peer.methods as any[])
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
        // TODO Remove unnecessary imports for ohos libraries
        imports.addFeatures(['ComponentBase'], "./ComponentBase")
        imports.addFeatures(['PeerNode'], "./PeerNode")
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

export function createPeersPrinter(dumpSerialized: boolean): PrinterFunction {
    return (library: PeerLibrary) => new PeersVisitor(library, dumpSerialized).printPeers()
}

export function generateStyleParentClass(peer: PeerClass): string | undefined {
     if (!isHeir(peer.originalClassName!)) return undefined
     return componentToStyleClass(peer.parentComponentName!)
}
