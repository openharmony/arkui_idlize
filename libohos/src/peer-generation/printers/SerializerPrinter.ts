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
import { generatorConfiguration, Language, isMaterialized, isBuilderClass, throwException, LanguageExpression, isInIdlize, isInIdlizeInternal, createLanguageWriter, lib, getExtractor, getSerializerName, InterfaceConvertor, ProxyConvertor, PrintHint, CppLanguageWriter, isInCurrentModule, isInExternalModule, capitalize } from '@idlizer/core'
import { ExpressionStatement, LanguageStatement, Method, MethodSignature, NamedMethodSignature } from "../LanguageWriters"
import { LanguageWriter, PeerLibrary } from "@idlizer/core"
import { peerGeneratorConfiguration } from '../../DefaultConfiguration'
import { ImportsCollector } from "../ImportsCollector"
import {
    ArkTSBuiltTypesDependencyFilter,
    DependencyFilter,
} from '../idl/IdlPeerGeneratorVisitor'
import { collectAllProperties, collectFunctions, collectProperties } from '../printers/StructPrinter'
import { FieldModifier, MethodModifier, ProxyStatement } from '@idlizer/core'
import { createDeclarationNameConvertor } from '@idlizer/core'
import { IDLEntry } from "@idlizer/core/idl"
import { convertDeclaration, generateCallbackKindValue } from '@idlizer/core'
import { getInternalClassName, getInternalClassQualifiedName, LayoutNodeRole } from '@idlizer/core'
import { collectUniqueCallbacks } from './CallbacksPrinter'
import { collectDeclItself, collectDeclDependencies, convertDeclToFeature } from '../ImportsCollectorUtils'
import { collectDeclarationTargets } from '../DeclarationTargetCollector'
import { qualifiedName, flattenUnionType, maybeTransformManagedCallback } from '@idlizer/core'
import { NativeModule } from '../NativeModule'
import { PrinterFunction, PrinterResult } from '../LayoutManager'
import { isComponentDeclaration } from '../ComponentsCollector'

type SerializableTarget = idl.IDLInterface | idl.IDLCallback

class SerializerPrinter {

    private readonly serializerArgName = 'buffer'
    private readonly deserializerArgName = 'buffer'

    public forwardDeclarations: CppLanguageWriter

    constructor(
        private readonly library: PeerLibrary,
        readonly language: Language,
    ) {
        this.forwardDeclarations = library.createLanguageWriter(Language.CPP) as CppLanguageWriter
    }

