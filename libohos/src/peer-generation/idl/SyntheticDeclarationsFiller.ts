import * as idl from '@idlizer/core/idl'
import { generateSyntheticFunctionName, maybeTransformManagedCallback, getInternalClassName, isMaterialized, PeerLibrary, PACKAGE_IDLIZE_INTERNAL, currentModule, isInCurrentModule, generatorConfiguration } from "@idlizer/core";
import { DependenciesCollector } from "./IdlDependenciesCollector";
import { componentToPeerClass, componentToStyleClass } from '../printers/PeersPrinter';
import { isComponentDeclaration } from '../ComponentsCollector';
import { collectDeclarationTargetsUncached } from '../DeclarationTargetCollector';
import { NativeModule } from '../NativeModule';

function createContinuationCallbackIfNeeded(library: PeerLibrary, continuationType: idl.IDLType, synthesizedEntries: Map<string, idl.IDLEntry>): void {
    const continuationParameters = library.createContinuationParameters(continuationType)
    const syntheticName = generateSyntheticFunctionName(
        continuationParameters,
        idl.IDLVoidType,
    )
    const continuationReference = idl.createReferenceType(syntheticName)

    if (!library.resolveTypeReference(continuationReference) && !synthesizedEntries.has(continuationReference.name)) {
        const callback = idl.createCallback(
            generateSyntheticFunctionName(
                continuationParameters,
                idl.IDLVoidType
            ),
            continuationParameters,
            idl.IDLVoidType,
            {
                fileName: 'generator_synthetic.d.ts',
                extendedAttributes: [{ name: idl.IDLExtendedAttributes.Synthetic }],
            }
        )
        synthesizedEntries.set(callback.name, callback)
    }
}
function createContinuationCallbacks(library: PeerLibrary, targets: idl.IDLNode[], synthesizedEntries: Map<string, idl.IDLEntry>): void {
    targets.forEach(entry => {
        if (idl.isCallback(entry)) {
            const transformedCallback = maybeTransformManagedCallback(entry, library) ?? entry
            createContinuationCallbackIfNeeded(library, transformedCallback.returnType, synthesizedEntries)
        }
    })
    for (const file of library.files) {
        if (!isInCurrentModule(file))
            continue
        for (const entry of file.entries) {
            idl.forEachFunction(entry, function_ => {
                const promise = idl.asPromise(function_.returnType)
                if (promise) {
                    createContinuationCallbackIfNeeded(library, promise, synthesizedEntries)
                }
            })
        }
    }
}

class ImportsStubsGenerator extends DependenciesCollector {
    constructor(library: PeerLibrary, private readonly synthesizedEntries: Map<string, idl.IDLEntry>) {
        super(library)
    }

    convertTypeReferenceAsImport(type: idl.IDLReferenceType, importClause: string): idl.IDLEntry[] {
        const decl = this.library.resolveTypeReference(type) ?? this.synthesizedEntries.get(type.name)
        if (!decl || idl.isTypedef(decl) && idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.Import)) {
            const syntheticName = type.name.replaceAll(".", "_")
            this.synthesizedEntries.set(syntheticName, idl.createInterface(
                syntheticName,
                idl.IDLInterfaceSubkind.Interface,
                undefined,
                undefined,
                undefined,
                [idl.createProperty(`_${syntheticName}Stub`, idl.IDLStringType)],
                undefined,
                undefined,
                undefined,
                {
                    fileName: decl?.fileName ?? 'generator_synthetic.d.ts',
                    // extendedAttributes: [{ name: idl.IDLExtendedAttributes.Synthetic }]
                },
            ))
        }
        return super.convertTypeReferenceAsImport(type, importClause)
    }
}

function createImportsStubs(library: PeerLibrary, synthesizedEntries: Map<string, idl.IDLEntry>): void {
    const generator = new ImportsStubsGenerator(library, synthesizedEntries)
    for (const file of library.files) {
        for (const entry of idl.linearizeNamespaceMembers(file.entries)) {
            generator.convert(entry)
        }
    }
}

function createMaterializedInternal(library: PeerLibrary, targets: idl.IDLNode[], synthesizedEntries: Map<string, idl.IDLEntry>): void {
    targets.forEach(entry => {
        if (idl.isInterface(entry) && isMaterialized(entry, library)) {
            const name = getInternalClassName(entry.name)
            synthesizedEntries.set(name, idl.createInterface(
                name,
                idl.IDLInterfaceSubkind.Interface,
                undefined,
                undefined,
                undefined,
                undefined,
                [idl.createMethod("__stub", [], idl.IDLVoidType)],
                undefined,
                undefined,
                { fileName: entry?.fileName ?? 'generator_synthetic.d.ts', },
            ))
        }
    })
}

function fillGeneratedNativeModuleDeclaration(library: PeerLibrary): void {
    const declaration = idl.createInterface(NativeModule.Generated.name, idl.IDLInterfaceSubkind.Interface)
    const file = idl.linkParentBack(
        idl.createFile([declaration], undefined, PACKAGE_IDLIZE_INTERNAL.split("."))
    )
    library.files.push(file)
}

function createComponentPeers(library: PeerLibrary, synthesizedEntries: Map<string, idl.IDLEntry>): void {
    library.files.forEach(file => {
        file.entries.forEach(it => {
            if (isComponentDeclaration(library, it)) {
                const peerName = componentToPeerClass(it.name.replace('Attribute', ''))
                synthesizedEntries.set(peerName, idl.createInterface(peerName, idl.IDLInterfaceSubkind.Class))
                const styleComponentName = componentToStyleClass(it.name)
                synthesizedEntries.set(styleComponentName, idl.createInterface(styleComponentName, idl.IDLInterfaceSubkind.Interface))
            }
        })
    })
}

/** @deprecated please do not extend this file. Storing synthetic declarations globally seems a bad pattern */
export function fillSyntheticDeclarations(library: PeerLibrary) {
    const targets = collectDeclarationTargetsUncached(library, { synthesizeCallbacks: false, unionFlatteningMode: false })
    const synthesizedEntries = new Map<string, idl.IDLEntry>()
    createContinuationCallbacks(library, targets, synthesizedEntries)
    createImportsStubs(library, synthesizedEntries)
    createMaterializedInternal(library, targets, synthesizedEntries)
    createComponentPeers(library, synthesizedEntries)
    fillGeneratedNativeModuleDeclaration(library)
    library.initSyntheticEntries(idl.linkParentBack(idl.createFile([...synthesizedEntries.values()])))
}