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
import { Language, isMaterialized, throwException, LanguageExpression, isInIdlizeInternal, getExtractor, getSerializerName, InterfaceConvertor, ProxyConvertor, PrintHint, CppLanguageWriter, isInCurrentModule, isInExternalModule, capitalize, wrapCurrentFileDescription } from '@idlizer/core'
import { Method, NamedMethodSignature } from "../LanguageWriters"
import { LanguageWriter, PeerLibrary } from "@idlizer/core"
import { peerGeneratorConfiguration } from '../../DefaultConfiguration'
import { ImportsCollector } from "../ImportsCollector"
import {
    ArkTSBuiltTypesDependencyFilter,
    DependencyFilter,
} from '../idl/IdlPeerGeneratorVisitor'
import { collectAllProperties, collectMeaninglessProperties, collectProperties } from '../printers/StructPrinter'
import { MethodModifier } from '@idlizer/core'
import { IDLEntry } from "@idlizer/core/idl"
import { LayoutNodeRole } from '@idlizer/core'
import { collectDeclItself, collectDeclDependencies } from '../ImportsCollectorUtils'
import { collectDeclarationTargets } from '../DeclarationTargetCollector'
import { flattenUnionType } from '@idlizer/core'
import { PrinterFunction, PrinterResult } from '../LayoutManager'
import { isComponentDeclaration } from '../ComponentsCollector'

type SerializableTarget = idl.IDLInterface | idl.IDLCallback

class SerializerPrinter {

    private readonly serializerArgName = 'buffer'
    private readonly deserializerArgName = 'buffer'

    constructor(
        private readonly library: PeerLibrary,
        readonly language: Language,
    ) { }


    private generateInterfaceSerializeSignature(target: idl.IDLInterface): Method {
        return new Method(`write`,
            new NamedMethodSignature(idl.IDLVoidType,
                [idl.createReferenceType('idlize.internal.SerializerBase'), idl.createReferenceType(target)],
                [this.serializerArgName, "value"],
                undefined,
                undefined,
                [undefined /*return hint*/, PrintHint.AsReference]
            ), [MethodModifier.PUBLIC, MethodModifier.STATIC])
    }

    private generateInterfaceSerializerDeclaration(writer: LanguageWriter, target: idl.IDLInterface): void {
        const signature = this.generateInterfaceSerializeSignature(target)
        writer.writeMethodDeclaration(signature.name, signature.signature, signature.modifiers)
    }

    private generateInterfaceSerializer(writer: LanguageWriter, imports:ImportsCollector, target: idl.IDLInterface) {
        const signature = new Method(`write`,
            new NamedMethodSignature(idl.IDLVoidType,
                [idl.createReferenceType('idlize.internal.SerializerBase'), idl.createReferenceType(target)],
                [this.serializerArgName, "value"],
                undefined,
                undefined,
                [undefined /*return hint*/, PrintHint.AsReference]
            ), [MethodModifier.PUBLIC, MethodModifier.STATIC])
        writer.writeMethodImplementation(signature, writer => {
            if (isMaterialized(target, this.library)) {
                this.generateMaterializedBodySerializer(target, writer)
            } else {
                this.generateInterfaceBodySerializer(target, writer, imports)
            }
        })
    }
    private declareSerializer(writer: LanguageWriter) {
        writer.writeStatement(
            writer.makeAssign(
                "valueSerializer",
                idl.createReferenceType("idlize.internal.SerializerBase"),
                writer.makeString(this.serializerArgName),
                true,
                false,
                { assignRef: true }
            )
        )
    }
    private generateInterfaceBodySerializer(target: idl.IDLInterface, writer: LanguageWriter, imports:ImportsCollector) {
        const properties = collectProperties(target, this.library)
        if (properties.length > 0) {
            this.declareSerializer(writer)
        }
        collectDeclDependencies(this.library, target, imports)
        properties.forEach(it => {
            let field = `valueHolderFor${capitalize(it.name)}`
            const type = flattenUnionType(this.library, it.type)
            let typeConvertor = this.library.typeConvertor(`value`, type, it.isOptional)
            // import collection!!!
            if (idl.isReferenceType(type)) {
                const resolved = this.library.resolveTypeReference(type)
                if (resolved) {
                    collectDeclItself(this.library, type, imports)
                }
            }

            let memberAccess = writer.makeString(`value.${writer.escapeKeyword(it.name)}`)
            writer.writeStatement(writer.makeAssign(field, undefined, memberAccess, true))
            writer.writeStatement(typeConvertor.convertorSerialize(`value`, field, writer))
        })
    }
    private generateMaterializedBodySerializer(target: idl.IDLInterface, writer: LanguageWriter) {
        this.declareSerializer(writer)
        const valueExpr = writer.makeString("value")
        let peerExpr: LanguageExpression
        switch (writer.language) {
            case Language.CPP:
                peerExpr = valueExpr
                break
            case Language.CJ:
                peerExpr = writer.makeMethodCall("MaterializedBase", "toPeerPtr", [valueExpr])
                break
            default:
                const extractor = getExtractor(target, writer.language)
                peerExpr = extractor.receiver
                    ? writer.makeMethodCall(extractor.receiver, extractor.method, [valueExpr])
                    : writer.makeFunctionCall(extractor.method, [valueExpr])
                break
        }
        writer.writeExpressionStatement(
            writer.makeMethodCall(`valueSerializer`, `writePointer`, [peerExpr]))
    }

