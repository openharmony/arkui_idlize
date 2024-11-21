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

import * as idl from "../../idl"
import { posix as path } from "path"
import { isImport, isStringEnum } from '../../peer-generation/idl/common';
import { DeclarationNameConvertor } from "../../peer-generation/idl/IdlNameConvertor"
import { ImportsCollector } from "../../peer-generation/ImportsCollector";
import { capitalize, isDefined, throwException } from "../../util";
import { PrimitiveType } from "../../peer-generation/ArkPrimitiveType";
import { cleanPrefix } from "../../peer-generation/PeerLibrary";
import { WrapperClass, WrapperField, WrapperMethod } from "../WrapperClass";
import { Skoala } from "../utils";
import { Field, FieldModifier, LanguageExpression, LanguageStatement, LanguageWriter, Method, MethodModifier, NamedMethodSignature } from "../../peer-generation/LanguageWriters";
import { ArgConvertor, BaseArgConvertor, BooleanConvertor, ClassConvertor, CustomTypeConvertor, EnumConvertor, ExpressionAssigneer, InterfaceConvertor, NullConvertor, NumberConvertor, RetConvertor, RuntimeType, StringConvertor, TypeAliasConvertor, UndefinedConvertor, UnionConvertor } from "../../peer-generation/ArgConvertors";
import { CustomPrintVisitor } from "../../from-idl/DtsPrinter";
import { Language } from "../../Language";
import { addSyntheticType, resolveSyntheticType } from "../../from-idl/deserialize";
import { convertDeclaration, convertType, DeclarationConvertor, IdlNameConvertor, TypeConvertor } from "../../peer-generation/LanguageWriters/nameConvertor";
import { LibraryInterface } from "../../LibraryInterface";
import { generateSyntheticFunctionName } from "../../IDLVisitor";
import { IDLNodeToStringConvertor } from "../../peer-generation/LanguageWriters/convertors/InteropConvertor";
import { IdlEntryManager } from "../../peer-generation/idl/IdlEntryManager";
import { DependenciesCollector } from "../../peer-generation/idl/IdlDependenciesCollector";

export class IldSkoalaFile {
    readonly wrapperClasses: Map<string, [WrapperClass, any|undefined]> = new Map()
    readonly baseName: string
    readonly importsCollector: ImportsCollector
    readonly declarations: Set<idl.IDLEntry>

    constructor(
        public readonly originalFilename: string,
        declarations?: idl.IDLEntry[]

    ) {
        this.baseName = path.basename(this.originalFilename)
        this.importsCollector = new ImportsCollector()
        this.declarations = declarations ? new Set(declarations) : new Set()
    }

    addImportFeature(module: string, ...features: string[]) {
        this.importsCollector.addFeatures(features, module)
    }
}

export class IdlSkoalaLibrary implements LibraryInterface {
    public readonly serializerDeclarations: Set<idl.IDLInterface> = new Set()
    readonly nameConvertorInstance: IdlNameConvertor = new TSSkoalaTypeNameConvertor(this)
    readonly interopNameConvertorInstance: IdlNameConvertor = new IDLNodeToStringConvertor(this)
    readonly importTypesStubToSource: Map<string, string> = new Map()
    readonly typeMap = new Map<idl.IDLType, [idl.IDLNode, boolean]>()
    public name: string = ""

    public language = Language.TS

    public readonly files: IldSkoalaFile[] = []
    findFileByOriginalFilename(filename: string): IldSkoalaFile | undefined {
        return this.files.find(it => it.originalFilename === filename)
    }

    get libraryPrefix(): string {
        return this.name
    }

    getCurrentContext(): string | undefined {
        return ""
    }

    get factory(): IdlEntryManager {
        throw new Error("Method not implemented.");
    }

    isComponentDeclaration(iface: idl.IDLInterface): boolean {
        throw new Error("Method not implemented.");
    }

    requestType(type: idl.IDLType, useToGenerate: boolean) {
        let declaration = this.typeMap.get(type)
        if (declaration) {
            declaration[1] ||= useToGenerate
            return
        }
        const decl = this.toDeclaration(type)
        this.typeMap.set(type, [decl, useToGenerate])
    }

