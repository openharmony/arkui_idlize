import * as fs from "fs"
import * as path from "path"
import { IDLEntry, IDLMethod, IDLInterface, isInterface, isClass } from "../../idl"
import { IndentedPrinter } from "../../IndentedPrinter"

export class SkoalaCCodeGenerator {
    private entries: IDLEntry[]
    private outputDir: string
    private fileName: string

    constructor(entries: IDLEntry[], outputDir: string, fileName: string) {
        this.entries = entries
        this.outputDir = outputDir
        this.fileName = fileName
    }

    public generate(): void {
        const printer = new IndentedPrinter()

        this.entries.forEach(entry => this.visit(entry, printer))

        const cCode = printer.getOutput().join("\n")
        if (cCode.trim()) {
            this.saveCCode(cCode)
        } else {
            console.log("C code generation failed, no code to save.")
        }
    }

    private visit(node: IDLEntry, printer: IndentedPrinter): void {
        console.log(`Processing IDLEntry with kind: ${node.kind}, name: ${(node as any).name || "Unnamed"}`)

        if (isInterface(node) || isClass(node)) {
            this.visitInterface(node as IDLInterface, printer)
        } else {
            console.log(`Skipping unsupported IDLEntry kind: ${node.kind}`)
        }
    }

    private visitInterface(node: IDLInterface, printer: IndentedPrinter): void {
        const methods = node.methods || []
        if (methods.length === 0) {
            console.log(`No methods found in interface/class ${node.name}`)
            return
        }

        methods.forEach(method => this.visitMethod(method, printer))
    }

    private visitMethod(method: IDLMethod, printer: IndentedPrinter): void {
        const returnType = method.returnType ? this.convertType(method.returnType.name) : "void"
        const signature = `${returnType} ${method.name}(`
        printer.print(signature)

        printer.pushIndent()
        const parameters = method.parameters
            .map(param => {
                if (!param.type) {
                    throw new Error(`Parameter type is not defined for parameter ${param.name} in method ${method.name}`)
                }
                const typeName = this.convertType(param.type.name)
                return `${typeName} ${param.name}`
            })
            .join(", ")
        printer.print(parameters)
        printer.popIndent()

        printer.print(") {")
        printer.pushIndent()
        printer.print(`// TODO: Implement ${method.name}`)

        if (returnType !== "void") {
            printer.print(`return (${returnType})0; // Placeholder return value`)
        }

        printer.popIndent()
        printer.print("}")
        printer.print("")
    }

    private convertType(idlType: string): string {
        const typeMapping: { [key: string]: string } = {
            "float32": "float",
            "int32": "int",
            "uint32": "unsigned int",
            "boolean": "bool",
            "DOMString": "char*",
            "void_": "void",
        }

        return typeMapping[idlType] || "void*"
    }

    private saveCCode(cCode: string): void {
        const baseFileName = path.basename(this.fileName, ".d.ts")
        const outputFileName = `${baseFileName}.cc`
        const outputPath = path.join(this.outputDir, outputFileName)

        console.log("Saving C Code to:", outputPath)

        try {
            fs.writeFileSync(outputPath, cCode)
            console.log("C code generated and saved to:", outputPath)
        } catch (error) {
            console.error("Error saving C code:", error)
        }
    }
}
