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
import {
    capitalize,
    Language,
    isRoot,
    generatorConfiguration,
    isInIdlizeInternal,
    isInIdlize,
    qualifiedName,
    isStaticMaterialized,
    isInCurrentModule,
    ArgumentModifier,
    getSuper,
    getSuperType,
    PeerMethodSignature,
    PeerMethodArg,
    createOutArgConvertor
} from '@idlizer/core'
import { ArgConvertor, PeerLibrary } from "@idlizer/core"
import { peerGeneratorConfiguration} from "../../DefaultConfiguration";
import { getInternalClassName, isBuilderClass, MaterializedClass, MaterializedField, MaterializedMethod } from "@idlizer/core"
import { Field, FieldModifier, Method, MethodModifier, NamedMethodSignature } from "../LanguageWriters";
import { BuilderClass, isMaterialized } from "@idlizer/core";
import { ImportFeature } from "../ImportsCollector"
import { convertDeclToFeature } from "../ImportsCollectorUtils"
import { collectComponents, findComponentByType, IdlComponentDeclaration, isComponentDeclaration } from "../ComponentsCollector"
import { ReferenceResolver } from "@idlizer/core"
import * as path from "path"

export interface DependencyFilter {
    shouldAdd(node: idl.IDLNode): boolean
}

class EmptyDependencyFilter implements DependencyFilter {
    shouldAdd(node: idl.IDLEntry): boolean {
        return true
    }
}

class SyntheticDependencyConfigurableFilter implements DependencyFilter {
    constructor(
        protected readonly library: PeerLibrary,
        private readonly config: {
            skipAnonymousInterfaces?: boolean,
            skipCallbacks?: boolean,
            skipTuples?: boolean,
        },
    ) {}
    shouldAdd(node: idl.IDLEntry): boolean {
        if (!idl.isSyntheticEntry(node)) return true
        if (idl.isInterface(node)) {
            if (node.subkind === idl.IDLInterfaceSubkind.AnonymousInterface && this.config.skipAnonymousInterfaces)
                return false
            if (node.subkind === idl.IDLInterfaceSubkind.Tuple && this.config.skipTuples)
                return false
        }
        if (this.config.skipCallbacks && node.kind == idl.IDLKind.Callback) return false
        return true
    }
}

export class ArkTSBuiltTypesDependencyFilter implements DependencyFilter {
    readonly IGNORE_TYPES = [
        "ArrayBuffer",
        "Uint8Array",
        "Uint8ClampedArray"]
    shouldAdd(node: idl.IDLEntry): boolean {
        return !(node.name !== undefined && this.IGNORE_TYPES.includes(node.name));
    }
}

class ArkTSSyntheticDependencyConfigurableFilter extends SyntheticDependencyConfigurableFilter {
    readonly arkTSBuiltTypesFilter = new ArkTSBuiltTypesDependencyFilter()
    shouldAdd(node: idl.IDLEntry): boolean {
        if (!this.arkTSBuiltTypesFilter.shouldAdd(node)) {
            return false
        }
        return super.shouldAdd(node)
    }
}

export class IdlPeerProcessor {
    private readonly dependencyFilter: DependencyFilter

    constructor(
        private readonly library: PeerLibrary,
    ) {
        this.dependencyFilter = createDependencyFilter(this.library)
    }

    private processBuilder(target: idl.IDLInterface) {
        let name = target.name!
        if (this.library.builderClasses.has(name)) {
            return
        }

        const builderClass = this.toBuilderClass(name, target)
        this.library.builderClasses.set(name, builderClass)
    }

    private toBuilderClass(name: string, target: idl.IDLInterface) {
        const isIface = idl.isInterface(target)
        const fields = target.properties.map(it => this.toBuilderField(it))
        const constructors = target.constructors.map(method => this.toBuilderMethod(method, name))
        const methods = this.getBuilderMethods(target)
        return new BuilderClass(target, name, undefined, isIface, undefined, fields, constructors, methods)
    }

    private toBuilderField(prop: idl.IDLProperty): Field {
        const modifiers = prop.isReadonly ? [FieldModifier.READONLY] : []
        return new Field(prop.name, idl.maybeOptional(prop.type, prop.isOptional), modifiers)
    }