    toDeclaration(type: idl.IDLType | idl.IDLTypedef | idl.IDLCallback | idl.IDLEnum | idl.IDLInterface): idl.IDLNode {
        switch (type) {
            case idl.IDLAnyType: return CustomObject
            case idl.IDLNullType:
            case idl.IDLVoidType: return idl.IDLUndefinedType
            case idl.IDLVoidType: return idl.IDLVoidType
            case idl.IDLUndefinedType: return idl.IDLUndefinedType
            case idl.IDLUnknownType: return CustomObject
            case idl.IDLObjectType: return CustomObject
        }
        if (isImport(type))
            return CustomObject
        if (idl.isReferenceType(type)) {
            if (type.name == 'Function') {
                return Function
            }
            if (type.name == 'Optional') {
                const wrappedType = idl.toIDLType(idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)!)
                return this.toDeclaration(wrappedType)
            }
            const decl = this.resolveTypeReference(type)
            return !decl ? CustomObject  // assume some builtin type
                : idl.isCallback(decl) ? Function
                : idl.isTypedef(decl) ? this.toDeclaration(decl.type)
                : decl
        }
        return type
    }

    getNodeName(node: idl.IDLNode): string {
        return this.interopNameConvertorInstance.convert(node)
    }
    getEntryName(node: idl.IDLEntry): string {
        return this.interopNameConvertorInstance.convert(node)
    }
    getTypeName(type: idl.IDLType): string {
       return this.interopNameConvertorInstance.convert(type)
    }
    getInteropName(node: idl.IDLNode): string {
        return this.interopNameConvertorInstance.convert(node)
    }

    mapType(type: idl.IDLType | idl.IDLCallback | undefined): string {
        return this.nameConvertorInstance.convert(type ?? idl.IDLVoidType)
    }

    typeConvertor(param: string, type: idl.IDLType, isOptionalParam = false, maybeCallback: boolean = false, processor?: IdlWrapperProcessor): ArgConvertor {
        if (idl.isPrimitiveType(type)) {
            switch (type) {
                case idl.IDLAnyType: return new CustomTypeConvertor(param, "Any")
                case idl.IDLBooleanType: return new BooleanConvertor(param)
                case idl.IDLStringType: return new StringConvertor(param)
                case idl.IDLNullType: return new NullConvertor(param)
                case idl.IDLBigintType:
                case idl.IDLNumberType: return new NumberConvertor(param)
                case idl.IDLUndefinedType:
                case idl.IDLVoidType: return new UndefinedConvertor(param)
                default: throw new Error(`Unconverted ${type}`)
            }
        }

        if (idl.isUnionType(type)) {
            return new UnionConvertor(this, param, type)
        }

        if (idl.isReferenceType(type)) {
            if (type == idl.IDLObjectType)
                return new CustomTypeConvertor(param, "Object")
            if (isImport(type)) {
                // return new ImportTypeConvertor(param, type)
                console.log('todo: type converter for import')
            }
        }

        if (idl.isReferenceType(type)) {
            const decl = this.resolveTypeReference(type)
            return this.declarationConvertor(param, type, decl, maybeCallback, processor)
        }
        return new CustomTypeConvertor(param, this.nameConvertorInstance.convert(type))
    }

    declarationConvertor(param: string, type: idl.IDLReferenceType,
        declaration: idl.IDLEntry | undefined, maybeCallback: boolean = false, processor?: IdlWrapperProcessor): ArgConvertor
    {
        if (!declaration)
            return new CustomTypeConvertor(param, type.name, false, type.name) // assume some predefined type

        const declarationName = declaration.name!

        if (idl.isEnum(declaration)) {
            return new EnumConvertor(param, declaration, isStringEnum(declaration))
        }

        if (idl.isEnumMember(declaration)) {
            return new EnumConvertor(param, declaration.parent, isStringEnum(declaration.parent))
        }

        if (idl.isInterface(declaration)) {
            if (processor?.isWrapper(declaration)) {
                return new IdlWrapperClassConvertor(declarationName, param, this, declaration)
            }
            return new InterfaceConvertor(this, declarationName, param, declaration)
        }
        if (idl.isClass(declaration)) {
            if (processor?.isWrapper(declaration)) {
                return new IdlWrapperClassConvertor(declarationName, param, this, declaration)
            }
            return new ClassConvertor(this, declarationName, param, declaration)
        }
        if (idl.isTypedef(declaration)) {
            return new TypeAliasConvertor(this, param, declaration)
        }

        console.log('todo: custom converter', type.name, declaration.name);
        return new CustomTypeConvertor(param, type.name, false, type.name)
    }

    ///

    resolveTypeReference(type: idl.IDLReferenceType, entries?: idl.IDLEntry[]): idl.IDLEntry | undefined {
        // let wrapperClassEntries: idl.IDLEntry[] = this.files.map(it => it.wrapperClasses.get(type.name)?.[1] as idl.IDLEntry).filter(it => !!it)
        let wrapperClassEntries = this.files.flatMap(f => f.wrapperClasses.get(type.name)?.[1]).filter(isDefined)
        entries ??= [...this.files.flatMap(it => [...it.declarations]), ...wrapperClassEntries]

        const [qualifier, typeName] = idl.decomposeQualifiedName(type)
        if (qualifier) {
            // This is a namespace or enum member. Try enum first
            const parent = entries.find(it => it.name === qualifier)
            if (parent && idl.isEnum(parent))
                return parent.elements.find(it => it.name === type.name)
            // Else try namespaces
            return entries.find(it =>
                it.name === typeName && idl.getExtAttribute(it, idl.IDLExtendedAttributes.Namespace) === qualifier)
        }

        const candidates = entries.filter(it => type.name === it.name)
        return candidates.length == 1
            ? candidates[0]
            : candidates.find(it => !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Import))
    }

    createContinuationCallbackReference(continuationType: idl.IDLType): idl.IDLReferenceType {
        if (idl.isContainerType(continuationType) && idl.IDLContainerUtils.isPromise(continuationType))
            return this.createContinuationCallbackReference(continuationType.elementType[0])
        const continuationParameters = idl.isVoidType(continuationType) ? [] : [idl.createParameter('value', continuationType)]
        const syntheticName = generateSyntheticFunctionName(
            continuationParameters,
            idl.IDLVoidType,
        )
        return idl.createReferenceType(syntheticName)
    }
}

