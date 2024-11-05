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

import * as ts from 'typescript'
import * as idl from '../../idl'
import { Language } from "../../Language";
import { DeclarationTable, DeclarationTarget } from "../DeclarationTable";
import { PrimitiveType } from "../ArkPrimitiveType"
import { createLanguageWriter, ExpressionStatement, LanguageStatement, LanguageWriter, Method, MethodSignature, NamedMethodSignature } from "../LanguageWriters";
import { PeerGeneratorConfig } from '../PeerGeneratorConfig';
import { checkDeclarationTargetMaterialized } from '../Materialized';
import { convertDeclToFeature as convertDeclToFeatureDTS, ImportsCollector } from '../ImportsCollector';
import { PeerLibrary } from '../PeerLibrary';
import { createTypeDependenciesCollector, createTypeNodeConvertor, isSourceDecl as isSourceDeclDTS } from "../PeerGeneratorVisitor";
import { isSyntheticDeclaration as isSyntheticDeclarationDTS } from "../synthetic_declaration";
import { DeclarationDependenciesCollector } from "../dependencies_collector";
import { isBuilderClass } from "../BuilderClass";
import { lazy, lazyThrow } from '../lazy';
import { TypeNodeNameConvertor } from "../TypeNodeNameConvertor";
import { IdlPeerLibrary } from '../idl/IdlPeerLibrary';
import {
    ArkTSBuiltTypesDependencyFilter,
    convertDeclToFeature,
    DependencyFilter,
    isMaterialized,
} from '../idl/IdlPeerGeneratorVisitor';
import { isSyntheticDeclaration, makeSyntheticDeclarationsFiles } from '../idl/IdlSyntheticDeclarations';
import { collectProperties } from '../idl/StructPrinter';
import { ProxyStatement } from '../LanguageWriters/LanguageWriter';
import { CallbackKind, generateCallbackKindAccess } from './CallbacksPrinter';
import { convertDeclaration } from '../LanguageWriters/typeConvertor';
import { DeclarationNameConvertor } from '../idl/IdlNameConvertor';

type SerializableTarget = idl.IDLInterface | idl.IDLCallback
import { getReferenceResolver } from '../ReferenceResolver';
import { throwException } from "../../util";
import { IDLEntry } from "../../idl";

function printSerializerImports(table: (ts.ClassDeclaration | ts.InterfaceDeclaration)[],
                                library: PeerLibrary,
                                writer: LanguageWriter) {
    const convertorImportsCollector = new ImportsCollector()
    if (writer.language === Language.ARKTS) {
        library.files.forEach(peer => peer.serializeImportFeatures
            .forEach(importFeature => convertorImportsCollector.addFeature(importFeature.feature, importFeature.module)))
        convertorImportsCollector.addFeature("TypeChecker", "#components")
    }
    if ([Language.TS, Language.ARKTS].includes(writer.language)) {
        convertorImportsCollector.addFeature("KBoolean", "@koalaui/interop")
    }
    const serializerCollector = createSerializerDependenciesCollector(writer.language, convertorImportsCollector, library)
    if (serializerCollector != undefined) {
        table.forEach(decl => serializerCollector.collect(decl))
    }
    convertorImportsCollector.print(writer, `./peers/Serializer.${writer.language.extension}`)
}

function canSerializeTarget(declaration: ts.ClassDeclaration | ts.InterfaceDeclaration): boolean {
    // we can not generate serializer/deserializer for targets, where
    // type parameters are in signature and some of this parameters has not
    // default value. At all we should not generate even classes with default values,
    // but they are at least compilable.
    // See class TransitionEffect declared at common.d.ts and used at CommonMethod.transition
    return (declaration.typeParameters ?? []).every(it => {
        return it.default !== undefined
    })
}

