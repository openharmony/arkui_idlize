import * as idl from '@idlizer/core/idl'
import { generateSyntheticFunctionName, getInternalClassName, isMaterialized,
    PACKAGE_IDLIZE_INTERNAL, StructureNameConvertor, 
    createCachedReferenceResolver,
    LibraryInterface,
    IdlNameConvertor,
    ArgConvertor,
    Language,
    LayoutManager,
    toDeclaration} from "@idlizer/core";
import { componentToPeerClass } from '../printers/PeersPrinter';
import { isComponentDeclaration } from '../ComponentsCollector';
import { NativeModule } from '../NativeModule';
import { compareNodes } from '@idlizer/core';

// TODO I think must be package specific
const SyntheticsPackageClause = ['synthetic']

export function syntheticTransformer(files: idl.IDLFile[]): idl.IDLFile[] {
    files = groupSyntheticsTransformer(files)
    files = continuationCallbacksTransformer(files)
    files = materializedInternalTransformer(files)
    files = componentsPeersTransformer(files)
    files = generatedNativeModuleTransformer(files)
    return files
}

function groupSyntheticsTransformer(files: idl.IDLFile[]): idl.IDLFile[] {
    const declarationsToDelete = new Array<idl.IDLEntry>()
    const referencesToReplace = new Map<string, string>()
    const syntheticDeclarations = new Array<idl.IDLEntry>()
    const syntheticPossibleConflicts = new Set<string>()
    for (const file of files) {
        idl.forEachChild(file, node => {
            if (idl.isSyntheticEntry(node)) {
                if (!(idl.isEnum(node) || idl.isInterface(node) || idl.isTypedef(node) || idl.isCallback(node)))
                    throw new Error(`Expected all synthetics to be entries, got ${node.kind}`)
                declarationsToDelete.push(node)
                referencesToReplace.set(idl.getFQName(node), `${SyntheticsPackageClause.join('.')}.${node.name}`)
                let sameNamed: idl.IDLEntry | undefined
                if (sameNamed = syntheticDeclarations.find(it => it.name === node.name)) {
                    if (!compareNodes(node, sameNamed)) {
                        console.error(`Found two synthetics with same name ${node.name} and different content`)
                    }
                } else {
                    syntheticDeclarations.push(idl.clone(node))
                }
            } else {
                if (idl.isEnum(node) || idl.isInterface(node) || idl.isTypedef(node) || idl.isCallback(node)) {
                    syntheticPossibleConflicts.add(node.name)
                }
            }
        })
    }

    // for found conflicts with non-synthetic declarations mangle synthetics
    for (let i = 0; i < syntheticDeclarations.length; i++) {
        const decl = syntheticDeclarations[i]
        if (syntheticPossibleConflicts.has(decl.name)) {
            let mangledDecl: idl.IDLEntry
            if (idl.isCallback(decl)) {
                mangledDecl = idl.createCallback(
                    `synthetic_${decl.name}`,
                    decl.parameters,
                    decl.returnType,
                    idl.cloneNodeInitializer(decl),
                    decl.typeParameters,
                )
            } else {
                throw new Error(`Do not know how to mangle conflicting synthetic entry with kind ${decl.kind}`)
            }
            syntheticDeclarations[i] = mangledDecl
            const syntheticFQN = `${SyntheticsPackageClause.join('.')}.${decl.name}`
            const mangledSyntheticFQN = `${SyntheticsPackageClause.join('.')}.${mangledDecl.name}`
            for (let [original, replacement] of referencesToReplace.entries()) {
                if (replacement == syntheticFQN) {
                    referencesToReplace.set(original, mangledSyntheticFQN)
                }
            }
        }
    }

    const transformer = (node: idl.IDLNode): idl.IDLNode => {
        if (idl.isFile(node)) {
            return idl.createFile(
                node.entries
                    .filter(it => !declarationsToDelete.includes(it))
                    .map(it => transformer(it) as idl.IDLEntry),
                node.fileName,
                node.packageClause,
                idl.cloneNodeInitializer(node),
            )
        }
        if (idl.isNamespace(node)) {
            return idl.createNamespace(
                node.name,
                node.members
                    .filter(it => !declarationsToDelete.includes(it))
                    .map(it => transformer(it) as idl.IDLEntry),
                idl.cloneNodeInitializer(node),
            )
        }
        if (idl.isReferenceType(node) && referencesToReplace.has(node.name)) {
            let syntheticFQN = referencesToReplace.get(node.name)!

            return idl.createReferenceType(
                syntheticFQN,
                node.typeArguments?.map(it => transformer(it) as idl.IDLType),
                idl.cloneNodeInitializer(node),
            )
        }
        return idl.visitChildren(node, transformer)
    }
    return files.concat(idl.createFile(
        syntheticDeclarations,
        undefined,
        SyntheticsPackageClause
    )).map(it => transformer(it) as idl.IDLFile).map(idl.linkParentBack)
}