    private getBuilderMethods(target: idl.IDLInterface, className?: string): Method[] {
        return [
            ...target.inheritance
                .filter(it => {
                    if (!this.library.resolveTypeReference(it))
                        console.log(`Cannot resolve ${it.name}`)
                    return true
                })
                .map(it => this.library.resolveTypeReference(it)!)
                .filter(it => idl.isInterface(it))
                .flatMap(it => this.getBuilderMethods(it as idl.IDLInterface, target.name)),
            ...target.methods.map(it => this.toBuilderMethod(it, className))]
    }

    private toBuilderMethod(method: idl.IDLConstructor | idl.IDLMethod | undefined, className?: string): Method {
        if (!method)
            return new Method("constructor", new NamedMethodSignature(idl.IDLVoidType))
        const methodName = idl.isConstructor(method) ? "constructor" : method.name
        const isStatic = idl.isConstructor(method) || (idl.isMethod(method) && (method.isStatic || method.isFree))
        // const generics = method.typeParameters?.map(it => it.getText())
        const signature = new NamedMethodSignature(
            isStatic ? method.returnType! : idl.IDLThisType,
            method.parameters.map(it => idl.maybeOptional(it.type!, it.isOptional)),
            method.parameters.map(it => it.name)
        )
        return new Method(methodName, signature, getMethodModifiers(method))
    }

