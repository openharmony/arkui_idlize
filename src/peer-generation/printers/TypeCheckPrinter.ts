import * as idl from "@idlize/core/idl"
import { ImportFeature, ImportsCollector } from "../ImportsCollector";
import {
    createLanguageWriter,
    generateTypeCheckerName,
    LanguageExpression,
    LanguageWriter,
    Method,
    MethodModifier,
    NamedMethodSignature
} from "../LanguageWriters";
import { PeerLibrary } from "../PeerLibrary";
import { createDeclarationNameConvertor } from "../idl/IdlNameConvertor";
import { Language } from "@idlize/core"
import { getExtAttribute, IDLBooleanType, isReferenceType } from "@idlize/core/idl"
import { getReferenceResolver } from '../ReferenceResolver';
import { convertDeclaration } from '@idlize/core';
import { PeerGeneratorConfig } from "../PeerGeneratorConfig";
import { collectDeclItself, collectDeclDependencies } from '../ImportsCollectorUtils';
import { DependenciesCollector } from '../idl/IdlDependenciesCollector';
import { isPredefined } from '../idl/IdlPeerGeneratorVisitor';

const builtInInterfaceTypes = new Map<string,
    (writer: LanguageWriter, value: string) => LanguageExpression>([
        ["Object",
            (writer: LanguageWriter, value: string) => writer.makeCallIsObject(value)],
        ["ArrayBuffer",
            (writer: LanguageWriter, value: string) => writer.makeCallIsArrayBuffer(value)],
        ["Resource",
            (writer: LanguageWriter, value: string) => writer.makeCallIsResource(value)],
    ])

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

function collectFields(library: PeerLibrary, target: idl.IDLInterface, struct: StructDescriptor): void {
    //TODO: is it need to collect conflicting declarations properties?
    // if (library.conflictedDeclarations.has(target)) {
    //     return
    // }

    //TODO: is recursive property collection necessary?
    // const superType = idl.getSuperType(target)
    // if (superType && idl.isReferenceType(superType)) {
    //     const decl = library.resolveTypeReference(superType) ?? throwException(`Wrong type reference ${idl.IDLKind[superType.kind]}`)
    //     if ((idl.isInterface(decl) || idl.isClass(decl) || idl.isAnonymousInterface(decl))) {
    //         collectFields(library, decl, struct)
    //     }
    // }

    target.properties?.filter(it => !it.isStatic).forEach(it => {
        struct.addField(new FieldRecord(it.type, it.name, it.isOptional))
    })
}

function makeStructDescriptor(library: PeerLibrary, target: idl.IDLEntry): StructDescriptor {
    const result = new StructDescriptor()
    if (idl.isInterface(target)
        || idl.isSyntheticEntry(target)) {
        collectFields(library, target as idl.IDLInterface, result)
    }
    return result
}

class TypeCheckSyntheticCollector extends DependenciesCollector {
    constructor(
        library: PeerLibrary,
        private readonly onSyntheticDeclaration: (entry: idl.IDLInterface | idl.IDLContainerType) => void,
    ) {
        super(library)
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLNode[] {
        const decl = this.library.resolveTypeReference(type)
        if (decl && (idl.isInterface(decl))) this.onSyntheticDeclaration(decl)
        return super.convertImport(type, importClause)
    }
    convertContainer(type: idl.IDLContainerType): idl.IDLNode[] {
        if (idl.IDLContainerUtils.isSequence(type))
            this.onSyntheticDeclaration(type)
        return super.convertContainer(type)
    }
}

function collectTypeCheckDeclarations(library: PeerLibrary): (idl.IDLInterface | idl.IDLEnum | idl.IDLContainerType)[] {
    const seenNames = new Set<string>()
    const res = new Array<idl.IDLInterface | idl.IDLEnum | idl.IDLContainerType>()
    const syntheticCollector = new TypeCheckSyntheticCollector(library, (entry) => {
        const name = idl.isContainerType(entry)
            ? library.getInteropName(entry)
            : entry.name
        if (!seenNames.has(name)) {
            seenNames.add(name)
            res.push(entry)
        }
    })
    for (const file of library.files) {
        for (const decl of file.entries) {
            if (idl.isModuleType(decl) ||
                idl.isPackage(decl) ||
                idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.GlobalScope) ||
                isPredefined(decl))
                continue
            if (PeerGeneratorConfig.ignoreEntry(decl.name, library.language))
                continue
            syntheticCollector.convert(decl)
            if ((idl.isInterface(decl) && decl.subkind != idl.IDLInterfaceSubkind.Tuple ||
                idl.isEnum(decl))
                && !seenNames.has(decl.name)) {
                seenNames.add(decl.name)
                res.push(decl)
            }
        }
    }
    return res
}

