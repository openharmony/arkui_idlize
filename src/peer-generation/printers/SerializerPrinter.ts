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
import { Language } from "../../util";
import { DeclarationTable, DeclarationTarget, PrimitiveType } from "../DeclarationTable";
import { LanguageWriter, Method, NamedMethodSignature, Type } from "../LanguageWriters";
import { PeerGeneratorConfig } from '../PeerGeneratorConfig';
import { checkDeclarationTargetMaterialized } from '../Materialized';
import { ImportsCollector } from '../ImportsCollector';
import { PeerLibrary } from '../PeerLibrary';
import { collectDtsImports } from '../DtsImportsGenerator';

function collectAllInterfacesImports(library: PeerLibrary, imports: ImportsCollector) {
    for (const file of library.files)
        file.importFeatures.forEach(it => imports.addFeature(it.feature, it.module))
}

function printSerializerImports(library: PeerLibrary, writer: LanguageWriter) {
    if (writer.language === Language.TS) {
        const collector = new ImportsCollector()
        collectAllInterfacesImports(library, collector)
        collector.print(writer)
    } else if (writer.language === Language.ARKTS) {
        writer.print(collectDtsImports().trim())
    }
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

    private generateSerializer(target: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        const name = this.table.computeTargetName(target, false, "")
        this.table.setCurrentContext(`write${name}()`)

        this.writer.writeMethodImplementation(
            new Method(`write${name}`,
                new NamedMethodSignature(Type.Void, [new Type(this.translateSerializerType(name, target))], ["value"])),
            writer => {
                writer.writeStatement(
                    writer.makeAssign("valueSerializer", new Type(writer.makeRef("Serializer")), writer.makeThis(), true, false))
                let struct = this.table.targetStruct(target)
                struct.getFields().forEach(it => {
                    let field = `value_${it.name}`
                    writer.writeStatement(writer.makeAssign(field, undefined, writer.makeString(`value.${it.name}`), true))
                    let typeConvertor = this.table.typeConvertor(`value`, it.type!, it.optional)
                    typeConvertor.convertorSerialize(`value`, field, writer)
                })
            })
        this.table.setCurrentContext(undefined)
    }

    print() {
        const className = "Serializer"
        const superName = `${className}Base`
        let ctorSignature: NamedMethodSignature | undefined = undefined
        switch (this.writer.language) {
            case Language.ARKTS:
                ctorSignature = new NamedMethodSignature(Type.Void, [], [])
                break;
            case Language.CPP:
                ctorSignature = new NamedMethodSignature(Type.Void, [new Type("uint8_t*")], ["data"])
                break;
            case Language.JAVA:
                ctorSignature = new NamedMethodSignature(Type.Void, [], [])
                break;
            }
        let seenNames = new Set<string>()
        printSerializerImports(this.library, this.writer)
        this.writer.writeClass(className, writer => {
            if (ctorSignature) {
                const ctorMethod = new Method(superName, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {}, ctorMethod)
            }
            for (let declaration of this.table.orderedDependenciesToGenerate) {
                if (ignoreSerializeTarget(this.table, declaration))
                    continue
                let name = this.table.computeTargetName(declaration, false, "")
                if (seenNames.has(name)) continue
                seenNames.add(name)
                if (ts.isInterfaceDeclaration(declaration) || ts.isClassDeclaration(declaration))
                    if (canSerializeTarget(declaration))
                        this.generateSerializer(declaration)
            }
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

    private generateDeserializer(target: ts.ClassDeclaration | ts.InterfaceDeclaration) {
        const name = this.table.computeTargetName(target, false, "")
        this.table.setCurrentContext(`read${name}()`)
        const type = new Type(name)
        this.writer.writeMethodImplementation(new Method(`read${name}`, new NamedMethodSignature(type, [], [])), writer => {
            writer.writeStatement(
                writer.makeAssign("valueDeserializer", new Type(writer.makeRef("Deserializer")), writer.makeThis(), true, false))
            // using list initialization to prevent uninitialized value errors
            writer.writeStatement(writer.makeObjectDeclare("value", type, this.table.targetStruct(target).getFields()))
            if (ts.isInterfaceDeclaration(target) || ts.isClassDeclaration(target)) {
                let struct = this.table.targetStruct(target)
                struct.getFields().forEach(it => {
                    let typeConvertor = this.table.typeConvertor(`value`, it.type!, it.optional)
                    writer.writeStatement(typeConvertor.convertorDeserialize(`value`, `value.${it.name}`, writer))
                })
            } else {
                if (writer.language === Language.CPP) {
                    let typeConvertor = this.table.typeConvertor("value", target, false)
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
        let ctorSignature = this.writer.language == Language.CPP
            ? new NamedMethodSignature(Type.Void, [new Type("uint8_t*"), Type.Int32], ["data", "length"])
            : undefined
        printSerializerImports(this.library, this.writer)
        this.writer.writeClass(className, writer => {
            if (ctorSignature) {
                const ctorMethod = new Method(`${className}Base`, ctorSignature)
                writer.writeConstructorImplementation(className, ctorSignature, writer => {}, ctorMethod)
            }
            const seenNames = new Set<string>()
            for (let declaration of this.table.orderedDependenciesToGenerate) {
                if (ignoreSerializeTarget(this.table, declaration))
                    continue

                let name = this.table.computeTargetName(declaration, false, "")
                if (seenNames.has(name)) continue
                seenNames.add(name)

                if (ts.isClassDeclaration(declaration) || ts.isInterfaceDeclaration(declaration)) {
                    if (canSerializeTarget(declaration))
                        this.generateDeserializer(declaration)
                }
            }
        }, superName)
    }
}

export function writeSerializer(library: PeerLibrary, writer: LanguageWriter) {
    const printer = new SerializerPrinter(library, writer)
    printer.print()
}

export function writeDeserializer(library: PeerLibrary, writer: LanguageWriter) {
    const printer = new DeserializerPrinter(library, writer)
    printer.print()
}