import * as idl from "@idlizer/core/idl"
import { ImportFeature, ImportsCollector } from  "../ImportsCollector"
import {
    generateTypeCheckerName,
    Method,
    MethodModifier,
    NamedMethodSignature
} from "../LanguageWriters";
import { LanguageWriter, LayoutNodeRole, PeerLibrary, createDeclarationNameConvertor, isInCurrentModule, isInIdlize, isStringEnumType } from "@idlizer/core"
import { Language } from "@idlizer/core"
import { getExtAttribute, IDLBooleanType, isReferenceType } from "@idlizer/core/idl"
import { convertDeclaration, generateEnumToNumericName, generateEnumFromNumericName } from '@idlizer/core';
import { peerGeneratorConfiguration} from "../../DefaultConfiguration";
import { collectDeclItself, collectDeclDependencies } from '../ImportsCollectorUtils';
import { DependenciesCollector } from '../idl/IdlDependenciesCollector';
import { PrinterResult } from "../LayoutManager";
import { collectDeclarationTargets } from "../DeclarationTargetCollector";
import { isComponentDeclaration } from "../ComponentsCollector";

export function importTypeChecker(library: PeerLibrary, imports: ImportsCollector): void {
    collectDeclItself(library, idl.createReferenceType("TypeChecker"), imports)
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
    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        const decl = this.library.resolveTypeReference(type)
        if (decl && (idl.isInterface(decl))) this.onSyntheticDeclaration(decl)
        return super.convertTypeReferenceAsImport(type, importClause)
    }
    convertContainer(type: idl.IDLContainerType): idl.IDLEntry[] {
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
            : idl.getFQName(entry)
        if (!seenNames.has(name)) {
            seenNames.add(name)
            res.push(entry)
        }
    })
    for (const decl of collectDeclarationTargets(library)) {
        if (!idl.isEntry(decl))
            continue
        if (idl.isImport(decl) ||
            isInIdlize(decl)
        )
            continue
        if (peerGeneratorConfiguration().ignoreEntry(decl.name, library.language))
            continue
        if (peerGeneratorConfiguration().externalTypes.get(decl.name))
            continue
        syntheticCollector.convert(decl)
        const declName = idl.getFQName(decl)
        if ((idl.isInterface(decl) && decl.subkind != idl.IDLInterfaceSubkind.Tuple ||
            idl.isEnum(decl))
            && !seenNames.has(declName))
        {
            seenNames.add(declName)
            res.push(decl)
        }
    }
    for (const file of library.files) {
        for (const decl of idl.linearizeNamespaceMembers(file.entries)) {
            if (isComponentDeclaration(library, decl) && decl.name.endsWith('Interface'))
                continue
            if (idl.isImport(decl) ||
                isInIdlize(decl) ||
                !isInCurrentModule(decl)
            )
                continue
            if (peerGeneratorConfiguration().ignoreEntry(decl.name, library.language))
                continue
            if (peerGeneratorConfiguration().externalTypes.get(decl.name))
                continue
            syntheticCollector.convert(decl)
        }
    }
    return res
}

abstract class TypeCheckerPrinter {
    constructor(
        protected readonly library: PeerLibrary,
        public readonly imports: ImportsCollector,
        public readonly writer: LanguageWriter,
    ) {}

    protected writeImports(features: ImportFeature[]): void {
        this.imports.addFeature('KBoolean', '@koalaui/interop')
        this.imports.addFeature('KStringPtr', '@koalaui/interop')
        this.imports.addFeature('NativeBuffer', '@koalaui/interop')
        this.imports.addFeature('MaterializedBase', '@koalaui/interop')
        this.imports.addFeature('int32', '@koalaui/common')
        for (const feature of features) {
            this.imports.addFeature(feature.feature, feature.module)
        }
        for (const dep of collectTypeCheckDeclarations(this.library)) {
            if (idl.isContainerType(dep)) {
                dep.elementType.forEach(it => {
                    const resolved = idl.isReferenceType(it) ? this.library.resolveTypeReference(it) : undefined
                    if (resolved && idl.isEntry(resolved))
                        collectDeclItself(this.library, resolved, this.imports)
                })
            } else {
                collectDeclItself(this.library, dep, this.imports)
                collectDeclDependencies(this.library, dep, this.imports)
            }
        }
    }

    protected abstract writeIsNativeBuffer(): void
    protected abstract writeTypeInstanceOf(): void
    protected abstract writeTypeCast(): void

    protected abstract writeEnumNumeric(type: idl.IDLEnum): void
    protected abstract writeInterfaceChecker(name: string, descriptor: StructDescriptor, type?: idl.IDLType): void
    protected abstract writeArrayChecker(typeName: string, type: idl.IDLContainerType): void