    //////////////////////////////////////////////////////////////////

    private generateInterfaceDeserializerSignature(target: idl.IDLInterface): Method {
        const type = idl.createReferenceType(target)
        return new Method('read',
            new NamedMethodSignature(type,
                [idl.createReferenceType('idlize.internal.DeserializerBase')],
                [this.deserializerArgName],
                undefined,
                undefined,
                [undefined /*return hint*/, PrintHint.AsReference]
            ), [MethodModifier.PUBLIC, MethodModifier.STATIC])
    }

    private generateInterfaceDeserializerDeclaration(writer: LanguageWriter, target: idl.IDLInterface): void {
        const signature = this.generateInterfaceDeserializerSignature(target)
        writer.writeMethodDeclaration(signature.name, signature.signature, signature.modifiers)
    }

    private generateInterfaceDeserializer(writer:LanguageWriter, imports:ImportsCollector, target: idl.IDLInterface) {
        const type = idl.createReferenceType(target)
        const signature = this.generateInterfaceDeserializerSignature(target)
        writer.writeMethodImplementation(signature, writer => {
            if (isMaterialized(target, this.library)) {
                this.generateMaterializedBodyDeserializer(writer, target)
            } else {
                this.generateInterfaceBodyDeserializer(writer, imports, target, type)
            }
        })
    }
    private declareDeserializer(writer:LanguageWriter) {
        writer.writeStatement(
            writer.makeAssign(
                "valueDeserializer",
                idl.createReferenceType("idlize.internal.DeserializerBase"),
                writer.makeString(this.deserializerArgName),
                true,
                false,
                { assignRef: true }
            )
        )
    }
    private generateInterfaceBodyDeserializer(writer:LanguageWriter, imports:ImportsCollector, target: idl.IDLInterface, type: idl.IDLType) {
        const properties = collectProperties(target, this.library)
        // using list initialization to prevent uninitialized value errors
        const valueType = type // not used, if language === TS

        if (writer.language === Language.CPP)
            writer.writeStatement(writer.makeAssign("value", valueType, writer.makeString(`{}`), true, false))
        if ([idl.IDLInterfaceSubkind.Interface, idl.IDLInterfaceSubkind.Class].includes(target.subkind)) {
            if (properties.length > 0) {
                this.declareDeserializer(writer)
            }
            properties.forEach(it => {
                const type = flattenUnionType(this.library, it.type)
                // import collection!!!
                if (idl.isReferenceType(type)) {
                    const resolved = this.library.resolveTypeReference(type)
                    if (resolved) {
                        collectDeclItself(this.library, type, imports)
                    }
                }
                let typeConvertor = this.library.typeConvertor(`value`, type, it.isOptional)
                writer.writeStatement(typeConvertor.convertorDeserialize(`${it.name}TmpBuf`, `valueDeserializer`, (expr) => {
                    if (writer.language === Language.CPP)
                        return writer.makeAssign(`value.${writer.escapeKeyword(it.name)}`, undefined, expr, false)
                    return writer.makeAssign(`${it.name}TmpResult`, idl.maybeOptional(it.type, it.isOptional), expr, true, true)
                }, writer))
            })
            if (writer.language !== Language.CPP) {
                let meaninglessProperties: idl.IDLProperty[] = []
                if (writer.language === Language.ARKTS) {
                    meaninglessProperties = collectMeaninglessProperties(target, this.library)
                }
                const propsAssignees = properties.map(it => {
                    return `${it.name}: ${it.name}TmpResult`
                }).concat(meaninglessProperties.map(it => {
                    return `${it.name}: undefined`
                }))
                if (writer.language == Language.CJ) {
                    let parentProperties: idl.IDLProperty[] = []
                    const superNames = target.inheritance
                    if (superNames) {
                        const superDecls = superNames ? superNames.map(t => this.library.resolveTypeReference(t as idl.IDLReferenceType)) : undefined
                        parentProperties = superDecls!.map(decl => collectAllProperties(decl as idl.IDLInterface, this.library)).flat()
                    }
                    let ownProperties: idl.IDLProperty[] = isComponentDeclaration(this.library, target) ? [] : target.properties.filter(it => !parentProperties.map(prop => prop.name).includes(it.name))

                    writer.writeStatement(writer.makeAssign("value", valueType, writer.makeString(`${writer.getNodeName(valueType)}(${ownProperties.concat(parentProperties).map(it => it.name.concat('TmpResult')).join(', ')})`), true, false))
                } else if (writer.language == Language.KOTLIN) {
                    writer.writeStatement(writer.makeAssign("value", valueType, writer.makeString(`object: ${writer.getNodeName(valueType)} { ${properties.map(it => `override var ${it.name} = ${it.name}TmpResult`).join('; ') }}`), true, false))
                }
                else {
                    writer.writeStatement(writer.makeAssign("value", valueType, writer.makeCast(writer.makeString(`{${propsAssignees.join(', ')}}`), type), true, false))
                }
            }
        } else {
            if (writer.language === Language.CPP) {
                let typeConvertor = this.library.declarationConvertor("value", idl.createReferenceType(target), target)
                this.declareDeserializer(writer)
                writer.writeStatement(typeConvertor.convertorDeserialize(`valueBuffer`, `valueDeserializer`, (expr) => {
                   return writer.makeAssign(`value`, undefined, expr, false)
                }, writer))
            }
        }
        writer.writeStatement(writer.makeReturn(
            writer.makeString("value")))
    }
    private generateMaterializedBodyDeserializer(writer:LanguageWriter, target: idl.IDLInterface) {
        this.declareDeserializer(writer)
        writer.writeStatement(
            writer.makeAssign(`ptr`, idl.IDLPointerType,
                writer.makeMethodCall(`valueDeserializer`, `readPointer`, []), true, false))
        if (writer.language === Language.CPP) {
            writer.writeStatement(
                writer.makeReturn(writer.makeCast(writer.makeString(`ptr`), idl.createReferenceType(target))))
            return
        }

        const extractor = getExtractor(target, writer.language, false)
        writer.writeStatement(
            writer.makeReturn(
                writer.makeMethodCall(extractor.receiver!, extractor.method, [writer.makeString(`ptr`)])))
    }

