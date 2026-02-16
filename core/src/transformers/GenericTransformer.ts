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
import { generatorConfiguration } from "../config"
import { toIdlType } from "../from-idl/deserialize"
import * as idl from "../idl"
import { Language } from "../Language"
import { IdlNameConvertor } from "../LanguageWriters"
import { ArgConvertor } from "../LanguageWriters/ArgConvertors"
import { StructureNameConvertor } from "../LanguageWriters/convertors/CppConvertors"
import { LibraryInterface } from "../LibraryInterface"
import { isMaterialized } from "../peer-generation/isMaterialized"
import { LayoutManager } from "../peer-generation/LayoutManager"
import { toDeclaration } from "../peer-generation/PeerLibrary"
import { createCachedReferenceResolver, ReferenceResolver } from "../peer-generation/ReferenceResolver"
import { IdlTransformer } from "./IdlTransformer"

type ProduceResult = {
    anchor: string,
    produced: idl.IDLEntry,
}

export function genericsTransformer(
    files: idl.IDLFile[],
    options: {
        ignore: ((node: idl.IDLNode) => boolean)[],
        ignoreGenerics: string[],
    }
): idl.IDLFile[] {
    const optionsResolver = createCachedReferenceResolver(files)
    options.ignore.push(ignoreConfigRule(options!.ignoreGenerics!),
        createIgnoreMaterializedRule(optionsResolver), createIgnoreResourceRule(optionsResolver))

    const defaultsGenericsTransformer = new DefaultGenericsTransformer(createCachedReferenceResolver(files))
    files = files.map(it => defaultsGenericsTransformer.visit(it)).map(idl.linkParentBack)
    const resolver = createCachedReferenceResolver(files)
    const resolverAdditionals = new Map<string, idl.IDLEntry>()
    const library: LibraryInterface = {
        language: Language.CPP,
        files: files,
        typeConvertor: function (param: string, type: idl.IDLType, isOptionalParam?: boolean): ArgConvertor {
            throw new Error('Function not implemented.');
        },
        declarationConvertor: function (param: string, type: idl.IDLReferenceType, declaration: idl.IDLEntry | undefined): ArgConvertor {
            throw new Error('Function not implemented.');
        },
        createTypeNameConvertor: function (language: Language): IdlNameConvertor {
            throw new Error('Function not implemented.');
        },
        createContinuationCallbackReference: function (continuationType: idl.IDLType): idl.IDLReferenceType {
            throw new Error('Function not implemented.');
        },
        getCurrentContext: function (): string | undefined {
            throw new Error('Function not implemented.');
        },
        layout: LayoutManager.Empty(),
        libraryPrefix: '',
        resolveTypeReference: function (type: idl.IDLReferenceType, options?: { terminalImports?: boolean, unresolvedOk?: boolean }): idl.IDLEntry | undefined {
            if (resolverAdditionals.has(type.name))
                return resolverAdditionals.get(type.name)!
            return resolver.resolveTypeReference(type, options)
        },
        toDeclaration: function (type: idl.IDLNode): idl.IDLNode {
            if (!idl.isType(type) && !idl.isEntry(type))
                throw new Error("toDeclaration can be performed only on types or entries!")
            return toDeclaration(type, this)
        },
        isHandwritten(node: idl.IDLEntry | idl.IDLReferenceType): boolean {
            if (idl.isEntry(node)) {
                return idl.isHandwritten(node)
            }
            const entry = this.resolveTypeReference(node)
            if (entry) {
                return this.isHandwritten(entry)
            }
            return false
        }
    }

    const production = new Array<ProduceResult>()
    const nameConvertor = new StructureNameConvertor(library)
    const monomorphizeReferencesTransformer = new GenericsTransformer(library, produced => {
        const anchorDecl = library.resolveTypeReference(idl.createReferenceType(produced.anchor))!
        const producedFqn = produced.anchor.split('.').slice(0, -1).concat(produced.produced.name).join('.')
        if (!resolverAdditionals.has(producedFqn)) {
            resolverAdditionals.set(producedFqn, produced.produced)
            production.push(produced)
            // hack to be able calculate FQN for this declaration
            produced.produced.parent = anchorDecl.parent
        }
    }, {
        nameConvertor: (node) => nameConvertor.convert(node),
        ignore: options.ignore,
        ignoreGenerics: options.ignoreGenerics,
    })
    files = files.map(it => monomorphizeReferencesTransformer.visit(it)).map(idl.linkParentBack)

    const debugInsertedEntries = new Set<string>()
    const insertProductionTransformer = new InsertProductionTransformer(production, {
        debugInserted: (node) => debugInsertedEntries.add(node),
    })
    files = files.map(it => insertProductionTransformer.visit(it)).map(idl.linkParentBack)
    const debugMissedEntries = new Set(production.filter(it => !debugInsertedEntries.has(it.anchor)).map(it => it.anchor))
    if (debugMissedEntries.size) {
        throw new Error(`Failed to insert generated generics for entries ${Array.from(debugMissedEntries).join(', ')}`)
    }

    return files
}

