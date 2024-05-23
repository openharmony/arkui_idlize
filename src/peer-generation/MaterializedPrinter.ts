import { IndentedPrinter } from "../IndentedPrinter";
import { Language, renameClassToMaterialized } from "../util";
import { PeerLibrary } from "./PeerLibrary";
import { writePeerMethod } from "./PeersPrinter"
import { LanguageWriter, MethodModifier, NamedMethodSignature, Method, Type, createLanguageWriter } from "./LanguageWriters";
import { MaterializedClass } from "./Materialized"
import { makeMaterializedPrologue } from "./FileGenerators";
import { OverloadsPrinter, collapseSameNamedMethods, groupOverloads } from "./OverloadsPrinter";

class MaterializedFileVisitor {

    readonly printer: LanguageWriter = createLanguageWriter(new IndentedPrinter(), this.language)
    private overloadsPrinter = new OverloadsPrinter(this.printer, this.library, false)

    constructor(
        private readonly language: Language,
        private readonly library: PeerLibrary,
        private readonly clazz: MaterializedClass,
        private readonly dumpSerialized: boolean,
    ) {}

    private printMaterializedClass(clazz: MaterializedClass) {
        const printer = this.printer
        printer.print(makeMaterializedPrologue(this.language))

        printer.writeClass(clazz.className, writer => {

            const finalizableType = new Type("Finalizable")
            writer.writeFieldDeclaration("peer", finalizableType, undefined, true)

            const pointerType = Type.Pointer
            makePrivate(clazz.ctor.method)
            writePeerMethod(writer, clazz.ctor, this.dumpSerialized, "", "", pointerType)

            const ctorSig = clazz.ctor.method.signature as NamedMethodSignature
            const sigWithPointer = new NamedMethodSignature(
                ctorSig.returnType,
                ctorSig.args.map(it => new Type(it.name, true)),
                ctorSig.argsNames,
                ctorSig.defaults)

            const allUndefined = ctorSig.argsNames.map(it => `${it} === undefined`).join(` && `)

            writer.writeConstructorImplementation(clazz.className, sigWithPointer, writer => {

                writer.writeStatement(
                    writer.makeCondition(
                        writer.makeString(ctorSig.args.length === 0 ? "true" : allUndefined),
                        writer.makeReturn()
                    )
                )

                const args = ctorSig.args.map((it, index) => writer.makeString(`${ctorSig.argsNames[index]}${it.nullable ? "" : "!"}`))
                writer.writeStatement(
                    writer.makeAssign("ctorPtr", Type.Pointer,
                        writer.makeMethodCall(clazz.className, "ctor", args),
                        true))

                writer.writeStatement(writer.makeAssign(
                    "this.peer",
                    finalizableType,
                    writer.makeString("new Finalizable(ctorPtr)"),
                    false
                ))
            })

            for (const grouped of groupOverloads(clazz.methods)) {
                this.overloadsPrinter.printGroupedComponentOverloads(clazz, grouped)
            }

            clazz.methods.forEach(method => {
                makePrivate(method.method)
                const returnType = method.tsReturnType()
                writePeerMethod(writer, method, this.dumpSerialized, "_serialize", "this.peer!.ptr", returnType)
            })
        })
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
        for (const clazz of this.library.materializedClasses.values()) {
            const visitor = new MaterializedFileVisitor(
                this.library.declarationTable.language, this.library, clazz, this.dumpSerialized)
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
        result.set(key, content.join('\n'))
    }
    return result
}

function makePrivate(method: Method) {
    method.modifiers?.unshift(MethodModifier.PRIVATE)
}