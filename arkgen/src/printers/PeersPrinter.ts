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
    Language,
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
    isMethodOverridden,
    getSuper,
    KotlinTypeComparator,
    LibraryInterface,
    toCamelCase,
} from '@idlizer/core'
import {
    ImportsCollector,
    TargetFile,
    collectDeclDependencies,
    collectDeclItself,
    collectModifiers,
    findComponentByName,
    findComponentByType,
    NativeModule,
    PrinterFunction,
    PrinterResult,
    collectPeersForFile,
    peerGeneratorConfiguration,
    writePeerMethod
} from "@idlizer/libohos";
import { HandwrittenModule } from '../ArkoalaLayout.js';

export function componentToPeerClass(component: string) {
    return `Ark${component}Peer`
}

export function componentToAttributesInterface(component: string) {
    return `${component}`
}

export function isPropertyBasedMethodOverridden(decl: idl.IDLInterface, property: string | idl.IDLProperty, library: LibraryInterface): boolean {
    if (typeof property === "string") {
        const originalProperty = decl.properties.find(it => it.name === property)
        if (originalProperty) {
            return isPropertyBasedMethodOverridden(decl, originalProperty, library)
        }
        return false
    }

    const ancestor = getSuper(decl, library)
    if (ancestor) {
        if (library.language === Language.KOTLIN) {
            const comparator = new KotlinTypeComparator(library)
            for (const ancestorProperty of ancestor.properties) {
                if (property.name == ancestorProperty.name) {
                    return comparator.isCompatibleType(property.type, ancestorProperty.type)
                }
            }
        }
        else if (ancestor.properties.some(it => it.name === property.name)) {
            return true
        }
        return isPropertyBasedMethodOverridden(ancestor, property, library)
    }
    return false
}

function getModifierForPeer(peer: PeerClass, library: PeerLibrary): idl.IDLInterface | undefined {
    const modifiers = collectModifiers(library)
    for (const modifierInfos of modifiers.values()) {
        for (const modifierInfo of modifierInfos) {
            if (modifierInfo.modifier && modifierInfo.peer === peer) {
                return modifierInfo.modifier
            }
        }
    }
    return undefined
}

// For TS and ArkTS
class PeerFileVisitor {
    constructor(
        protected readonly library: PeerLibrary,
        protected readonly file: idl.IDLFile,
        protected readonly dumpSerialized: boolean,
    ) { }

    protected generatePeerParentName(parentComponentName: string | undefined): string {
        if (parentComponentName === undefined) {
            return "PeerNode"
        }
        return componentToPeerClass(parentComponentName)
    }

    protected printImports(peer: PeerClass, imports: ImportsCollector): void {
        if (!peer.originalClassName)
            throw new Error(`${peer.componentName} is not supported, use 'uselessConstructorInterfaces' for now`)
        this.getDefaultPeerImports(this.library.language, imports)
        if (peer.parentNames) {
            const parentComponentName = peer.parentNames.componentName
            const parentComponent = findComponentByName(this.library, parentComponentName)
            imports.addFeature(this.generatePeerParentName(parentComponentName), this.library.layout.resolve({node: parentComponent!.attributeDeclaration, role: LayoutNodeRole.PEER}))
        }
        const component = findComponentByType(this.library, idl.createReferenceType(peer.originalClassName))!
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
            imports.addFeature('GestureName', './framework/shared/generated-utils')
            imports.addFeature('GestureComponent', './framework/shared/generated-utils')
        }