    private generateInterfaceSerializer(writer: LanguageWriter, fdWriter:LanguageWriter, imports:ImportsCollector, target: idl.IDLInterface) {
        const signature = new Method(`write`,
            new NamedMethodSignature(idl.IDLVoidType,
                [idl.createReferenceType('SerializerBase'), idl.createReferenceType(target)],
                [this.serializerArgName, "value"],
                undefined,
                undefined,
                [undefined /*return hint*/, PrintHint.AsReference]
            ), [MethodModifier.PUBLIC, MethodModifier.STATIC])
        fdWriter.writeMethodDeclaration(signature.name, signature.signature, signature.modifiers)
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
                idl.createReferenceType("SerializerBase"),
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
            typeConvertor.convertorSerialize(`value`, field, writer)
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
            case Language.JAVA:
            case Language.KOTLIN:
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

    private generateInterfaceDeserializer(writer:LanguageWriter, fdWriter:LanguageWriter, imports:ImportsCollector, target: idl.IDLInterface) {
        const type = idl.createReferenceType(target)
        const signature = new Method('read',
            new NamedMethodSignature(type,
                [idl.createReferenceType('DeserializerBase')],
                [this.deserializerArgName],
                undefined,
                undefined,
                [undefined /*return hint*/, PrintHint.AsReference]
            ), [MethodModifier.PUBLIC, MethodModifier.STATIC])
        fdWriter.writeMethodDeclaration(signature.name, signature.signature, signature.modifiers)
        writer.writeMethodImplementation(signature, writer => {
            if (isMaterialized(target, this.library)) {
                this.generateMaterializedBodyDeserializer(writer, target)
            } else if (isBuilderClass(target)) {
                this.generateBuilderClassDeserializer(writer, imports, target, type)
            } else {
                this.generateInterfaceBodyDeserializer(writer, imports, target, type)
            }
        })
    }
    private declareDeserializer(writer:LanguageWriter) {
        writer.writeStatement(
            writer.makeAssign(
                "valueDeserializer",
                idl.createReferenceType("DeserializerBase"),
                writer.makeString(this.deserializerArgName),
                true,
                false,
                { assignRef: true }
            )
        )
    }
    private generateBuilderClassDeserializer(writer:LanguageWriter, imports:ImportsCollector, target: idl.IDLInterface, type: idl.IDLType) {
        if (writer.language === Language.CPP)
            return this.generateInterfaceBodyDeserializer(writer, imports, target, type)
        writer.writeStatement(writer.makeThrowError("Can not deserialize builder class"))
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
                const propsAssignees = properties.map(it => {
                    return `${it.name}: ${it.name}TmpResult`
                })
                if (writer.language == Language.CJ) {
                    let parentProperties: idl.IDLProperty[] = []
                    const superNames = target.inheritance
                    if (superNames) {
                        const superDecls = superNames ? superNames.map(t => this.library.resolveTypeReference(t as idl.IDLReferenceType)) : undefined
                        parentProperties = superDecls!.map(decl => collectAllProperties(decl as idl.IDLInterface, this.library)).flat()
                    }
                    let ownProperties: idl.IDLProperty[] = isComponentDeclaration(this.library, target) ? [] : target.properties.filter(it => !parentProperties.map(prop => prop.name).includes(it.name))

                    writer.writeStatement(writer.makeAssign("value", valueType, writer.makeString(`${writer.getNodeName(valueType)}(${ownProperties.concat(parentProperties).map(it => it.name.concat('_result')).join(', ')})`), true, false))
                } else if (writer.language == Language.KOTLIN) {
                    writer.writeStatement(writer.makeAssign("value", valueType, writer.makeString(`object: ${writer.getNodeName(valueType)} { ${properties.map(it => `override var ${it.name} = ${it.name}_result`).join('; ') }}`), true, false))
                }
                else {
                    if (writer.language === Language.ARKTS) {
                        if (collectFunctions(target, this.library).length > 0) {
                            writer.writeStatement(writer.makeThrowError("Interface with functions is not supported"))
                            return;
                        }
                    }
                    
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
                writer.makeReturn(writer.makeCast(writer.makeString(`ptr`), target)))
            return
        }

        const extractor = getExtractor(target, writer.language, false)
        writer.writeStatement(
            writer.makeReturn(
                writer.makeMethodCall(extractor.receiver!, extractor.method, [writer.makeString(`ptr`)])))
    }

    //////////////////////////////////////////////////////////////////

    private generateSerializerClass(target: idl.IDLEntry): PrinterResult[] {

        const writer = this.library.createLanguageWriter(this.language)
        const imports = new ImportsCollector()

        collectDeclItself(this.library, target, imports)

        printSerializerImports(this.library, this.language, imports)

        const className = getSerializerName(target)
        if (writer instanceof CppLanguageWriter) {
            writer.changeModeTo('detached')
        }
        writer.writeClass(className, writer => {
            writer.makeStaticBlock(() => {
                this.forwardDeclarations.writeClass(className, fdWriter => {
                    fdWriter.print('public:')
                    if (idl.isInterface(target)) {
                        this.generateInterfaceSerializer(writer, fdWriter, imports, target)
                        this.generateInterfaceDeserializer(writer, fdWriter, imports, target)
                    }
                })
            })
        })

        return [{
            collector: imports,
            content: writer,
            over: {
                node: target,
                role: LayoutNodeRole.SERIALIZER
            },
            ignoreNamespace: true
        }]
    }

    print(prefix: string): PrinterResult[] {
        if (prefix == "" && this.language === Language.CPP)
            prefix = generatorConfiguration().TypePrefix + this.library.libraryPrefix
        const serializerDeclarations = getSerializerDeclarations(this.library,
            createSerializerDependencyFilter(this.language))

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
        return new SerializerPrinter(library, language).print(prefix)
    }
}
export function createCSerializerPrinter(library: PeerLibrary, language: Language, prefix: string): LanguageWriter {
    const serializers = library.createLanguageWriter(Language.CPP)
    const generator = new SerializerPrinter(library, language)
    const result = generator.print(prefix)
    serializers.concat(generator.forwardDeclarations)
    result.forEach(it => serializers.concat(it.content))
    return serializers
}

