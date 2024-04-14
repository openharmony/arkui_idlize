import * as ts from "typescript"
import { IndentedPrinter } from "../IndentedPrinter"
import { SortingEmitter } from "./SortingEmitter"
import { getDeclarationsByNode, identName, importTypeName } from "../util"
import { PeerGeneratorVisitor } from "./PeerGeneratorVisitor"

export class DeserializerGenerator {
    constructor(private structPrinter: SortingEmitter, private deserPrinter: IndentedPrinter) {
    }

    generate(name: string, type: ts.TypeNode, optional: boolean, visitor: PeerGeneratorVisitor) {
        let typeName = ts.isTypeReferenceNode(type) ? type.typeName : (ts.isImportTypeNode(type) ? type.qualifier : undefined)
        let declarations = typeName ? getDeclarationsByNode(visitor.typeChecker, typeName) : []
        //this.structPrinter.startEmit(visitor.typeChecker, visitor, type, name)
        while (declarations.length > 0 && ts.isTypeAliasDeclaration(declarations[0])) {
            type = declarations[0].type
            declarations = getDeclarationsByNode(visitor.typeChecker, declarations[0].type) ?? []
        }
        let isEnum = declarations.length > 0 && ts.isEnumDeclaration(declarations[0])
        if (isEnum) {
            this.structPrinter.print(`typedef int32_t ${name};`)
            return
        }
        if (ts.isImportTypeNode(type)) {
            this.structPrinter.print(`typedef CustomObject ${importTypeName(type)};`)
            return
        }
        this.deserPrinter.print(`${name} read${name}() {`)
        this.deserPrinter.pushIndent()
        let structFields: (ts.PropertySignature | ts.PropertyDeclaration)[] = []
        this.deserPrinter.print(`Deserializer& valueDeserializer = *this;`)
        this.deserPrinter.print(`${name} value;`)
        if (declarations.length > 0 && !optional) {
            this.structPrinter.print(`struct ${name} {`)
            this.structPrinter.pushIndent()
            this.deserPrinter.print(`int32_t tag = valueDeserializer.readInt8();`)
            this.deserPrinter.print(`if (tag == Tags::TAG_UNDEFINED) throw new Error("Undefined");`)
            let declaration = declarations[0]
            if (ts.isInterfaceDeclaration(declaration)) {
                declaration.members
                    .filter(ts.isPropertySignature)
                    .forEach(it => structFields.push(it))
            }
            if (ts.isClassDeclaration(declaration)) {
                declaration.members
                    .filter(ts.isPropertyDeclaration)
                    .forEach(it => structFields.push(it))
            }
            if (ts.isTypeLiteralNode(type)) {
                type.members
                    .filter(ts.isPropertySignature)
                    .forEach(it => structFields.push(it))
            }
            structFields.forEach(it => this.processSingleField(it, name, visitor))
            if (ts.isEnumDeclaration(declaration)) {
                this.deserPrinter.print(`value = valueDeserializer.readInt32();`)
            }
            this.structPrinter.popIndent()
            this.structPrinter.print(`};`)
        } else {
            let convertor = visitor.declarationTable.typeConvertor("value", type, optional)
            convertor.convertorToCDeserial("value", "value", this.deserPrinter)
            this.structPrinter.print(`typedef ${convertor.nativeType(true)} ${name};`)
        }
        this.deserPrinter.print(`return value;`)
        this.deserPrinter.popIndent()
        this.deserPrinter.print(`}`)

        if (false) {
            this.structPrinter.print(`template <>`)
            this.structPrinter.print(`inline void WriteToString(string* result, const ${name}& value) {`)
            this.structPrinter.pushIndent()
            this.structPrinter.print(`result->append("${name} {");`)
            structFields.forEach((field, index) => {
                const fieldName = identName(field.name)
                if (index > 0) this.structPrinter.print(`result->append(", ");`)
                let isStatic = field.modifiers?.find(it => it.kind == ts.SyntaxKind.StaticKeyword) != undefined
                if (isStatic) {
                    this.structPrinter.print(`/* Ignore static ${fieldName} */`)
                } else {
                    this.structPrinter.print(`result->append("${fieldName}=");`)
                    this.structPrinter.print(`WriteToString(result, value.${fieldName});`)
                }
            })
            this.structPrinter.print(`result->append("}");`)
            this.structPrinter.popIndent()
            this.structPrinter.print(`}`)
        }
    }

    private processSingleField(field: ts.PropertySignature | ts.PropertyDeclaration, structName: string, visitor: PeerGeneratorVisitor) {
        if (!field.type) throw new Error("Untyped field")
        let isStatic = field.modifiers?.find(it => it.kind == ts.SyntaxKind.StaticKeyword) != undefined
        if (isStatic) return
        const optional = field.questionToken !== undefined
        visitor.requestType(`${structName}_${identName(field.name)}`, field.type)
        let typeConvertor = visitor.declarationTable.typeConvertor("value", field.type, optional)
        let fieldName = identName(field.name)
        let nativeType = typeConvertor.nativeType(false)
        this.structPrinter.print(`${nativeType} ${fieldName};`)
        typeConvertor.convertorToCDeserial(`value`, `value.${fieldName}`, this.deserPrinter)
    }
}
