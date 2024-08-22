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
import { serializerBaseMethods, isDefined, Language, renameDtsToInterfaces, renameClassToBuilderClass, renameClassToMaterialized, capitalize } from "../../util"
import { GenericVisitor } from "../../options"
import { ArgConvertor, RetConvertor } from "./IdlArgConvertors"
import { PeerGeneratorConfig } from "../PeerGeneratorConfig";
import { IdlPeerClass } from "./IdlPeerClass"
import { IdlPeerMethod } from "./IdlPeerMethod"
import { IdlPeerFile, EnumEntity } from "./IdlPeerFile"
import { IdlPeerLibrary } from "./IdlPeerLibrary"
// import { MaterializedClass, MaterializedField, MaterializedMethod, SuperElement, checkTSDeclarationMaterialized, isMaterialized } from "../Materialized"
import { Field, FieldModifier, Method, MethodModifier, NamedMethodSignature, Type } from "../LanguageWriters";
import { convertDeclaration, convertType } from "./IdlTypeConvertor";
import { DeclarationDependenciesCollector, TypeDependenciesCollector } from "./IdlDependenciesCollector";
// import { convertDeclToFeature } from "../ImportsCollector";
import { addSyntheticDeclarationDependency, isSyntheticDeclaration, makeSyntheticTypeAliasDeclaration, syntheticDeclarationFilename } from "./IdlSyntheticDeclarations";
import { BuilderClass, isCustomBuilderClass } from "../BuilderClass";
import { typeConvertor } from "./IdlArgConvertors";
import { isRoot } from "../inheritance";
import { isMaterialized } from "./IdlArgConvertors";
import { ImportFeature } from "../ImportsCollector";
import { DeclarationNameConvertor } from "./IdlDependenciesCollector";
import { ArkTSTypeNameConvertor } from "./IdlTypeNameConvertor";

export enum RuntimeType {
    UNEXPECTED = -1,
    NUMBER = 1,
    STRING = 2,
    OBJECT = 3,
    BOOLEAN = 4,
    UNDEFINED = 5,
    BIGINT = 6,
    FUNCTION = 7,
    SYMBOL = 8,
    MATERIALIZED = 9,
}

/**
 * Theory of operations.
 *
 * We use type definition as "grammar", and perform recursive descent to terminal nodes of such grammar
 * generating serialization code. We use TS typechecker to analyze compound and union types and generate
 * universal finite automata to serialize any value of the given type.
 */


// export interface TypeAndName {
//     type: ts.TypeNode
//     name: string
//     optional: boolean
// }

export type IdlPeerGeneratorVisitorOptions = {
    // sourceFile: ts.SourceFile
    sourceFile: string
    peerFile: IdlPeerFile
    // typeChecker: ts.TypeChecker
    // declarationTable: DeclarationTable,
    peerLibrary: IdlPeerLibrary
}

export class IdlComponentDeclaration {
    constructor(
        public readonly name: string,
        public readonly interfaceDeclaration: idl.IDLInterface | undefined,
        public readonly attributesDeclarations: idl.IDLInterface,
    ) {}
}

export class IdlPeerGeneratorVisitor implements GenericVisitor<void> {
    // private readonly sourceFile: ts.SourceFile
    private readonly sourceFile: string

    static readonly serializerBaseMethods = serializerBaseMethods()

    readonly peerLibrary: IdlPeerLibrary
    readonly peerFile: IdlPeerFile

    constructor(options: IdlPeerGeneratorVisitorOptions) {
        this.sourceFile = options.sourceFile
        this.peerLibrary = options.peerLibrary
        this.peerFile = options.peerFile
    }

    visitWholeFile(): void {
        this.peerFile.entries
            .filter(it => idl.hasExtAttribute(it, idl.IDLExtendedAttributes.Component))
            .forEach(it => this.visitComponent(it as idl.IDLInterface))
    }

    visitComponent(component: idl.IDLInterface) {
        const componentName = component.name.replace("Attribute", "")
        if (PeerGeneratorConfig.ignoreComponents.includes(componentName))
            return
        const compInterface = this.peerLibrary.resolveTypeReference(
            idl.createReferenceType(`${componentName}Interface`),
            this.peerFile.entries)
        if (compInterface && idl.isInterface(compInterface)) {
            this.peerLibrary.componentsDeclarations.push(
                new IdlComponentDeclaration(componentName, compInterface, component))
        }
    }

//     private processCustomComponent(node: ts.ClassDeclaration) {
//         const methods = node.members
//             .filter(it => ts.isMethodDeclaration(it) || ts.isMethodSignature(it))
//             .map(it => it.getText().replace(/;\s*$/g, ''))
//             .map(it => `${it} { throw new Error("not implemented"); }`)
//         this.peerLibrary.customComponentMethods.push(...methods)
//     }
}

function generateArgConvertor(library: IdlPeerLibrary, param: idl.IDLParameter, maybeCallback: boolean): ArgConvertor {
    if (!param.type) throw new Error("Type is needed")
    return typeConvertor(library, param.name, param.type, param.isOptional, maybeCallback)
}