    print() {
        const importFeatures: ImportFeature[] = []
        const declNameConvertor = createDeclarationNameConvertor(this.library.language)
        const interfaces: { name: string, type?: idl.IDLType, descriptor: StructDescriptor }[] = []
        const arrays: idl.IDLContainerType[] = []
        const enums: idl.IDLEnum[] = []
        collectTypeCheckDeclarations(this.library).forEach(decl => {
            if (idl.isContainerType(decl)) {
                arrays.push(decl)
            }
            if (idl.isEnum(decl)) {
                enums.push(decl)
            }
            if (idl.isEnum(decl) || idl.isInterface(decl)) {
                interfaces.push({
                    name: convertDeclaration(declNameConvertor, decl),
                    type: idl.createReferenceType(decl),
                    descriptor: makeStructDescriptor(this.library, decl)
                })
            }
        })

        interfaces.sort((a, b) => a.name.localeCompare(b.name))

        // Imports leads to error: "SyntaxError: Cannot find imported element 'TypeChecker'"
        // To resolve this error need to use the patched panda sdk(npm run panda:sdk:build) or remove './' from paths in arktsconfig.json
        this.writeImports(importFeatures)
        this.writer.writeClass("TypeChecker", writer => {
            this.writeTypeInstanceOf();
            this.writeTypeCast()
            this.writeIsNativeBuffer()
            for (const struct of interfaces)
                this.writeInterfaceChecker(struct.name, struct.descriptor, struct.type)
            for (const e of enums) {
                this.writeEnumNumeric(e)
            }
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
        super(library, new ImportsCollector(), library.createLanguageWriter(Language.ARKTS))
    }


    protected writeIsNativeBuffer(): void {
        let className = "NativeBuffer"
        this.writer.writeMethodImplementation(
            new Method("isNativeBuffer",
                new NamedMethodSignature(
                    idl.IDLBooleanType,
                    [idl.IDLObjectType], ["value"]),
                    [MethodModifier.STATIC]),
                       writer => {
                           writer.writeStatement(
                                writer.makeReturn(
                                    writer.makeString(`value instanceof ${className}`),
                                )
                            )
                        })
    }

    private writeInstanceofChecker(typeName: string,
                                   checkerName: string,
                                   fieldsCount: number,
                                   typeArguments: string[]) {
        const argsNames = Array.from({length: fieldsCount}, (_, index) => `arg${index}`)
        const argType = idl.createUnionType([
            idl.IDLObjectType,
            idl.IDLStringType,
            idl.IDLNumberType,
            idl.IDLUndefinedType,
        ])
        this.writer.writeMethodImplementation(new Method(
            checkerName,
            new NamedMethodSignature(IDLBooleanType,
                [argType, ...argsNames.map(_ => IDLBooleanType)],
                ['value', ...argsNames]),
            [MethodModifier.STATIC],
            typeArguments
        ), writer => {
            //TODO: hack for now
            typeName = typeName === "Callback"
                ? "Callback<void, void>"
                : typeName === "Array<T>"
                ? "Array"
                : typeName
            const statement = writer.makeReturn(writer.makeString(`value instanceof ${typeName}`))
            writer.writeStatement(statement)
        })
    }

    protected writeTypeInstanceOf(): void {
        this.writer.writeMethodImplementation(
            new Method("typeInstanceOf",
                new NamedMethodSignature(
                    idl.IDLBooleanType,
                    [idl.IDLObjectType, idl.IDLStringType], ["value", "prop"]),
                [MethodModifier.STATIC], ["T"]),
            writer => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(`value instanceof T`),
                    )
                )
            }
        )
    }

    protected writeTypeCast(): void {
        this.writer.writeMethodImplementation(
            new Method("typeCast",
                new NamedMethodSignature(
                    idl.createTypeParameterReference("T"),
                    [idl.IDLObjectType], ["value"]),
                [MethodModifier.STATIC], ["T"]),
            writer => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(`value as T`),
                    )
                )
            }
        )
    }

    protected writeEnumNumeric(type: idl.IDLEnum): void {
        this.writer.writeMethodImplementation(
            new Method(generateEnumToNumericName(type),
                new NamedMethodSignature(
                    idl.IDLI32Type,
                    [idl.createReferenceType(type)], ["value"]),
                [MethodModifier.STATIC]),
            writer => {
                isPassedByOrdinalEnum(type)
                    ? writer.writeStatement(
                        writer.makeReturn(writer.makeString(`value.getOrdinal()`))
                    )
                    : writer.writeStatement(
                        writer.makeReturn(writer.makeString(`value.valueOf()`))
                    )
            }
        )
        const enumName = this.writer.getNodeName(type)
        this.writer.writeMethodImplementation(
            new Method(generateEnumFromNumericName(type),
                new NamedMethodSignature(
                    idl.createReferenceType(type),
                    [idl.IDLI32Type], ["ordinal"]),
                [MethodModifier.STATIC]),
            writer => {
                isPassedByOrdinalEnum(type)
                    ? writer.writeStatement(
                        writer.makeReturn(writer.makeString(`${enumName}.values()[ordinal]`))
                    )
                    : writer.writeStatement(
                        writer.makeReturn(writer.makeString(`${enumName}.fromValue(ordinal)`))
                    )
            }
        )
    }

    protected writeInterfaceChecker(name: string, descriptor: StructDescriptor): void {
        this.writeInstanceofChecker(name, generateTypeCheckerName(name), descriptor.getFields().length, [])
    }

    protected writeArrayChecker(typeName: string, type: idl.IDLContainerType): void {
        const typeArguments = type.elementType
            .filter((it): it is idl.IDLReferenceType => isReferenceType(it))
            .flatMap(it => it.typeArguments ?? [])
            .map(it => this.writer.getNodeName(it))
        this.writeInstanceofChecker('Array', generateTypeCheckerName(typeName), 0, typeArguments)
    }
}