    private processMaterialized(decl: idl.IDLInterface, isStaticMaterialized: boolean = false) {
        if (!isInCurrentModule(decl)) {
            return
        }
        if (peerGeneratorConfiguration().isHandWritten(decl.name)) {
            return
        }
        const fullCName = qualifiedName(decl, "_", "namespace.name")
        if (this.library.materializedClasses.has(fullCName)) {
            return
        }

        const isDeclInterface = idl.isInterfaceSubkind(decl) && !isStaticMaterialized
        const implemenationParentName = isDeclInterface ? getInternalClassName(decl.name) : decl.name
        const resolvedDecl = getSuper(decl, this.library)
        const interfaces: idl.IDLReferenceType[] = []
        const propertiesFromInterface: idl.IDLProperty[] = []
        let superType: idl.IDLReferenceType | undefined = undefined
        if (resolvedDecl) {
            superType = getSuperType(decl, this.library)
            if (!resolvedDecl || !idl.isInterface(resolvedDecl) || !isMaterialized(resolvedDecl, this.library)) {
                propertiesFromInterface.push(...getUniquePropertiesFromSuperTypes(decl, this.library))
                interfaces.push(superType!)
                superType = undefined
            }
        }

        let constructors: idl.IDLConstructor[] = decl.constructors
        if (constructors.length == 0 && !isStaticMaterialized) {
            if (decl.callables.length > 0) {
                const first = decl.callables[0]
                const constructor = idl.createConstructor(
                    [...first.parameters],
                    first.returnType,
                    {
                        documentation: first.documentation,
                        extendedAttributes: first.extendedAttributes,
                        fileName: first.fileName
                    }
                )
                constructors = [constructor]
            } else {
                constructors = [idl.createConstructor([], idl.IDLVoidType)]
            }
        }
        const mConstructors = isStaticMaterialized ? [] : constructors.map(c => this.makeMaterializedMethod(decl, c, fullCName, implemenationParentName))
        const mFinalizer = isStaticMaterialized ? undefined : new MaterializedMethod(
            new PeerMethodSignature(
                PeerMethodSignature.GET_FINALIZER,
                idl.getFQName(decl).split('.').concat(PeerMethodSignature.GET_FINALIZER).join('_'),
                [],
                idl.IDLPointerType,
            ),
            fullCName, implemenationParentName, idl.IDLPointerType, false,
            new Method("getFinalizer", new NamedMethodSignature(idl.IDLPointerType, [], [], []), [MethodModifier.STATIC]))
        const mFields = propertiesFromInterface.concat(decl.properties)
            // TODO what to do with setter accessors? Do we need FieldModifier.WRITEONLY? For now, just skip them
            .filter(it => idl.getExtAttribute(it, idl.IDLExtendedAttributes.Accessor) !== idl.IDLAccessorAttribute.Setter)
            .map(it => this.makeMaterializedField(it))
        const mMethods = decl.methods
            // TODO: Properly handle methods with return Promise<T> type
            .map(method => this.makeMaterializedMethod(decl, method, fullCName, implemenationParentName))
            .filter(it => !idl.isNamedNode(it.method.signature.returnType) || !peerGeneratorConfiguration().materialized.ignoreReturnTypes.includes(it.method.signature.returnType.name))

        const taggedMethods = decl.methods.filter(m => m.extendedAttributes?.find(it => it.name === idl.IDLExtendedAttributes.DtsTag))

        mFields.forEach(f => {
            const field = f.field
            const idlType = field.type
            const isStatic = field.modifiers.includes(FieldModifier.STATIC)
            const getSignature = new NamedMethodSignature(idl.maybeOptional(field.type, f.isNullableOriginalTypeField), [], [])
            const sameNamedGetters = mFields.filter(it => it.field.name === f.field.name)
            const overloadPostfix = sameNamedGetters.length > 1 ? sameNamedGetters.indexOf(f).toString() : ``
            const getAccessor = new MaterializedMethod(
                new PeerMethodSignature(
                    `get${capitalize(field.name)}${overloadPostfix}`,
                    idl.getFQName(decl).split('.').concat(`get${capitalize(field.name)}${overloadPostfix}`).join('_'),
                    [],
                    idl.maybeOptional(idlType, f.isNullableOriginalTypeField),
                    isStatic ? undefined : decl,
                ),
                fullCName, implemenationParentName, idl.maybeOptional(field.type, f.isNullableOriginalTypeField), false,
                new Method(`get${capitalize(field.name)}`, getSignature, [MethodModifier.PRIVATE, ...(isStatic ? [MethodModifier.STATIC]:[])]))
            mMethods.push(getAccessor)
            const isReadOnly = field.modifiers.includes(FieldModifier.READONLY)
            if (!isReadOnly) {
                const setSignature = new NamedMethodSignature(idl.IDLVoidType, [idl.maybeOptional(idlType, f.isNullableOriginalTypeField)], [field.name])
                const setAccessor = new MaterializedMethod(
                    new PeerMethodSignature(
                        `set${capitalize(field.name)}${overloadPostfix}`,
                        idl.getFQName(decl).split('.').concat(`set${capitalize(field.name)}${overloadPostfix}`).join('_'),
                        [new PeerMethodArg(f.field.name, idl.maybeOptional(idlType, f.isNullableOriginalTypeField))],
                        idl.IDLVoidType,
                        isStatic ? undefined : decl,
                    ),
                    fullCName, implemenationParentName, idl.IDLVoidType, false,
                    new Method(`set${capitalize(field.name)}`, setSignature, [MethodModifier.PRIVATE, ...(isStatic ? [MethodModifier.STATIC]:[])]))
                mMethods.push(setAccessor)
            }
        })
        this.library.materializedClasses.set(fullCName,
            new MaterializedClass(decl, decl.name, isDeclInterface, isStaticMaterialized, superType, interfaces, decl.typeParameters,
                mFields, mConstructors, mFinalizer, mMethods, true, taggedMethods))
    }

    private makeMaterializedField(prop: idl.IDLProperty): MaterializedField {
        const argConvertor = this.library.typeConvertor(prop.name, prop.type!, prop.isOptional)
        const modifiers: FieldModifier[] = []
        if (prop.isReadonly)
            modifiers.push(FieldModifier.READONLY)
        if (prop.isStatic)
            modifiers.push(FieldModifier.STATIC)
        return new MaterializedField(
            new Field(prop.name, prop.type, modifiers),
            argConvertor,
            createOutArgConvertor(this.library, prop.type, [prop.name]),
            prop.isOptional,
            idl.getExtAttribute(prop, idl.IDLExtendedAttributes.ExtraMethod))
    }