class DefaultGenericsTransformer extends IdlTransformer {
    constructor(private resolver: ReferenceResolver) {
        super()
    }

    visit(node: idl.IDLFile): idl.IDLFile
    visit(node: idl.IDLType): idl.IDLType
    visit(node: idl.IDLNode): idl.IDLNode {
        if (idl.isReferenceType(node)) {
            const decl = this.resolver.resolveTypeReference(node)
            if (!decl) {
                console.error(`Can not resolve reference for inplacing default generics ${node.name} in file ${node.fileName ?? '<unknown>'}`)
                return this.visitEachChild(node)
            }
            if (!idl.isTypedef(decl) && !idl.isInterface(decl) && !idl.isCallback(decl)) {
                return this.visitEachChild(node)
            }
            if ((decl.typeParameters?.length ?? 0) > (node.typeArguments?.length ?? 0)) {
                const defaults: (undefined | idl.IDLType)[] = decl.extendedAttributes
                    ?.find(it => it.name === idl.IDLExtendedAttributes.TypeParametersDefaults)
                    ?.typesValue?.slice()
                    ?.map(it => this.visit(it)) ?? []
                while (defaults.length < decl.typeParameters!.length) {
                    defaults.unshift(undefined)
                }
                const typeArguments = Array.from(node.typeArguments ?? [])
                while (decl.typeParameters!.length > typeArguments.length) {
                    if (defaults[typeArguments.length] === undefined) {
                        const declarationDetails = `${idl.getFQName(decl)}<${(decl.typeParameters ?? [])
                            .map((it, index) => `${it}${defaults[index] ? '='+defaults[index] : ''}`)
                            .join(', ')}>`
                        const referenceDetails = `${node.name}<${typeArguments.map(it => idl.printType(it)).join(", ")}>`
                        throw new Error(`Can not validate reference to ${declarationDetails} declaration: reference ${referenceDetails} has not enough generic arguments or declaration does not have enough default generic values. Reference defined at: ${node.fileName}`)
                    }
                    typeArguments.push(defaults[typeArguments.length]!)
                }
                return idl.createReferenceType(
                    node.name,
                    typeArguments,
                    idl.cloneNodeInitializer(node),
                )
            }
        }
        return this.visitEachChild(node)
    }
}

class GenericsTransformer extends IdlTransformer {
    private meaninglessFieldsTransformer = new RemoveMeaninglessFieldsTransformer()

    constructor(
        private resolver: ReferenceResolver,
        private producer: (result: ProduceResult) => void,
        private options: {
            ignore: ((node: idl.IDLNode) => boolean)[],
            nameConvertor: (type: idl.IDLType) => string,
            ignoreGenerics: string[],
        }
    ) {
        super()
    }

    visit(node: idl.IDLFile): idl.IDLFile
    visit(node: idl.IDLReferenceType): idl.IDLReferenceType
    visit(node: idl.IDLNode): idl.IDLNode
    visit(node: idl.IDLNode): idl.IDLNode {
        if (idl.isReferenceType(node)) {
            const ref = this.visitEachChild(node) as idl.IDLReferenceType
            if (!ref.typeArguments?.length || hasTypeParameterTypeChild(ref)) {
                return ref
            }
            const resolved = this.resolver.resolveTypeReference(ref)
            if (!resolved) {
                throw new Error(`Can not resolve ${ref.name}`)
            }
            if (this.options.ignore.some(it =>
                    it(ref) || it(resolved)) ||
                    this.options.ignoreGenerics.includes(idl.getFQName(resolved))) {
                return ref
            }
            if (!idl.isTypedef(resolved) && !idl.isInterface(resolved) && !idl.isCallback(resolved)) {
                throw new Error(`Unsupported generics target ${resolved.kind}`)
            }
            const inplacedRef = idl.createReferenceType(
                idl.deriveQualifiedNameFrom(monomorphisedEntryName(resolved, ref.typeArguments, this.options), resolved),
                undefined,
                idl.cloneNodeInitializer(ref)
            )
            if (!this.resolver.resolveTypeReference(inplacedRef, { unresolvedOk: true })) {
                const monomorphizedEntry = this.visit(this.monomorphizeEntry(resolved, ref.typeArguments)) as idl.IDLEntry
                this.producer({ anchor: idl.getFQName(resolved), produced: monomorphizedEntry })
            }
            return inplacedRef
        }
        return this.visitEachChild(node)
    }

