import * as fs from "fs"
import * as path from "path"
import * as idl from "@idlize/core/idl"
import { IDLEntry, IDLMethod, IDLInterface, isInterface } from "@idlize/core/idl"
import { IndentedPrinter, capitalize, toCamelCase } from "@idlize/core"

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

        if (isInterface(node)) {
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

        methods.forEach(method => this.visitMethod(method, node, printer))
    }

    private visitMethod(method: IDLMethod, parentNode: IDLInterface, printer: IndentedPrinter): void {
        const returnType = method.returnType ? this.convertType(method.returnType) : "void"

        const capitalizedMethodName = capitalize(method.name)
        const methodNameWithPrefix = `impl_skoala_${parentNode.name}__1n${capitalizedMethodName}`
        const signature = `${returnType} ${methodNameWithPrefix}(`

        printer.print(signature)

        printer.pushIndent()

        const parametersList: string[] = [];

        const pointerName = `${toCamelCase(parentNode.name)}Ptr`

        const isStaticMethod = method.isStatic || false

        if (!isStaticMethod) {
            parametersList.push(`KNativePointer ${pointerName}`)
        }

        const methodParameters = method.parameters
            .map(param => {
                if (!param.type) {
                    throw new Error(`Parameter type is not defined for parameter ${param.name} in method ${method.name}`);
                }
                const typeName = this.convertType(param.type)
                return `${typeName} ${param.name}`
            })

        const parameters = parametersList.concat(methodParameters).join(", ")
        printer.print(parameters)
        printer.popIndent()

        printer.print(");")
        printer.print("")
    }

    private convertType(idlType: idl.IDLType): string {
        switch (idl.forceAsNamedNode(idlType).name) {
            case "float32": return "float"
            case "int32": return "int"
            case "uint32": return "unsigned int"
            case idl.IDLBooleanType.name: return "bool"
            case idl.IDLStringType.name: return "char*"
            case idl.IDLVoidType.name: return "void"
            case "KNativePointer": return "KNativePointer"
            default: return "void*"
        }
    }

    private saveCCode(cCode: string): void {
        const baseFileName = path.basename(this.fileName, ".d.ts")
        const outputFileName = `${baseFileName}.h`
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