abstract class TypeCheckerPrinter {
    constructor(
        protected readonly library: PeerLibrary,
        public readonly writer: LanguageWriter,
    ) {}

    protected writeImports(features: ImportFeature[]): void {
        const imports = new ImportsCollector()
        imports.addFeature('KBoolean', '@koalaui/interop')
        imports.addFeature('KStringPtr', '@koalaui/interop')
        imports.addFeature('NativeBuffer', '@koalaui/interop')
        for (const feature of features) {
            imports.addFeature(feature.feature, feature.module)
        }
        for (const dep of collectTypeCheckDeclarations(this.library)) {
            if (idl.isContainerType(dep))
                continue
            collectDeclItself(this.library, dep, imports)
            collectDeclDependencies(this.library, dep, imports)
        }
        imports.print(this.writer, 'arkts/type_check')
    }
    protected abstract writeInterfaceChecker(name: string, descriptor: StructDescriptor, type?: idl.IDLType): void
    protected abstract writeArrayChecker(typeName: string, type: idl.IDLContainerType): void

    print() {
        const importFeatures: ImportFeature[] = []
        const declNameConvertor = createDeclarationNameConvertor(this.library.language)
        const interfaces: { name: string, type?: idl.IDLType, descriptor: StructDescriptor }[] = []
        const arrays: idl.IDLContainerType[] = []
        collectTypeCheckDeclarations(this.library).forEach(decl => {
            if (idl.isContainerType(decl)) {
                arrays.push(decl)
            } else {
                interfaces.push({
                    name: convertDeclaration(declNameConvertor, decl),
                    type: idl.createReferenceType(decl.name),
                    descriptor: makeStructDescriptor(this.library, decl)
                })
            }
        })

        interfaces.sort((a, b) => a.name.localeCompare(b.name))

        // Imports leads to error: "SyntaxError: Cannot find imported element 'TypeChecker'"
        // To resolve this error need to use the patched panda sdk(npm run panda:sdk:build) or remove './' from paths in arktsconfig.json
        this.writeImports(importFeatures)
        this.writer.writeClass("TypeChecker", writer => {
            for (const struct of interfaces)
                this.writeInterfaceChecker(struct.name, struct.descriptor, struct.type)
            for (const array of arrays) {
                const name = this.library.getInteropName(array)
                this.writeArrayChecker(name, array)
            }
        })
    }
}

class ARKTSTypeCheckerPrinter extends TypeCheckerPrinter {
    constructor(
        library: PeerLibrary
    ) {
        super(library, createLanguageWriter(Language.ARKTS, getReferenceResolver(library)))
    }

    private writeInstanceofChecker(typeName: string,
                                   checkerName: string,
                                   fieldsCount: number,
                                   typeArguments: string[]) {
        const argsNames = Array.from({length: fieldsCount}, (_, index) => `arg${index}`)
        this.writer.writeMethodImplementation(new Method(
            checkerName,
            new NamedMethodSignature(IDLBooleanType,
                [idl.createReferenceType('object|string|number|undefined|null'), ...argsNames.map(_ => IDLBooleanType)],
                ['value', ...argsNames]),
            [MethodModifier.STATIC],
            typeArguments
        ), writer => {
            //TODO: hack for now
            typeName = typeName === "Callback" ? "Callback<void, void>" : typeName
            const statement = writer.makeReturn(writer.makeString(`value instanceof ${typeName}`))
            writer.writeStatement(statement)
        })
    }