export class IdlWrapperClassConvertor extends BaseArgConvertor {
    // TODO:
    constructor(
        name: string,
        param: string,
        protected table: IdlSkoalaLibrary,
        private type: idl.IDLInterface
    ) {
        super(idl.toIDLType(name), [RuntimeType.OBJECT], false, true, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeWrapper", [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const prefix = writer.language === Language.CPP ? PrimitiveType.Prefix : ""
        const readStatement = writer.makeCast(
            writer.makeMethodCall(`${deserializerName}`, `readWrapper`, []),
            idl.toIDLType(`${prefix}${this.type.name}`)
        )
        return assigneer(readStatement)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType('Materialized')
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
            [writer.makeString(`${value} instanceof ${writer.getNodeName(this.idlType)}`)])
    }
}

export const CustomObject: idl.IDLPrimitiveType = idl.IDLCustomObjectType
export const Function: idl.IDLPrimitiveType = idl.IDLFunctionType

class ImportsAggregateCollector extends DependenciesCollector {
    constructor(
        protected readonly peerLibrary: IdlSkoalaLibrary,
        private readonly expandAliases: boolean,
    ) {
        super(peerLibrary)
    }

    override convertTypeReference(type: idl.IDLReferenceType): idl.IDLNode[] {
        const declarations = super.convertTypeReference(type)
        const syntheticDeclarations = declarations.filter(it => idl.isSyntheticEntry(it))
        const realDeclarations = declarations.filter(it => !idl.isSyntheticEntry(it))

        const result = [...realDeclarations]

        // process synthetic declarations dependencies
        result.push(...syntheticDeclarations.flatMap(decl => this.convert(decl)))

        for (const decl of realDeclarations) {
            // expand type aliaces because we have serialization inside peers methods
            if (this.expandAliases && idl.isTypedef(decl))
                result.push(...this.convert(decl.type))
        }
        return result
    }
}