    private makeMaterializedMethod(
        decl: idl.IDLInterface,
        method: idl.IDLConstructor | idl.IDLMethod | undefined,
        originalParentName: string,
        implemenationParentName: string,
    ) {
        let methodName = PeerMethodSignature.CTOR
        let returnType: idl.IDLType = idl.createReferenceType(decl)
        if (method && !idl.isConstructor(method)) {
            methodName = method.name
            returnType = method.returnType
        }
        if (method === undefined) {
            // interface or class without constructors
            const ctor = new Method(PeerMethodSignature.CTOR, new NamedMethodSignature(idl.createReferenceType(decl), [], []), [MethodModifier.STATIC])
            return new MaterializedMethod(new PeerMethodSignature(
                PeerMethodSignature.CTOR,
                idl.getFQName(decl).split('.').concat(PeerMethodSignature.CTOR).join('_'),
                [],
                returnType,
            ), originalParentName, implemenationParentName, returnType, false, ctor)
        }

        const signature = generateSignature(method, returnType)
        const overloadPostfix = PeerMethodSignature.generateOverloadPostfix(method)
        return new MaterializedMethod(
            new PeerMethodSignature(
                methodName + overloadPostfix,
                idl.getFQName(decl).split('.').concat(methodName + overloadPostfix).join('_'),
                signature.args.map((it, index) => new PeerMethodArg(signature.argName(index), it)),
                signature.returnType,
                idl.isMethod(method) && !method.isStatic ? decl : undefined,
            ),
            originalParentName, implemenationParentName, returnType, false,
            new Method(methodName,
                signature,
                getMethodModifiers(method),
                method.typeParameters)
        )
    }

    private ignoreDeclaration(decl: idl.IDLEntry, language: Language): boolean {
        return isInIdlize(decl) ||
            peerGeneratorConfiguration().ignoreEntry(decl.name!, language)
    }

    process(): void {
        // initCustomBuilderClasses()
        const allDeclarations = this.library.files.flatMap(file => idl.linearizeNamespaceMembers(file.entries))
        const curConfig = generatorConfiguration()
        const curPeerConfig = peerGeneratorConfiguration()
        console.log(curConfig.LibraryPrefix, curPeerConfig.LibraryPrefix)

        for (const dep of allDeclarations) {
            if (peerGeneratorConfiguration().ignoreEntry(dep.name, this.library.language) || this.ignoreDeclaration(dep, this.library.language) || idl.isHandwritten(dep) || isInIdlizeInternal(dep))
                continue
            const isPeerDecl = idl.isInterface(dep) && isComponentDeclaration(this.library, dep)
            if (!isPeerDecl && idl.isInterface(dep) && [idl.IDLInterfaceSubkind.Class, idl.IDLInterfaceSubkind.Interface].includes(dep.subkind)) {
                if (isBuilderClass(dep)) {
                    this.processBuilder(dep)
                    continue
                } else if (isStaticMaterialized(dep, this.library)) {
                    this.processMaterialized(dep, true)
                    continue
                } else if (isMaterialized(dep, this.library)) {
                    this.processMaterialized(dep)
                    continue
                }
            }
        }
    }
}

export function createDependencyFilter(library: PeerLibrary): DependencyFilter {
    switch (library.language) {
        case Language.TS:
            return new SyntheticDependencyConfigurableFilter(library,
                {
                    skipAnonymousInterfaces: true,
                    skipCallbacks: false,
                    skipTuples: false
                })
        case Language.ARKTS:
            return new ArkTSSyntheticDependencyConfigurableFilter(library,
                {
                    skipAnonymousInterfaces: false,
                    skipCallbacks: true,
                    skipTuples: false
                })
        case Language.JAVA: return new EmptyDependencyFilter()
        case Language.CJ: return new EmptyDependencyFilter()
    }
    // TODO: support other languages
    return new EmptyDependencyFilter()
}

export function isCommonMethodOrSubclass(library: PeerLibrary, decl?: idl.IDLEntry): boolean {
    if (!decl || !idl.isInterface(decl))
        return false
    let isSubclass = isRoot(decl.name)
    const superDecl = getSuper(decl, library)
    if (superDecl) {
        isSubclass ||= isCommonMethodOrSubclass(library, superDecl)
    }
    return isSubclass
}

export function isSourceDecl(node: idl.IDLEntry): boolean {
    // if (isNamespace(node.parent))
    //     return this.isSourceDecl(node.parent.parent)
    // if (isTypeParameterType(node))
    //     return false
    // if (!ts.isSourceFile(node.parent))
    //     throw 'Expected declaration to be at file root'
    return !node.fileName?.endsWith('stdlib.d.ts')
}