// function generateRetConvertor(typeNode?: ts.TypeNode): RetConvertor {
//     let nativeType = typeNode ? mapCInteropRetType(typeNode) : "void"
//     let isVoid = nativeType == "void"
//     return {
//         isVoid: isVoid,
//         nativeType: () => nativeType,
//         macroSuffixPart: () => isVoid ? "V" : ""
//     }
// }

// function mapCInteropRetType(type: ts.TypeNode): string {
//     if (type.kind == ts.SyntaxKind.VoidKeyword) {
//         return `void`
//     }
//     if (type.kind == ts.SyntaxKind.NumberKeyword) {
//         return PrimitiveType.Int32.getText()
//     }
//     if (type.kind == ts.SyntaxKind.BooleanKeyword) {
//         return PrimitiveType.Boolean.getText()
//     }
//     if (ts.isTypeReferenceNode(type)) {
//         let name = identName(type.typeName)!
//         /* HACK, fix */
//         if (name.endsWith("Attribute")) return "void"
//         switch (name) {
//             /* ANOTHER HACK, fix */
//             case "T": return "void"
//             case "UIContext": return PrimitiveType.NativePointer.getText()
//             default: return PrimitiveType.NativePointer.getText()
//         }
//     }
//     if (type.kind == ts.SyntaxKind.StringKeyword) {
//         /* HACK, fix */
//         // return `KStringPtr`
//         return "void"
//     }
//     if (ts.isUnionTypeNode(type)) {
//         console.log(`WARNING: unhandled union type: ${type.getText()}`)
//         // TODO: not really properly supported.
//         if (type.types[0].kind == ts.SyntaxKind.VoidKeyword) return "void"
//         if (type.types.length == 2) {
//             if (type.types[1].kind == ts.SyntaxKind.UndefinedKeyword) return `void`
//             if (ts.isLiteralTypeNode(type.types[1]) && type.types[1].literal.kind == ts.SyntaxKind.NullKeyword) {
//                 // NavPathStack | null
//                 return mapCInteropRetType(type.types[0])
//             }
//         }
//         // TODO: return just type of the first elem
//         // for the materialized class getter with union type
//         return mapCInteropRetType(type.types[0])
//     }
//     if (ts.isArrayTypeNode(type)) {
//         /* HACK, fix */
//         // return array by some way
//         return "void"
//     }
//     if (ts.isParenthesizedTypeNode(type)) {
//         return mapCInteropRetType(type.type)
//     }
//     throw new Error(type.getText())
// }


class ImportsAggregateCollector extends TypeDependenciesCollector {
    constructor(
        protected readonly peerLibrary: IdlPeerLibrary,
        private readonly expandAliases: boolean,
    ) {
        super(peerLibrary)
    }

    override convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        const generatedName = this.peerLibrary.mapType(type)
        if (!this.peerLibrary.importTypesStubToSource.has(generatedName)) {
            this.peerLibrary.importTypesStubToSource.set(generatedName, type.name)
        }
        let syntheticDeclaration: idl.IDLEntry

        if (type.name === 'Resource') {
            syntheticDeclaration = makeSyntheticTypeAliasDeclaration(
                'SyntheticDeclarations', generatedName, idl.createReferenceType("ArkResource"))
            addSyntheticDeclarationDependency(syntheticDeclaration, {feature: "ArkResource", module: "./shared/ArkResource"})
        } else {
            syntheticDeclaration = makeSyntheticTypeAliasDeclaration(
                'SyntheticDeclarations',
                generatedName,
                idl.createAnyType()
            )
        }
        return [
            ...super.convertImport(type, importClause),
            syntheticDeclaration
        ]
    }

    override convertTypeReference(type: idl.IDLReferenceType): idl.IDLEntry[] {
        const declarations = super.convertTypeReference(type)
        const result = [...declarations]
        for (const decl of declarations) {
            // expand type aliaces because we have serialization inside peers methods
            if (this.expandAliases && idl.isTypedef(decl))
                result.push(...this.convert(decl.type))
        }
        return result
    }
}

class ArkTSImportsAggregateCollector extends ImportsAggregateCollector {
    private readonly typeConvertor = new ArkTSTypeNameConvertor(this.peerLibrary)

    // override convertLiteralType(node: ts.LiteralTypeNode): ts.Declaration[] {
    //     if (ts.isUnionTypeNode(node.parent) && ts.isStringLiteral(node.literal)) {
    //         return [this.addSyntheticDeclarationDependency(this.typeConvertor.convertLiteralType(node))]
    //     }
    //     return super.convertLiteralType(node)
    // }

    // override convertTemplateLiteral(node: ts.TemplateLiteralTypeNode): ts.Declaration[] {
    //     return [this.addSyntheticDeclarationDependency(this.typeConvertor.convertTemplateLiteral(node))]
    // }

    // private addSyntheticDeclarationDependency(generatedName: string): ts.TypeAliasDeclaration {
    //     const typeRef = `External_${generatedName}`
    //     const syntheticDeclaration = makeSyntheticTypeAliasDeclaration(
    //         'SyntheticDeclarations',
    //         generatedName,
    //         ts.factory.createTypeReferenceNode(typeRef),
    //     )
    //     addSyntheticDeclarationDependency(syntheticDeclaration, {
    //         feature: typeRef,
    //         module: "./shared/dts-exports"
    //     })
    //     return syntheticDeclaration
    // }
}

