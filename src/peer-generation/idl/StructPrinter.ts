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

import * as idl from "../../idl"
import { IndentedPrinter } from "../../IndentedPrinter"
import { camelCaseToUpperSnakeCase } from "../../util"
import { RuntimeType } from "../ArgConvertors"
// import { ArkPrimitiveType } from "../DeclarationTable"
import { ArkPrimitiveType } from "../ArkPrimitiveType"
import { LanguageExpression, LanguageWriter, Method, MethodModifier, NamedMethodSignature, Type } from "../LanguageWriters"
import { PeerGeneratorConfig } from "../PeerGeneratorConfig"
import { isImport, isStringEnum } from "./common"
import { isBuilderClass, isMaterialized } from "./IdlPeerGeneratorVisitor"
import { cleanPrefix, IdlPeerLibrary } from "./IdlPeerLibrary"

export class StructPrinter {
    constructor(private library: IdlPeerLibrary) {}

    private isPointerDeclaration(target: idl.IDLEntry, isOptional: boolean = false): boolean {
        if (isOptional) return true
        if (idl.isPrimitiveType(target))
            return ["any", "DOMString", "number", "Length", "CustomObject"].includes(target.name)
        if (idl.isEnum(target) || idl.isEnumType(target)) return false
        if (idl.isReferenceType(target) && target.name === "GestureType") return false
        return true
    }

    private printStructsCHead(name: string, target: idl.IDLEntry, structs: LanguageWriter) {
        // if (descriptor.isArray) {
        //     // Forward declaration of element type.
        //     let elementTypePointer = descriptor.getFields()[0].declaration
        //     if (!(elementTypePointer instanceof PointerType))
        //         throw new Error(`Unexpected ${this.computeTargetName(elementTypePointer, false)}`)
        //     let elementType = elementTypePointer.pointed
        //     if (!(elementType instanceof PrimitiveType)) {
        //         let name = this.computeTargetName(elementType, false)
        //         if (ts.isEnumDeclaration(elementType)) {
        //             structs.print(`typedef int32_t ${this.enumName(elementType.name)};`)
        //         }
        //     }
        // }
        structs.print(`typedef struct ${name} {`)
        structs.pushIndent()
    }


    private printStructsCTail(name: string, structs: LanguageWriter) {
        structs.popIndent()
        structs.print(`} ${name};`)
    }