function ignoreSerializeTarget(table: DeclarationTable, target: DeclarationTarget): target is PrimitiveType | ts.EnumDeclaration {
    const name = table.computeTargetName(target, false, "")
    if (PeerGeneratorConfig.ignoreSerialization.includes(name)) return true
    if (target instanceof PrimitiveType) return true
    if (ts.isEnumDeclaration(target)) return true
    if (ts.isFunctionTypeNode(target)) return true
    if (ts.isImportTypeNode(target)) return true
    if (ts.isTemplateLiteralTypeNode(target)) return true
    if (checkDeclarationTargetMaterialized(target)) return true
    return false
}

class SerializerPrinter {
    constructor(
        private readonly library: PeerLibrary,
        private readonly writer: LanguageWriter,
    ) {}

    private get table(): DeclarationTable {
        return this.library.declarationTable
    }

    private translateSerializerType(name: string, target: DeclarationTarget): string {
        if (target instanceof PrimitiveType) throw new Error("Unexpected")
        if (ts.isInterfaceDeclaration(target) && target.typeParameters != undefined) {
            if (target.typeParameters.length != 1) throw new Error("Unexpected")
            return `${name}<object>`
        } else {
            return name
        }
    }

    private generateSerializer(writer: LanguageWriter, target: ts.ClassDeclaration | ts.InterfaceDeclaration,
                               prefix: string,
                               typeNodeNameConvertor: TypeNodeNameConvertor) {
        const name = this.table.computeTargetName(target, false, prefix)
        const methodName = this.table.computeTargetName(target, false, "")
        this.table.setCurrentContext(`write${methodName}()`)

        writer.writeMethodImplementation(
            new Method(`write${methodName}`,
                new NamedMethodSignature(idl.IDLVoidType, [idl.toIDLType(this.translateSerializerType(name, target))], ["value"])),
            writer => {
                let struct = this.table.targetStruct(target)
                if (struct.getFields().length > 0) {
                    writer.writeStatement(
                        writer.makeAssign("valueSerializer", writer.makeRef("Serializer"), writer.makeThis(), true, false))
                }
                struct.getFields().forEach(it => {
                    let field = `value_${it.name}`
                    writer.writeStatement(writer.makeAssign(field, undefined, writer.makeString(`value.${writer.escapeKeyword(it.name)}`), true))
                    let typeConvertor = this.table.typeConvertor(`value`, it.type!, it.optional, undefined, typeNodeNameConvertor)
                    typeConvertor.convertorSerialize(`value`, field, writer)
                })
            })
        this.table.setCurrentContext(undefined)
    }

    print() {
        const className = "Serializer"
        const superName = `${className}Base`
        let prefix = ""
        let ctorSignature: NamedMethodSignature | undefined = undefined
        switch (this.writer.language) {
            case Language.ARKTS:
                ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [], [])
                break;
            case Language.CPP:
                ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [idl.toIDLType("uint8_t*")], ["data"])
                prefix = PrimitiveType.Prefix
                break;
            case Language.JAVA:
                ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [], [])
                break;
            case Language.CJ:
                ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [], [])
                break;
        }
        const serializerDeclarations = generateSerializerDeclarationsTable(prefix, this.table)
        const serializerWriter = createLanguageWriter(this.writer.language, getReferenceResolver(this.library))
        const typeNodeNameConvertor = createTypeNodeConvertor(this.library)
        // just a separator
        serializerWriter.print("")
        serializerWriter.writeClass(className, writer => {
            if (ctorSignature) {
                const ctorMethod = new Method(superName, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, _ => {}, ctorMethod)
            }
            serializerDeclarations.forEach(decl =>
                this.generateSerializer(serializerWriter, decl, prefix, typeNodeNameConvertor))
            if (serializerWriter.language == Language.JAVA) {
                // TODO: somewhat ugly.
                serializerWriter.print(`static Serializer createSerializer() { return new Serializer(); }`)
            }
        }, superName)
        printSerializerImports(serializerDeclarations, this.library, this.writer)
        this.writer.print(serializerWriter.printer.getOutput().join("\n"))
    }
}

