// TODO: remove after full switching to IDL

import * as ts from "typescript"
import { convertDeclToFeature, ImportFeature, ImportsCollector } from "../ImportsCollector";
import { PeerLibrary } from "../PeerLibrary";
import {
    DeclarationNameConvertor
} from "../dependencies_collector";
import { convertDeclaration } from "../TypeNodeConvertor";
import { createLanguageWriter, LanguageExpression, LanguageWriter, Method, MethodModifier, NamedMethodSignature, Type } from "../LanguageWriters";
import { Language } from "../../Language";
import { StructDescriptor } from "../DeclarationTable";
import { getSyntheticDeclarationList } from "../synthetic_declaration";

const builtInInterfaceTypes = new Map<string,
    (writer: LanguageWriter, value: string) => LanguageExpression>([
        ["Resource",
            (writer: LanguageWriter, value: string) => writer.makeCallIsResource(value)],
        ["Object",
            (writer: LanguageWriter, value: string) => writer.makeCallIsObject(value)],
        ["ArrayBuffer",
            (writer: LanguageWriter, value: string) => writer.makeCallIsArrayBuffer(value)]
    ],
)

export function importTypeChecker(library: PeerLibrary, imports: ImportsCollector): void {
    imports.addFeature("TypeChecker", "#components")
}

export function makeEnumTypeCheckerCall(valueAccessor: string, enumName: string, writer: LanguageWriter): LanguageExpression {
    return writer.makeMethodCall(
        "TypeChecker",
        generateTypeCheckerName(enumName),
        [writer.makeString(valueAccessor)]
    )
}

export function makeInterfaceTypeCheckerCall(
    valueAccessor: string,
    interfaceName: string,
    allFields: string[],
    duplicates: Set<string>,
    writer: LanguageWriter,
): LanguageExpression {
    if (builtInInterfaceTypes.has(interfaceName)) {
        return builtInInterfaceTypes.get(interfaceName)!(writer, valueAccessor)
    }
    return writer.makeMethodCall(
        "TypeChecker",
        generateTypeCheckerName(interfaceName), [writer.makeString(valueAccessor),
        ...allFields.map(it => {
            return writer.makeString(duplicates.has(it) ? "true" : "false")
        })
    ])
}

export function makeArrayTypeCheckCall(
    valueAccessor: string,
    typeName: string,
    writer: LanguageWriter,
) {
    return writer.makeMethodCall(
        "TypeChecker",
        generateTypeCheckerName(typeName),
        // isBrackets ? generateTypeCheckerNameBracketsArray(typeName) : generateTypeCheckerNameArray(typeName),
        [writer.makeString(valueAccessor)
    ])
}

export function generateTypeCheckerName(typeName: string): string {
    typeName = typeName.replaceAll('[]', 'BracketsArray')
    return `is${typeName.replaceAll('[]', 'Brackets')}`
}

abstract class TypeCheckerPrinter {
    constructor(
        protected readonly library: PeerLibrary,
        public readonly writer: LanguageWriter,
    ) {}

    protected writeImports(features: ImportFeature[]): void {
        const imports = new ImportsCollector()
        for (const feature of features) {
            imports.addFeature(feature.feature, feature.module)
        }
        for (const file of this.library.files)
            for (const feature of file.serializeImportFeatures)
                imports.addFeature(feature.feature, feature.module)
        imports.print(this.writer, 'arkts/type_check')
    }
    protected abstract writeInterfaceChecker(name: string, descriptor: StructDescriptor): void
    protected abstract writeArrayChecker(typeName: string): void

    print() {
        const importFeatures: ImportFeature[] = []
        const interfaces: { name: string, descriptor: StructDescriptor }[] = []
        for (const file of this.library.files) {
            for (const decl of file.declarations) {
                if (ts.isTypeAliasDeclaration(decl) && ts.isTypeLiteralNode(decl.type)) {
                    importFeatures.push(convertDeclToFeature(this.library, decl))
                    interfaces.push({
                        name: convertDeclaration(DeclarationNameConvertor.I, decl),
                        descriptor: this.library.declarationTable.targetStruct(decl.type)
                    })
                } else if (ts.isInterfaceDeclaration(decl)) {
                    importFeatures.push(convertDeclToFeature(this.library, decl))
                    interfaces.push({
                        name: convertDeclaration(DeclarationNameConvertor.I, decl),
                        descriptor: this.library.declarationTable.targetStruct(decl)
                    })
                }
            }
        }

        // Collecting of synthetic types. This is necessary for the arkts
        getSyntheticDeclarationList()
            .filter(ts.isInterfaceDeclaration)
            .forEach(it => {
                importFeatures.push(convertDeclToFeature(this.library, it))
                interfaces.push({
                    name: convertDeclaration(DeclarationNameConvertor.I, it),
                    descriptor: this.library.declarationTable.targetStruct(it)
                })
        })

        // Imports leads to error: "SyntaxError: Cannot find imported element 'TypeChecker'"
        // To resolve this error need to use the patched panda sdk(npm run panda:sdk:build) or remove './' from paths in arktsconfig.json
        this.writeImports(importFeatures)
        this.writer.writeClass("TypeChecker", writer => {
            for (const struct of interfaces)
                this.writeInterfaceChecker(struct.name, struct.descriptor)
            const writtenTypes = new Set()
            for (const arrayType of this.library.arrayTypeCheckeres) {
                if (!writtenTypes.has(arrayType)) {
                    this.writeArrayChecker(arrayType)
                    writtenTypes.add(arrayType)
                }
            }
        })
    }
}