    //////////////////////////////////////////////////////////////////

    printCppForwardDeclarations(): LanguageWriter {
        const printer = this.library.createLanguageWriter(Language.CPP) as CppLanguageWriter
        const serializerDeclarations = getSerializerDeclarations(this.library,
            createSerializerDependencyFilter(this.library, this.language), this.language)

        serializerDeclarations.forEach(decl => {
            // internal modules provide serializers
            // serializers needs to be generated for the current and external modules
            if (this.language !== Language.CPP && !isInCurrentModule(decl) && !isInExternalModule(decl)) {
                return
            }
            if (isComponentDeclaration(this.library, decl)) {
                return
            }
            if (idl.isInterface(decl)) {
                const className = getSerializerName(this.library, printer.language, decl)
                printer.writeClass(className, fdWriter => {
                    fdWriter.print('public:')
                    if (idl.isInterface(decl)) {
                        this.generateInterfaceSerializerDeclaration(fdWriter, decl)
                        this.generateInterfaceDeserializerDeclaration(fdWriter, decl)
                    }
                })
            }
        })
        return printer
    }

    private generateSerializerClass(target: idl.IDLEntry): PrinterResult[] {
        const generate = () => {
            const writer = this.library.createLanguageWriter(this.language)
            const imports = new ImportsCollector()

            collectDeclItself(this.library, target, imports)

            printSerializerImports(this.library, this.language, imports)

            const className = getSerializerName(this.library, writer.language, target)
            if (writer instanceof CppLanguageWriter) {
                writer.changeModeTo('detached')
            }
            writer.writeClass(className, writer => {
                writer.makeStaticBlock(() => {
                    if (idl.isInterface(target)) {
                        this.generateInterfaceSerializer(writer, imports, target)
                        this.generateInterfaceDeserializer(writer, imports, target)
                    }
                })
            })
            return { content: writer, imports}
        }

        return [{
            generate,
            over: {
                node: target,
                role: LayoutNodeRole.SERIALIZER
            },
            ignoreNamespace: true
        }]
    }

