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
import { posix as path } from "path"
import { ImportsCollector } from '../../peer-generation/ImportsCollector'
import {
    capitalize,
    isDefined,
    throwException,
    Language,
    CustomPrintVisitor,
    DeclarationNameConvertor,
    addSyntheticType,
    resolveSyntheticType,
    isImport,
    CustomTypeConvertor,
    generatorConfiguration,
    LibraryInterface,
    LibraryFileInterface,
    InterfaceConvertor,
    PrimitiveTypesInstance
} from '@idlizer/core'
import { WrapperClass, WrapperField, WrapperMethod } from "../WrapperClass";
import { Skoala } from "../utils";
import { Field, FieldModifier, LanguageExpression, LanguageStatement, LanguageWriter, Method, MethodModifier, NamedMethodSignature, NumberConvertor } from "@idlizer/core";
import { ClassConvertor, StringConvertor, TypeAliasConvertor, UnionConvertor, CppNameConvertor,
    ArgConvertor, BooleanConvertor, BaseArgConvertor, EnumConvertor, ExpressionAssigner, RuntimeType, UndefinedConvertor,
    convertDeclaration, convertType, DeclarationConvertor, IdlNameConvertor, TypeConvertor, generateSyntheticFunctionName
} from "@idlizer/core"
import { DependenciesCollector } from "../../peer-generation/idl/IdlDependenciesCollector";
import { createOutArgConvertor } from "../../peer-generation/PromiseConvertors";

export class IldSkoalaFile implements LibraryFileInterface {
    readonly wrapperClasses: Map<string, [WrapperClass, any|undefined]> = new Map()
    readonly baseName: string
    readonly importsCollector: ImportsCollector
    readonly declarations: Set<idl.IDLEntry>

    processedDeclarationsList: Array<idl.IDLEntry> | undefined
    get entries(): idl.IDLEntry[] {
        return this.processedDeclarationsList!
    }

    constructor(
        public file: idl.IDLFile
    ) {
        this.baseName = path.basename(file.fileName!)
        this.importsCollector = new ImportsCollector()
        this.declarations = new Set(file.entries)
    }

    addImportFeature(module: string, ...features: string[]) {
        this.importsCollector.addFeatures(features, module)
    }
}

export class IdlSkoalaLibrary implements LibraryInterface {
    public readonly serializerDeclarations: Set<idl.IDLInterface> = new Set()
    readonly nameConvertorInstance: IdlNameConvertor = new TSSkoalaTypeNameConvertor(this)
    readonly interopNameConvertorInstance: IdlNameConvertor = new CppNameConvertor(this)
    readonly typeMap = new Map<idl.IDLType, [idl.IDLNode, boolean]>()
    public name: string = ""

    public language = Language.TS

    public readonly files: IldSkoalaFile[] = []
    findFileByOriginalFilename(filename: string): IldSkoalaFile | undefined {
        return this.files.find(it => it.file.fileName === filename)
    }

    get libraryPrefix(): string {
        return this.name
    }

    get libraryPackages() {
        return undefined
    }

    getCurrentContext(): string | undefined {
        return ""
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
            case idl.IDLVoidType: return idl.IDLUndefinedType
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
                const wrappedType = type.typeArguments![0]
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
                case idl.IDLAnyType: return new CustomTypeConvertor(param, "Any", false, "Object")
                case idl.IDLBooleanType: return new BooleanConvertor(param)
                case idl.IDLStringType: return new StringConvertor(param)
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
                return new CustomTypeConvertor(param, "Object", false, "Object")
            if (isImport(type)) {
                // return new ImportTypeConvertor(param, type)
                console.log('todo: type converter for import')
            }
        }

