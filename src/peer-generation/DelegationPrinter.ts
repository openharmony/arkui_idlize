import { IndentedPrinter } from "../IndentedPrinter";
import { DeclarationTable, FieldRecord } from "./DeclarationTable";
import { completeDelegationsImpl } from "./FileGenerators";
import { Materialized } from "./Materialized";
import { PeerLibrary } from "./PeerLibrary";
import { MethodSeparatorVisitor, PeerMethod } from "./PeerMethod";

export class DelegationSignatureBuilder {
    constructor(
        private readonly declarationTable: DeclarationTable,
        private readonly method: PeerMethod
    ) {
        this.args = method.argConvertors.map((convertor, index) => {
            return [{
                argName: convertor.param,
                argType: convertor.nativeType(false),
                isPointerType: convertor.isPointerType(),
            }]
        })
    }

    private readonly args: {
        argName: string,
        argType: string,
        isPointerType: boolean,
    }[][]

    pushUnionScope(argIndex: number, field: FieldRecord): void {
        this.args[argIndex].push({
            argName: field.name,
            argType: this.declarationTable.uniqueName(field.declaration),
            isPointerType: false,
        })
    }

    popScope(argIndex: number): void {
        this.args[argIndex].pop()
    }

    buildIdentifier(): string {
        const argsPostfix = this.args
            .map(argStack => argStack.map(argStackItem => argStackItem.argType))
            .map(argStack => argStack.join('_'))
            .join('__')
        return `${this.method.implName}__${argsPostfix}`
    }

    buildSignature(): string {
        let args = this.args
            .map(argStack => argStack[argStack.length - 1])
            .map((arg, index) => {
                return arg.isPointerType
                    ? `const ${arg.argType} *arg_${index}`
                    : `const ${arg.argType} &arg_${index}`
            })
        if (this.method.hasReceiver()) {
            const receiver = this.method.generateReceiver()!
            args = [`${receiver.argType} ${receiver.argName}`, ...args]
        }
        return `${this.method.retType} ${this.buildIdentifier()}(${args.join(', ')})`
    }
}

class MethodDelegationsPrinter extends MethodSeparatorVisitor {
    public readonly declPrinter = new IndentedPrinter()
    public readonly implPrinter = new IndentedPrinter()
    private delegationSignatureBuilder: DelegationSignatureBuilder
    constructor(
        declarationTable: DeclarationTable,
        method: PeerMethod,
    ) {
        super(declarationTable, method)
        this.delegationSignatureBuilder = new DelegationSignatureBuilder(declarationTable, method)
    }

    onPushUnionScope(argIndex: number, field: FieldRecord, selectorValue: number): void {
        super.onPushUnionScope(argIndex, field, selectorValue)
        this.delegationSignatureBuilder!.pushUnionScope(argIndex, field)        
    }

    onPopUnionScope(argIndex: number): void {
        super.onPopUnionScope(argIndex)
        this.delegationSignatureBuilder.popScope(argIndex)
    }

    onVisitInseparable(): void {
        const signature = this.delegationSignatureBuilder.buildSignature()
        this.declPrinter.print(`${signature};`) 

        let retStatement = ""
        if (!this.method.retConvertor.isVoid) {
            const retValue = this.method.retConvertor.isStruct ? "{}" : "0"
            retStatement = `return ${retValue};`
        }
        this.implPrinter.print(`${signature} { ${retStatement} }`)
    }
}

class DelegationVisitor {
    readonly api: IndentedPrinter = new IndentedPrinter()
    readonly impl: IndentedPrinter = new IndentedPrinter()

    constructor(
        private readonly library: PeerLibrary,
    ) {}

    private printMethod(method: PeerMethod) {
        const visitor = new MethodDelegationsPrinter(
            this.library.declarationTable,
            method,
        )
        visitor.visit()
        visitor.declPrinter.getOutput().forEach(it => this.api.print(it))
        visitor.implPrinter.getOutput().forEach(it => this.impl.print(it))
    }

    print(): void {
        for (const file of this.library.files) {
            for (const peer of file.peers.values()) {
                for (const method of peer.methods) {
                    this.printMethod(method)
                }
            }
        }
        for (const materialized of Materialized.Instance.materializedClasses.values()) {
            this.printMethod(materialized.ctor)
            this.printMethod(materialized.dtor)
            for (const method of materialized.methods) {
                this.printMethod(method)
            }
        }
    }
}

export function printDelegationsHeaders(library: PeerLibrary): string {
    const visitor = new DelegationVisitor(library)
    visitor.print()
    // TODO here can be conflicts between different union filds with same types
    const uniqueDeclarations = Array.from(new Set(visitor.api.getOutput()))
    return uniqueDeclarations.join('\n')
}

export function printDelegationsImplementation(library: PeerLibrary): string {
    const visitor = new DelegationVisitor(library)
    visitor.print()
    // TODO here can be conflicts between different union filds with same types
    const uniqueDeclarations = Array.from(new Set(visitor.impl.getOutput()))
    return completeDelegationsImpl(uniqueDeclarations.join('\n'))
}