class IdlSerializerPrinter {
    constructor(
        private readonly library: IdlPeerLibrary,
        private readonly writer: LanguageWriter,
    ) {}

    private generateInterfaceSerializer(target: idl.IDLInterface, prefix: string = "") {
        const name = this.library.computeTargetName(target, false, prefix)
        const methodName = target.name
        this.library.setCurrentContext(`write${methodName}()`)
        this.writer.writeMethodImplementation(
            new Method(`write${methodName}`,
                new NamedMethodSignature(idl.IDLVoidType, [idl.toIDLType(name)], ["value"])),
            writer => {
                const properties = collectProperties(target, this.library)
                if (properties.length > 0) {
                    writer.writeStatement(
                        writer.makeAssign("valueSerializer", writer.makeRef("Serializer"), writer.makeThis(), true, false))
                }
                properties.forEach(it => {
                    let field = `value_${it.name}`
                    writer.writeStatement(writer.makeAssign(field, undefined, writer.makeString(`value.${writer.escapeKeyword(it.name)}`), true))
                    let typeConvertor = this.library.typeConvertor(`value`, it.type!, it.isOptional)
                    typeConvertor.convertorSerialize(`value`, field, writer)
                })
            })
        this.library.setCurrentContext(undefined)
    }

    print(prefix: string, declarationPath?: string) {
        const className = "Serializer"
        const superName = `${className}Base`
        let ctorSignature: NamedMethodSignature | undefined = undefined
        switch (this.writer.language) {
            case Language.ARKTS:
                ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [], [])
                break;
            case Language.CPP:
                ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [idl.createReferenceType("uint8_t*"), idl.createReferenceType("CallbackResourceHolder*")], ["data", "resourceHolder"], [undefined, `nullptr`])
                if (prefix == "") prefix = PrimitiveType.Prefix + this.library.libraryPrefix
                break;
            case Language.JAVA:
                ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [], [])
                break;
        }
        const serializerDeclarations = getSerializers(this.library,
            createSerializerDependencyFilter(this.library))
        printIdlImports(this.library, serializerDeclarations, this.writer, declarationPath)
        // just a separator
        this.writer.print("")
        this.writer.writeClass(className, writer => {
            if (ctorSignature) {
                const ctorMethod = new Method(superName, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {
                }, ctorMethod)
            }
            for (const decl of serializerDeclarations) {
                if (idl.isInterface(decl) || idl.isClass(decl) || idl.isAnonymousInterface(decl) || idl.isTupleInterface(decl)) {
                    this.generateInterfaceSerializer(decl, prefix)
                } else if (idl.isCallback(decl)) {
                    // callbacks goes through writeCallbackResource function
                }
            }
            if (this.writer.language == Language.JAVA) {
                // TODO: somewhat ugly.
                this.writer.print(`static Serializer createSerializer() { return new Serializer(); }`)
            }
        }, superName)
    }
}

class IdlDeserializerPrinter {///converge w/ IdlSerP?
    constructor(
        private readonly library: IdlPeerLibrary,
        private readonly writer: LanguageWriter,
    ) {}

