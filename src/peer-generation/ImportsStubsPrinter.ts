import { IndentedPrinter } from "../IndentedPrinter";
import { PeerLibrary } from "./PeerLibrary";

class ImportsStubsVisitor {
    readonly printer = new IndentedPrinter()

    constructor(
        private readonly library: PeerLibrary,
    ) {}

    print(): void {
        const printedStubs: string[] = []
        for (const type of this.library.importTypesStubs) {
            if (printedStubs.includes(type)) continue
            printedStubs.push(type)
            this.printer.print(`export declare interface ${type} {}`)
        }
    }
}

export function printImportsStubs(library: PeerLibrary) {
    const visitor = new ImportsStubsVisitor(library)
    visitor.print()
    return visitor.printer.getOutput().join("\n")
}