class FilteredDeclarationCollector extends DeclarationDependenciesCollector {
    constructor(
        private readonly library: IdlPeerLibrary,
        typeDepsCollector: TypeDependenciesCollector,
    ) {
        super(typeDepsCollector)
    }

    protected override convertSupertype(type: idl.IDLType): idl.IDLEntry[] {
        if (idl.isReferenceType(type)) {
            const decl = this.library.resolveTypeReference(type)
            return decl && idl.isClass(decl) && this.library.isComponentDeclaration(decl)
                ? []
                : super.convertSupertype(type)
        }
        throw new Error(`Expected reference type, got ${type.kind} ${type.name}`)
    }
}

class ComponentsCompleter {
    constructor(
        private readonly library: IdlPeerLibrary,
    ) {}

    // private componentNameByClass(node: ts.ClassDeclaration): string {
    //     return node.name!.text
    // }

    public process(): void {
        for (let i = 0; i < this.library.componentsDeclarations.length; i++) {
            const attributes = this.library.componentsDeclarations[i].attributesDeclarations
            // if ((attributes.inheritance.length ?? 0) > 1)
            //     throw new Error("Expected component attributes to have single heritage clause at most")
            const parent = idl.getSuperType(attributes)
            if (!parent)
                continue
            if (!idl.isReferenceType(parent))
                throw new Error("Expected component parent type to be a reference type")
            const parentDecl = this.library.resolveTypeReference(parent)
                // to resolve a problem with duplicate CommonMethod interface in koala fakes
                // .filter(it => ts.isClassDeclaration(it))
            // if (parentDecls.length !== 1)
            //     throw new Error("Expected parent to have single declaration")
            // const parentDecl = parentDecls[0]
            if (!parentDecl || !idl.isClass(parentDecl))
                throw new Error("Expected parent to be a class")
            if (!this.library.isComponentDeclaration(parentDecl)) {
                this.library.componentsDeclarations.push(
                    new IdlComponentDeclaration(parentDecl.name, undefined, parentDecl))
            }
        }
        // topological sort
        const components = this.library.componentsDeclarations
        for (let i = 0; i < components.length; i++) {
            for (let j = i + 1; j < components.length; j++) {
                if (this.isSubclassComponent(components[i], components[j])) {
                    components.splice(i, 0, ...components.splice(j, 1))
                    i--
                    break
                }
            }
        }
    }

    private isSubclassComponent(a: IdlComponentDeclaration, b: IdlComponentDeclaration) {
        return this.isSubclass(a.attributesDeclarations, b.attributesDeclarations)
    }

    private isSubclass(component: idl.IDLInterface, maybeParent: idl.IDLInterface): boolean {
        const parentDecl = idl.getSuperType(component)
        return isDefined(parentDecl) && (
            parentDecl.name === maybeParent.name ||
            idl.isClass(parentDecl) && this.isSubclass(parentDecl, maybeParent))
    }
}

class PeersGenerator {
    constructor(
        private readonly library: IdlPeerLibrary,
    ) {}

    private processProperty(prop: idl.IDLProperty, peer: IdlPeerClass, maybeCallback: boolean, parentName?: string): IdlPeerMethod {
        if (prop.name === "onWillScroll") {
            /**
             * ScrollableCommonMethod has a method `onWillScroll(handler: Optional<OnWillScrollCallback>): T;`
             * ScrollAttribute extends ScrollableCommonMethod and overrides this method as
             * `onWillScroll(handler: ScrollOnWillScrollCallback): ScrollAttribute;`. So that override is not
             * valid and cannot be correctly processed and we want to stub this for now.
             */
            prop.type = idl.createAnyType()
        }
        const originalParentName = parentName ?? peer.originalClassName!
        // this.declarationTable.setCurrentContext(`${originalParentName}.${methodName}()`)
        const argConvertor = typeConvertor(this.library, "value", prop.type, prop.isOptional, maybeCallback)
        const argType = new Type(this.library.mapType(prop.type), prop.isOptional)
        const signature = new NamedMethodSignature(Type.Void, [argType], ["value"])
        const peerMethod = new IdlPeerMethod(
            originalParentName,
    //         declarationTargets,
            [argConvertor],
    //         retConvertor,
            false,
            new Method(prop.name, signature, []))
    //     this.declarationTable.setCurrentContext(undefined)
        return peerMethod
    }

