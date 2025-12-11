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
    groupBy,
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
    createOutArgConvertor,
    getExtendsChain
} from '@idlizer/core'
import { ArgConvertor, PeerLibrary } from "@idlizer/core"
import { peerGeneratorConfiguration} from "../../DefaultConfiguration";
import { getInternalClassName, MaterializedClass, MaterializedField, MaterializedMethod } from "@idlizer/core"
import { Field, FieldModifier, Method, MethodModifier, NamedMethodSignature } from "../LanguageWriters";
import { isMaterialized } from "@idlizer/core";
import { ImportFeature } from "../ImportsCollector"
import { convertDeclToFeature } from "../ImportsCollectorUtils"
import { collectComponents, findComponentByType, IdlComponentDeclaration, isComponentDeclaration } from "../ComponentsCollector"
import { ReferenceResolver } from "@idlizer/core"
import * as path from "path"

export const FinalizableType = idl.createReferenceType("idlize.internal.Finalizable")
export const RefCountedType = idl.createReferenceType("RefCounted")

export function isRefCounted(declaration: idl.IDLInterface, resolver: ReferenceResolver): boolean {
    let extendsChain = getExtendsChain(declaration, resolver)
    return !!extendsChain.find(it => idl.isEqualByQualifedName(it, RefCountedType, "name"))
}