    private generateInterfaceDeserializer(target: idl.IDLInterface, prefix: string = "") {
        const name = this.library.computeTargetName(target, false, prefix)
        const methodName = this.library.computeTargetName(target, false, "")
        const type = idl.toIDLType(name)
        this.writer.writeMethodImplementation(new Method(`read${methodName}`, new NamedMethodSignature(type, [], [])), writer => {
            function declareDeserializer() {
                writer.writeStatement(
                    writer.makeAssign("valueDeserializer", writer.makeRef("Deserializer"), writer.makeThis(), true, false))
            }
            const properties = collectProperties(target, this.library)
            // using list initialization to prevent uninitialized value errors
            const valueType = writer.language !== Language.TS ? type /// refac into LW
                : idl.toIDLType(`{${properties.map(it => `${it.name}?: ${writer.convert(it.type)}`).join(", ")}}`)

            if (writer.language === Language.CPP) 
                writer.writeStatement(writer.makeAssign("value", valueType, writer.makeString(`{}`), true, false))
            if (idl.isInterface(target) || idl.isClass(target)) {
                if (properties.length > 0) {
                    declareDeserializer()
                }
                properties.forEach(it => {
                    let typeConvertor = this.library.typeConvertor(`value`, it.type!, it.isOptional)
                    writer.writeStatement(typeConvertor.convertorDeserialize(`${it.name}_buf`, `valueDeserializer`, (expr) => {
                        if (writer.language === Language.CPP)
                            return writer.makeAssign(`value.${writer.escapeKeyword(it.name)}`, undefined, expr, false)
                        return writer.makeAssign(`${it.name}_result`, idl.maybeOptional(it.type, it.isOptional), expr, true, true)
                    }, writer))
                })
                if (writer.language !== Language.CPP) {
                    const propsAssignees = properties.map(it => {
                        return `${it.name}: ${it.name}_result`
                    })
                    writer.writeStatement(writer.makeAssign("value", valueType, writer.makeString(`{${propsAssignees.join(',')}}`), true, false))
                }
            } else {
                if (writer.language === Language.CPP) {
                    let typeConvertor = this.library.declarationConvertor("value", idl.createReferenceType((target as idl.IDLInterface).name), target)
                    declareDeserializer()
                    writer.writeStatement(typeConvertor.convertorDeserialize(`value_buf`, `valueDeserializer`, (expr) => {
                       return writer.makeAssign(`value`, undefined, expr, false) 
                    }, writer))
                }
            }
            writer.writeStatement(writer.makeReturn(
                writer.makeCast(writer.makeString("value"), idl.toIDLType(name))))
        })
    }

    private generateCallbackDeserializer(target: idl.IDLCallback): void {
        if (this.writer.language === Language.CPP)
            // callbacks in native are just CallbackResource while in managed we need to convert them to 
            // target language callable
            return
        if (PeerGeneratorConfig.ignoredCallbacks.has(target.name))
            return
        const returnTypeName = this.library.mapType(target)
        const methodName = this.library.computeTargetName(target, false, "")
        const type = idl.createReferenceType(returnTypeName)
        this.writer.writeMethodImplementation(new Method(`read${methodName}`, new NamedMethodSignature(type, [], [])), writer => {
            const resourceName = "_resource"
            const callName = "_call"
            const argsSerializer = "_args"
            const continuationValueName = "_continuationValue"
            const continuationCallbackName = "_continuationCallback"
            writer.writeStatement(writer.makeAssign(
                resourceName,
                idl.createReferenceType("CallbackResource"),
                writer.makeMethodCall(`this`, `readCallbackResource`, []),
                true,
            ))
            writer.writeStatement(writer.makeAssign(
                callName,
                idl.IDLPointerType,
                writer.makeMethodCall(`this`, `readPointer`, []),
                true,
            ))
            const callbackSignature = new NamedMethodSignature(
                target.returnType,
                target.parameters.map(it => idl.maybeOptional(it.type!, it.isOptional)),
                target.parameters.map(it => it.name),
            )
            const hasContinuation = !idl.isVoidType(target.returnType)
            let continuation: LanguageStatement[] = []
            if (hasContinuation) {
                const continuationReference = this.library.createContinuationCallbackReference(target.returnType)
                const continuationTarget = this.library.resolveTypeReference(continuationReference) as idl.IDLCallback
                const continuationConvertor = this.library.typeConvertor(continuationCallbackName, continuationReference)
                const returnType = target.returnType
                const optionalReturnType = idl.createUnionType([
                    target.returnType,
                    idl.IDLUndefinedType,
                ])
                continuation = [
                    writer.makeAssign(continuationValueName, optionalReturnType, undefined, true, false),
                    writer.makeAssign(
                        continuationCallbackName,
                        idl.createReferenceType(this.library.mapType(continuationTarget)),
                        writer.makeLambda(new NamedMethodSignature(idl.IDLVoidType, [returnType], [`value`]), [
                            writer.makeAssign(continuationValueName, undefined, writer.makeString(`value`), false)
                        ]),
                        true,
                    ),
                    new ProxyStatement(writer => {
                        continuationConvertor.convertorSerialize(argsSerializer, continuationCallbackName, writer)
                    }),
                ]
            }
            writer.writeStatement(writer.makeReturn(writer.makeLambda(callbackSignature, [
                writer.makeAssign(`${argsSerializer}Serializer`, idl.createReferenceType('Serializer'), writer.makeMethodCall('SerializerBase', 'hold', [
                    writer.makeSerializerCreator()
                ]), true),
                new ExpressionStatement(writer.makeMethodCall(`${argsSerializer}Serializer`, `writeCallbackResource`, 
                    [writer.makeString(resourceName)])),
                ...target.parameters.map(it => {
                    const convertor = this.library.typeConvertor(it.name, it.type!, it.isOptional)
                    return new ProxyStatement((writer: LanguageWriter) => {
                        convertor.convertorSerialize(argsSerializer, it.name, writer)
                    })
                }),
                ...continuation,
                new ExpressionStatement(writer.makeNativeCall(`_CallCallback`, [
                    writer.makeString(`${generateCallbackKindAccess(target, writer.language)}`),
                    writer.makeString(`${argsSerializer}Serializer.asArray()`),
                    writer.makeString(`${argsSerializer}Serializer.length()`),
                ])),
                new ExpressionStatement(writer.makeMethodCall(`${argsSerializer}Serializer`, `release`, [])),
                writer.makeReturn(hasContinuation 
                    ? writer.makeCast(
                        writer.makeString(continuationValueName),
                        target.returnType) 
                    : undefined),
            ])))

        })
    }

