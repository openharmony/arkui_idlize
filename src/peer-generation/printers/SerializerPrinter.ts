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
import { Language } from "../../util";
import { DeclarationTable, DeclarationTarget, PrimitiveType } from "../DeclarationTable";
import { createLanguageWriter, LanguageWriter, Method, NamedMethodSignature, Type } from "../LanguageWriters";
import { PeerGeneratorConfig } from '../PeerGeneratorConfig';
import { checkDeclarationTargetMaterialized } from '../Materialized';
import { convertDeclToFeature, ImportsCollector } from '../ImportsCollector';
import { PeerLibrary } from '../PeerLibrary';
import { createTypeDependenciesCollector, createTypeNodeConvertor, isSourceDecl } from "../PeerGeneratorVisitor";
import { isSyntheticDeclaration } from "../synthetic_declaration";
import { DeclarationDependenciesCollector } from "../dependencies_collector";
import { isBuilderClass } from "../BuilderClass";
import { lazy, lazyThrow } from '../lazy';
import { TypeNodeNameConvertor } from "../TypeNodeNameConvertor";
import { IdlPeerLibrary } from '../idl/IdlPeerLibrary';
import { isMaterialized } from '../idl/IdlPeerGeneratorVisitor';
import { makeSyntheticDeclarationsFiles } from '../idl/IdlSyntheticDeclarations';
import { collectProperties } from '../idl/StructPrinter';