export function isFinalizable(declaration: idl.IDLInterface, resolver: ReferenceResolver): boolean {
    let extendsChain = getExtendsChain(declaration, resolver)
    let res = extendsChain.find(it => idl.isEqualByQualifedName(it, FinalizableType, "name"))
    return res ? true : false
}

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
        let interfaces: idl.IDLReferenceType[] = []
        const methodsFromInterface: idl.IDLMethod[] = []
        const propertiesFromInterface: idl.IDLProperty[] = []

        let superType: idl.IDLReferenceType | undefined = undefined
        let isRefCountedClass = isRefCounted(decl, this.library)
        let isFinalizableClass = isFinalizable(decl, this.library)
        if (resolvedDecl) {
            superType = getSuperType(decl, this.library)
            if (isRefCountedClass || isFinalizableClass) {
                superType = undefined
            } else if (idl.isInterfaceSubkind(resolvedDecl) && !isMaterialized(resolvedDecl, this.library)) {
                const [superProperties, superMethods] = getUniquePropertiesFromSuperTypes(decl, this.library)
                propertiesFromInterface.push(...superProperties)
                methodsFromInterface.push(...superMethods)
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
                constructor.parent = decl
                constructors = [constructor]
            } else {
                const constructor = idl.createConstructor([], idl.IDLVoidType)
                constructor.parent = decl
                constructors = [constructor]
            }
        }
        const mConstructors = isStaticMaterialized ? [] : constructors.map(c => this.makeMaterializedMethod(decl, c, fullCName, implemenationParentName))
        const mFinalizer = (isRefCountedClass || isStaticMaterialized) ? undefined : new MaterializedMethod(
            undefined,
            new PeerMethodSignature(
                PeerMethodSignature.GET_FINALIZER,
                idl.getFQName(decl).split('.').concat(PeerMethodSignature.GET_FINALIZER).join('_'),
                [],
                idl.IDLPointerType,
            ),
            fullCName, implemenationParentName, idl.IDLPointerType, false,
            "getFinalizer",
            new Method("getFinalizer", new NamedMethodSignature(idl.IDLPointerType, [], [], []), [MethodModifier.STATIC]))
        
        const mMethods: MaterializedMethod[] = []
        if (mFinalizer) {
            const callHolder = new MaterializedMethod(
                undefined,
                new PeerMethodSignature(
                    PeerMethodSignature.CALL_HOLDER,
                    idl.getFQName(decl).split('.').concat(PeerMethodSignature.CALL_HOLDER).join('_'),
                    [],
                    idl.IDLVoidType,
                    decl
                ),
                fullCName, implemenationParentName, idl.IDLVoidType, false,
                PeerMethodSignature.CALL_HOLDER,
                new Method(
                    PeerMethodSignature.CALL_HOLDER,
                    new NamedMethodSignature(idl.IDLVoidType, [], [], []),
                    [MethodModifier.PROTECTED])
                )
            mMethods.push(callHolder)
        }
        const groupedFields = groupBy(propertiesFromInterface.concat(decl.properties), it => it.name)
        const mFields = [...(groupedFields.values())]
            .map(props => this.makeMaterializedField(props))
        mMethods.push(...(decl.methods
            // .concat(...methodsFromInterface) // TODO insert here methods from interfaces
            // TODO: Properly handle methods with return Promise<T> type
            .filter(it => it.name != PeerMethodSignature.GET_FINALIZER)
            .filter(it => it.name != PeerMethodSignature.CALL_HOLDER)
            .map(method => this.makeMaterializedMethod(decl, method, fullCName, implemenationParentName))
            .filter(it =>
                !idl.isNamedNode(it.method.signature.returnType) ||
                !peerGeneratorConfiguration().materialized.ignoreReturnTypes.includes(
                    it.method.signature.returnType.name
                )
            )
        ))

        const taggedMethods = decl.methods.filter(m => m.extendedAttributes?.find(it => it.name === idl.IDLExtendedAttributes.DtsTag))

        mFields.forEach(f => {
            const field = f.field
            const idlType = field.type
            const isStatic = field.modifiers.includes(FieldModifier.STATIC)
            const getSignature = new NamedMethodSignature(idl.maybeOptional(field.type, f.isNullableOriginalTypeField), [], [])
            const overloadPostfix = ``
            if (!f.state.isAccessor || f.state.hasGetter) {
                const getAccessor = new MaterializedMethod(
                    undefined,
                    new PeerMethodSignature(
                        `get${capitalize(field.name)}${overloadPostfix}`,
                        idl.getFQName(decl).split('.').concat(`get${capitalize(field.name)}${overloadPostfix}`).join('_'),
                        [],
                        idl.maybeOptional(idlType, f.isNullableOriginalTypeField),
                        isStatic ? undefined : decl,
                    ),
                    fullCName, implemenationParentName, idl.maybeOptional(field.type, f.isNullableOriginalTypeField), false,
                    `get${capitalize(field.name)}`,
                    new Method(`get${capitalize(field.name)}`, getSignature, [MethodModifier.PRIVATE, ...(isStatic ? [MethodModifier.STATIC] : [])]))
                mMethods.push(getAccessor)
            }

            if (!f.state.isAccessor && !f.state.isReadonly || f.state.isAccessor && f.state.hasSetter) {
                const setSignature = new NamedMethodSignature(idl.IDLVoidType, [idl.maybeOptional(idlType, f.isNullableOriginalTypeField)], [field.name])
                const setAccessor = new MaterializedMethod(
                    undefined,
                    new PeerMethodSignature(
                        `set${capitalize(field.name)}${overloadPostfix}`,
                        idl.getFQName(decl).split('.').concat(`set${capitalize(field.name)}${overloadPostfix}`).join('_'),
                        [new PeerMethodArg(f.field.name, idl.maybeOptional(idlType, f.isNullableOriginalTypeField))],
                        idl.IDLVoidType,
                        isStatic ? undefined : decl,
                    ),
                    fullCName, implemenationParentName, idl.IDLVoidType, false,
                    `set${capitalize(field.name)}`,
                    new Method(`set${capitalize(field.name)}`, setSignature, [MethodModifier.PRIVATE, ...(isStatic ? [MethodModifier.STATIC] : [])]))
                mMethods.push(setAccessor)
            }
        })
        this.library.materializedClasses.set(fullCName,
            new MaterializedClass(decl, decl.name, isDeclInterface, isStaticMaterialized, superType, interfaces, decl.typeParameters,
                mFields, mConstructors, mFinalizer, mMethods, true, taggedMethods, isRefCountedClass))
    }

    private makeMaterializedField(props: idl.IDLProperty[]): MaterializedField {
        const prop = props[0]
        const argConvertor = this.library.typeConvertor(prop.name, prop.type!, prop.isOptional)
        const modifiers = new Set<FieldModifier>()
        var extraMethod: string | undefined = undefined
        for (const p of props) {
            if (p.isStatic)
                modifiers.add(FieldModifier.STATIC)
            if (p.isReadonly)
                modifiers.add(FieldModifier.READONLY)
            const accessor = idl.getExtAttribute(p, idl.IDLExtendedAttributes.Accessor)
            if (accessor == idl.IDLAccessorAttribute.Getter)
                modifiers.add(FieldModifier.GET)
            if (accessor == idl.IDLAccessorAttribute.Setter)
                modifiers.add(FieldModifier.SET)
            if (!extraMethod) {
                extraMethod = idl.getExtAttribute(prop, idl.IDLExtendedAttributes.ExtraMethod)
            }
        }
        return new MaterializedField(
            new Field(prop.name, prop.type, [...modifiers]),
            argConvertor,
            createOutArgConvertor(this.library, prop.type, [prop.name]),
            prop.isOptional,
            extraMethod)
    }

    private makeMaterializedMethod(
        decl: idl.IDLInterface,
        method: idl.IDLConstructor | idl.IDLMethod,
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
            return new MaterializedMethod(undefined, new PeerMethodSignature(
                PeerMethodSignature.CTOR,
                idl.getFQName(decl).split('.').concat(PeerMethodSignature.CTOR).join('_'),
                [],
                returnType,
                undefined,
                peerGeneratorConfiguration().forceContext.includes(idl.getFQName(method)) ? [MethodModifier.FORCE_CONTEXT] : undefined
            ), originalParentName, implemenationParentName, returnType, false, "", ctor)
        }

        const signature = generateSignature(method, returnType)
        const overloadInfo = PeerMethodSignature.mangleOverloadedName(method)
        const overloadedName = overloadInfo.alias ?? (methodName + overloadInfo.postfix)
        return new MaterializedMethod(
            method,
            new PeerMethodSignature(
                overloadedName,
                idl.getFQName(decl).split('.').concat(overloadedName).join('_'),
                signature.args.map((it, index) => new PeerMethodArg(signature.argName(index), it)),
                signature.returnType,
                idl.isMethod(method) && !method.isStatic ? decl : undefined,
                peerGeneratorConfiguration().forceContext.includes(idl.getFQNameSafe(method) ?? "") ? [MethodModifier.FORCE_CONTEXT] : undefined
            ),
            originalParentName, implemenationParentName, returnType, false,
            overloadInfo.alias ?? methodName,
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
        const allDeclarations = this.library.files.flatMap(file => idl.linearizeNamespaceMembers(file.entries))
        const curConfig = generatorConfiguration()
        const curPeerConfig = peerGeneratorConfiguration()
        console.log(curConfig.LibraryPrefix, curPeerConfig.LibraryPrefix)

        for (const dep of allDeclarations) {
            if (peerGeneratorConfiguration().ignoreEntry(dep.name, this.library.language) || this.ignoreDeclaration(dep, this.library.language) || idl.isHandwritten(dep) || isInIdlizeInternal(dep))
                continue
            const isPeerDecl = idl.isInterface(dep) && isComponentDeclaration(this.library, dep)
            if (!isPeerDecl && idl.isInterface(dep) && [idl.IDLInterfaceSubkind.Class, idl.IDLInterfaceSubkind.Interface].includes(dep.subkind)) {
                if (isStaticMaterialized(dep, this.library)) {
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

export function getUniquePropertiesFromSuperTypes(declaration: idl.IDLInterface, resolver: ReferenceResolver): [idl.IDLProperty[], idl.IDLMethod[]] {
    const methods: idl.IDLMethod[] = []
    const properties: idl.IDLProperty[] = []
    const seen = new Set<string>()
    forEachSuperType(declaration, resolver, (superInterface) => {
        superInterface.properties.forEach((property) => {
            if (seen.has(property.name)) return
            properties.push(property)
            seen.add(property.name)
        })
        superInterface.methods.forEach(method => {
            if (seen.has(method.name)) return
            methods.push(method)
            seen.add(method.name)
        })
    })
    return [properties, methods]
}

export function getMethodModifiers(method: idl.IDLMethod | idl.IDLConstructor | idl.IDLCallable): MethodModifier[] {
    const modifiers = []
    if (idl.isConstructor(method) || (idl.isMethod(method) && (method.isStatic || method.isFree)))
        modifiers.push(MethodModifier.STATIC)
    if (idl.hasExtAttribute(method, idl.IDLExtendedAttributes.Throws))
        modifiers.push(MethodModifier.THROWS)
    return modifiers
}