    print(prefix: string, declarationPath?: string) {///converge w/ Ts printers
        const className = "Deserializer"
        const superName = `${className}Base`
        let ctorSignature: NamedMethodSignature | undefined = undefined
        if (this.writer.language == Language.CPP) {
            ctorSignature = new NamedMethodSignature(idl.IDLVoidType, [idl.createReferenceType("uint8_t*"), idl.IDLI32Type], ["data", "length"])
            prefix = prefix === "" ? PrimitiveType.Prefix : prefix
        }
        const serializerDeclarations = getSerializers(this.library,
            createSerializerDependencyFilter(this.library))
        printIdlImports(this.library, serializerDeclarations, this.writer, declarationPath)
        this.writer.print("")
        this.writer.writeClass(className, writer => {
            if (ctorSignature) {
                const ctorMethod = new Method(`${className}Base`, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {}, ctorMethod)
            }
            for (const decl of serializerDeclarations) {
                if (idl.isInterface(decl) || idl.isClass(decl) || idl.isAnonymousInterface(decl) || idl.isTupleInterface(decl)) {
                    this.generateInterfaceDeserializer(decl, prefix)
                } else if (idl.isCallback(decl)) {
                    this.generateCallbackDeserializer(decl)
                }
            }
        }, superName)
    }
}

export function writeSerializer(library: PeerLibrary | IdlPeerLibrary, writer: LanguageWriter, prefix: string, declarationPath?: string) {
    const printer = library instanceof PeerLibrary
        ? new SerializerPrinter(library, writer) : new IdlSerializerPrinter(library, writer)
    printer.print(prefix, declarationPath)
}

export function writeDeserializer(library: IdlPeerLibrary, writer: LanguageWriter, prefix = "", declarationPath?: string) {
    const printer = new IdlDeserializerPrinter(library, writer)
    printer.print(prefix, declarationPath)
}