function printSerializerImports(table: (ts.ClassDeclaration | ts.InterfaceDeclaration)[],
                                library: PeerLibrary,
                                writer: LanguageWriter) {
    const convertorImportsCollector = new ImportsCollector()
    if (writer.language === Language.ARKTS) {
        library.files.forEach(peer => peer.serializeImportFeatures
            .forEach(importFeature => convertorImportsCollector.addFeature(importFeature.feature, importFeature.module)))
        convertorImportsCollector.addFeature("TypeChecker", "#arkui")
    }
    if ([Language.TS, Language.ARKTS].includes(writer.language))
        convertorImportsCollector.addFeature("KInt", "@koalaui/interop")
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
                new NamedMethodSignature(Type.Void, [new Type(this.translateSerializerType(name, target))], ["value"])),
            writer => {
                let struct = this.table.targetStruct(target)
                if (struct.getFields().length > 0) {
                    writer.writeStatement(
                        writer.makeAssign("valueSerializer", new Type(writer.makeRef("Serializer")), writer.makeThis(), true, false))
                }
                struct.getFields().forEach(it => {
                    let field = `value_${it.name}`
                    writer.writeStatement(writer.makeAssign(field, undefined, writer.makeString(`value.${writer.languageKeywordProtection(it.name)}`), true))
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
                ctorSignature = new NamedMethodSignature(Type.Void, [], [])
                break;
            case Language.CPP:
                ctorSignature = new NamedMethodSignature(Type.Void, [new Type("uint8_t*")], ["data"])
                prefix = PrimitiveType.Prefix
                break;
            case Language.JAVA:
                ctorSignature = new NamedMethodSignature(Type.Void, [], [])
                break;
            case Language.CJ:
                ctorSignature = new NamedMethodSignature(Type.Void, [], [])
                break;
        }
        const serializerDeclarations = generateSerializerDeclarationsTable(prefix, this.table)
        const serializerWriter = createLanguageWriter(this.writer.language)
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

    private generateSerializer(target: idl.IDLInterface, prefix: string = "") {
        const name = this.library.computeTargetName(target, false, prefix)
        const methodName = target.name
        this.library.setCurrentContext(`write${methodName}()`)
        this.writer.writeMethodImplementation(
            new Method(`write${methodName}`,
                new NamedMethodSignature(Type.Void, [new Type(name)], ["value"])),
            writer => {
                const properties = collectProperties(target, this.library)
                if (properties.length > 0) {
                    writer.writeStatement(
                        writer.makeAssign("valueSerializer", new Type(writer.makeRef("Serializer")), writer.makeThis(), true, false))
                }
                properties.forEach(it => {
                    let field = `value_${it.name}`
                    writer.writeStatement(writer.makeAssign(field, undefined, writer.makeString(`value.${writer.languageKeywordProtection(it.name)}`), true))
                    let typeConvertor = this.library.typeConvertor(`value`, it.type!, it.isOptional)
                    typeConvertor.convertorSerialize(`value`, field, writer)
                })
            })
        this.library.setCurrentContext(undefined)
    }

    print() {
        const className = "Serializer"
        const superName = `${className}Base`
        let prefix = ""
        let ctorSignature: NamedMethodSignature | undefined = undefined
        switch (this.writer.language) {
            case Language.ARKTS:
                ctorSignature = new NamedMethodSignature(Type.Void, [], [])
                break;
            case Language.CPP:
                ctorSignature = new NamedMethodSignature(Type.Void, [new Type("uint8_t*")], ["data"])
                prefix = PrimitiveType.Prefix
                break;
            case Language.JAVA:
                ctorSignature = new NamedMethodSignature(Type.Void, [], [])
                break;
        }
        const serializerDeclarations = getSerializers(this.library)
        printIdlImports(this.library, this.writer)
        // just a separator
        this.writer.print("")
        this.writer.writeClass(className, writer => {
            if (ctorSignature) {
                const ctorMethod = new Method(superName, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {
                }, ctorMethod)
            }
            serializerDeclarations.forEach(decl => this.generateSerializer(decl, prefix))
            if (this.writer.language == Language.JAVA) {
                // TODO: somewhat ugly.
                this.writer.print(`static Serializer createSerializer() { return new Serializer(); }`)
            }
        }, superName)
    }
}

class DeserializerPrinter {
    constructor(
        private readonly library: PeerLibrary,
        private readonly writer: LanguageWriter,
    ) {}

    private get table(): DeclarationTable {
        return this.library.declarationTable
    }

    private generateDeserializer(target: ts.ClassDeclaration | ts.InterfaceDeclaration, prefix: string = "") {
        const name = this.table.computeTargetName(target, false, prefix)
        const methodName = this.table.computeTargetName(target, false, "")
        this.table.setCurrentContext(`read${methodName}()`)
        const type = new Type(name)
        this.writer.writeMethodImplementation(new Method(`read${methodName}`, new NamedMethodSignature(type, [], [])), writer => {
            function declareDeserializer() {
                writer.writeStatement(
                    writer.makeAssign("valueDeserializer", new Type(writer.makeRef("Deserializer")), writer.makeThis(), true, false))
            }
            // using list initialization to prevent uninitialized value errors
            writer.writeStatement(writer.makeObjectDeclare("value", type, this.table.targetStruct(target).getFields()))
            if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
                let struct = this.table.targetStruct(target)
                if (struct.getFields().length > 0) {
                    declareDeserializer()
                }
                struct.getFields().forEach(it => {
                    let typeConvertor = this.table.typeConvertor(`value`, it.type!, it.optional)
                    writer.writeStatement(typeConvertor.convertorDeserialize(`value`, `value.${it.name}`, writer))
                })
            } else {
                if (writer.language === Language.CPP) {
                    let typeConvertor = this.table.typeConvertor("value", target, false)
                    declareDeserializer()
                    writer.writeStatement(typeConvertor.convertorDeserialize(`value`, `value`, writer))
                }
            }
            writer.writeStatement(writer.makeReturn(
                writer.makeCast(writer.makeString("value"), new Type(name))))
        })
        this.table.setCurrentContext(undefined)
    }

    print() {
        const className = "Deserializer"
        const superName = `${className}Base`
        let ctorSignature: NamedMethodSignature | undefined = undefined
        let prefix = ""
        if (this.writer.language == Language.CPP) {
            ctorSignature = new NamedMethodSignature(Type.Void, [new Type("uint8_t*"), Type.Int32], ["data", "length"])
            prefix = PrimitiveType.Prefix
        }
        const serializerDeclarations = generateSerializerDeclarationsTable(prefix, this.table)
        printSerializerImports(serializerDeclarations, this.library, this.writer)
        this.writer.print("")
        this.writer.writeClass(className, writer => {
            if (ctorSignature) {
                const ctorMethod = new Method(`${className}Base`, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {}, ctorMethod)
            }
            serializerDeclarations.forEach(decl => this.generateDeserializer(decl, prefix))
        }, superName)
    }
}

class IdlDeserializerPrinter {///converge w/ IdlSerP?
    constructor(
        private readonly library: IdlPeerLibrary,
        private readonly writer: LanguageWriter,
    ) {}