    generateStructs(structs: LanguageWriter, typedefs: IndentedPrinter, writeToString: LanguageWriter) {
        const seenNames = new Set<string>()
        seenNames.clear()
        let noDeclaration = ["Int32", "Tag", "number", "boolean", "DOMString"]
        for (let target of this.library.orderedDependencies) {
            let nameAssigned = this.library.computeTargetName(target, false)
            if (nameAssigned === ArkPrimitiveType.Tag.getText())
                continue
            if (!nameAssigned) {
                throw new Error(`No assigned name for an ${idl.IDLKind[target.kind!]}`)
            }
            if (seenNames.has(nameAssigned)) continue
            seenNames.add(nameAssigned)
            let isPointer = this.isPointerDeclaration(target)
            let isAccessor = (idl.isClass(target) || idl.isInterface(target)) && isMaterialized(target)
            let noBasicDecl = isAccessor || noDeclaration.includes(nameAssigned)
            const nameOptional = ArkPrimitiveType.OptionalPrefix + cleanPrefix(nameAssigned, ArkPrimitiveType.Prefix)
            if (idl.isEnum(target)) {
                const stringEnum = isStringEnum(target)
                structs.print(`typedef enum ${nameAssigned} {`)
                structs.pushIndent()
                for (let member of target.elements) {
                    const memberName = member.documentation?.includes("@deprecated")
                        ? member.name : camelCaseToUpperSnakeCase(member.name)
                    const initializer = !stringEnum && member.initializer ? " = " + member.initializer : ""
                    structs.print(`${camelCaseToUpperSnakeCase(nameAssigned)}_${memberName}${initializer},`)
                }
                structs.popIndent()
                structs.print(`} ${nameAssigned};`)
            } else if (!noBasicDecl && !this.ignoreTarget(target)) {
                // TODO: fix it to define array type after its elements types
                if (nameAssigned === `Array_GestureRecognizer`) {
                    structs.print(`typedef Ark_Materialized ${ArkPrimitiveType.Prefix}GestureRecognizer;`)
                }

                this.printStructsCHead(nameAssigned, target, structs)
                if (idl.isUnionType(target)) {
                    structs.print(`${ArkPrimitiveType.Prefix}Int32 selector;`)
                    structs.print("union {")
                    structs.pushIndent()
                    target.types.forEach((it, index) =>
                        structs.print(`${this.library.getTypeName(it, false)} value${index};`))
                    structs.popIndent()
                    structs.print("};")
                } else if (idl.isClass(target) || idl.isInterface(target) || idl.isAnonymousInterface(target) || idl.isTupleInterface(target)) {
                    const properties = collectProperties(target, this.library)
                    if (properties.length === 0) {
                        structs.print(`void *handle;`) // avoid empty structs
                    }
                    properties.forEach(it =>
                        structs.print(`${this.library.getTypeName(it.type, it.isOptional)} ${structs.escapeKeyword(it.name)};`))
                } else if (idl.isContainerType(target)) {
                    let fieldNames: string[] = []
                    switch (target.name) {
                        case "sequence":
                            structs.print("Ark_Int32 length;")
                            fieldNames = ["array"]
                            break
                        case "record":
                            structs.print("Ark_Int32 size;")
                            fieldNames = ["keys", "values"]
                            break
                    }
                    target.elementType.forEach((it, index) => {
                        const structKeyword = idl.isPrimitiveType(it) || idl.isEnumType(it) || it.name === "GestureRecognizer"
                            ? "" : "struct "
                        structs.print(`${structKeyword}${this.library.getTypeName(it)}* ${fieldNames[index]};`)
                    })
                }
                this.printStructsCTail(nameAssigned, structs)
            }
            if (isAccessor) {
                structs.print(`typedef Ark_Materialized ${nameAssigned};`)
            }
            let skipWriteToString = idl.isPrimitiveType(target) || idl.isCallback(target)
            if (!noBasicDecl && !skipWriteToString) {
                this.generateWriteToString(nameAssigned, target, writeToString, isPointer)
            }
            this.writeRuntimeType(target, nameAssigned, false, writeToString)
            if (seenNames.has(nameOptional)) continue
            seenNames.add(nameOptional)
            if (nameAssigned !== "Optional" && nameAssigned !== "RelativeIndexable") {
                this.printStructsCHead(nameOptional, target, structs)
                structs.print(`enum ${ArkPrimitiveType.Tag.getText()} tag;`)
                structs.print(`${nameAssigned} value;`)
                this.printStructsCTail(nameOptional, structs)
                this.writeOptional(nameOptional, writeToString, isPointer)
                this.writeRuntimeType(target, nameOptional, true, writeToString)
            }
        }
        // TODO: hack, remove me!
        typedefs.print(`typedef ${ArkPrimitiveType.OptionalPrefix}Length ${ArkPrimitiveType.OptionalPrefix}Dimension;`)
    }

    private writeRuntimeType(target: idl.IDLEntry, targetTypeName: string, isOptional: boolean, writer: LanguageWriter) {
        const resultType = new Type("Ark_RuntimeType")
        const op = this.writeRuntimeTypeOp(target, targetTypeName, resultType, isOptional, writer)
        if (op) {
            writer.print("template <>")
            writer.writeMethodImplementation(
                new Method("runtimeType",
                    new NamedMethodSignature(resultType, [new Type(`const ${targetTypeName}&`)], ["value"]),
                    [MethodModifier.INLINE]),
                op)
        }
    }

