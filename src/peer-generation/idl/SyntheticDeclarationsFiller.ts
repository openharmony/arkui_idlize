import * as idl from "../../idl"
import { generateSyntheticFunctionName } from "../../IDLVisitor";
import { PeerLibrary } from "../PeerLibrary";
import { DependenciesCollector } from "./IdlDependenciesCollector";

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
                createContinuationCallbackIfNeeded(library, entry.returnType, synthesizedEntries)
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
                idl.IDLKind.Interface,
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

/** @deprecated please do not extend this file. Storing synthetic declarations globally seems a bad pattern */
export function fillSyntheticDeclarations(library: PeerLibrary) {
    const synthesizedEntries = new Map<string, idl.IDLEntry>()
    createContinuationCallbacks(library, synthesizedEntries)
    createImportsStubs(library, synthesizedEntries)
    library.initSyntheticEntries([...synthesizedEntries.values()])
}