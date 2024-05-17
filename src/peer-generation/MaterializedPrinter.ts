import * as path from "path"
import { IndentedPrinter } from "../IndentedPrinter";
import { Language, renameClassToMaterialized } from "../util";

import { PeerLibrary } from "./PeerLibrary";
import { writePeerMethod } from "./PeersPrinter"

import { LanguageWriter, NamedMethodSignature, Type, createLanguageWriter } from "./LanguageWriters";

import { Materialized, MaterializedClass, MaterializedMethod} from "./Materialized"

import { makeMaterializedPrologue } from "./FileGenerators";

class MaterializedFileVisitor {

    readonly printer: LanguageWriter = createLanguageWriter(new IndentedPrinter(), this.language)

    constructor(
        private readonly language: Language,
        private readonly clazz: MaterializedClass,
        private readonly dumpSerialized: boolean,
    ) {}

    private printMaterializedClass(clazz: MaterializedClass) {
        const printer = this.printer
        printer.print(makeMaterializedPrologue(this.language))

        printer.writeClass(clazz.className, writer => {

            const pointerType = Type.Pointer
            writePeerMethod(writer, clazz.ctor, this.dumpSerialized, "", "", pointerType)

            writer.writeConstructorImplementation(clazz.className, clazz.ctor.method.signature, writer => {
                const ctorSig = clazz.ctor.method.signature as NamedMethodSignature
                writer.writeStatement(writer.makeAssign("ctorPtr", pointerType,
                    writer.makeMemberCall(clazz.className, "ctor", ctorSig.argsNames)
                ))

                writer.writeSuperCall([`ctorPtr`])
            })

            clazz.methods.forEach(method => {
                writePeerMethod(writer, method, this.dumpSerialized, "", "this.ptr")
            })
        }, "Finalizable")
    }

    printFile(): void {
        this.printMaterializedClass(this.clazz)
    }

    private getReturnValue(className: string, retType: string| undefined): string| undefined {
        if (retType === undefined || retType === "void") {
            return ""
        } else if(retType === className) {
            return (`this`)
        } else if (retType === "boolean") {
            return `true`
        } else {
            return undefined
        }
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
            const visitor = new MaterializedFileVisitor(
                this.library.declarationTable.language, clazz, this.dumpSerialized)
            visitor.printFile()
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