    private writeRuntimeTypeOp(
        target: idl.IDLEntry, targetTypeName: string, resultType: Type, isOptional: boolean, writer: LanguageWriter
    ) : ((writer: LanguageWriter) => void) | undefined
    {
        let result: LanguageExpression
        if (isOptional) {
            result = writer.makeTernary(writer.makeDefinedCheck("value.tag"),
                writer.makeRuntimeType(RuntimeType.OBJECT), writer.makeRuntimeType(RuntimeType.UNDEFINED))
        } else if (idl.isEnum(target)) {
            result = writer.makeRuntimeType(RuntimeType.NUMBER)
        } else if ((idl.isInterface(target) || idl.isClass(target)) && isMaterialized(target)) {
            return undefined
        } else if (idl.isUnionType(target)) {
            return writer => {
                writer.print("switch (value.selector) {")
                writer.pushIndent()
                for (let i = 0; i < target.types.length; i++) {
                    writer.print(`case ${i}: return runtimeType(value.value${i});`)
                }
                writer.print(`default: throw "Bad selector in ${targetTypeName}: " + std::to_string(value.selector);`)
                writer.popIndent()
                writer.print("}")
            }
        } else {
            switch (target.name) {
                case "boolean":
                    result = writer.makeRuntimeType(RuntimeType.BOOLEAN)
                    break
                case "CustomObject":
                case "Materialized":
                case "NativePointer":
                case "Tag":
                    return undefined
                case "Function":
                    result = writer.makeRuntimeType(RuntimeType.FUNCTION)
                    break
                case "Int32":
                case "number":
                    result = writer.makeRuntimeType(RuntimeType.NUMBER)
                    break
                case "Length":
                    result = writer.makeCast(writer.makeString("value.type"), resultType)
                    break
                case "DOMString":
                    result = writer.makeRuntimeType(RuntimeType.STRING)
                    break
                case "undefined":
                    result = writer.makeRuntimeType(RuntimeType.UNDEFINED)
                    break
                case "Optional":
                    result = writer.makeTernary(writer.makeDefinedCheck("value.tag"),
                        writer.makeRuntimeType(RuntimeType.OBJECT), writer.makeRuntimeType(RuntimeType.UNDEFINED))
                    break
                default:
                    result = writer.makeRuntimeType(RuntimeType.OBJECT)
                    break
            }
        }
        return writer => writer.writeStatement(writer.makeReturn(result))
    }

