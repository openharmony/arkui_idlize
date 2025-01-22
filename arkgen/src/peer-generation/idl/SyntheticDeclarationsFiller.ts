import * as idl from '@idlize/core/idl'
import { generateSyntheticFunctionName } from "../../IDLVisitor";
import { maybeTransformManagedCallback } from "../ArgConvertors";
import { getInternalClassName } from "../Materialized";
import { PeerLibrary } from "../PeerLibrary";
import { DependenciesCollector } from "./IdlDependenciesCollector";
import { isMaterialized } from "./IdlPeerGeneratorVisitor";

function createTransformedCallbacks(library: PeerLibrary, synthesizedEntries: Map<string, idl.IDLEntry>) {
    for (const file of library.files) {
        for (const entry of file.entries) {
            if (idl.isCallback(entry)) {
                const transformedCallback = maybeTransformManagedCallback(entry) ?? entry
                if (transformedCallback &&
                    !library.resolveTypeReference(idl.createReferenceType(transformedCallback.name)) &&
                    !synthesizedEntries.has(transformedCallback.name)) {
                    synthesizedEntries.set(transformedCallback.name, transformedCallback)
                }
            }
        }
    }
}

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
function createContinuationCallbacks(library: PeerLibrary, synthesizedEntries: Map<string, idl.IDLEntry>): void {
    for (const file of library.files) {
        for (const entry of file.entries) {
            if (idl.isCallback(entry)) {
                const transformedCallback = maybeTransformManagedCallback(entry) ?? entry
                createContinuationCallbackIfNeeded(library, transformedCallback.returnType, synthesizedEntries)
            }
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

    convertImport(type: idl.IDLReferenceType, importClause: string): idl.IDLNode[] {
        const decl = this.library.resolveTypeReference(type) ?? this.synthesizedEntries.get(type.name)
        if (!decl || idl.isTypedef(decl) && idl.hasExtAttribute(decl, idl.IDLExtendedAttributes.Import)) {
            this.synthesizedEntries.set(type.name, idl.createInterface(
                type.name,
                idl.IDLInterfaceSubkind.Interface,
                undefined,
                undefined,
                undefined,
                [idl.createProperty(`__${type.name}Stub`, idl.IDLStringType)],
                undefined,
                undefined,
                undefined,
                {
                    fileName: decl?.fileName ?? 'generator_synthetic.d.ts',
                    // extendedAttributes: [{ name: idl.IDLExtendedAttributes.Synthetic }]
                },
            ))
        }
        return super.convertImport(type, importClause)
    }
}

function createImportsStubs(library: PeerLibrary, synthesizedEntries: Map<string, idl.IDLEntry>): void {
    const generator = new ImportsStubsGenerator(library, synthesizedEntries)
    for (const file of library.files) {
        for (const entry of file.entries) {
            if (idl.isPackage(entry) || idl.isModuleType(entry) || idl.isImport(entry))
                continue
            generator.convert(entry)
        }
    }
}

function createMaterializedInternal(library: PeerLibrary, synthesizedEntries: Map<string, idl.IDLEntry>): void {
    for (const file of library.files) {
        for (const entry of file.entries) {
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
        }
    }
}

/** @deprecated please do not extend this file. Storing synthetic declarations globally seems a bad pattern */
export function fillSyntheticDeclarations(library: PeerLibrary) {
    const synthesizedEntries = new Map<string, idl.IDLEntry>()
    createTransformedCallbacks(library, synthesizedEntries)
    createContinuationCallbacks(library, synthesizedEntries)
    createImportsStubs(library, synthesizedEntries)
    createMaterializedInternal(library, synthesizedEntries)
    library.initSyntheticEntries([...synthesizedEntries.values()])
}