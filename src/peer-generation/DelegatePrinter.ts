import { IndentedPrinter } from "../IndentedPrinter";
import { DeclarationTable, FieldRecord } from "./DeclarationTable";
import { completeDelegatesImpl } from "./FileGenerators";
import { PeerLibrary } from "./PeerLibrary";
import { MethodSeparatorVisitor, PeerMethod } from "./PeerMethod";

export class DelegateSignatureBuilder {
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
            argType: this.declarationTable.computeTargetName(field.declaration, false),
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

class MethodDelegatePrinter extends MethodSeparatorVisitor {
    public readonly declPrinter = new IndentedPrinter()
    public readonly implPrinter = new IndentedPrinter()
    private delegateSignatureBuilder: DelegateSignatureBuilder
    constructor(
        declarationTable: DeclarationTable,
        method: PeerMethod,
    ) {
        super(declarationTable, method)
        this.delegateSignatureBuilder = new DelegateSignatureBuilder(declarationTable, method)
    }

    onPushUnionScope(argIndex: number, field: FieldRecord, selectorValue: number): void {
        super.onPushUnionScope(argIndex, field, selectorValue)
        this.delegateSignatureBuilder!.pushUnionScope(argIndex, field)
    }

    onPopUnionScope(argIndex: number): void {
        super.onPopUnionScope(argIndex)
        this.delegateSignatureBuilder.popScope(argIndex)
    }

    onVisitInseparable(): void {
        const signature = this.delegateSignatureBuilder.buildSignature()
        this.declPrinter.print(`${signature};`)
        const retStatement = this.method.retConvertor.isVoid ? "" :`return 0;`
        this.implPrinter.print(`${signature} { ${retStatement} }`)
    }
}

class DelegateVisitor {
    readonly api: IndentedPrinter = new IndentedPrinter()
    readonly impl: IndentedPrinter = new IndentedPrinter()

    constructor(
        private readonly library: PeerLibrary,
    ) {}

    private printMethod(method: PeerMethod) {
        const visitor = new MethodDelegatePrinter(
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
        for (const materialized of this.library.materializedClasses.values()) {
            this.printMethod(materialized.ctor)
            this.printMethod(materialized.finalizer)
            for (const method of materialized.methods) {
                this.printMethod(method)
            }
        }
    }
}

export function printDelegatesHeaders(library: PeerLibrary): string {
    const visitor = new DelegateVisitor(library)
    visitor.print()
    // TODO here can be conflicts between different union filds with same types
    const uniqueDeclarations = Array.from(new Set(visitor.api.getOutput()))
    return uniqueDeclarations.join('\n')
}

export function printDelegatesImplementation(library: PeerLibrary): string {
    const visitor = new DelegateVisitor(library)
    visitor.print()
    // TODO here can be conflicts between different union filds with same types
    const uniqueDeclarations = Array.from(new Set(visitor.impl.getOutput()))
    return completeDelegatesImpl(uniqueDeclarations.join('\n'))
}