    private processMethodOrCallable(method: idl.IDLMethod | idl.IDLCallable, peer: IdlPeerClass, maybeCallback: boolean, parentName?: string): IdlPeerMethod {
        const isCallSignature = !idl.isMethod(method)
    //     // Some method have other parents as part of their names
    //     // Such as the ones coming from thr friend interfaces
    //     // E.g. ButtonInterface instead of ButtonAttribute
        const originalParentName = parentName ?? peer.originalClassName!
        const methodName = isCallSignature ? `set${peer.componentName}Options` : method.name

    //     this.declarationTable.setCurrentContext(`${originalParentName}.${methodName}()`)

        // const parameters = tempExtractParameters(method)
    //     parameters.forEach((param, index) => {
    //         if (param.type) {
    //             this.declarationTable.requestType(
    //                 `Type_${originalParentName}_${methodName}${methodIndex == 0 ? "" : methodIndex.toString()}_Arg${index}`,
    //                 param.type,
    //                 this.library.shouldGenerateComponent(peer.componentName),
    //             )
    //         }
    //     })
        const argConvertors = method.parameters.map(param => generateArgConvertor(this.library, param, maybeCallback))
    //     const declarationTargets = parameters
    //         .map((param) => this.declarationTable.toTarget(param.type ??
    //             throwException(`Expected a type for ${asString(param)} in ${asString(method)}`)))
    //     const retConvertor = generateRetConvertor(method.type)

    //     // TODO: restore collapsing logic!
        const signature = /* collapsed?.signature ?? */ this.generateSignature(method)

        const peerMethod = new IdlPeerMethod(
            originalParentName,
    //         declarationTargets,
            argConvertors,
    //         retConvertor,
            isCallSignature,
            new Method(methodName, signature, method.isStatic ? [MethodModifier.STATIC] : []))
    //     this.declarationTable.setCurrentContext(undefined)
        return peerMethod
    }

    private generateSignature(method: idl.IDLCallable | idl.IDLMethod): NamedMethodSignature {
        const returnName = method.returnType!.name
        const returnType = returnName === "void" ? Type.Void
            : method.isStatic ? new Type(returnName) : Type.This
        return new NamedMethodSignature(returnType,
            method.parameters.map(it => new Type(this.library.mapType(it.type!), it.isOptional)),
            method.parameters.map(it => it.name))
    }

    private createComponentAttributesDeclaration(clazz: idl.IDLInterface, peer: IdlPeerClass) {
        if (PeerGeneratorConfig.invalidAttributes.includes(peer.componentName)) {
            return
        }
        const seenAttributes = new Set<string>()
        clazz.properties.forEach(prop => {
            this.processOptionAttribute(seenAttributes, prop, peer)
        })
    }

    private processOptionAttribute(seenAttributes: Set<string>, property: idl.IDLProperty, peer: IdlPeerClass) {
        const propName = property.name
        if (seenAttributes.has(propName)) {
            console.log(`WARNING: ignore seen property: ${propName}`)
            return
        }
        seenAttributes.add(propName)
        const type = this.fixTypeLiteral(propName, property.type, peer)
        peer.attributesFields.push(`${propName}?: ${type}`)
    }

    /**
     * Arkts needs a named type as its argument method, not an anonymous type
     * at which producing 'SyntaxError: Invalid Type' error
     */
    private fixTypeLiteral(name: string, type: idl.IDLType, peer: IdlPeerClass): string {
        if (idl.isReferenceType(type)) {
            const decl = this.library.resolveTypeReference(type)
            if (decl && idl.isAnonymousInterface(decl)) {
                const fixedTypeName = capitalize(name) + "ValuesType"
                const attributeDeclarations = decl.properties
                    .map(it => `  ${it.name}${it.isOptional ? "?" : ""}: ${this.library.mapType(it.type)}`)
                    .join('\n')
                peer.attributesTypes.push({
                    typeName: fixedTypeName,
                    content: `export interface ${fixedTypeName} {\n${attributeDeclarations}\n}`})
                const peerMethod = peer.methods.find((method) => method.overloadedName == name)
                if (peerMethod !== undefined) {
                    peerMethod.method.signature.args = [new Type(fixedTypeName)]
                }
                return fixedTypeName
            }
        }
        return this.library.mapType(type)
    }

    private fillInterface(peer: IdlPeerClass, iface: idl.IDLInterface) {
        peer.originalInterfaceName = iface.name
        const methods = iface.callables
        const peerMethods = methods
            .map(it => this.processMethodOrCallable(it, peer, false, iface?.name))
            .filter(isDefined)
        IdlPeerMethod.markOverloads(peerMethods)
        peer.methods.push(...peerMethods)
    }

    private fillClass(peer: IdlPeerClass, clazz: idl.IDLInterface) {
        peer.originalClassName = clazz.name
        // peer.hasGenericType = (clazz.typeParameters?.length ?? 0) > 0
        // const parent = singleParentDeclaration(this.declarationTable.typeChecker!, clazz) as ts.ClassDeclaration
        const parent = idl.getSuperType(clazz)
        if (parent) {
            const parentComponent = this.library.findComponentByType(parent)!
            const parentDecl = this.library.resolveTypeReference(parent as idl.IDLReferenceType)
            peer.originalParentName = parent.name
            peer.originalParentFilename = parentDecl?.fileName
            peer.parentComponentName = parentComponent.name
        }
        const maybeCallback = isCommonMethodOrSubclass(this.library, clazz)
        const peerMethods = [
            ...clazz.properties.map(it => this.processProperty(it, peer, maybeCallback)),
            ...clazz.methods.map(it => this.processMethodOrCallable(it, peer, maybeCallback)),
            ].filter(it => !PeerGeneratorConfig.ignorePeerMethod.includes(it.method.name))

        IdlPeerMethod.markOverloads(peerMethods)
        peer.methods.push(...peerMethods)

        this.createComponentAttributesDeclaration(clazz, peer)
    }

