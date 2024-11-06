import * as idl from '../../idl'
import { ImportFeature, ImportsCollector } from "../ImportsCollector";
import { createLanguageWriter, generateTypeCheckerName, LanguageExpression, LanguageWriter, Method, MethodModifier, NamedMethodSignature, StringExpression } from "../LanguageWriters";
import { throwException } from "../../util";
import { IdlPeerLibrary } from "../idl/IdlPeerLibrary";
import { convertDeclToFeature } from "../idl/IdlPeerGeneratorVisitor";
import { getSyntheticDeclarationList } from "../idl/IdlSyntheticDeclarations";
import { PeerLibrary } from "../PeerLibrary";
import {
    DeclarationNameConvertor
} from "../idl/IdlNameConvertor";
import { convertDeclaration } from "../LanguageWriters/typeConvertor";
import { Language } from "../../Language";
import { IDLBooleanType, IDLType, toIDLType } from "../../idl";
import { getReferenceResolver } from '../ReferenceResolver';

const builtInInterfaceTypes = new Map<string,
    (writer: LanguageWriter, value: string) => LanguageExpression>([
        ["Object",
            (writer: LanguageWriter, value: string) => writer.makeCallIsObject(value)],
        ["ArrayBuffer",
            (writer: LanguageWriter, value: string) => writer.makeCallIsArrayBuffer(value)],
        ["Resource",
            (writer: LanguageWriter, value: string) => writer.makeCallIsResource(value)],
    ])

export function importTypeChecker(library: IdlPeerLibrary, imports: ImportsCollector): void {
    imports.addFeature("TypeChecker", "#components")
}

export function makeEnumTypeCheckerCall(valueAccessor: string, enumName: string, writer: LanguageWriter): LanguageExpression {
    return writer.makeMethodCall(
        "TypeChecker",
        generateTypeCheckerName(enumName),
        [writer.makeString(valueAccessor)]
    )
}

class FieldRecord {
    constructor(public type: idl.IDLType, public name: string, public optional: boolean = false) { }
}

class StructDescriptor {
    private fields: FieldRecord[] = []
    private seenFields = new Set<string>()
    addField(field: FieldRecord) {
        if (!this.seenFields.has(field.name)) {
            this.seenFields.add(field.name)
            this.fields.push(field)
        }
    }
    getFields(): readonly FieldRecord[] {
        return this.fields
    }
}

function collectFields(library: IdlPeerLibrary, target: idl.IDLInterface, struct: StructDescriptor): void {
    const superType = idl.getSuperType(target)
    if (superType && idl.isReferenceType(superType)) {
        const decl = library.resolveTypeReference(superType) ?? throwException(`Wrong type reference ${idl.IDLKind[superType.kind]}`)
        if ((idl.isInterface(decl) || idl.isClass(decl) || idl.isAnonymousInterface(decl))) {
            collectFields(library, decl, struct)
        }
    }

    target.properties?.filter(it => !it.isStatic).forEach(it => {
        struct.addField(new FieldRecord(it.type, it.name, it.isOptional))
    })
}

function makeStructDescriptor(library: IdlPeerLibrary, target: idl.IDLInterface): StructDescriptor {
    const result = new StructDescriptor()
    collectFields(library, target, result)
    return result
}

abstract class TypeCheckerPrinter {
    constructor(
        protected readonly library: IdlPeerLibrary,
        public readonly writer: LanguageWriter,
    ) {}

    protected writeImports(features: ImportFeature[]): void {
        const imports = new ImportsCollector()
        imports.addFeature('KBoolean', '@koalaui/interop')
        imports.addFeature('KStringPtr', '@koalaui/interop')
        for (const feature of features) {
            imports.addFeature(feature.feature, feature.module)
        }
        for (const file of this.library.files)
            for (const feature of file.serializeImportFeatures)
                imports.addFeature(feature.feature, feature.module)
        imports.print(this.writer, 'arkts/type_check')
    }
    protected abstract writeInterfaceChecker(name: string, descriptor: StructDescriptor): void
    protected abstract writeArrayChecker(typeName: string, type: idl.IDLType): void