        if ([Language.TS, Language.ARKTS, Language.KOTLIN].includes(this.library.language)) {
            if ([Language.TS, Language.ARKTS].includes(this.library.language)) {
                imports.addFeature('CallbackTransformer', './CallbackTransformer')
            }
            else if (this.library.language === Language.KOTLIN) {
                imports.addFeature("CallbackTransformer", "koalaui.arkoala")
            }
            collectDeclItself(this.library, idl.createReferenceType("idlize.internal.CallbackKind"), imports)
            collectDeclItself(this.library, idl.createReferenceType(`idlize.internal.${NativeModule.Generated.name}`), imports)

            const hookClassName = peer.componentName == "CommonMethod"
                ? peer.componentName
                : `${peer.componentName}Attribute`
            const hookMethods = peerGeneratorConfiguration().hooks.get(hookClassName)
            if (hookMethods) {
                for (const [methodName, hook] of hookMethods.entries()) {
                    const hookName = hook ? hook.hookName : `hook${peer.componentName}${capitalize(methodName)}`
                    imports.addFeature(hookName, HandwrittenModule(this.library.language))
                }
            }
        }
        if (this.library.language == Language.TS) {
            imports.addFeature("unsafeCast", "@koalaui/common")
        }
        if (this.library.language === Language.TS || this.library.language === Language.ARKTS) {
            imports.addFeatures(["MaterializedBase", "toPeerPtr"], "@koalaui/interop")
            // collectMaterializedImports(imports, this.library)
        }
        else {
            imports.addFeatures(["MaterializedBase", "toPeerPtr"], "koalaui.interop")
        }
        const modifierDecl = getModifierForPeer(peer, this.library)
        if (modifierDecl !== undefined && this.library.language !== Language.KOTLIN) {
            const location = this.library.layout.resolve({
                node: modifierDecl,
                role: LayoutNodeRole.INTERFACE,
                hint: 'component.modifier'
            })
            imports.addFeature(modifierDecl.name, location)
            
        }
    }

    protected printPeerConstructor(peer: PeerClass, printer: LanguageWriter): void {
        // Improve: fully switch to writer!
        const signature = new NamedMethodSignature(
            idl.createPrimitiveType('void'),
            [idl.createPrimitiveType('pointer'), idl.createPrimitiveType('i32'), idl.createPrimitiveType('String'), idl.createPrimitiveType('i32')],
            ['peerPtr', 'id', 'name', 'flags'],
            [undefined, undefined, [Language.TS, Language.ARKTS].includes(printer.language) ? `''` : '""', '0'])

        printer.writeConstructorImplementation(componentToPeerClass(peer.componentName), signature, (writer) => { },
            {
                delegationArgs: ['peerPtr', 'id', 'name', 'flags'].map(it => printer.makeString(it)),
                delegationName: peer.parentNames?.componentName
            },
            [MethodModifier.PUBLIC])
    }

    protected printCreateMethod(peer: PeerClass, writer: LanguageWriter): void {
        const peerClass = componentToPeerClass(peer.componentName)
        const signature = new NamedMethodSignature(
            createReferenceType(peerClass),
            [createReferenceType('idlize.internal.ComponentBase'), idl.createPrimitiveType('i32')],
            ['component', 'flags'],
            [undefined, '0'],
            [[ArgumentModifier.OPTIONAL], undefined]
        )
        writer.writeStaticEntitiesBlock(() => {
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

    protected printPeerMethod(decl: idl.IDLInterface, method: PeerMethod, printer: LanguageWriter) {
        this.library.setCurrentContext(`${method.originalParentName}.${method.sig.name}`)
        const isOverridden = isMethodOverridden(decl, method.method, this.library) ||
            isPropertyBasedMethodOverridden(decl, method.method.name, this.library)
        writePeerMethod(this.library, printer, method, this.dumpSerialized, "Attribute", "this.peer.ptr", undefined, isOverridden)
        this.library.setCurrentContext(undefined)
    }

    protected printPeer(peer: PeerClass, printer: LanguageWriter) {
        printer.writeClass(componentToPeerClass(peer.componentName), (writer) => {
            const modifierDecl = getModifierForPeer(peer, this.library)
            if (this.library.language !== Language.KOTLIN) {
                const modifierName = modifierDecl ? modifierDecl.name : `AttributeModifier<${peer.originalClassName}>`
                writer.print(`${toCamelCase(peer.componentName)}AttributeSet?: ${modifierName};`)
            }
            this.printPeerConstructor(peer, writer)
            this.printCreateMethod(peer, writer);
            (peer.methods as any[])
                .forEach(method => this.printPeerMethod(peer.decl, method, writer))
        }, this.generatePeerParentName(peer.parentNames?.componentName))
    }

    printFile(): PrinterResult[] {
        return collectPeersForFile(this.library, this.file).map(peer => {
            const component = findComponentByName(this.library, peer.componentName)
            return {
                over: {
                    node: component!.attributeDeclaration,
                    role: LayoutNodeRole.PEER,
                },
                generate: () => {
                    const imports = new ImportsCollector()
                    const content = this.library.createLanguageWriter(this.library.language)
                    this.printImports(peer, imports)
                    this.printPeer(peer, content)
                    return { imports, content }
                }
            }
        })
    }

    protected getDefaultPeerImports(lang: Language, imports: ImportsCollector) {
        if (lang !== Language.TS && lang !== Language.ARKTS) return

        imports.addFeatures(['int32', 'int64', 'float32'], "@koalaui/common")
        imports.addFeatures(['nullptr', 'KPointer', 'KInt', 'KBoolean', 'KStringPtr', 'RuntimeType'], "@koalaui/interop")
        // Improve Remove unnecessary imports for ohos libraries
        imports.addFeatures(['ComponentBase'], "./ComponentBase")
        imports.addFeatures(['PeerNode'], "./PeerNode")
        switch (lang) {
            case Language.TS: {
                imports.addFeatures(['isInstanceOf', 'runtimeType'], "@koalaui/interop")
                break
            }
            case Language.ARKTS: {
                imports.addFeature(NativeModule.Generated.name, "#components")
                break;
            }
        }
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
            return {
                over: {
                    node: component!.attributeDeclaration,
                    role: LayoutNodeRole.PEER,
                },
                generate: () => {
                    const printer = this.library.createLanguageWriter()
                    this.printPeer(peer, printer)
                    return printer
                },
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
            return {
                over: {
                    node: component!.attributeDeclaration,
                    role: LayoutNodeRole.PEER,
                },
                generate: () => {
                    const imports = new ImportsCollector()
                    const content = this.library.createLanguageWriter(this.library.language)
                    this.printImports(peer, imports)
                    this.printPeer(peer, content)
                    return { imports, content }
                }
            }
        })
    }

    protected getDefaultPeerImports(lang: Language, imports: ImportsCollector) {
        imports.addFeatures(["nullptr", "KPointer", "KInt", "KBoolean", "KStringPtr", "RuntimeType"], "koalaui.interop")
        imports.addFeature("Instant", "kotlin.time")
        imports.addFeatures(["ComponentBase", "PeerNode"], "koalaui.arkoala")
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
            const visitor = this.library.language == Language.CJ
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
