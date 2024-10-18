import { IDLEntry, IDLInterface, isInterface, isClass } from "../../idl"
import { IndentedPrinter } from "../../IndentedPrinter"
import { cStyleCopyright } from "../FileGenerators"
import * as fs from "fs"
import * as path from "path"

export class SkoalaDeserializerPrinter {
    static generateDeserializer(outputDir: string, generatedIDLMap: Map<string, IDLEntry[]>) {
        let combinedDeserializerPrinter = new IndentedPrinter()
        
        combinedDeserializerPrinter.print(cStyleCopyright)

        combinedDeserializerPrinter.print(`#ifndef DESERIALIZER_H`)
        combinedDeserializerPrinter.print(`#define DESERIALIZER_H`)
        combinedDeserializerPrinter.print("")

        combinedDeserializerPrinter.print(`#include "DeserializerBase.h"`)
        combinedDeserializerPrinter.print("")
        combinedDeserializerPrinter.print(`class Deserializer : public DeserializerBase {`)
        combinedDeserializerPrinter.print(`public:`)
        combinedDeserializerPrinter.pushIndent()
        combinedDeserializerPrinter.print(`Deserializer(uint8_t* data, int32_t length) : DeserializerBase(data, length) {}`)
        combinedDeserializerPrinter.print(``)

        generatedIDLMap.forEach((entries, fileName) => {
            const deserializerGenerator = new SkoalaDeserializerPrinter(entries)
            deserializerGenerator.generateSkoalaDeserializer(combinedDeserializerPrinter)
            console.log(`Methods added to deserializer for ${fileName}.`)
        })

        combinedDeserializerPrinter.popIndent()
        combinedDeserializerPrinter.print("};")
        combinedDeserializerPrinter.print("")
        combinedDeserializerPrinter.print("#endif")

        const deserializerCode = combinedDeserializerPrinter.getOutput().join("\n")

        if (deserializerCode.trim()) {
            const deserializerFilePath = path.join(outputDir, "deserializer.h")
            fs.writeFileSync(deserializerFilePath, deserializerCode)
            console.log(`Combined Deserializer generated and saved to: ${deserializerFilePath}`)
        } else {
            console.log("No deserializer code generated")
        }
    }
    private entries: IDLEntry[]

    constructor(entries: IDLEntry[]) {
        this.entries = entries
    }

    public generateSkoalaDeserializer(printer: IndentedPrinter): void {
        this.entries.forEach(entry => {
            if (isInterface(entry) || isClass(entry)) {
                this.visitSkoalaDeserializer(entry as IDLInterface, printer)
            }
        })
    }

    private visitSkoalaDeserializer(node: IDLInterface, printer: IndentedPrinter): void {
        const className = `Skoala_${node.name}`
        const deserializerName = `read${node.name}`
        printer.print(`${className} ${deserializerName}(DeserializerBase deserializer) {`)
        printer.pushIndent()
        printer.print(`${className} value = {};`)

        if (node.properties) {
            node.properties.forEach((property: any) => {
                const fieldName = property.name
                const fieldType = this.convertType(property.type.name)

                if (this.isPrimitiveType(fieldType)) {
                    const readMethod = this.getReadMethodForType(fieldType)
                    printer.print(`value.${fieldName} = deserializer.${readMethod}();`)
                } else {
                    const readMethod = `read${fieldType}`
                    printer.print(`value.${fieldName} = deserializer.${readMethod}();`)
                }
            })
        }

        if (node.constants) {
            node.constants.forEach((constant: any) => {
                const constName = constant.name
                const constType = this.convertType(constant.type.name)
                const readMethod = `read${constType}`
                printer.print(`value.${constName} = deserializer.${readMethod}();`)
            })
        }

        printer.print(`return value;`)
        printer.popIndent()
        printer.print("}")
        printer.print("")
    }

    private convertType(idlType: string): string {
        const typeMapping: { [key: string]: string } = {
            "float32": "Float32",
            "int32": "Int32",
            "uint32": "UInt32",
            "boolean": "Boolean",
            "DOMString": "String",
            "void_": "void",
            "KNativePointer": "NativePointer",
        };

        return typeMapping[idlType] || idlType
    }

    private isPrimitiveType(type: string): boolean {
        const primitiveTypes = ["Int32", "Float32", "Boolean", "String"]
        return primitiveTypes.includes(type)
    }

    private getReadMethodForType(type: string): string {
        const readMethods: { [key: string]: string } = {
            "Int32": "readInt32",
            "Float32": "readFloat32",
            "Boolean": "readBoolean",
            "String": "readString",
        }

        return readMethods[type] || `read${type}`
    }
}