    monomorphizeEntry<T extends idl.IDLEntry>(typedEntry: T, typeArguments: idl.IDLType[]): T {
        if (!idl.isTypedef(typedEntry) && !idl.isInterface(typedEntry) && !idl.isCallback(typedEntry))
            throw new Error(`Can not monomorphize ${typedEntry.kind}`)
        if (typedEntry.typeParameters?.length != typeArguments.length)
            throw new Error(`Trying to monomorphize entry ${typedEntry.name} that accepts ${typedEntry.typeParameters?.length} type parameters with ${typeArguments.length} type arguments`)
        const monomorphizedEntry = idl.clone(typedEntry)
        monomorphizedEntry.name = monomorphisedEntryName(typedEntry, typeArguments, this.options)
        monomorphizedEntry.typeParameters = undefined
        const nameToType = new Map(typedEntry.typeParameters.map((name, index) => [name, typeArguments[index]]))
        idl.updateEachChild(monomorphizedEntry, (node) => {
            if (idl.isTypeParameterType(node)) {
                if (!nameToType.has(node.name))
                    throw new Error(`Can not name ${node.name} in type parameters of ${typedEntry.name}: available are ${typedEntry.typeParameters?.join(", ")}`)
                return idl.clone(nameToType.get(node.name)!)
            }
            return node
        })
        monomorphizedEntry.extendedAttributes ??= []
        monomorphizedEntry.extendedAttributes.push({
            name: idl.IDLExtendedAttributes.OriginalGenericName,
            value: idl.getFQName(typedEntry),
            typesValue: typeArguments,
        })
        this.correctTransformOnSerialize(monomorphizedEntry.extendedAttributes, typeArguments)
        return this.meaninglessFieldsTransformer.visit(monomorphizedEntry)
    }

    correctTransformOnSerialize(
        extendedAttributes: idl.IDLExtendedAttribute[],
        typeArguments: idl.IDLType[],
    ) {
        const transformOnSerializeAttribute = extendedAttributes.find(it => it.name === idl.IDLExtendedAttributes.TransformOnSerialize)
        if (transformOnSerializeAttribute === undefined)
            return
        const targetType = toIdlType("", transformOnSerializeAttribute.value!)
        if (idl.isReferenceType(targetType)) {
            const monomorphizedReference = this.visit(idl.createReferenceType(
                targetType.name,
                typeArguments,
                idl.cloneNodeInitializer(targetType),
            ))
            transformOnSerializeAttribute.value = monomorphizedReference.name
        }
    }
}

class InsertProductionTransformer extends IdlTransformer {
    private production: Map<string | undefined, idl.IDLEntry[]>

    constructor(production: ProduceResult[], private options: { debugInserted: (node: string) => void }) {
        super()
        this.production = new Map()
        for (const result of production) {
            if (!this.production.has(result.anchor))
                this.production.set(result.anchor, [])
            this.production.get(result.anchor)!.push(result.produced)
        }
    }