class ARKTSTypeCheckerPrinter extends TypeCheckerPrinter {
    constructor(
        library: PeerLibrary
    ) {
        super(library, createLanguageWriter(Language.ARKTS))
    }

    private writeInstanceofChecker(typeName: string, checkerName: string, fieldsCount: number) {
        const argsNames = Array.from({length: fieldsCount}, (_, index) => `arg${index}`)
        this.writer.writeMethodImplementation(new Method(
            checkerName,
            new NamedMethodSignature(Type.Boolean,
                [new Type('object|string|number|undefined|null'), ...argsNames.map(_ => Type.Boolean)],
                ['value', ...argsNames]),
            [MethodModifier.STATIC],
        ), writer => {
            //TODO: hack for now
            typeName = typeName === "Callback" ? "Callback<void, void>" : typeName
            const statement = writer.makeReturn(writer.makeString(`value instanceof ${typeName}`))
            writer.writeStatement(statement)
        })
    }

    protected writeInterfaceChecker(name: string, descriptor: StructDescriptor): void {
        this.writeInstanceofChecker(name, generateTypeCheckerName(name), descriptor.getFields().length)
    }

    protected writeArrayChecker(typeName: string): void {
        this.writeInstanceofChecker(typeName, generateTypeCheckerName(typeName), 0)
    }
}

class TSTypeCheckerPrinter extends TypeCheckerPrinter {
    constructor(
        library: PeerLibrary
    ) {
        super(library, createLanguageWriter(Language.TS))
    }

    protected writeInterfaceChecker(name: string, descriptor: StructDescriptor): void {
        if (descriptor.getFields().length === 0)
            return
        const argsNames = descriptor.getFields().map(it => `duplicated_${it.name}`)
        this.writer.writeMethodImplementation(new Method(
            generateTypeCheckerName(name),
            new NamedMethodSignature(Type.Boolean,
                [new Type('object|string|number|undefined|null'), ...argsNames.map(_ => Type.Boolean)],
                ['value', ...argsNames]),
            [MethodModifier.STATIC],
        ), writer => {
            const orderedFields = Array.from(descriptor.getFields()).sort((a, b) => {
                const aWeight = a.optional ? 1 : 0
                const bWeight = b.optional ? 1 : 0
                return aWeight - bWeight
            })
            const statement = writer.makeMultiBranchCondition(orderedFields.map(it => {
                return {
                    expr: writer.makeNaryOp("&&", [
                        writer.makeString(`!duplicated_${it.name}`),
                        writer.makeString(`value?.hasOwnProperty("${it.name}")`)
                    ]),
                    stmt: writer.makeReturn(writer.makeString('true'))
                }
            }), writer.makeThrowError(`Can not discriminate value typeof ${name}`))
            writer.writeStatement(statement)
        })
    }

    protected writeArrayChecker(typeName: string) {
        const checkerName = generateTypeCheckerName(typeName)
        this.writer.writeMethodImplementation(new Method(
            checkerName,
            new NamedMethodSignature(Type.Boolean, [new Type('object|string|number|undefined|null')], ['value']),
            [MethodModifier.STATIC],
        ), writer => {
            writer.writeStatement(writer.makeReturn(writer.makeString(`Array.isArray(value)`)))
        })
    }
}

export function writeARKTSTypeCheckerFromDTS(library: PeerLibrary, printer: LanguageWriter) {
    const checker = new ARKTSTypeCheckerPrinter(library)
    checker.print()
    printer.concat(checker.writer)
}

export function writeTSTypeCheckerFromDTS(library: PeerLibrary, printer: LanguageWriter) {
    const checker = new TSTypeCheckerPrinter(library)
    checker.print()
    printer.concat(checker.writer)
}