    protected writeInterfaceChecker(name: string, descriptor: StructDescriptor): void {
        this.writeInstanceofChecker(name, generateTypeCheckerName(name), descriptor.getFields().length, [])
    }

    protected writeArrayChecker(typeName: string, type: idl.IDLContainerType): void {
        const typeArguments = type.elementType
            .filter((it): it is idl.IDLReferenceType => isReferenceType(it))
            .flatMap(it => it.typeArguments ?? [])
            .map(it => this.writer.getNodeName(it))
        this.writeInstanceofChecker(this.writer.getNodeName(type), generateTypeCheckerName(typeName), 0, typeArguments)
    }
}

class TSTypeCheckerPrinter extends TypeCheckerPrinter {
    constructor(
        library: PeerLibrary
    ) {
        super(library, createLanguageWriter(Language.TS, getReferenceResolver(library)))
    }

    protected writeInterfaceChecker(name: string, descriptor: StructDescriptor, type: idl.IDLType): void {
        const typeName = this.library.mapType(type)
        const argsNames = descriptor.getFields().map(it => `duplicated_${it.name}`)
        this.writer.writeMethodImplementation(new Method(
            generateTypeCheckerName(name),
            new NamedMethodSignature(IDLBooleanType,
                [idl.createReferenceType('object|string|number|undefined|null|boolean'), ...argsNames.map(_ => IDLBooleanType)],
                ['value', ...argsNames]),
            [MethodModifier.STATIC],
        ), writer => {
            const orderedFields = Array.from(descriptor.getFields()).sort((a, b) => {
                const aWeight = a.optional ? 1 : 0
                const bWeight = b.optional ? 1 : 0
                return aWeight - bWeight
            })

            const throwErrorStatement = writer.makeThrowError(`Can not discriminate value typeof ${typeName}`)
            let checkStatement = throwErrorStatement
            if (orderedFields.length > 0) {
                 checkStatement = writer.makeMultiBranchCondition(orderedFields.map(it => {
                    return {
                        expr: writer.makeNaryOp("&&", [
                            writer.makeString(`!duplicated_${it.name}`),
                            writer.makeString(`value?.hasOwnProperty("${it.name}")`)
                        ]),
                        stmt: writer.makeReturn(writer.makeString('true'))
                    }
                }), throwErrorStatement)
            } else if (isReferenceType(type)) {
                const resolved = this.library.resolveTypeReference(type)
                if (resolved !== undefined && idl.isEnum(resolved)) {
                    checkStatement = writer.makeMultiBranchCondition(resolved.elements.map(it => {
                        const origMemName = getExtAttribute(it, idl.IDLExtendedAttributes.OriginalEnumMemberName)
                        const memberName = origMemName !== undefined ? origMemName : it.name
                        return {
                            expr: writer.makeNaryOp("&&", [
                                writer.makeNaryOp("===", [
                                    writer.makeString("value"),
                                    writer.makeString(`${name}.${memberName}`)
                                ])
                            ]),
                            stmt: writer.makeReturn(writer.makeString("true"))
                        }
                    }), throwErrorStatement)
                }
            }
            writer.writeStatement(checkStatement)
        })
    }

    protected writeArrayChecker(typeName: string, type: idl.IDLContainerType) {
        const checkerName = generateTypeCheckerName(typeName)
        this.writer.writeMethodImplementation(new Method(
            checkerName,
            new NamedMethodSignature(IDLBooleanType, [idl.createReferenceType('object|string|number|undefined|null')], ['value']),
            [MethodModifier.STATIC],
        ), writer => {
            writer.writeStatement(writer.makeReturn(writer.makeString(`Array.isArray(value)`)))
        })
    }
}

export function writeARKTSTypeCheckers(library: PeerLibrary, printer: LanguageWriter) {
    const checker = new ARKTSTypeCheckerPrinter(library)
    checker.print()
    printer.concat(checker.writer)
}

export function writeTSTypeCheckers(library: PeerLibrary, printer: LanguageWriter) {
    const checker = new TSTypeCheckerPrinter(library)
    checker.print()
    printer.concat(checker.writer)
}