    print(): PrinterResult[] {
        const serializerDeclarations = getSerializerDeclarations(this.library,
            createSerializerDependencyFilter(this.library, this.language), this.language)

        return serializerDeclarations.flatMap(decl => {
            // internal modules provide serializers
            // serializers needs to be generated for the current and external modules
            if (this.language !== Language.CPP && !isInCurrentModule(decl) && !isInExternalModule(decl)) {
                return []
            }
            if (isComponentDeclaration(this.library, decl)) {
                return []
            }
            if (idl.isInterface(decl)) {
                return this.generateSerializerClass(decl)
            }
            return []
        })
    }
}

/* CJ
if (this.writer.language == Language.CJ) {
    for (let valueHolder of this.continuationValueHolders) {
        let className = `${this.writer.getNodeName(valueHolder).replace(/[\<\>]/g, '')}Holder`
        this.writer.writeClass(className, (writer) => {
            writer.makeAssign("value", idl.maybeOptional(valueHolder, true), undefined, true, false).write(writer)
            writer.writeConstructorImplementation(className, new MethodSignature(idl.IDLAnyType, [idl.maybeOptional(valueHolder, true)]), () => {
                writer.makeAssign("this.value", idl.maybeOptional(valueHolder, true), writer.makeString('arg0'), false, false).write(writer)
            })
        })
    }
}
*/

export function createSerializerPrinter(language: Language, prefix: string): PrinterFunction {
    return (library: PeerLibrary) => {
        return new SerializerPrinter(library, language).print()
    }
}
export function createCSerializerPrinter(library: PeerLibrary, language: Language, prefix: string): LanguageWriter {
    const serializers = library.createLanguageWriter(Language.CPP)
    const generator = new SerializerPrinter(library, language)
    const result = generator.print()
    serializers.concat(generator.printCppForwardDeclarations())
    result.forEach(it => {
        const printerResult = wrapCurrentFileDescription(it.over, it.generate)
        serializers.concat(printerResult instanceof LanguageWriter ? printerResult : printerResult.content)
    })
    return serializers
}

export function getSerializerDeclarations(library: PeerLibrary, dependencyFilter: DependencyFilter, language: Language): SerializableTarget[] {
    const nameConvertor = library.createTypeNameConvertor(Language.CPP)
    const seenNames = new Set<string>()
    return collectDeclarationTargets(library)
        .map(it => it)
        .filter((it): it is SerializableTarget => dependencyFilter.shouldAdd(it))
        .filter(it => !idl.isHandwritten(it) && !isInIdlizeInternal(it) && !peerGeneratorConfiguration().components.custom.includes(it.name) && !peerGeneratorConfiguration().isHandWritten(it.name))
        .filter(it => !peerGeneratorConfiguration().ignoreEntry(it.name, language))
        .filter(it => !(idl.isNamedNode(it) && peerGeneratorConfiguration().isResource(it.name)))
        .filter(it => !it.typeParameters?.length
            || it.typeParameters.every(it => it.includes('='))
            || idl.isInterface(it) && isMaterialized(it, library))
        .filter(it => {
            const fullName = nameConvertor.convert(it)
            const seen = seenNames.has(fullName)
            seenNames.add(fullName)
            return !seen
        })
}