export function getSerializerDeclarations(library: PeerLibrary, dependencyFilter: DependencyFilter): SerializableTarget[] {
    const seenNames = new Set<string>()
    return collectDeclarationTargets(library)
        .map(it => it)
        .filter((it): it is SerializableTarget => dependencyFilter.shouldAdd(it))
        .filter(it => !idl.isHandwritten(it) && !isInIdlizeInternal(it) && !peerGeneratorConfiguration().components.custom.includes(it.name) && !peerGeneratorConfiguration().isHandWritten(it.name))
        .filter(it => !(idl.isNamedNode(it) && peerGeneratorConfiguration().isResource(it.name)))
        .filter(it => !it.typeParameters?.length || it.typeParameters.every(it => it.includes('=')))
        .filter(it => {
            const fullName = qualifiedName(it, "_", "namespace.name")
            const seen = seenNames.has(fullName)
            seenNames.add(fullName)
            return !seen
        })
}

export function printSerializerImports(library: PeerLibrary, language: Language, collector: ImportsCollector) {
    if (language === Language.TS || language === Language.ARKTS) {
        collector.addFeatures([
            "SerializerBase", "DeserializerBase", "CallbackResource", "InteropNativeModule", "MaterializedBase", "Tags", "RuntimeType", "runtimeType", "toPeerPtr", 'nullptr', 'KPointer'
        ], "@koalaui/interop")
        collector.addFeatures(["int32", "int64", "float32", "unsafeCast"], "@koalaui/common")
        if (language == Language.TS && library.name === "arkoala") {
            collector.addFeatures([
                "MaterializedBase", "InteropNativeModule", "ResourceHolder",
                "nullptr", "KPointer", "isInstanceOf",
            ], "@koalaui/interop")
        }

        if ([...generatorConfiguration().modules.values()].some(it => it.external ?? false)) {
            collector.addFeature("extractors", library.layout.handwrittenPackage())
        }

        collector.addFeatures(["NativeBuffer", "KSerializerBuffer"], "@koalaui/interop")
        if (language === Language.TS) {
            collector.addFeature('Finalizable', '@koalaui/interop')
            collector.addFeatures(["NativeBuffer"], "@koalaui/interop")
        } else {
            collectDeclItself(library, idl.createReferenceType("TypeChecker"), collector)
            collector.addFeatures(["KUint8ArrayPtr", "NativeBuffer", "InteropNativeModule"], "@koalaui/interop")
        }
        if (library.name === 'arkoala') {
            collector.addFeature("CallbackTransformer", "./CallbackTransformer")
        }
    }
}

const MATERIALIZED_BASE = idl.createInterface(
    "MaterializedBase",
    idl.IDLInterfaceSubkind.Interface, [], [], [],
    [idl.createProperty("peer", idl.IDLBooleanType)],
)

export function createSerializerDependencyFilter(language: Language): DependencyFilter {
    switch (language) {
        case Language.TS: return new DefaultSerializerDependencyFilter()
        case Language.ARKTS: return new ArkTSSerializerDependencyFilter()
        case Language.JAVA: return new DefaultSerializerDependencyFilter()
        case Language.CJ: return new DefaultSerializerDependencyFilter()
        case Language.CPP: return new DefaultSerializerDependencyFilter()
        case Language.KOTLIN: return new DefaultSerializerDependencyFilter()
    }
    throwException("Unimplemented filter")
}

class DefaultSerializerDependencyFilter implements DependencyFilter {
    shouldAdd(node: IDLEntry): boolean {
        return !peerGeneratorConfiguration().serializer.ignore.includes(node.name!)
            && (!this.isParameterized(node) || this.isParametrizedWithAllDefaults(node))
            && this.canSerializeDependency(node)
    }
    isParameterized(node: idl.IDLEntry) {
        return idl.hasExtAttribute(node, idl.IDLExtendedAttributes.TypeParameters)
            || ["Record", "Required"].includes(node.name!)
    }
    isParametrizedWithAllDefaults(node: idl.IDLEntry): boolean {
        return !!idl.getExtAttribute(node, idl.IDLExtendedAttributes.TypeParameters)?.split(',').every(it => it.includes("="))
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