interface SerializerDependenciesCollector {
    collect(decl: ts.Declaration): void
}

class TSSerializerDependenciesCollector implements SerializerDependenciesCollector {
    private readonly declDependenciesCollector: DeclarationDependenciesCollector
    constructor(private readonly collector: ImportsCollector, private readonly library: PeerLibrary) {
        this.declDependenciesCollector = new DeclarationDependenciesCollector(
            library.declarationTable.typeChecker!,
            createTypeDependenciesCollector(library, { declDependenciesCollector: lazyThrow()}))
        for (const file of this.library.files) {
            file.importFeatures.forEach(it => this.collector.addFeature(it.feature, it.module))
        }
    }
    collect(decl: ts.Declaration) {
        this.declDependenciesCollector.convert(decl).forEach(it => {
            if (this.isBuilderClassDeclaration(it)) {
                const feature = convertDeclToFeatureDTS(this.library, it)
                this.collector.addFeature(feature.feature, feature.module)
            }
        })
        if (this.isBuilderClassDeclaration(decl)) {
            const feature = convertDeclToFeatureDTS(this.library, decl)
            this.collector.addFeature(feature.feature, feature.module)
        }
    }
    isBuilderClassDeclaration(decl: ts.Declaration): boolean {
        return (ts.isInterfaceDeclaration(decl) || ts.isClassDeclaration(decl)) && isBuilderClass(decl)
    }
}

class ArkTSSerializerDependenciesCollector implements SerializerDependenciesCollector {
    private readonly declDependenciesCollector: DeclarationDependenciesCollector
    constructor(private readonly collector: ImportsCollector, private readonly library: PeerLibrary) {
        this.declDependenciesCollector = new DeclarationDependenciesCollector(
            library.declarationTable.typeChecker!,
            createTypeDependenciesCollector(library, {
                declDependenciesCollector: lazy(() => this.declDependenciesCollector)
            })
        )
    }

    collect(decl: ts.Declaration): void {
        this.declDependenciesCollector.convert(decl).forEach(it => {
            if (isSourceDeclDTS(it) || isSyntheticDeclarationDTS(it)) {
                const feature = convertDeclToFeatureDTS(this.library, it)
                this.collector.addFeature(feature.feature, feature.module)
            }
        })
        if (decl.parent && isSourceDeclDTS(decl)) {
            const feature = convertDeclToFeatureDTS(this.library, decl)
            this.collector.addFeature(feature.feature, feature.module)
        }
    }
}

function createSerializerDependenciesCollector(language: Language,
                                               collector: ImportsCollector,
                                               library: PeerLibrary): SerializerDependenciesCollector | undefined {
    switch (language) {
        case Language.TS:
            return new TSSerializerDependenciesCollector(collector, library)
        case Language.ARKTS:
            return new ArkTSSerializerDependenciesCollector(collector, library)
    }
    return undefined
}

function generateSerializerDeclarationsTable(prefix: string, table: DeclarationTable):
        (ts.ClassDeclaration | ts.InterfaceDeclaration)[] {
    const declarations = new Array<ts.ClassDeclaration | ts.InterfaceDeclaration>()
    const seenNames = new Set<string>()
    for (let declaration of table.orderedDependenciesToGenerate) {
        if (ignoreSerializeTarget(table, declaration)) {
            continue
        }

        const name = table.computeTargetName(declaration, false, prefix)
        if (seenNames.has(name)) {
            continue
        }
        seenNames.add(name)

        if ((ts.isClassDeclaration(declaration) || ts.isInterfaceDeclaration(declaration))
            && canSerializeTarget(declaration)) {
            declarations.push(declaration)
        }
    }
    return declarations
}

function getSerializers(library: IdlPeerLibrary, dependencyFilter: DependencyFilter): SerializableTarget[] {
    const seenNames = new Set<string>()
    return library.orderedDependenciesToGenerate
        .filter((it): it is SerializableTarget => dependencyFilter.shouldAdd(it))
        .filter(it => {
            const seen = seenNames.has(it.name!)
            seenNames.add(it.name!)
            return !seen
        })
}