        if (idl.isReferenceType(type)) {
            const decl = this.resolveTypeReference(type)
            return this.declarationConvertor(param, type, decl, maybeCallback, processor)
        }
        return new CustomTypeConvertor(param, this.nameConvertorInstance.convert(type), false, "Object")
    }

    declarationConvertor(param: string, type: idl.IDLReferenceType,
        declaration: idl.IDLEntry | undefined, maybeCallback: boolean = false, processor?: IdlWrapperProcessor): ArgConvertor
    {
        if (!declaration)
            return new CustomTypeConvertor(param, type.name, false, type.name) // assume some predefined type

        const declarationName = declaration.name!

        if (idl.isEnum(declaration)) {
            return new EnumConvertor(param, declaration)
        }

        if (idl.isEnumMember(declaration)) {
            return new EnumConvertor(param, declaration.parent)
        }

        if (idl.isInterface(declaration)) {
            if (processor?.isWrapper(declaration)) {
                return new IdlWrapperClassConvertor(declarationName, param, this, declaration)
            }
            switch (declaration.subkind) {
                case idl.IDLInterfaceSubkind.Interface:
                    return new InterfaceConvertor(this, declarationName, param, declaration)
                case idl.IDLInterfaceSubkind.Class:
                    return new ClassConvertor(this, declarationName, param, declaration)
            }
        }

        if (idl.isTypedef(declaration)) {
            return new TypeAliasConvertor(this, param, declaration)
        }

        console.log('todo: custom converter', type.name, declaration.name);
        return new CustomTypeConvertor(param, type.name, false, type.name)
    }

    ///

    resolveTypeReference(type: idl.IDLReferenceType, pointOfView?: idl.IDLEntry, rootEntries?: idl.IDLEntry[]): idl.IDLEntry | undefined {
        throw new Error("not implemented yet")

        // // let wrapperClassEntries: idl.IDLEntry[] = this.files.map(it => it.wrapperClasses.get(type.name)?.[1] as idl.IDLEntry).filter(it => !!it)
        // let wrapperClassEntries = this.files.flatMap(f => f.wrapperClasses.get(type.name)?.[1]).filter(isDefined)
        // entries ??= [...this.files.flatMap(it => [...it.declarations]), ...wrapperClassEntries]

        // const [qualifier, typeName] = idl.decomposeQualifiedName(type)
        // if (qualifier) {
        //     // This is a namespace or enum member. Try enum first
        //     const parent = entries.find(it => it.name === qualifier)
        //     if (parent && idl.isEnum(parent))
        //         return parent.elements.find(it => it.name === type.name)
        //     // Else try namespaces
        //     return entries.find(it =>
        //         it.name === typeName && it.namespace && qualifiedName(it.namespace, ".") === qualifier)

        // }

        // const candidates = entries.filter(it => type.name === it.name)
        // return candidates.length == 1
        //     ? candidates[0]
        //     : candidates.find(it => !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Import))
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

    createTypeNameConvertor(language: Language): IdlNameConvertor {
        return this.nameConvertorInstance
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
        super(idl.createReferenceType(type), [RuntimeType.OBJECT], false, true, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeWrapper", [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const prefix = writer.language === Language.CPP ? generatorConfiguration().TypePrefix : ""
        const readStatement = writer.makeCast(
            writer.makeMethodCall(`${deserializerName}`, `readWrapper`, []),
            idl.createReferenceType(`${prefix}${this.type.name}`)
        )
        return assigneer(readStatement)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType('Materialized')
    }
    interopType(): idl.IDLType {
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

    override convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
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
                .filter(it => !idl.isPackage(it) && !idl.isImport(it))
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
            if (idl.isSyntheticEntry(decl) && (idl.isCallback(decl) || idl.isInterface(decl))) {
                addSyntheticType(decl.name ?? "MISSING_TYPE_NAME", decl)
            }
            const file = this.library.findFileByOriginalFilename(decl.fileName!)!

            //  process wrapper
            if (idl.isInterface(decl)) {
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
                if (it && (idl.isInterface(it))) {
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
            file.processedDeclarationsList = [...file.declarations]
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
                    if (superClassDecl && (idl.isInterface(superClassDecl))) {
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

        const constructor = decl.subkind === idl.IDLInterfaceSubkind.Class ? decl.constructors[0] : undefined
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
                    []
                )
                wMethods.push(getAccessor)
            }
            const isReadOnly = field.modifiers.includes(FieldModifier.READONLY)
            if (!isReadOnly) {
                const setSignature = new NamedMethodSignature(idl.IDLVoidType, [field.type], [field.name])
                const setAccessor = new WrapperMethod(
                    name,
                    new Method(`set${capitalize(field.name)}`, setSignature, [MethodModifier.PRIVATE]),
                    [f.argConvertor]
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
        return new WrapperField(
            new Field(property.name, property.type, modifiers),
            argConvertor,
        )
    }

    private makeWrapperMethod(decl: idl.IDLInterface,
        idlMethod: idl.IDLConstructor | idl.IDLMethod
    ): WrapperMethod {
        // TODO: add convertor to convers method.type, method.name, method.parameters[..].type, method.parameters[..].name
        // TODO: add arg and ret convertors

        const outArgConvertor = idl.isConstructor(idlMethod)
            ? undefined
            : createOutArgConvertor(this.library, idlMethod.returnType, idlMethod.parameters.map(it => it.name))
        let args: idl.IDLType[] = []
        let argsNames: string[] = []
        let argAndOutConvertors = idlMethod.parameters.map(param => {
            if (!param.type) throw new Error("Type is needed")
            args.push(idl.maybeOptional(param.type, param.isOptional))
            argsNames.push(param.name)
            return this.library.typeConvertor(param.name, param.type, param.isOptional, undefined, this)
        })
        if (outArgConvertor)
            argAndOutConvertors.push(outArgConvertor)

        const modifiers = idl.isConstructor(idlMethod) || idlMethod.isStatic ? [MethodModifier.STATIC] : []

        let method: Method
        if (idl.isConstructor(idlMethod)) {
            method = new Method("constructor", new NamedMethodSignature(idl.IDLThisType, args, argsNames), modifiers)
        } else {
            method = new Method(idlMethod.name, new NamedMethodSignature(idlMethod.returnType, args, argsNames), modifiers)
        }

        return new WrapperMethod(decl.name, method, argAndOutConvertors)
    }

    private collectImports(importsCollector: ImportsCollector, methods: WrapperMethod[]) {
        methods.forEach(it => {
            if (it.isMakeMethod()) {
                importsCollector.addFeature("isNullPtr", "@koalaui/interop")
                return
            }
        })

        methods.forEach(it => {
            it.argAndOutConvertors.forEach(conv => {
                if (conv.runtimeTypes.length > 1) {
                    importsCollector.addFeature("unsafeCast", "@koalaui/common")
                }
                if (conv.runtimeTypes.indexOf(RuntimeType.OBJECT) > -1
                    || conv.runtimeTypes.indexOf(RuntimeType.MATERIALIZED) > -1
                    || conv.runtimeTypes.indexOf(RuntimeType.FUNCTION) > -1
                ) {
                    importsCollector.addFeatures(["Serializer"], "Serializer")
                    importsCollector.addFeatures(["RuntimeType", "runtimeType" ], "@koalaui/interop")
                }
            })
        })

        importsCollector.addFeature(Skoala.NativeModuleImportFeature.feature, Skoala.NativeModuleImportFeature.module)
    }
}

// TODO convert to convertor ;)
function mapCInteropRetType(type: idl.IDLType): string {
    if (idl.isPrimitiveType(type)) {
        switch (type) {
            case idl.IDLBooleanType: return PrimitiveTypesInstance.Boolean.getText()
            case idl.IDLNumberType: return PrimitiveTypesInstance.Int32.getText()
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
        return PrimitiveTypesInstance.NativePointer.getText()
    }
    if (idl.isTypeParameterType(type))
        /* ANOTHER HACK, fix */
        return "void"
    if (idl.isUnionType(type))
        return PrimitiveTypesInstance.NativePointer.getText()
    if (idl.isContainerType(type)) {
        if (idl.IDLContainerUtils.isSequence(type)) {
            /* HACK, fix */
            // return array by some way
            return "void"
        } else
            return PrimitiveTypesInstance.NativePointer.getText()
    }
    throw new Error(`mapCInteropType failed for ${idl.IDLKind[type.kind]}`)
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
    convertMethod(node: idl.IDLMethod): void {
        this.printer.output = []
        this.printer.printMethod(node, true)
        this.writer.print(this.printer.output.join("\n"))
    }
    convertConstant(node: idl.IDLConstant): void {
        this.printer.output = []
        this.printer.printConstant(node)
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
    convertNamespace(node: idl.IDLNamespace): void {
        this.writer.print(`${idl.fetchNamespaceFrom(node.parent) ? "" : "declare " }namespace ${node.name} {`)
        this.writer.pushIndent()
        node.members.forEach(it => convertDeclaration(this, it))
        this.writer.popIndent()
        this.writer.print("}")
    }
    convertInterface(node: idl.IDLInterface): void {
        this.printer.output = []
        this.printer.printInterface(node)
        this.writer.print(this.printer.output.join("\n"))
    }
}

export function isSourceDecl(node: idl.IDLEntry): boolean {
    // if (isSyntheticDeclaration(node))
    //     return true
    // if (isNamespace(node.parent))
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