    public generatePeer(component: IdlComponentDeclaration): void {
        const sourceFile = component.attributesDeclarations.fileName
        if (!sourceFile)
            throw new Error("Expected parent of attributes to be a SourceFile")
        const file = this.library.findFileByOriginalFilename(sourceFile)
        if (!file)
            throw new Error("Not found a file corresponding to attributes class")
        const peer = new IdlPeerClass(file, component.name, sourceFile)
        if (component.interfaceDeclaration)
            this.fillInterface(peer, component.interfaceDeclaration)
        this.fillClass(peer, component.attributesDeclarations)
        file.peers.set(component.name, peer)
    }
}

export class IdlPeerProcessor {
    private readonly typeDependenciesCollector: TypeDependenciesCollector
    private readonly declDependenciesCollector: DeclarationDependenciesCollector
    private readonly serializeDepsCollector: DeclarationDependenciesCollector

    constructor(
        private readonly library: IdlPeerLibrary,
    ) {
        this.typeDependenciesCollector = createTypeDependenciesCollector(this.library)
        this.declDependenciesCollector = new FilteredDeclarationCollector(this.library, this.typeDependenciesCollector)
        this.serializeDepsCollector = new FilteredDeclarationCollector(
            this.library, new ImportsAggregateCollector(this.library, true))
    }
    // private get declarationTable(): DeclarationTable {
    //     return this.library.declarationTable
    // }

    private processBuilder(target: idl.IDLInterface, isActualDeclaration: boolean) {
        let name = target.name!
        if (this.library.builderClasses.has(name)) {
            return
        }

        if (isCustomBuilderClass(name)) {
            return
        }

        const builderClass = toBuilderClass(name, target, isActualDeclaration)
        this.library.builderClasses.set(name, builderClass)
    }

    // private processMaterialized(target: ts.InterfaceDeclaration | ts.ClassDeclaration, isActualDeclaration: boolean) {
    //     let name = nameOrNull(target.name)!
    //     if (this.library.materializedClasses.has(name)) {
    //         return
    //     }

    //     const isClass = ts.isClassDeclaration(target)
    //     const isInterface = ts.isInterfaceDeclaration(target)

    //     const superClassType = target.heritageClauses
    //         ?.filter(it => it.token == ts.SyntaxKind.ExtendsKeyword)[0]?.types[0]


    //     const superClass = superClassType ?
    //         new SuperElement(
    //             identName(superClassType.expression)!,
    //             superClassType.typeArguments?.filter(ts.isTypeReferenceNode).map(it => identName(it.typeName)!))
    //         : undefined

    //     const importFeatures = this.serializeDepsCollector.convert(target)
    //         .filter(it => this.isSourceDecl(it))
    //         .filter(it => PeerGeneratorConfig.needInterfaces || checkTSDeclarationMaterialized(it) || isSyntheticDeclaration(it))
    //         .map(it => convertDeclToFeature(this.library, it))
    //     const generics = target.typeParameters?.map(it => it.getText())

    //     let constructor = isClass ? target.members.find(ts.isConstructorDeclaration) : undefined
    //     let mConstructor = this.makeMaterializedMethod(name, constructor, isActualDeclaration)
    //     const finalizerReturnType = {isVoid: false, nativeType: () => PrimitiveType.NativePointer.getText(), macroSuffixPart: () => ""}
    //     let mFinalizer = new MaterializedMethod(name, [], [], finalizerReturnType, false,
    //         new Method("getFinalizer", new NamedMethodSignature(Type.Pointer, [], [], []), [MethodModifier.STATIC]))
    //     let mFields = isClass
    //         ? target.members
    //             .filter(ts.isPropertyDeclaration)
    //             .map(it => this.makeMaterializedField(name, it))
    //         : isInterface
    //             ? target.members
    //                 .filter(ts.isPropertySignature)
    //                 .map(it => this.makeMaterializedField(name, it))
    //             : []

    //     let mMethods = isClass
    //         ? target.members
    //             .filter(ts.isMethodDeclaration)
    //             .map(method => this.makeMaterializedMethod(name, method, isActualDeclaration))
    //         : isInterface
    //             ? target.members
    //             .filter(ts.isMethodSignature)
    //             .map(method => this.makeMaterializedMethod(name, method, isActualDeclaration))
    //             : []


    //     mFields.forEach(f => {
    //         const field = f.field
    //         // TBD: use deserializer to get complex type from native
    //         const isSimpleType = !f.argConvertor.useArray // type needs to be deserialized from the native
    //         if (isSimpleType) {
    //             const getAccessor = new MaterializedMethod(name, [], [], f.retConvertor, false,
    //                 new Method(`get${capitalize(field.name)}`, new NamedMethodSignature(field.type, [], []), [MethodModifier.PRIVATE])
    //             )
    //             mMethods.push(getAccessor)
    //         }