    visit<T extends idl.IDLNode>(node: T): T
    visit(node: idl.IDLNode): idl.IDLNode {
        if (idl.isFile(node)) {
            if (node.entries.some(it => this.production.has(idl.getFQNameSafe(it)))) {
                return idl.createFile(
                    node.entries.flatMap(it => {
                        const fqn = idl.getFQNameSafe(it)
                        if (this.production.has(fqn)) {
                            this.options.debugInserted(fqn!)
                            return this.production.get(fqn)!.concat(this.visit(it))
                        }
                        return this.visit(it)
                    }),
                    node.fileName,
                    node.packageClause,
                    idl.cloneNodeInitializer(node),
                )
            }
        }
        if (idl.isNamespace(node)) {
            if (node.members.some(it => this.production.has(idl.getFQNameSafe(it)))) {
                return idl.createNamespace(
                    node.name,
                    node.members.flatMap(it => {
                        const fqn = idl.getFQNameSafe(it)
                        if (this.production.has(fqn)) {
                            this.options.debugInserted(fqn!)
                            return this.production.get(fqn)!.concat(this.visit(it))
                        }
                        return this.visit(it)
                    }),
                    idl.cloneNodeInitializer(node)
                )
            }
        }
        return this.visitEachChild(node)
    }
}

class RemoveMeaninglessFieldsTransformer extends IdlTransformer {
    visit<T extends idl.IDLNode>(node: T): T
    visit(node: idl.IDLNode): idl.IDLNode {
        if (idl.isInterface(node) && node.properties.some(it => isMeaninglessFieldType(it.type))) {
            return idl.createInterface(
                node.name,
                node.subkind,
                node.inheritance.map(it => this.visit(it)),
                node.constructors.map(it => this.visit(it)),
                node.constants.map(it => this.visit(it)),
                node.properties.filter(it => !isMeaninglessFieldType(it.type)).map(it => this.visit(it)),
                node.methods.map(it => this.visit(it)),
                node.callables.map(it => this.visit(it)),
                node.typeParameters,
                idl.cloneNodeInitializer(node),
            )
        }
        if (idl.isMethod(node) && node.parameters.some(it => isMeaninglessFieldType(it.type))) {
            return idl.createMethod(
                node.name,
                node.parameters.filter(it => !isMeaninglessFieldType(it.type)).map(it => this.visit(it)),
                this.visit(node.returnType),
                {
                    isAsync: node.isAsync,
                    isFree: node.isFree,
                    isOptional: node.isOptional,
                    isStatic: node.isStatic,
                },
                idl.cloneNodeInitializer(node),
                node.typeParameters,
            )
        }
        if (idl.isCallback(node) && node.parameters.some(it => isMeaninglessFieldType(it.type))) {
            return idl.createCallback(
                node.name,
                node.parameters.filter(it => !isMeaninglessFieldType(it.type)).map(it => this.visit(it)),
                this.visit(node.returnType),
                idl.cloneNodeInitializer(node),
                node.typeParameters,
            )
        }
        return this.visitEachChild(node)
    }
}

export function isInplacedGeneric(entry: idl.IDLEntry) {
    return idl.hasExtAttribute(entry, idl.IDLExtendedAttributes.OriginalGenericName)
}

function ignoreConfigRule(ignoreGenerics: string[]) {
    return (node: idl.IDLNode) => {
        return idl.isEntry(node) && ignoreGenerics.includes(idl.getFQName(node))
    }
}

function createIgnoreMaterializedRule(resolver: ReferenceResolver): (node: idl.IDLNode) => boolean {
    return (node: idl.IDLNode) => idl.isInterface(node) && isMaterialized(node, resolver) && !idl.hasExtAttribute(node, idl.IDLExtendedAttributes.TransformOnSerialize)
}

function createIgnoreResourceRule(resolver: ReferenceResolver): (node: idl.IDLNode) => boolean {
    return (node: idl.IDLNode) => {
        if (!idl.isReferenceType(node)) {
            return false
        }
        const declaration = resolver.resolveTypeReference(node)
        if (!declaration) {
            return false
        }
        return generatorConfiguration().forceResource.includes(declaration.name)
    }
}

function monomorphisedEntryName(typedEntry: idl.IDLEntry, typeArguments: idl.IDLType[], options: { nameConvertor: (node: idl.IDLType) => string }): string {
    return typedEntry.name + "_" + typeArguments.map(options.nameConvertor).join("_")
}

function hasTypeParameterTypeChild(node: idl.IDLNode): boolean {
    let result = false
    idl.forEachChild(node, (child) => {
        if (idl.isTypeParameterType(child))
            result = true
    })
    return result
}

function isMeaninglessFieldType(type: idl.IDLType): boolean {
    return idl.isVoidType(type) || idl.isUndefinedType(type) ||
        idl.isUnionType(type) && type.types.every(isMeaninglessFieldType) ||
        idl.isOptionalType(type) && isMeaninglessFieldType(type.type)
}