    print() {
        const importFeatures: ImportFeature[] = []
        const interfaces: { name: string, descriptor: StructDescriptor }[] = []

        const seenNames = new Set<string>()
        for (const file of this.library.files) {
            for (const decl of file.declarations) {
                if ((idl.isInterface(decl) || idl.isAnonymousInterface(decl)) && !seenNames.has(decl.name)) {
                    seenNames.add(decl.name)
                    importFeatures.push(convertDeclToFeature(this.library, decl))
                    interfaces.push({
                        name: convertDeclaration(DeclarationNameConvertor.I, decl),
                        descriptor: makeStructDescriptor(this.library, decl)
                    })
                }
            }
        }

        // Collecting of synthetic types. This is necessary for the arkts
        getSyntheticDeclarationList()
            .filter(idl.isInterface)
            .forEach(it => {
                importFeatures.push(convertDeclToFeature(this.library, it))
                interfaces.push({
                    name: convertDeclaration(DeclarationNameConvertor.I, it),
                    descriptor: makeStructDescriptor(this.library, it)
                })
        })

        interfaces.sort((a, b) => a.name.localeCompare(b.name))

        // Imports leads to error: "SyntaxError: Cannot find imported element 'TypeChecker'"
        // To resolve this error need to use the patched panda sdk(npm run panda:sdk:build) or remove './' from paths in arktsconfig.json
        this.writeImports(importFeatures)
        this.writer.writeClass("TypeChecker", writer => {
            for (const struct of interfaces)
                this.writeInterfaceChecker(struct.name, struct.descriptor)

            const arrayTypes = Array.from(this.library.seenArrayTypes).sort((a, b) => a[0].localeCompare(b[0]))
            const processed: Set<string> = new Set()
            for (const [alias, type] of arrayTypes) {
                if (processed.has(alias)) {
                    continue
                }
                this.writeArrayChecker(alias, type)
                processed.add(alias)
            }
        })
    }
}

class ARKTSTypeCheckerPrinter extends TypeCheckerPrinter {
    constructor(
        library: IdlPeerLibrary
    ) {
        super(library, createLanguageWriter(Language.ARKTS, getReferenceResolver(library)))
    }

    private writeInstanceofChecker(typeName: string, checkerName: string, fieldsCount: number) {
        const argsNames = Array.from({length: fieldsCount}, (_, index) => `arg${index}`)
        this.writer.writeMethodImplementation(new Method(
            checkerName,
            new NamedMethodSignature(IDLBooleanType, 
                [toIDLType('object|string|number|undefined|null'), ...argsNames.map(_ => IDLBooleanType)], 
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

    protected writeArrayChecker(typeName: string, type: idl.IDLType): void {
        this.writeInstanceofChecker(this.library.mapType(type), generateTypeCheckerName(typeName), 0)
    }
}

class TSTypeCheckerPrinter extends TypeCheckerPrinter {
    constructor(
        library: IdlPeerLibrary
    ) {
        super(library, createLanguageWriter(Language.TS, getReferenceResolver(library)))
    }

    protected writeInterfaceChecker(name: string, descriptor: StructDescriptor): void {
        if (descriptor.getFields().length === 0)
            return
        const argsNames = descriptor.getFields().map(it => `duplicated_${it.name}`)
        this.writer.writeMethodImplementation(new Method(
            generateTypeCheckerName(name),
            new NamedMethodSignature(IDLBooleanType, 
                [toIDLType('object|string|number|undefined|null'), ...argsNames.map(_ => IDLBooleanType)], 
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

    protected writeArrayChecker(typeName: string, type: idl.IDLType) {
        const checkerName = generateTypeCheckerName(typeName)
        this.writer.writeMethodImplementation(new Method(
            checkerName,
            new NamedMethodSignature(IDLBooleanType, [toIDLType('object|string|number|undefined|null')], ['value']),
            [MethodModifier.STATIC],
        ), writer => {
            writer.writeStatement(writer.makeReturn(writer.makeString(`Array.isArray(value)`)))
        })
    }
}

export function writeARKTSTypeCheckers(library: IdlPeerLibrary, printer: LanguageWriter) {
    const checker = new ARKTSTypeCheckerPrinter(library)
    checker.print()
    printer.concat(checker.writer)
}

export function writeTSTypeCheckers(library: IdlPeerLibrary, printer: LanguageWriter) {
    const checker = new TSTypeCheckerPrinter(library)
    checker.print()
    printer.concat(checker.writer)
}