function generateSignature(
    method: idl.IDLCallable | idl.IDLMethod | idl.IDLConstructor,
    returnType?: idl.IDLType
): NamedMethodSignature {
    returnType ??= method.returnType!
    // if (idl.isConstructor(method) && method.parent)
    //     returnType = idl.createReferenceType(method.parent as idl.IDLInterface)
    if (returnType === undefined) {
        throw new Error(`Return type for ${method.name} is undefined`)
    }
    return new NamedMethodSignature(
        returnType ?? method.returnType!,
        method.parameters.map(it => idl.maybeOptional(it.type!, it.isOptional)),
        method.parameters.map(it => it.name),
        undefined,
        method.parameters.map(it => it.isOptional ? ArgumentModifier.OPTIONAL : undefined)
    )
}

export function forEachSuperType(declaration: idl.IDLInterface, resolver: ReferenceResolver, callback: (superType: idl.IDLInterface) => void) {
    const superDecl = getSuper(declaration, resolver)
    if (!superDecl) return

    callback(superDecl)
    forEachSuperType(superDecl, resolver, callback)
}

export function getUniquePropertiesFromSuperTypes(declaration: idl.IDLInterface, resolver: ReferenceResolver): idl.IDLProperty[] {
    const result: idl.IDLProperty[] = []
    const seenProperties = new Set<string>()
    forEachSuperType(declaration, resolver, (superInterface) => {
        const props = superInterface.properties
        if (props) {
            props.forEach((property) => {
                if (seenProperties.has(property.name)) return
                result.push(property)
                seenProperties.add(property.name)

            })
        }
    })
    return result
}

export function convertTypeToFeature(library: PeerLibrary, type: idl.IDLType): ImportFeature | undefined {
    const typeReference = idl.isReferenceType(type)
        ? library.resolveTypeReference(type)
        : undefined
    if (typeReference !== undefined) {
        return convertDeclToFeature(library, typeReference)
    }
    return undefined
}

// function initCustomBuilderClasses(library: PeerLibrary) {
//     function builderMethod(name: string, type: idl.IDLType): Method {
//         return new Method(name, new NamedMethodSignature(idl.IDLThisType, [type], ["value"]))
//     }
//     const decl = idl.createInterface(
//         "Indicator",
//         idl.IDLInterfaceSubkind.Class,
//         [],
//         [idl.createConstructor([], undefined)],
//         undefined,
//         undefined,
//         [
//             ...["left", "top", "right", "bottom"].map(it => idl.createMethod(it,
//                 [idl.createParameter("value", idl.createReferenceType("Length"))],
//                 idl.IDLThisType,
//             )),
//             ...["start", "end"].map(it => idl.createMethod(it,
//                 [idl.createParameter(`value`, idl.createReferenceType("LengthMetrics"))],
//                 idl.IDLThisType,
//             )),
//             idl.createMethod(`dot`, [], idl.createReferenceType(`DotIndicator`)),
//             idl.createMethod(`digit`, [], idl.createReferenceType(`DigitIndicator`)),
//         ]
//     )
//     CUSTOM_BUILDER_CLASSES.push(
//         new BuilderClass(decl, "Indicator", ["T"], false, undefined,
//             [], // fields
//             [new Method("constructor", new MethodSignature(idl.IDLVoidType, []))],
//             [
//                 ...["left", "top", "right", "bottom"].map(it => builderMethod(it, idl.createReferenceType("Length"))),
//                 ...["start", "end"].map(it => builderMethod(it, idl.createReferenceType("LengthMetrics"))),
//                 new Method("dot", new MethodSignature(idl.createReferenceType("DotIndicator"), []), [MethodModifier.STATIC]),
//                 new Method("digit", new MethodSignature(idl.createReferenceType("DigitIndicator"), []), [MethodModifier.STATIC]),
//             ]
//         )
//     )
// }

export function getMethodModifiers(method: idl.IDLMethod | idl.IDLConstructor | idl.IDLCallable): MethodModifier[] {
    const modifiers = []
    if (idl.isConstructor(method) || (idl.isMethod(method) && (method.isStatic || method.isFree)))
        modifiers.push(MethodModifier.STATIC)
    if (idl.hasExtAttribute(method, idl.IDLExtendedAttributes.Throws))
        modifiers.push(MethodModifier.THROWS)
    return modifiers
}