export class IdlWrapperProcessor {
    private readonly dependenciesCollector: DependenciesCollector

    constructor(
        public library: IdlSkoalaLibrary
    ) {
        this.dependenciesCollector = new ImportsAggregateCollector(library, false)
    }

    private collectDepsRecursive(decl: idl.IDLNode, deps: Set<idl.IDLNode>): void {
        const currentDeps = this.dependenciesCollector.convert(decl)
        for (const dep of currentDeps) {
            if (deps.has(dep)) continue
            if (idl.isEntry(dep) && !isSourceDecl(dep)) continue
            deps.add(dep)
            this.collectDepsRecursive(dep, deps)
        }
    }

    private generateDeclarations(): Set<idl.IDLEntry> {
        const deps: Set<idl.IDLEntry> = new Set(
            this.library.files
                .flatMap(it => [...it.declarations])
                .filter(it => !idl.isPackage(it)
                    && !idl.isModuleType(it)
                    && !idl.isImport(it)
                )
        )
        const depsCopy = Array.from(deps)
        for (const dep of depsCopy) {
            this.collectDepsRecursive(dep, deps)
        }
        for (const dep of Array.from(deps)) {
            if (idl.isEnumMember(dep)) {
                deps.add(dep.parent)
                deps.delete(dep)
            }
        }
        return deps
    }

    process() {
        let allDeps = this.generateDeclarations()
        for (let decl of allDeps) {
            if (idl.isSyntheticEntry(decl) && (idl.isCallback(decl) || idl.isInterface(decl) || idl.isTupleInterface(decl))) {
                addSyntheticType(decl.name ?? "MISSING_TYPE_NAME", decl)
            }
            const file = this.library.findFileByOriginalFilename(decl.fileName!)!

            //  process wrapper
            if (idl.isClass(decl) || idl.isInterface(decl)) {
                let wrapperClass = this.tryProcessWrapper(decl, file)
                if (wrapperClass) {
                    file.declarations.delete(decl)
                    file.wrapperClasses.set(wrapperClass.className, [wrapperClass, decl])
                    this.collectImports(file.importsCollector, wrapperClass.methods)
                    continue
                } else if (!idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.GlobalScope)) {
                    this.library.serializerDeclarations.add(decl)
                }
            }

            //  process serializer dependency
            let serDependencies = this.dependenciesCollector.convert(decl)
                .filter(it => idl.isEntry(it) && isSourceDecl(it))

            serDependencies.forEach(it => {
                if (it && (idl.isClass(it) || idl.isInterface(it))) {
                    this.library.serializerDeclarations.add(it)
                }
            })
        }

