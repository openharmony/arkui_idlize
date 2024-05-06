import * as path from "path"
import { IndentedPrinter } from "../IndentedPrinter";
import { Language, renameClassToMaterialized, renameDtsToPeer, throwException } from "../util";

import { PeerLibrary } from "./PeerLibrary";

import { Materialized, MaterializedClass} from "./Materialized"

class MaterializedFileVisitor {
    readonly printer: IndentedPrinter = new IndentedPrinter()

    constructor(
        private readonly clazz: MaterializedClass,
        private readonly dumpSerialized: boolean,
    ) {}

    private printMaterializedClass(printer: IndentedPrinter, clazz: MaterializedClass) {
        printer.print(`import { Finalizable } from "@koalaui/arkoala"`)
        printer.print(`export class ${clazz.className} extends Finalizable {`)
        printer.pushIndent()
        let consParams = clazz.ctor.argConvertors.map(it => `${it.param}: ${it.tsTypeName}`).join(", ")
        // constructor
        printer.print(`constructor(${consParams}) {`)
        printer.pushIndent()
        printer.print(`super(BigInt(42)) // TBD`)
        printer.popIndent()
        printer.print(`}`)
        // methods
        clazz.methods.forEach(method => {
            let staticModifier = method.hasReceiver ? "" : "static "
            let returnType = method.tsRetType === undefined ? "" : `: ${method.tsRetType} `
            let params = method.argConvertors.map(it => `${it.param}: ${it.tsTypeName}`).join(", ")
            printer.print(`${staticModifier}${method.methodName}(${params})${returnType} {`)
            printer.pushIndent()
            printer.print(`// TBD nativeModule()...`)
            printer.print(`return this`)
            printer.popIndent()
            printer.print(`}`)
        })
        printer.popIndent()
        printer.print(`}`)
    }

    printFile(): void {
        this.printMaterializedClass(this.printer, this.clazz)
    }
}

class MaterializedVisitor {
    readonly materialized: Map<string, string[]> = new Map()

    constructor(
        private readonly library: PeerLibrary,
        private readonly dumpSerialized: boolean,
    ) {}

    printMaterialized(): void {
        for (const clazz of Materialized.Instance.materializedClasses.values()) {
            const visitor = new MaterializedFileVisitor(clazz, this.dumpSerialized)
            visitor.printFile()
            renameClassToMaterialized
            //this.materialized.set(`Ark${clazz.className}Materialized.ts`, visitor.printer.getOutput())
            const fileName = renameClassToMaterialized(clazz.className, this.library.declarationTable.language)
            this.materialized.set(fileName, visitor.printer.getOutput())
        }
    }
}

export function printMaterialized(peerLibrary: PeerLibrary, dumpSerialized: boolean): Map<string, string> {

    // TODO: support other output languages
    if (peerLibrary.declarationTable.language != Language.TS)
        return new Map()
 
    const visitor = new MaterializedVisitor(peerLibrary, dumpSerialized)
    visitor.printMaterialized()
    const result = new Map<string, string>()
    for (const [key, content] of visitor.materialized) {
        if (content.length === 0) continue
        console.log(`  key: ${key}, content: ${content.join(`|`)}`)
        result.set(key, content.join('\n'))
    }
    return result
}