export function printSerializerImports(library: PeerLibrary, language: Language, collector: ImportsCollector) {
    if (language === Language.TS || language === Language.ARKTS) {
        collector.addFeatures([
            "SerializerBase", "DeserializerBase", "CallbackResource", "InteropNativeModule", "MaterializedBase", "Tags", "RuntimeType", "toPeerPtr", 'nullptr', 'KPointer'
        ], "@koalaui/interop")
        collector.addFeatures(["int32", "int64", "float32", "unsafeCast"], "@koalaui/common")
        if (language == Language.TS && library.name === "arkoala") {
            collector.addFeatures([
                "MaterializedBase", "InteropNativeModule", "ResourceHolder",
                "nullptr", "KPointer", "isInstanceOf",
            ], "@koalaui/interop")
        }
        collector.addFeatures(["NativeBuffer", "KSerializerBuffer"], "@koalaui/interop")
        if (language === Language.TS) {
            collector.addFeature('Finalizable', '@koalaui/interop')
            collector.addFeatures(["NativeBuffer", "runtimeType"], "@koalaui/interop")
        } else {
            collector.addFeatures(["KUint8ArrayPtr", "NativeBuffer", "InteropNativeModule"], "@koalaui/interop")
        }
        if (library.name === 'arkoala') {
            collector.addFeature("CallbackTransformer", "./CallbackTransformer")
        }
    }
    else if (library.language === Language.KOTLIN) {
        collector.addFeatures([
            "SerializerBase",
            "DeserializerBase",
            "CallbackResource",
            "InteropNativeModule",
            "MaterializedBase",
            "Tag",
            "RuntimeType",
            "toPeerPtr",
            "nullptr",
            "KPointer",
            "KNativePointer",
            "NativeBuffer",
            "KUint8ArrayPtr",
        ], "koalaui.interop")
    }
}

export function createSerializerDependencyFilter(library: PeerLibrary, language: Language): DependencyFilter {
    switch (language) {
        case Language.TS: return new DefaultSerializerDependencyFilter()
        case Language.ARKTS: return new ArkTSSerializerDependencyFilter()
        case Language.CJ: return new DefaultSerializerDependencyFilter()
        case Language.CPP: return new CppSerializerDependencyFilter(library)
        case Language.KOTLIN: return new DefaultSerializerDependencyFilter()
    }
    throwException("Unimplemented filter")
}

class DefaultSerializerDependencyFilter implements DependencyFilter {
    shouldAdd(node: IDLEntry): boolean {
        return !peerGeneratorConfiguration().serializer.ignore.includes(node.name!)
            && (!this.isParameterized(node) || this.isParametrizedWithAllDefaults(node) || this.canHandleParametrized(node))
            && this.canSerializeDependency(node)
    }
    isParameterized(node: idl.IDLEntry) {
        return idl.isGeneric(node) && node.typeParameters && node.typeParameters.length
            || ["Record", "Required"].includes(node.name)
    }
    isParametrizedWithAllDefaults(node: idl.IDLEntry): boolean {
        return false
    }

    canHandleParametrized(node: idl.IDLEntry): boolean {
        return false
    }
    canSerializeDependency(dep: idl.IDLEntry): dep is SerializableTarget  {
        if (idl.isInterface(dep)) {
            return [idl.IDLInterfaceSubkind.Class, idl.IDLInterfaceSubkind.Interface].includes(dep.subkind)
        }
        if (idl.isCallback(dep))
            return true
        return false
    }
}

class ArkTSSerializerDependencyFilter extends DefaultSerializerDependencyFilter {
    readonly arkTSBuiltTypesFilter = new ArkTSBuiltTypesDependencyFilter()
    override shouldAdd(node: IDLEntry): node is SerializableTarget {
        if (idl.isEnum(node)) {
            return true
        }
        if (!this.arkTSBuiltTypesFilter.shouldAdd(node)) {
            return false
        }
        return super.shouldAdd(node)
    }
}

class CppSerializerDependencyFilter extends DefaultSerializerDependencyFilter {
    constructor(protected library: PeerLibrary) {
        super()
    }

    canHandleParametrized(node: idl.IDLEntry): boolean {
        return idl.isInterface(node) && isMaterialized(node, this.library)
    }
}
