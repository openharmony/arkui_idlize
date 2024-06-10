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

import * as path from "path";
import * as fs from "fs";
import { IndentedPrinter } from "../IndentedPrinter";
import { DeclarationTable, DeclarationTarget, FieldRecord, PrimitiveType } from "./DeclarationTable";
import { completeDelegatesImpl, warning } from "./FileGenerators";
import { PeerLibrary } from "./PeerLibrary";
import { MethodSeparatorVisitor, PeerMethod } from "./PeerMethod";
import { PeerClass } from "./PeerClass";
import { MaterializedClass } from "./Materialized";
import { CppFileWriter, CppHeaderFileGenerator as CppHeaderFileWriter, CppSourceFileGenerator as CppSourceFileWriter } from "./CppFileGenerator";

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
        exists?: boolean,
    }[][]

    pushUnionScope(argIndex: number, field: FieldRecord): void {
        this.args[argIndex].push({
            argName: field.name,
            argType: this.declarationTable.computeTargetName(field.declaration, false),
            isPointerType: false,
        })
    }

    pushOptionScope(argIndex: number, target: DeclarationTarget, exists: boolean): void {
        const arg = this.args[argIndex]
        arg.push({
            argName: arg[arg.length - 1].argName,
            argType: this.declarationTable.computeTargetName(exists ? target : PrimitiveType.Undefined, false),
            isPointerType: false,
            exists: exists,
        })
    }

    popScope(argIndex: number): void {
        this.args[argIndex].pop()
    }

    buildIdentifier(): string {
        const argsPostfix = this.args
            .map(argStack => argStack.map(argStackItem => {
                return argStackItem.exists !== undefined
                    ? (argStackItem.exists ? "Def" : "Undef")
                    : argStackItem.argType
            }))
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

    protected override onPushUnionScope(argIndex: number, field: FieldRecord, selectorValue: number): void {
        super.onPushUnionScope(argIndex, field, selectorValue)
        this.delegateSignatureBuilder!.pushUnionScope(argIndex, field)
    }

    protected override onPopUnionScope(argIndex: number): void {
        super.onPopUnionScope(argIndex)
        this.delegateSignatureBuilder.popScope(argIndex)
    }

    protected override onPushOptionScope(argIndex: number, target: DeclarationTarget, exists: boolean): void {
        super.onPushOptionScope(argIndex, target, exists)
        this.delegateSignatureBuilder.pushOptionScope(argIndex, target, exists)
    }

    protected override onPopOptionScope(argIndex: number): void {
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

export function printDelegatesAsMultipleFiles(library: PeerLibrary, outputDir: string) {
    const visitor = new MultiFileDelegateVisitor(library)
    visitor.print()
    visitor.emitSync(outputDir)
}


interface MultiFileDelegatePrinters {
    api: IndentedPrinter
    impl: IndentedPrinter
}

class MultiFileDelegateVisitor {
    private readonly printers: Map<string, MultiFileDelegatePrinters> = new Map();
    private api?: IndentedPrinter
    private impl?: IndentedPrinter
    
    constructor(
        private readonly library: PeerLibrary,
    ) {}

    private printMethod(method: PeerMethod) {
        const visitor = new MethodDelegatePrinter(
            this.library.declarationTable,
            method,
        )
        visitor.visit()
        visitor.declPrinter.getOutput().forEach(it => this.api!.print(it))
        visitor.implPrinter.getOutput().forEach(it => this.impl!.print(it))
    }

    private onPeerStart(clazz: PeerClass) {
        let slug = clazz.componentName.toLowerCase()
        this.pushPrinters(slug)
    }

    private onPeerEnd(_clazz: PeerClass) {
        this.api = this.impl = undefined
    }

    private onMaterializedClassStart(clazz: MaterializedClass) {
        let slug = clazz.className.toLowerCase()
        this.pushPrinters(slug)
    }

    private onMaterializedClassEnd(_clazz: MaterializedClass) {
        this.api = this.impl = undefined
    }

    private pushPrinters(slug: string) {
        let printers = this.printers.get(slug)
        if (printers) {
            this.api = printers.api
            this.impl = printers.impl
            return
        }
        let api = this.api = new IndentedPrinter()
        let impl = this.impl = new IndentedPrinter()
        this.printers.set(slug, { api, impl })
    }

    print() {
        for (const file of this.library.files) {
            for (const peer of file.peers.values()) {
                this.onPeerStart(peer)
                for (const method of peer.methods) {
                    this.printMethod(method)
                }
                this.onPeerEnd(peer)
            }
        }
        for (const materialized of this.library.materializedClasses.values()) {
            this.onMaterializedClassStart(materialized)
            this.printMethod(materialized.ctor)
            this.printMethod(materialized.finalizer)
            for (const method of materialized.methods) {
                this.printMethod(method)
            }
            this.onMaterializedClassEnd(materialized)
        }
    }

    emitSync(outputDirectory: string): void {
        fs.mkdirSync(outputDirectory, { recursive: true });
        let implPrinter = new DelegateImplementationPrinter();
        let headerPrinter = new DelegateHeaderPrinter();

        for (const [slug, { api, impl }] of this.printers) {
            implPrinter.printFile(path.join(outputDirectory, `${slug}_delegates.cc`), impl);
            headerPrinter.printFile(path.join(outputDirectory, `${slug}_delegates.h`), api);
        }
    }
}

abstract class DelegateFilePrinter {
    static readonly GENERATED_WARNING = `/*
 * ${warning}
 */
`
    public printFile(filePath: string, source: IndentedPrinter) {
        let output = this.createFileWriter(filePath)
        output.writeLine(DelegateFilePrinter.GENERATED_WARNING)
        let uniqueDecls = new Set(source.getOutput())
        for (const decl of uniqueDecls) {
            output.writeLine(decl)
        }
        output.end()
    }

    protected abstract createFileWriter(filePath: string): CppFileWriter
}

class DelegateHeaderPrinter extends DelegateFilePrinter {
    protected createFileWriter(filePath: string): CppFileWriter {
        return new CppHeaderFileWriter(filePath)
    }
}

class DelegateImplementationPrinter extends DelegateFilePrinter {
    protected createFileWriter(filePath: string): CppFileWriter {
        const output = new CppSourceFileWriter(filePath)
        const headerName = path.basename(filePath, ".cc") + ".h"
        output.writeInclude("Serializers.h")
        output.writeInclude(headerName)
        output.writeLine()
        return output
    }
}