        // process imports
        for (let file of this.library.files) {
            const importDecl = [...file.declarations].filter(it => idl.isImport(it)).map(it => it as idl.IDLImport)
            importDecl.filter(it => isDefined(it.importClause)).forEach(importModule => {
                if (importModule.name.includes("@")) {
                    file.addImportFeature(importModule.name, ...importModule.importClause!)
                } else {
                    importModule.importClause?.forEach(feature => {
                        if (feature in Skoala.BaseClasses) {
                            file.addImportFeature(importModule.name, feature)
                        } else if (this.library.files.find(f => f.wrapperClasses.has(feature))) {
                            file.addImportFeature(importModule.name, feature)
                        }
                    })
                }
                file.declarations.delete(importModule)
            })
        }
    }

    private findHeritageClasses(declaration: idl.IDLInterface, heritageClasses: string[] = []): string[] | undefined {
        const superClassType = idl.getSuperType(declaration)
        if (superClassType) {
            let superClassName = this.library.nameConvertorInstance.convert(superClassType)
            heritageClasses.push(superClassName)

            if (Skoala.isBaseClass(superClassName)) {
                return heritageClasses
            } else {
                if (idl.isReferenceType(superClassType)) {
                    let superClassDecl = this.library.resolveTypeReference(superClassType)
                    if (superClassDecl && (idl.isInterface(superClassDecl) || idl.isClass(superClassDecl))) {
                        return this.findHeritageClasses(superClassDecl, heritageClasses)
                    }
                }
            }
        }

        return undefined
    }

    isWrapper(node: idl.IDLInterface): boolean {
        return !!this.findHeritageClasses(node)
    }

    tryProcessWrapper(decl: idl.IDLInterface, file: IldSkoalaFile): WrapperClass | undefined {
        const name = decl.name
        this.library.files.forEach((file, idx) => {
            if (file.wrapperClasses.has(name)) return
        })

        let heritageClasses = this.findHeritageClasses(decl)
        if (!heritageClasses?.length) return undefined

        const baseClass = heritageClasses[heritageClasses.length - 1]

        const constructor = idl.isClass(decl) ? decl.constructors[0] : undefined
        const wConstructor = constructor ? this.makeWrapperMethod(decl, constructor) : undefined
        const finalizer = decl.methods.find(it => it.name == Skoala.getFinalizer)
        const wFinalizer = finalizer ? this.makeWrapperMethod(decl, finalizer) : undefined
        const wFields = decl.properties
            .filter(it => idl.getExtAttribute(it, idl.IDLExtendedAttributes.Accessor) !== idl.IDLAccessorAttribute.Setter)
            .map(it => this.makeWrapperField(it))
        const wMethods = decl.methods
            .filter(it => it.name != Skoala.getFinalizer)
            // TODO: Properly handle methods with return Promise<T> type
            .map(method => this.makeWrapperMethod(decl, method))

        wFields.forEach(f => {
            const field = f.field
            // TBD: use deserializer to get complex type from native
            const isSimpleType = !f.argConvertor.useArray // type needs to be deserialized from the native
            if (isSimpleType) {
                const getSignature = new NamedMethodSignature(field.type, [], [])
                const getAccessor = new WrapperMethod(
                    name,
                    new Method(`get${capitalize(field.name)}`, getSignature, [MethodModifier.PRIVATE]),
                    [], f.retConvertor
                )
                wMethods.push(getAccessor)
            }
            const isReadOnly = field.modifiers.includes(FieldModifier.READONLY)
            if (!isReadOnly) {
                const setSignature = new NamedMethodSignature(idl.IDLVoidType, [field.type], [field.name])
                const retConvertor = { isVoid: true, nativeType: () => "void", macroSuffixPart: () => "V" }
                const setAccessor = new WrapperMethod(
                    name,
                    new Method(`set${capitalize(field.name)}`, setSignature, [MethodModifier.PRIVATE]),
                    [f.argConvertor], retConvertor
                )
                wMethods.push(setAccessor)
            }
        })

        return new WrapperClass(
            name,
            idl.isInterface(decl),
            baseClass as Skoala.BaseClasses,
            heritageClasses,
            wFields,
            wConstructor,
            wFinalizer,
            wMethods
        )
    }

    private makeWrapperField(
        property: idl.IDLProperty
    ): WrapperField {
        let modifiers: FieldModifier[] = []
        if (property.isStatic) modifiers.push(FieldModifier.STATIC)
        if (property.isReadonly) modifiers.push(FieldModifier.READONLY)
        const argConvertor = this.library.typeConvertor(property.name, property.type!, undefined, undefined, this)
        const retConvertor = generateRetConvertor(property.type)
        return new WrapperField(
            new Field(property.name, property.type, modifiers),
            argConvertor,
            retConvertor,
        )
    }

    private makeWrapperMethod(decl: idl.IDLInterface,
        idlMethod: idl.IDLConstructor | idl.IDLMethod
    ): WrapperMethod {
        // TODO: add convertor to convers method.type, method.name, method.parameters[..].type, method.parameters[..].name
        // TODO: add arg and ret convertors

        let retConvertor = {
            isVoid: false,
            nativeType: () => PrimitiveType.NativePointer.getText(),
            macroSuffixPart: () => ""
        }

        if (!idl.isConstructor(idlMethod)) {
            retConvertor = generateRetConvertor(idlMethod.returnType)
        }

        let args: idl.IDLType[] = []
        let argsNames: string[] = []
        let argConvertors = idlMethod.parameters.map(param => {
            if (!param.type) throw new Error("Type is needed")
            args.push(idl.maybeOptional(param.type, param.isOptional))
            argsNames.push(param.name)
            return this.library.typeConvertor(param.name, param.type, param.isOptional, undefined, this)
        })

        const modifiers = idl.isConstructor(idlMethod) || idlMethod.isStatic ? [MethodModifier.STATIC] : []

        let method: Method
        if (idl.isConstructor(idlMethod)) {
            method = new Method("constructor", new NamedMethodSignature(idl.IDLThisType, args, argsNames), modifiers)
        } else {
            method = new Method(idlMethod.name, new NamedMethodSignature(idlMethod.returnType, args, argsNames), modifiers)
        }

        return new WrapperMethod(decl.name, method, argConvertors, retConvertor)
    }

    private collectImports(importsCollector: ImportsCollector, methods: WrapperMethod[]) {
        methods.forEach(it => {
            if (it.isMakeMethod()) {
                importsCollector.addFeature("isNullPtr", "@koalaui/interop")
                return
            }
        })

        methods.forEach(it => {
            it.argConvertors.forEach(conv => {
                if (conv.runtimeTypes.length > 1) {
                    importsCollector.addFeature("unsafeCast", "generated-utils")
                }
                if (conv.runtimeTypes.indexOf(RuntimeType.OBJECT) > -1
                    || conv.runtimeTypes.indexOf(RuntimeType.MATERIALIZED) > -1
                    || conv.runtimeTypes.indexOf(RuntimeType.FUNCTION) > -1
                ) {
                    importsCollector.addFeatures(["Serializer"], "Serializer")
                    importsCollector.addFeatures(["RuntimeType", "runtimeType" ], "SerializerBase")
                }
            })
        })

        importsCollector.addFeature(Skoala.NativeModuleImportFeature.feature, Skoala.NativeModuleImportFeature.module)
    }
}