    //         const isReadOnly = field.modifiers.includes(FieldModifier.READONLY)
    //         if (!isReadOnly) {
    //             const setSignature = new NamedMethodSignature(Type.Void, [field.type], [field.name])
    //             const retConvertor = { isVoid: true, nativeType: () => Type.Void.name, macroSuffixPart: () => "V" }
    //             const setAccessor = new MaterializedMethod(name, [f.declarationTarget], [f.argConvertor], retConvertor, false,
    //                 new Method(`set${capitalize(field.name)}`, setSignature, [MethodModifier.PRIVATE])
    //             )
    //             mMethods.push(setAccessor)
    //         }
    //     })

    //     this.library.materializedClasses.set(name,
    //         new MaterializedClass(name, isInterface, superClass, generics, mFields, mConstructor, mFinalizer, importFeatures, mMethods, isActualDeclaration))
    // }

    // private makeMaterializedField(className: string, property: ts.PropertyDeclaration | ts.PropertySignature): MaterializedField {
    //     const name = identName(property.name)!
    //     this.declarationTable.setCurrentContext(`Materialized_${className}_${name}`)
    //     const declarationTarget = this.declarationTable.toTarget(property.type!)
    //     const argConvertor = this.declarationTable.typeConvertor(name, property.type!)
    //     const retConvertor = generateRetConvertor(property.type!)
    //     const modifiers = isReadonly(property.modifiers) ? [FieldModifier.READONLY] : []
    //     this.declarationTable.setCurrentContext(undefined)
    //     return new MaterializedField(declarationTarget, argConvertor, retConvertor,
    //         new Field(name, new Type(mapType(property.type)), modifiers))
    // }

    // private makeMaterializedMethod(parentName: string, method: ts.ConstructorDeclaration | ts.MethodDeclaration | ts.MethodSignature | undefined, isActualDeclaration: boolean) {
    //     const methodName = method === undefined || ts.isConstructorDeclaration(method) ? "ctor" : identName(method.name)!
    //     this.declarationTable.setCurrentContext(`Materialized_${parentName}_${methodName}`)

    //     const retConvertor = method === undefined || ts.isConstructorDeclaration(method)
    //         ? { isVoid: false, isStruct: false, nativeType: () => PrimitiveType.NativePointer.getText(), macroSuffixPart: () => "" }
    //         : generateRetConvertor(method.type)

    //     if (method === undefined) {
    //         // interface or class without constructors
    //         const ctor = new Method("ctor", new NamedMethodSignature(Type.Void, [], []), [MethodModifier.STATIC])
    //         this.declarationTable.setCurrentContext(undefined)
    //         return new MaterializedMethod(parentName, [], [], retConvertor, false, ctor)
    //     }

    //     const generics = method.typeParameters?.map(it => it.getText())
    //     const declarationTargets = method.parameters.map(param =>
    //         this.declarationTable.toTarget(param.type ??
    //             throwException(`Expected a type for ${asString(param)} in ${asString(method)}`)))
    //     method.parameters.forEach(it => this.declarationTable.requestType(undefined, it.type!, isActualDeclaration))
    //     const argConvertors = method.parameters.map(param => generateArgConvertor(this.declarationTable, param))
    //     const signature = generateSignature(method)
    //     const modifiers = ts.isConstructorDeclaration(method) || isStatic(method.modifiers) ? [MethodModifier.STATIC] : []
    //     this.declarationTable.setCurrentContext(undefined)
    //     return new MaterializedMethod(parentName, declarationTargets, argConvertors, retConvertor, false,
    //         new Method(methodName, signature, modifiers, generics))
    // }

    private collectDepsRecursive(decl: idl.IDLEntry, deps: Set<idl.IDLEntry>): void {
        const isDeclaration = idl.isClass(decl) || idl.isInterface(decl) || idl.isAnonymousInterface(decl) ||
            idl.isTupleInterface(decl) || idl.isEnum(decl) || idl.isTypedef(decl) || idl.isCallback(decl)
        const currentDeps = isDeclaration
            ? convertDeclaration(this.declDependenciesCollector, decl)
            : convertType(this.typeDependenciesCollector, decl as idl.IDLType)
        for (const dep of currentDeps) {
            if (deps.has(dep)) continue
            if (!isSourceDecl(dep)) continue
            deps.add(dep)
            this.collectDepsRecursive(dep, deps)
        }
    }

    private processEnum(decl: idl.IDLEnum) {
        // TODO do we need this? Cannot we just put all IDLEnums from a peer file into Ark*Interface.ts?
        const comment = decl.documentation ?? ""
        const enumEntity = new EnumEntity(decl.name, comment)
        decl.elements.forEach(child => {
            const comment = child.documentation ?? ""
            enumEntity.pushMember(child.name, comment, child.initializer?.toString())
        })
        this.library.findFileByOriginalFilename(decl.fileName ?? "MISSING_FILENAME")!.pushEnum(enumEntity)
    }

    // private getDeclSourceFile(node: ts.Declaration): ts.SourceFile {
    //     if (ts.isModuleBlock(node.parent))
    //         return this.getDeclSourceFile(node.parent.parent)
    //     if (!ts.isSourceFile(node.parent))
    //         throw 'Expected declaration to be at file root'
    //     return node.parent
    // }