function continuationCallbacksTransformer(files: idl.IDLFile[]): idl.IDLFile[] {
    const library = createLibraryFromFiles(files)
    const structureNameConvertor = new StructureNameConvertor(library)
    const allContinuationTypes = new Array<idl.IDLType>()
    const allCallbacksNames = new Set<string>()
    const syntheticCallbacksNames = new Set<string>()
    for (const file of files) {
        idl.forEachChild(file, node => {
            if (idl.isCallback(node) && !node.typeParameters?.length) {
                allContinuationTypes.push(node.returnType)
                allCallbacksNames.add(node.name)
            }
            if (idl.isCallback(node) && idl.isSyntheticEntry(node)) {
                syntheticCallbacksNames.add(node.name)
            }
            if (idl.isMethod(node)) {
                const promise = idl.asPromise(node.returnType)
                if (promise)
                    allContinuationTypes.push(promise)
            }
        })
    }

    const syntheticEntries = new Array<idl.IDLEntry>()
    for (const continuationType of allContinuationTypes) {
        const continuationParameters = createContinuationParameters(continuationType)
        const primarySyntheticName = generateSyntheticFunctionName(
            continuationParameters,
            idl.IDLVoidType,
            { nameConvertor: structureNameConvertor }
        )
        const alternativeSyntheticName = `synthetic_${primarySyntheticName}`
        let syntheticName: string
        if (syntheticCallbacksNames.has(primarySyntheticName)) {
            syntheticName = primarySyntheticName
        } else if (syntheticCallbacksNames.has(alternativeSyntheticName)) {
            syntheticName = alternativeSyntheticName
        } else {
            syntheticName = allCallbacksNames.has(primarySyntheticName)
                ? alternativeSyntheticName
                : primarySyntheticName
        }

        if (!syntheticCallbacksNames.has(syntheticName)) {
            syntheticCallbacksNames.add(syntheticName)
            syntheticEntries.push(idl.createCallback(
                syntheticName,
                continuationParameters,
                idl.IDLVoidType,
                { extendedAttributes: [{ name: idl.IDLExtendedAttributes.Synthetic }]},
            ))
        }
    }
    return files.concat(idl.createFile(
        syntheticEntries,
        undefined,
        SyntheticsPackageClause
    )).map(idl.linkParentBack)
}

function createContinuationParameters(continuationType: idl.IDLType): idl.IDLParameter[] {
    const continuationParameters: idl.IDLParameter[] = []
    if (idl.isContainerType(continuationType) && idl.IDLContainerUtils.isPromise(continuationType)) {
        const errorType = idl.createOptionalType(idl.createContainerType("sequence", [idl.IDLStringType]))
        continuationParameters.push(idl.createParameter("error", errorType, true))
        const promise = continuationType as idl.IDLContainerType
        if (!idl.isVoidType(promise.elementType[0])) {
            const valueType = idl.createOptionalType(promise.elementType[0])
            continuationParameters.unshift(idl.createParameter("value", valueType, true))
        }
    } else if (!idl.isVoidType(continuationType))
        continuationParameters.push(idl.createParameter('value', continuationType))
    return continuationParameters
}

function materializedInternalTransformer(files: idl.IDLFile[]): idl.IDLFile[] {
    const resolver = createCachedReferenceResolver(files)
    const syntheticDeclarations = new Array<idl.IDLInterface>()
    for (const file of files) {
        idl.forEachChild(file, node => {
            if (idl.isInterface(node) && !idl.isInIdlize(node) && isMaterialized(node, resolver)) {
                const name = getInternalClassName(node.name)
                syntheticDeclarations.push(idl.createInterface(
                    name,
                    idl.IDLInterfaceSubkind.Interface,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    { extendedAttributes: [{ name: idl.IDLExtendedAttributes.Synthetic }]}
                ))
            }
        })
    }
    return files.concat(idl.linkParentBack(idl.createFile(syntheticDeclarations)))
}

function generatedNativeModuleTransformer(files: idl.IDLFile[]): idl.IDLFile[] {
    const declaration = idl.createInterface(NativeModule.Generated.name, idl.IDLInterfaceSubkind.Interface)
    return files.concat(idl.linkParentBack(
        idl.createFile([declaration], undefined, PACKAGE_IDLIZE_INTERNAL.split("."))
    ))
}

function createLibraryFromFiles(files: idl.IDLFile[]): LibraryInterface {
    const resolver = createCachedReferenceResolver(files)
    return {
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
            return resolver.resolveTypeReference(type, options)
        },
        toDeclaration: function (type: idl.IDLNode): idl.IDLNode {
            if (!idl.isType(type) && !idl.isEntry(type))
                throw new Error("toDeclaration can be performed only on types or entries!")
            return toDeclaration(type, this)
        }
    }
}

function componentsPeersTransformer(files: idl.IDLFile[]): idl.IDLFile[] {
    const library = createLibraryFromFiles(files)
    const syntheticDeclarations = new Array<idl.IDLEntry>()
    files.forEach(file => {
        file.entries.forEach(it => {
            if (isComponentDeclaration(library, it)) {
                const peerName = componentToPeerClass(it.name.replace('Attribute', ''))
                syntheticDeclarations.push(idl.createInterface(peerName, idl.IDLInterfaceSubkind.Interface,
                    undefined, undefined, undefined, undefined, undefined, undefined, undefined,
                    { extendedAttributes: [{ name: idl.IDLExtendedAttributes.Synthetic }]}
                ))
            }
        })
    })
    return files.concat(idl.linkParentBack(idl.createFile(syntheticDeclarations)))
}