    writeOptional(nameOptional: string, printer: LanguageWriter, isPointer: boolean) {
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(string* result, const ${nameOptional}* value) {`)
        printer.print(`result->append("{.tag=");`)
        printer.print(`result->append(tagNameExact((${ArkPrimitiveType.Tag.getText()})(value->tag)));`)
        printer.print(`result->append(", .value=");`)
        printer.pushIndent()
        printer.print(`if (value->tag != ${ArkPrimitiveType.UndefinedTag}) {`)
        printer.pushIndent()
        printer.print(`WriteToString(result, ${isPointer ? "&" : ""}value->value);`)
        printer.popIndent()
        printer.print(`} else {`)
        printer.pushIndent()
        printer.print(`${ArkPrimitiveType.Undefined.getText()} undefined = { 0 };`)
        printer.print(`WriteToString(result, undefined);`)
        printer.popIndent()
        printer.print(`}`)
        printer.popIndent()
        printer.print(`result->append("}");`)
        printer.print(`}`)
    }

    private generateArrayWriteToString(name: string, target: idl.IDLContainerType, printer: LanguageWriter) {
        let convertor = this.library.typeConvertor("param", target.elementType[0])
        let isPointerField = convertor.isPointerType()
        let elementNativeType = convertor.nativeType(false)
        let constCast = isPointerField ? `(const ${elementNativeType}*)` : ``

        printer.print(
`
template <>
inline void WriteToString(string* result, const ${elementNativeType}${isPointerField ? "*" : ""} value);

inline void WriteToString(string* result, const ${name}* value) {
    int32_t count = value->length;
    result->append("{.array=allocArray<${elementNativeType}, " + std::to_string(count) + ">({{");
    for (int i = 0; i < count; i++) {
        if (i > 0) result->append(", ");
        WriteToString(result, ${constCast}${isPointerField ? "&" : ""}value->array[i]);
    }
    result->append("}})");
    result->append(", .length=");
    result->append(std::to_string(value->length));
    result->append("}");
}`)
    }

    private generateMapWriteToString(name: string, target: idl.IDLContainerType, printer: LanguageWriter) {
        const [keyType, valueType] = target.elementType.slice(0, 2)
        if (!keyType || !valueType)
            throw new Error("Impossible")
        const keyConvertor = this.library.typeConvertor("_", keyType)
        const valueConvertor = this.library.typeConvertor("_", valueType)
        let isPointerKeyField = keyConvertor.isPointerType()
        let isPointerValueField = valueConvertor.isPointerType()
        let keyNativeType = keyConvertor.nativeType(false)
        let valueNativeType = valueConvertor.nativeType(false)
        let keyConstCast = isPointerKeyField ? `(const ${keyNativeType}*)` : ``
        let valueConstCast = isPointerValueField ? `(const ${valueNativeType}*)` : ``

        // Provide prototype of keys printer.
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(string* result, const ${keyNativeType}${isPointerKeyField ? "*" : ""} value);`)
        // Provide prototype of values printer.
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(string* result, const ${valueNativeType}${isPointerValueField ? "*" : ""} value);`)

        // Printer.
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(string* result, const ${name}* value) {`)
        printer.pushIndent()
        printer.print(`result->append("{");`)
        printer.print(`int32_t count = value->size;`)
        printer.print(`for (int i = 0; i < count; i++) {`)
        printer.pushIndent()
        printer.print(`if (i > 0) result->append(", ");`)
        printer.print(`WriteToString(result, ${keyConstCast}${isPointerKeyField ? "&" : ""}value->keys[i]);`)
        printer.print(`result->append(": ");`)
        printer.print(`WriteToString(result, ${valueConstCast}${isPointerValueField ? "&" : ""}value->values[i]);`)
        printer.popIndent()
        printer.print(`}`)
        printer.print(`result->append("}");`)
        printer.popIndent()
        printer.print(`}`)
    }

    private generateWriteToString(name: string, target: idl.IDLEntry, printer: LanguageWriter, isPointer: boolean) {
        let access = isPointer ? "->" : "."
        if (idl.isContainerType(target)) {
            if (target.name === "sequence") {
                this.generateArrayWriteToString(name, target, printer)
            } else if (target.name === "record") {
                this.generateMapWriteToString(name, target, printer)
            }
        } else if (idl.isEnum(target)) {
            printer.print(`inline void WriteToString(string* result, ${name} value) {`)
            printer.pushIndent()
            printer.print(`result->append("${name}(");`)
            printer.print(`WriteToString(result, (Ark_Int32) value);`)
            printer.print(`result->append(")");`)
            printer.popIndent()
            printer.print(`}`)
        } else {
            printer.print(`template <>`)
            printer.print(`inline void WriteToString(string* result, const ${name}${isPointer ? "*" : ""} value) {`)
            printer.pushIndent()

            if (idl.isUnionType(target)) {
                printer.print(`result->append("{");`);
                printer.print(`result->append(".selector=");`)
                printer.print(`result->append(std::to_string(value->selector));`);
                printer.print(`result->append(", ");`);
                target.types.forEach((type, index) => {
                    const isPointerField = this.isPointerDeclaration(type)
                    printer.print(`// ${this.library.getTypeName(type, false)}`)
                    printer.print(`if (value${access}selector == ${index}) {`)
                    printer.pushIndent()
                    printer.print(`result->append(".value${index}=");`);
                    printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}value${index});`)
                    printer.popIndent()
                    printer.print(`}`)
                })
                printer.print(`result->append("}");`);
            } else if (idl.isTupleInterface(target)) {
                printer.print(`result->append("{");`)
                collectProperties(target, this.library)
                    .forEach((field, index) => {
                        printer.print(`// ${this.library.getTypeName(field.type)} ${field.name}`)
                        let isPointerField = this.isPointerDeclaration(field.type, field.isOptional)
                        if (index > 0) printer.print(`result->append(", ");`)
                        printer.print(`result->append(".${field.name}=");`)
                        printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${field.name});`)
                    })
                printer.print(`result->append("}");`)
            } else if (idl.isInterface(target) && target.name === "Optional") {
                printer.print(`result->append("{");`)
                collectProperties(target, this.library)
                    .forEach((field, index) => {
                        printer.print(`// ${this.library.getTypeName(field.type)} ${field.name}`)
                        if (index > 0) printer.print(`result->append(", ");`)
                        printer.print(`result->append("${field.name}: ");`)
                        const isPointerField = this.isPointerDeclaration(field.type, field.isOptional)
                        printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${field.name});`)
                        if (index == 0) {
                            printer.print(`if (value${access}${field.name} != ${ArkPrimitiveType.UndefinedTag}) {`)
                            printer.pushIndent()
                        }
                    })
                printer.popIndent()
                printer.print("}")
                printer.print(`result->append("}");`)
            } else if (idl.isClass(target) || idl.isInterface(target) || idl.isAnonymousInterface(target)) {
                printer.print(`result->append("{");`)
                collectProperties(target, this.library)
                    .forEach((field, index) => {
                        printer.print(`// ${this.library.getTypeName(field.type)} ${field.name}`)
                        if (index > 0) printer.print(`result->append(", ");`)
                        printer.print(`result->append(".${field.name}=");`)
                        let isPointerField = this.isPointerDeclaration(field.type, field.isOptional)
                        printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${printer.escapeKeyword(field.name)});`)
                    })
                printer.print(`result->append("}");`)
            }
            printer.popIndent()
            printer.print(`}`)
        }
    }

    private ignoreTarget(target: idl.IDLEntry): target is idl.IDLPrimitiveType | idl.IDLEnum {
        if (PeerGeneratorConfig.ignoreSerialization.includes(target.name!)) return true
        if (idl.isPrimitiveType(target)) return true
        if (idl.isEnum(target)) return true
        if (idl.isCallback(target)) return true
        if (isImport(target)) return true
        return false
    }
}

export function collectProperties(decl: idl.IDLInterface, library: IdlPeerLibrary): idl.IDLProperty[] {
    const superType = idl.getSuperType(decl)
    const superDecl = superType ? library.resolveTypeReference(superType as idl.IDLReferenceType) : undefined
    return [
        ...(superDecl ? collectProperties(superDecl as idl.IDLInterface, library) : []),
        ...decl.properties,
        ...collectBuilderProperties(decl)
    ].filter(it => !it.isStatic && !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.CommonMethod))
}

function collectBuilderProperties(decl: idl.IDLInterface): idl.IDLProperty[] {
    if (!isBuilderClass(decl)) {
        return []
    }
    return decl.methods
        .filter(m => !m.isStatic && m.parameters.length === 1)
        .map(m => {
            return {
                kind: idl.IDLKind.Property,
                name: "_" + m.name,
                type: m.parameters[0].type!,
                isReadonly: false,
                isStatic: false,
                isOptional: true,
            }
        })
        // filter out duplicates (SubTabBarStyle._padding)
        .filter((prop, index, array) => {
            return index === array.findIndex(it => it.name === prop.name);
        }) as idl.IDLProperty[]
}
