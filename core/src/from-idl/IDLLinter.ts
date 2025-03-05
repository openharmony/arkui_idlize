import * as idl from "../idl"
import { convertNode, NodeConvertor } from "../LanguageWriters";
import { ReferenceResolver } from "../peer-generation/ReferenceResolver";

export interface IDLLinterOptions {
    validEntryAttributes: Map<idl.IDLKind, string[]>,
    checkEnumsConsistency: boolean,
    checkReferencesResolved: boolean,
}

export class IDLLinter {
    constructor(
        protected node: idl.IDLNode,
        protected resolver: ReferenceResolver,
        protected options: IDLLinterOptions,
    ) {}

    private entryErrors: Record<string, string[]> | undefined
    private pushError(node: idl.IDLEntry | string, error: string) {
        const name = typeof node === 'string' ? node : idl.getFQName(node)
        if (!this.entryErrors)
            this.entryErrors = {}
        if (!this.entryErrors[name])
            this.entryErrors[name] = []
        this.entryErrors[name].push(error)
    }
    public result: string = ""

    public visit(): string {
        this.check(this.node)
        idl.forEachChild(this.node, node => {
            this.check(node)
        })
        this.result = !this.entryErrors ? "" : JSON.stringify(this.entryErrors, undefined, 2)
        return this.result
    }

    protected check(node: idl.IDLNode) {
        if (idl.isEntry(node)) {
            this.checkValidAttributes(node, this.options.validEntryAttributes.get(node.kind) ?? [])
        }
        if (this.options.checkEnumsConsistency && idl.isEnum(node)) {
            this.checkEnumConsistency(node)
        }
        if (this.options.checkReferencesResolved && idl.isReferenceType(node)) {
            this.checkReferenceResolved(node)
        }
    }

    protected checkValidAttributes(entry: idl.IDLEntry, validAttributes: string[]): void {
        if (!entry.extendedAttributes)
            return
        for (const attr of entry.extendedAttributes) {
            if (!validAttributes.includes(attr.name))
                this.pushError(entry, `${entry.kind}: Invalid attribute '${attr.name}'`)
        }
    }

    protected checkEnumConsistency(entry: idl.IDLEnum): void {
        let hasNumber = false
        let hasString = false
        for (const element of entry.elements) {
            if (typeof element.initializer === 'string')
                hasString = true
            if (typeof element.initializer === 'number')
                hasNumber = true
        }
        if (hasNumber && hasString)
            this.pushError(entry, "Enum includes both string and number values")
    }

    private static builtinReferences = [
        idl.IDLTopType.name,
        idl.IDLObjectType.name,
    ]
    protected checkReferenceResolved(reference: idl.IDLReferenceType): void {
        if (IDLLinter.builtinReferences.includes(reference.name))
            return
        const resolved = this.resolver.resolveTypeReference(reference)
        if (resolved === undefined) {
            const parentFile = idl.getFileFor(reference)!
            const parentNamespace = idl.fetchNamespaceFrom(reference)
            const scopeName = parentNamespace ? idl.getFQName(parentNamespace) : idl.getPackageName(parentFile)
            this.pushError(scopeName, `Can not resolve reference '${reference.name}' defined in scope '${scopeName}' in file '${parentFile.fileName}''`)
        }
    }
}

class IDLLinterError extends Error {}

export function verifyIDLLinter(node: idl.IDLNode, resolver: ReferenceResolver, options: IDLLinterOptions): true {
    const result = new IDLLinter(node, resolver, options).visit()
    if (result.length)
        throw new IDLLinterError(result)
    return true
}