    private generateActualComponents(): IdlComponentDeclaration[] {
        const components = this.library.componentsDeclarations
        if (!this.library.componentsToGenerate.size)
            return components
        const entryComponents = components.filter(it => this.library.shouldGenerateComponent(it.name))
        return components.filter(component => entryComponents.includes(component))
    }

    private generateDeclarations(components: IdlComponentDeclaration[]): Set<idl.IDLEntry> {
        const deps: Set<idl.IDLEntry> = new Set(
            components.flatMap(it => {
                const decls = [it.attributesDeclarations]
                if (it.interfaceDeclaration)
                    decls.push(it.interfaceDeclaration)
                return decls
            }))
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
        for (const dep of Array.from(deps)) {
            if (isConflictedDeclaration(dep)) {
                deps.delete(dep)
                this.library.conflictedDeclarations.add(dep)
            }
        }
        return deps
    }

    process(): void {
        new ComponentsCompleter(this.library).process()
        const peerGenerator = new PeersGenerator(this.library)
        for (const component of this.library.componentsDeclarations)
            peerGenerator.generatePeer(component)
        const allDeclarations = this.generateDeclarations(this.library.componentsDeclarations)
        const actualDeclarations = this.generateDeclarations(this.generateActualComponents())

        for (const dep of allDeclarations) {
            if (isSyntheticDeclaration(dep))
                continue
            const file = this.library.findFileByOriginalFilename(dep.fileName!)!
            const isPeerDecl = idl.isInterface(dep) && this.library.isComponentDeclaration(dep)
            const isActualDeclaration = actualDeclarations.has(dep)

            if (!isPeerDecl && (idl.isClass(dep) || idl.isInterface(dep))) {
                if (isBuilderClass(dep)) {
                    this.processBuilder(dep, isActualDeclaration)
                // } else if (isMaterialized(dep)) {
                //     this.processMaterialized(dep, isActualDeclaration)
                //     continue
                }
            }

            if (!isActualDeclaration)
                continue

            if (idl.isEnum(dep)) {
                this.processEnum(dep)
                continue
            }

            this.declDependenciesCollector.convert(dep).forEach(it => {
                if (isSourceDecl(it) &&
                    (PeerGeneratorConfig.needInterfaces || isSyntheticDeclaration(it)) &&
                    needImportFeature(this.library.language, it))
                {
                    file.importFeatures.push(convertDeclToFeature(this.library, it))
                }
            })
            this.serializeDepsCollector.convert(dep).forEach(it => {
                if (isSourceDecl(it) &&
                    PeerGeneratorConfig.needInterfaces &&
                    needImportFeature(this.library.language, it))
                {
                    file.serializeImportFeatures.push(convertDeclToFeature(this.library, it))
                }
            })
            if (PeerGeneratorConfig.needInterfaces && needImportFeature(this.library.language, dep)) {
                file.declarations.add(dep)
                file.importFeatures.push(convertDeclToFeature(this.library, dep))
            }
        }
    }
}

function needImportFeature(language: Language, decl: idl.IDLEntry): boolean {
    if (language === Language.ARKTS) {
        if (idl.isInterface(decl) && isMaterialized(decl))
            return false
        return idl.isEnum(decl) || idl.isInterface(decl) || idl.isTypedef(decl)
    }
    return true;
}

function convertDeclToFeature(library: IdlPeerLibrary, node: idl.IDLEntry): ImportFeature {
    if (isSyntheticDeclaration(node))
        return {
            feature: convertDeclaration(DeclarationNameConvertor.I, node), 
            module: `./${syntheticDeclarationFilename(node)}`
        }
    if (isConflictedDeclaration(node)) {
        // const parent = node.parent
        let feature = /*ts.isModuleBlock(parent)
            ? parent.parent.name.text
            : */convertDeclaration(DeclarationNameConvertor.I, node)
        return {
            feature: feature,
            module: './ConflictedDeclarations'
        }
    }

    const originalBasename = path.basename(node.fileName!)
    let fileName = renameDtsToInterfaces(originalBasename, library.language)
    if ((idl.isInterface(node) || idl.isClass(node)) && !library.isComponentDeclaration(node)) {
        if (isBuilderClass(node)) {
            fileName = renameClassToBuilderClass(node.name, library.language)
        } else if (isMaterialized(node)) {
            fileName = renameClassToMaterialized(node.name, library.language)
        }
    }

    const basename = path.basename(fileName)
    const basenameNoExt = basename.replaceAll(path.extname(basename), '')
    return {
        feature: convertDeclaration(DeclarationNameConvertor.I, node),
        module: `./${basenameNoExt}`,
    }
}

function createTypeDependenciesCollector(library: IdlPeerLibrary): TypeDependenciesCollector {
    return library.language === Language.TS
        ? new ImportsAggregateCollector(library, false)
        : new ArkTSImportsAggregateCollector(library, false)
    }