class TSTypeCheckerPrinter extends TypeCheckerPrinter {
    constructor(
        library: PeerLibrary
    ) {
        super(library, new ImportsCollector(), library.createLanguageWriter(Language.TS))
    }

    protected writeTypeInstanceOf(): void {
        this.writer.writeMethodImplementation(
            new Method("typeInstanceOf",
                new NamedMethodSignature(
                    idl.IDLBooleanType,
                    [idl.IDLObjectType, idl.IDLStringType], ["value", "prop"]),
                [MethodModifier.STATIC], ["T"]),
            writer => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(`value.hasOwnProperty(prop)`),
                    )
                )
            }
        )
    }

    protected writeIsNativeBuffer(): void {
        let className = "ArrayBuffer"
        this.writer.writeMethodImplementation(
            new Method("isNativeBuffer",
                new NamedMethodSignature(
                    idl.IDLBooleanType,
                    [idl.IDLObjectType], ["value"]),
                    [MethodModifier.STATIC]),
                       writer => {
                           writer.writeStatement(
                                writer.makeReturn(
                                    writer.makeString(`value instanceof ${className}`),
                                )
                            )
                        })
    }



    protected writeTypeCast(): void {
        this.writer.writeMethodImplementation(
            new Method("typeCast",
                new NamedMethodSignature(
                    idl.createReferenceType("T"),
                    [idl.IDLObjectType], ["value"]),
                [MethodModifier.STATIC], ["T"]),
            writer => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(`value as unknown as T`),
                    )
                )
            }
        )
    }

    protected writeEnumNumeric(type: idl.IDLEnum): void {
        this.writer.writeMethodImplementation(
            new Method(generateEnumToNumericName(type),
                new NamedMethodSignature(
                    idl.IDLI32Type,
                    [idl.createReferenceType(type)], ["value"]),
                [MethodModifier.STATIC]),
            writer => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(`value as int32`),
                    )
                )
            }
        )
        this.writer.writeMethodImplementation(
            new Method(generateEnumFromNumericName(type),
                new NamedMethodSignature(
                    idl.createReferenceType(type),
                    [idl.IDLI32Type], ["ordinal"]),
                [MethodModifier.STATIC]),
            writer => {
                writer.writeStatement(
                    writer.makeReturn(
                        writer.makeString(`ordinal as ${this.writer.getNodeName(type)}`),
                    )
                )
            }
        )
    }

    protected writeInterfaceChecker(name: string, descriptor: StructDescriptor, type: idl.IDLType): void {
        const typeName = this.library.mapType(type)
        const argsNames = descriptor.getFields().map(it => `duplicated_${it.name}`)
        const argType = idl.createUnionType([
            idl.IDLObjectType,
            idl.IDLStringType,
            idl.IDLNumberType,
            idl.IDLUndefinedType,
            idl.IDLBooleanType,
        ])
        this.writer.writeMethodImplementation(new Method(
            generateTypeCheckerName(name),
            new NamedMethodSignature(IDLBooleanType,
                [argType, ...argsNames.map(_ => IDLBooleanType)],
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
        const argType = idl.createUnionType([
            idl.IDLObjectType,
            idl.IDLStringType,
            idl.IDLNumberType,
            idl.IDLUndefinedType,
        ])
        this.writer.writeMethodImplementation(new Method(
            checkerName,
            new NamedMethodSignature(IDLBooleanType, [argType], ['value']),
            [MethodModifier.STATIC],
        ), writer => {
            writer.writeStatement(writer.makeReturn(writer.makeString(`Array.isArray(value)`)))
        })
    }
}

export function printTSTypeChecker(library: PeerLibrary): PrinterResult[] {
    const checker = new TSTypeCheckerPrinter(library)
    checker.print()
    return [{
        over: {
            node: library.resolveTypeReference(idl.createReferenceType('TSTypeChecker')) as idl.IDLEntry,
            role: LayoutNodeRole.PEER
        },
        collector: checker.imports,
        content: checker.writer,
    }]
}

export function printArkTSTypeChecker(library: PeerLibrary): PrinterResult[] {
    const checker = new ARKTSTypeCheckerPrinter(library)
    checker.print()
    return [{
        over: {
            node: library.resolveTypeReference(idl.createReferenceType('ArkTSTypeChecker')) as idl.IDLEntry,
            role: LayoutNodeRole.PEER
        },
        collector: checker.imports,
        content: checker.writer,
    }]
}

function isPassedByOrdinalEnum(type: idl.IDLEnum): boolean {
    return idl.isStringEnum(type)
}