function generateRetConvertor(type?: idl.IDLType): RetConvertor {
    let nativeType = type ? mapCInteropRetType(type) : "void"
    let isVoid = nativeType == "void"
    return {
        isVoid: isVoid,
        nativeType: () => nativeType,
        macroSuffixPart: () => isVoid ? "V" : ""
    }
}

// TODO convert to convertor ;)
function mapCInteropRetType(type: idl.IDLType): string {
    if (idl.isPrimitiveType(type)) {
        switch (type) {
            case idl.IDLBooleanType: return PrimitiveType.Boolean.getText()
            case idl.IDLNumberType: return PrimitiveType.Int32.getText()
            case idl.IDLStringType:
            case idl.IDLAnyType:
                /* HACK, fix */
                // return `KStringPtr`
                return "void"
            case idl.IDLVoidType:
            case idl.IDLUndefinedType:
                return "void"
        }
    }
    if (idl.isReferenceType(type)) {
        return PrimitiveType.NativePointer.getText()
    }
    if (idl.isTypeParameterType(type))
        /* ANOTHER HACK, fix */
        return "void"
    if (idl.isUnionType(type))
        return PrimitiveType.NativePointer.getText()
    if (idl.isContainerType(type)) {
        if (idl.IDLContainerUtils.isSequence(type)) {
            /* HACK, fix */
            // return array by some way
            return "void"
        } else
            return PrimitiveType.NativePointer.getText()
    }
    throw `mapCInteropType failed for ${idl.IDLKind[type.kind]}`
}

export class TSDeclConvertor implements DeclarationConvertor<void> {
    private printer
    constructor(private readonly writer: LanguageWriter, readonly library: IdlSkoalaLibrary) {
        this.printer = new CustomPrintVisitor(resolveSyntheticType, writer.language)
    }
    convertCallback(node: idl.IDLCallback): void {
        this.printer.output = []
        this.printer.printTypedef(node)
        this.writer.print(this.printer.output.join("\n"))
    }
    convertEnum(node: idl.IDLEnum): void {
        this.printer.output = []
        this.printer.printEnum(node)
        this.writer.print(this.printer.output.join("\n"))
    }
    convertTypedef(node: idl.IDLTypedef): void {
        this.printer.output = []
        this.printer.printTypedef(node)
        this.writer.print(this.printer.output.join("\n"))
    }
    private replaceImportTypeNodes(text: string): string {///operate on stringOrNone[]
        for (const [stub, src] of [...this.library.importTypesStubToSource.entries()].reverse()) {
            text = text.replaceAll(src, stub)
        }
        return text
    }