export function isConflictedDeclaration(decl: idl.IDLEntry): boolean {// stolen from PGConfig
    // if (!this.needInterfaces) return false
    // duplicate type declarations with different signatures
    if (idl.isInterface(decl) && decl.name === 'OnWillScrollCallback') return true
    // has same named class and interface
    if ((idl.isInterface(decl)) && decl.name === 'LinearGradient') return true
    // just has ugly dependency WrappedBuilder - there is conflict in generic types
    if (idl.isInterface(decl) && decl.name === 'ContentModifier') return true
    // complicated type arguments
    if (idl.isInterface(decl) && decl.name === 'TransitionEffect') return true
    // inside namespace
    if (idl.isEnum(decl) && decl.name === 'GestureType') return true
    // no return type in some methods
    if (idl.isInterface(decl) && decl.name === 'LayoutChild') return true
    return false
}

export function isBuilderClass(declaration: idl.IDLInterface): boolean {// stolen from BUilderClass

    // Builder classes are classes with methods which have only one parameter and return only itself

    const className = declaration.name!

    if (PeerGeneratorConfig.builderClasses.includes(className)) {
        return true
    }

    if (isCustomBuilderClass(className)) {
        return true
    }

    // TBD: update builder class check condition.
    // Only SubTabBarStyle, BottomTabBarStyle, DotIndicator, and DigitIndicator classes
    // are used for now.

    return false

    /*
    if (PeerGeneratorConfig.isStandardNameIgnored(className)) {
        return false
    }

    const methods: (ts.MethodSignature | ts.MethodDeclaration)[] = [
        ...ts.isClassDeclaration(declaration) ? declaration.members.filter(ts.isMethodDeclaration) : [],
    ]

    if (methods.length === 0) {
        return false
    }

    return methods.every(it => it.type && className == it.type.getText() && it.parameters.length === 1)
    */
}

function toBuilderClass(name: string, target: idl.IDLInterface, needBeGenerated: boolean) {
    const isIface = idl.isInterface(target)
    // const fields = target.properties.map(it => toBuilderField(it))
    // const constructors = target.constructors.map(method => toBuilderMethod(method))
        // : [toBuilderMethod(undefined)]
    // const methods = getBuilderMethods(target)
    return new BuilderClass(name, isIface, undefined, [], [], []/*fields, constructors, methods*/, [], needBeGenerated)
}

// function getBuilderMethods(target: IDLInterface): Method[] {

//     const heritageMethods = target.heritageClauses
//         ?.flatMap(it => heritageDeclarations(typeChecker, it))
//         .flatMap(it => (ts.isClassDeclaration(it) || ts.isInterfaceDeclaration(it))
//             ? getBuilderMethods(it, typeChecker)
//             : [])
//         ?? []

//     const isClass = ts.isClassDeclaration(target)
//     const isInterface = ts.isInterfaceDeclaration(target)

//     const methods = isClass
//         ? target.members
//             .filter(ts.isMethodDeclaration)
//             .map(method => toBuilderMethod(method))
//         : isInterface
//             ? target.members
//                 .filter(ts.isMethodSignature)
//                 .map(method => toBuilderMethod(method))
//             : []

//     return [...heritageMethods, ...methods]
// }

// function toBuilderField(property: ts.PropertyDeclaration | ts.PropertySignature): Field {
//     const fieldName = identName(property.name)!
//     const modifiers = isReadonly(property.modifiers) ? [FieldModifier.READONLY] : []
//     const isOptional = property.questionToken !== undefined
//     return new Field(fieldName, new Type(mapType(property.type), isOptional), modifiers)
// }

// function toBuilderMethod(method: ts.ConstructorDeclaration | ts.MethodDeclaration | ts.MethodSignature | undefined): Method {
//     const methodName = method === undefined || ts.isConstructorDeclaration(method) ? "constructor" : identName(method.name)!

//     if (method === undefined) {
//         return new Method(methodName, new NamedMethodSignature(Type.Void))
//     }

//     const generics = method.typeParameters?.map(it => it.getText())
//     const signature = generateSignature(method)
//     const modifiers = ts.isConstructorDeclaration(method) || isStatic(method.modifiers) ? [MethodModifier.STATIC] : []

//     return new Method(methodName, signature, modifiers, generics)
// }

export function isCommonMethodOrSubclass(library: IdlPeerLibrary, decl?: idl.IDLEntry): boolean {
    if (!decl || !idl.isInterface(decl))
        return false
    let isSubclass = isRoot(decl.name)
    const superType = idl.getSuperType(decl)
    if (superType && idl.isReferenceType(superType)) {
        const superDecl = library.resolveTypeReference(superType)
            // let name = asString(it.name)
            // isSubclass = isSubclass || isRoot(name)
            // if (!ts.isClassDeclaration(it)) return isSubclass
        isSubclass ||= isCommonMethodOrSubclass(library, superDecl)
    }
    return isSubclass
}

export function isSourceDecl(node: idl.IDLEntry): boolean {
    if (isSyntheticDeclaration(node))
        return true
    // if (isModuleType(node.parent))
    //     return this.isSourceDecl(node.parent.parent)
    // if (isTypeParameterType(node))
    //     return false
    // if (!ts.isSourceFile(node.parent))
    //     throw 'Expected declaration to be at file root'
    return !node.fileName?.endsWith('stdlib.d.ts')
}