function printIdlImports(library: IdlPeerLibrary, serializerDeclarations: SerializableTarget[], writer: LanguageWriter, declarationPath?: string) {
    const collector = new ImportsCollector()

    if (writer.language === Language.TS) {
        for (let [module, {dependencies, declarations}] of makeSyntheticDeclarationsFiles()) {
            declarations.forEach(it => collector.addFeature(it.name!, module))
        }

        for (let builder of library.builderClasses.keys()) {
            collector.addFeature(builder, `Ark${builder}Builder`)
        }

        if (declarationPath) { // This is used for OHOS library generation only
            // TODO Check for compatibility!
            const makeFeature = (node: idl.IDLEntry) => {
                return {
                    feature: convertDeclaration(DeclarationNameConvertor.I, node),
                    module: `./${declarationPath}` // TODO resolve
                }
            }
            serializerDeclarations.filter(it => it.fileName)
                .filter(it => !idl.isCallback(it) && !(library.files.find(f => f.originalFilename == it.fileName)?.isPredefined))
                .map(makeFeature)
                .forEach(it => collector.addFeature(it.feature, it.module))
        }
    }
    else if (writer.language === Language.ARKTS) {
        collector.addFeature("TypeChecker", "#components")
        collector.addFeature("KInt", "@koalaui/interop")

        library.files.forEach(peer => peer.serializeImportFeatures
            .forEach(importFeature => collector.addFeature(importFeature.feature, importFeature.module)))

        serializerDeclarations.filter(it => isSyntheticDeclaration(it) || it.fileName)
            .filter(it => !idl.isCallback(it))
            .map(it => convertDeclToFeature(library, it))
            .forEach(it => collector.addFeature(it.feature, it.module))

        for (let builder of library.builderClasses.keys()) {
            collector.addFeature(builder, `Ark${builder}Builder`)
        }
    }

    // TODO Refactor to remove dependency on hardcoded paths
    collector.print(writer, (declarationPath ? "." : "./peers/") + `Serializer.${writer.language.extension}`)
}

function createSerializerDependencyFilter(peerLibrary: IdlPeerLibrary): DependencyFilter {
    switch (peerLibrary.language) {
        case Language.TS: return new DefaultSerializerDependencyFilter()
        case Language.ARKTS: return new ArkTSSerializerDependencyFilter()
        case Language.JAVA: return new DefaultSerializerDependencyFilter()
        case Language.CJ: return new DefaultSerializerDependencyFilter()
    }
    throwException("Unimplemented filter")
}

class DefaultSerializerDependencyFilter implements DependencyFilter {
    shouldAdd(node: IDLEntry): boolean {
        return !PeerGeneratorConfig.ignoreSerialization.includes(node.name!)
            && !this.isParameterized(node)
            && this.canSerializeDependency(node);
    }
    isParameterized(node: idl.IDLEntry) {
        return idl.hasExtAttribute(node, idl.IDLExtendedAttributes.TypeParameters)
            || ["Record", "Required"].includes(node.name!)
    }

    canSerializeDependency(dep: idl.IDLEntry): dep is SerializableTarget  {
        if ((idl.isClass(dep) || idl.isInterface(dep)) && !isMaterialized(dep))
            return true
        if (idl.isCallback(dep))
            return true
        return false
    }
}

class ArkTSSerializerDependencyFilter extends DefaultSerializerDependencyFilter {
    readonly arkTSBuiltTypesFilter = new ArkTSBuiltTypesDependencyFilter()
    override shouldAdd(node: IDLEntry): node is SerializableTarget {
        if (!this.arkTSBuiltTypesFilter.shouldAdd(node)) {
            return false
        }
        return super.shouldAdd(node)
    }
}