    private generateDeserializer(target: idl.IDLInterface, prefix: string = "") {
        const name = this.library.computeTargetName(target, false, prefix)
        const methodName = this.library.computeTargetName(target, false, "")
        const type = new Type(name)
        this.writer.writeMethodImplementation(new Method(`read${methodName}`, new NamedMethodSignature(type, [], [])), writer => {
            function declareDeserializer() {
                writer.writeStatement(
                    writer.makeAssign("valueDeserializer", new Type(writer.makeRef("Deserializer")), writer.makeThis(), true, false))
            }
            const properties = collectProperties(target, this.library)
            // using list initialization to prevent uninitialized value errors
            const valueType = writer.language !== Language.TS ? type /// refac into LW
                : new Type(`{${properties.map(it => `${it.name}?: ${this.library.mapType(it.type)}`).join(",")}}`)
            writer.writeStatement(writer.makeAssign("value", valueType, writer.makeString(`{}`), true, false))

            if (idl.isInterface(target) || idl.isClass(target)) {
                if (properties.length > 0) {
                    declareDeserializer()
                }
                properties.forEach(it => {
                    let typeConvertor = this.library.typeConvertor(`value`, it.type!, it.isOptional)
                    writer.writeStatement(typeConvertor.convertorDeserialize(`value`, `value.${it.name}`, writer))
                })
            } else {
                if (writer.language === Language.CPP) {
                    let typeConvertor = this.library.declarationConvertor("value", idl.createReferenceType((target as idl.IDLInterface).name), target)
                    declareDeserializer()
                    writer.writeStatement(typeConvertor.convertorDeserialize(`value`, `value`, writer))
                }
            }
            writer.writeStatement(writer.makeReturn(
                writer.makeCast(writer.makeString("value"), new Type(name))))
        })
    }

    print() {///converge w/ Ts printers
        const className = "Deserializer"
        const superName = `${className}Base`
        let ctorSignature: NamedMethodSignature | undefined = undefined
        let prefix = ""
        if (this.writer.language == Language.CPP) {
            ctorSignature = new NamedMethodSignature(Type.Void, [new Type("uint8_t*"), Type.Int32], ["data", "length"])
            prefix = PrimitiveType.Prefix
        }
        const serializerDeclarations = getSerializers(this.library)
        printIdlImports(this.library, this.writer)
        this.writer.print("")
        this.writer.writeClass(className, writer => {
            if (ctorSignature) {
                const ctorMethod = new Method(`${className}Base`, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {}, ctorMethod)
            }
            serializerDeclarations.forEach(decl => this.generateDeserializer(decl, prefix))
        }, superName)
    }
}

export function writeSerializer(library: PeerLibrary | IdlPeerLibrary, writer: LanguageWriter) {
    const printer = library instanceof PeerLibrary
        ? new SerializerPrinter(library, writer) : new IdlSerializerPrinter(library, writer)
    printer.print()
}

export function writeDeserializer(library: PeerLibrary | IdlPeerLibrary, writer: LanguageWriter) {
    const printer = library instanceof PeerLibrary
        ? new DeserializerPrinter(library as PeerLibrary, writer) : new IdlDeserializerPrinter(library, writer)
    printer.print()
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
                const feature = convertDeclToFeature(this.library, it)
                this.collector.addFeature(feature.feature, feature.module)
            }
        })
        if (this.isBuilderClassDeclaration(decl)) {
            const feature = convertDeclToFeature(this.library, decl)
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
            if (isSourceDecl(it) || isSyntheticDeclaration(it)) {
                const feature = convertDeclToFeature(this.library, it)
                this.collector.addFeature(feature.feature, feature.module)
            }
        })
        if (decl.parent && isSourceDecl(decl)) {
            const feature = convertDeclToFeature(this.library, decl)
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

function getSerializers(library: IdlPeerLibrary): idl.IDLInterface[] {
    const seenNames = new Set<string>()
    return library.orderedDependenciesToGenerate
        .filter(it => !PeerGeneratorConfig.ignoreSerialization.includes(it.name!))
        .filter(it => (idl.isClass(it) || idl.isInterface(it)) && !isMaterialized(it))
        .filter(it => !isParameterized(it))
        .filter(it => {
            const seen = seenNames.has(it.name!)
            seenNames.add(it.name!)
            return !seen
        }) as idl.IDLInterface[]
}

function isParameterized(node: idl.IDLEntry) {
    return node.name !== "TransitionEffect"  // parameterized but we still need it
        && idl.hasExtAttribute(node, idl.IDLExtendedAttributes.TypeParameters)
        || ["Record", "Required"].includes(node.name!)
}

function printIdlImports(library: IdlPeerLibrary, writer: LanguageWriter) {
    if (writer.language === Language.TS) {
        const collector = new ImportsCollector()
        for (let [module, {dependencies, declarations}] of makeSyntheticDeclarationsFiles()) {
            declarations.forEach(it => collector.addFeature(it.name!, module))
        }
        for (let builder of library.builderClasses.keys()) {
            collector.addFeature(builder, `Ark${builder}Builder`)
        }
        collector.print(writer, `./peers/Serializer.${writer.language.extension}`)
    }
}