    convertInterface(node: idl.IDLInterface): void {
        this.printer.output = []
        this.printer.printInterface(node)
        this.writer.print(this.replaceImportTypeNodes(this.printer.output.join("\n")))
    }
}

export function isSourceDecl(node: idl.IDLEntry): boolean {
    // if (isSyntheticDeclaration(node))
    //     return true
    // if (isModuleType(node.parent))
    //     return this.isSourceDecl(node.parent.parent)
    // if (isTypeParameterType(node))
    //     return false
    // if (!ts.isSourceFile(node.parent))
    //     throw 'Expected declaration to be at file root'
    return !node.fileName?.endsWith('stdlib.d.ts')
}

export function convertDeclToFeature(node: idl.IDLEntry) {
    let module = path.basename(node.fileName!).replace(".d.ts", "")
    return {
        feature: convertDeclaration(DeclarationNameConvertor.I, node),
        module: `./${module}`,
    }
}

export class TSSkoalaTypeNameConvertor implements IdlNameConvertor, TypeConvertor<string> {
    constructor(private library: IdlSkoalaLibrary) {}
    convertOptional(type: idl.IDLOptionalType): string {
        return `${this.convert(type.type)} | undefined`
    }
    convertUnion(type: idl.IDLUnionType): string {
        return type.types.map(it => this.convert(it)).join(" | ")
    }
    convertContainer(type: idl.IDLContainerType): string {
        const containerName =
        idl.IDLContainerUtils.isSequence(type) ? "Array"
            : idl.IDLContainerUtils.isRecord(type) ? "Map"
            : idl.IDLContainerUtils.isPromise(type) ? "Promise"
            : throwException(`Unmapped container type: ${idl.DebugUtils.debugPrintType(type)}`)
        return `${containerName}<${type.elementType.map(it => this.convert(it)).join(",")}>`
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): string {
        ///feed importClause into TS parser?
        if (importClause.includes("want?: import('../api/@ohos.app.ability.Want').default;"))
            return "IMPORT_Callback_code_number_want_IMPORT_default_FROM_api_ohos_app_ability_Want_FROM_api_ohos_base"
        const match = importClause.match(/import *\((['"`])(.+)\1\)\.(.+)/)
        if (!match)
            throw new Error(`Cannot parse import clause ${importClause}`)
        const [where, what] = match.slice(2)
        return `IMPORT_${what}_FROM_${where}`
            .match(/[a-zA-Z]+/g)!.join('_')
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        // resolve synthetic types
        const decl = this.library.resolveTypeReference(type)!
        if (decl && idl.isSyntheticEntry(decl)) {
            if (idl.isCallback(decl)) {
                return this.callbackType(decl)
            }
            return decl.name ?? "MISSING_TYPE_NAME"
        }

        let typeSpec = type.name
        let typeArgs = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)?.split(",")
        const maybeTypeArguments = !typeArgs?.length ? '' : `<${typeArgs.join(', ')}>`
        return `${typeSpec}${maybeTypeArguments}`
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return type.name
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLStringType: return "string"
            case idl.IDLNullType: return "null"
            case idl.IDLVoidType: return "void"
        }
        // todo: add other types
        return type.name
    }
    convertType(type: idl.IDLType): string {
        return convertType(this, type)
    }
    convertEntry(entry: idl.IDLEntry): string {
        if (idl.isCallback(entry)) {
            return this.callbackType(entry)
        }
        return entry.name
    }
    convert(node: idl.IDLNode): string {
        if (idl.isType(node)) {
            return this.convertType(node)
        }
        if (idl.isEntry(node)) {
            return this.convertEntry(node)
        }
        throw new Error("node is either entry or type!")
    }

    callbackType(decl: idl.IDLCallback): string {
        const params = decl.parameters.map(it =>
            `${it.isVariadic ? "..." : ""}${it.name}${it.isOptional ? "?" : ""}: ${this.library.mapType(it.type)}`)
        return `((${params.join(", ")}) => ${this.library.mapType(decl.returnType)})`
    }
}