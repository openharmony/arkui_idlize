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

import * as idl from "@idlize/core/idl"
import { IDLType } from "@idlize/core/idl"
import { IndentedPrinter, Language, camelCaseToUpperSnakeCase } from "@idlize/core"
import { RuntimeType } from "../ArgConvertors"
import { PrimitiveType } from "../ArkPrimitiveType"
import { createLanguageWriter, LanguageExpression, LanguageWriter, Method, MethodModifier, NamedMethodSignature } from "../LanguageWriters"
import { PeerGeneratorConfig } from "../PeerGeneratorConfig"
import { isImport, isStringEnum } from "../idl/common"
import { generateCallbackAPIArguments } from "../ArgConvertors"
import { isBuilderClass, isMaterialized } from "../idl/IdlPeerGeneratorVisitor"
import { cleanPrefix, PeerLibrary } from "../PeerLibrary"
import { MethodArgPrintHint } from "../LanguageWriters/LanguageWriter"
import { LibraryInterface } from "../../LibraryInterface"
import { collectDeclarationTargets } from "../DeclarationTargetCollector"
import { flattenUnionType } from "../unions"

export class StructPrinter {
    constructor(private library: PeerLibrary) {}

    private isPointerDeclaration(target: idl.IDLNode, isOptional: boolean = false): boolean {
        if (isOptional) return true
        if (idl.isPrimitiveType(target))
            return [idl.IDLAnyType.name, idl.IDLStringType.name, idl.IDLNumberType.name, "Length", "CustomObject"].includes(target.name)
        if (idl.isEnum(target)) return false
        if (idl.isReferenceType(target) && target.name === "GestureType") return false
        return true
    }

    private printStructsCHead(name: string, target: idl.IDLNode, structs: LanguageWriter) {
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
        const enumsDeclarations = createLanguageWriter(Language.CPP, this.library)
        const forwardDeclarations = createLanguageWriter(Language.CPP, this.library)
        const concreteDeclarations = createLanguageWriter(Language.CPP, this.library)
        const seenNames = new Set<string>()
        seenNames.clear()
        const noDeclaration = ["Int32", "Tag", idl.IDLNumberType.name, idl.IDLBooleanType.name, idl.IDLStringType.name, idl.IDLVoidType.name]
        for (const target of collectDeclarationTargets(this.library)) {
            if (target === idl.IDLVoidType) {
                continue
            }
            const targetType  = idl.isType(target) ? target : idl.createReferenceType(idl.forceAsNamedNode(target).name)
            let nameAssigned = structs.getNodeName(target)
            if (nameAssigned === 'Tag')
                continue
            if (!nameAssigned) {
                throw new Error(`No assigned name for an ${idl.IDLKind[target.kind!]}`)
            }
            if (seenNames.has(nameAssigned)) {
                continue
            }
            seenNames.add(nameAssigned)
            let isPointer = this.isPointerDeclaration(target)
            let isAccessor = idl.isInterface(target) && isMaterialized(target, this.library)
            let noBasicDecl = isAccessor || noDeclaration.includes(nameAssigned)
            if (idl.isEnum(target) || idl.isEnumMember(target)) {
                const enumTarget = idl.isEnumMember(target) ? target.parent : target
                const stringEnum = isStringEnum(enumTarget)
                enumsDeclarations.print(`typedef enum ${nameAssigned} {`)
                enumsDeclarations.pushIndent()
                for (let member of enumTarget.elements) {
                    const memberName = member.documentation?.includes("@deprecated")
                        ? member.name : camelCaseToUpperSnakeCase(member.name)
                    const initializer = (!stringEnum && (member.initializer !== undefined)) ? " = " + member.initializer : ""
                    enumsDeclarations.print(`${camelCaseToUpperSnakeCase(nameAssigned)}_${memberName}${initializer},`)
                }
                enumsDeclarations.popIndent()
                enumsDeclarations.print(`} ${nameAssigned};`)
                this.writeRuntimeType(target, targetType, false, writeToString)
                this.generateWriteToString(nameAssigned, target, writeToString, isPointer)
                this.printOptionalIfNeeded(undefined, enumsDeclarations, writeToString, target, seenNames)
            } else if (!noBasicDecl && !this.ignoreTarget(target)) {
                forwardDeclarations.print(`typedef struct ${nameAssigned} ${nameAssigned};`)
                this.printStructsCHead(nameAssigned, target, concreteDeclarations)
                if (idl.isUnionType(target)) {
                    concreteDeclarations.print(`${PrimitiveType.Prefix}Int32 selector;`)
                    concreteDeclarations.print("union {")
                    concreteDeclarations.pushIndent()
                    target.types.forEach((it, index) =>
                        concreteDeclarations.print(`${structs.getNodeName(it)} value${index};`))
                    concreteDeclarations.popIndent()
                    concreteDeclarations.print("};")
                } else if (idl.isInterface(target)) {
                    const properties = collectProperties(target, this.library)
                    if (properties.length === 0) {
                        concreteDeclarations.print(`void *handle;`) // avoid empty structs
                    }
                    properties.forEach(it => {
                        const type = flattenUnionType(this.library, it.type)
                        concreteDeclarations.print(`${structs.getNodeName(idl.maybeOptional(type, it.isOptional))} ${concreteDeclarations.escapeKeyword(it.name)};`)
                    })
                } else if (idl.isContainerType(target)) {
                    let fieldNames: string[] = []
                    if (idl.IDLContainerUtils.isSequence(target)) {
                        fieldNames = ["array"]
                    }
                    if (idl.IDLContainerUtils.isRecord(target)) {
                        concreteDeclarations.print(`${PrimitiveType.Int32.getText()} size;`)
                            fieldNames = ["keys", "values"]
                    }
                    target.elementType.forEach((it, index) => {
                        concreteDeclarations.print(`${structs.getNodeName(it)}* ${fieldNames[index]};`)
                    })
                    if (idl.IDLContainerUtils.isSequence(target)) {
                        concreteDeclarations.print(`${PrimitiveType.Int32.getText()} length;`)
                    }
                } else if (idl.isCallback(target)) {
                    concreteDeclarations.print(`${PrimitiveType.Prefix}CallbackResource resource;`)
                    const args = generateCallbackAPIArguments(this.library, target)
                    concreteDeclarations.print(`void (*call)(${args.join(', ')});`)
                    const syncArgs = [`${PrimitiveType.Prefix}VMContext context`].concat(args)
                    concreteDeclarations.print(`void (*callSync)(${syncArgs.join(', ')});`)
                }
                this.printStructsCTail(nameAssigned, concreteDeclarations)
                this.writeRuntimeType(target, targetType, idl.isOptionalType(target), writeToString)
                this.generateWriteToString(nameAssigned, target, writeToString, isPointer)
                this.printOptionalIfNeeded(forwardDeclarations, concreteDeclarations, writeToString, target, seenNames)
            } else if (isAccessor) {
                forwardDeclarations.print(`typedef ${PrimitiveType.Materialized.getText()} ${nameAssigned};`)
                this.printOptionalIfNeeded(forwardDeclarations, concreteDeclarations, writeToString, target, seenNames)
            } else {
                if (!noBasicDecl && !idl.isPrimitiveType(target))
                    this.generateWriteToString(nameAssigned, target, writeToString, isPointer)
                this.writeRuntimeType(target, targetType, idl.isOptionalType(target), writeToString)
                this.printOptionalIfNeeded(undefined, concreteDeclarations, writeToString, target, seenNames)
            }
        }
        structs.concat(forwardDeclarations)
        structs.concat(enumsDeclarations)
        structs.concat(concreteDeclarations)
        // TODO: hack, remove me!
        if (this.library.name == "") { // TODO we probably don't need this typedef for any library except Ark
            typedefs.print(`typedef ${PrimitiveType.OptionalPrefix}Length ${PrimitiveType.OptionalPrefix}Dimension;`)
        }
    }

    private printOptionalIfNeeded(
        forwardDeclarations: LanguageWriter | undefined,
        concreteDeclarations: LanguageWriter,
        writeToString: LanguageWriter,
        target: idl.IDLNode,
        seenNames: Set<String>,
    ) {
        const isPointer = this.isPointerDeclaration(target)
        const nameAssigned = concreteDeclarations.getNodeName(target)
        const nameOptional = idl.isType(target)
            ? concreteDeclarations.getNodeName(idl.createOptionalType(target))
            : PrimitiveType.OptionalPrefix + cleanPrefix(concreteDeclarations.getNodeName(target as idl.IDLEntry), PrimitiveType.Prefix)
        if (seenNames.has(nameOptional)) {
            return
        }
        seenNames.add(nameOptional)
        if (nameAssigned !== "Optional" && nameAssigned !== "RelativeIndexable") {
            forwardDeclarations?.print(`typedef struct ${nameOptional} ${nameOptional};`)
            this.printStructsCHead(nameOptional, target, concreteDeclarations)
            concreteDeclarations.print(`${PrimitiveType.Tag.getText()} tag;`)
            concreteDeclarations.print(`${nameAssigned} value;`)
            this.printStructsCTail(nameOptional, concreteDeclarations)
            this.writeOptional(nameOptional, writeToString, isPointer)
            this.writeRuntimeType(target, idl.isType(target) ? target : idl.createReferenceType(idl.forceAsNamedNode(target).name), true, writeToString)
        }
    }

    private prologueDefinedRuntimeTypes = [
        idl.IDLDate.name,
    ]
    private writeRuntimeType(target: idl.IDLNode, targetType: IDLType, isOptional: boolean, writer: LanguageWriter) {
        if (idl.isNamedNode(target) && this.prologueDefinedRuntimeTypes.includes(target.name) && !isOptional)
            return
        const resultType = idl.createReferenceType("RuntimeType")
        const op = this.writeRuntimeTypeOp(target, targetType, resultType, isOptional, writer)
        if (op) {
            writer.print("template <>")
            writer.writeMethodImplementation(
                new Method("runtimeType",
                    new NamedMethodSignature(resultType, [idl.maybeOptional(targetType, isOptional)], ["value"], undefined, [undefined, MethodArgPrintHint.AsConstReference]),
                    [MethodModifier.INLINE]),
                op)
        }
    }

    private writeRuntimeTypeOp(
        target: idl.IDLNode, targetType: IDLType, resultType: IDLType, isOptional: boolean, writer: LanguageWriter
    ) : ((writer: LanguageWriter) => void) | undefined
    {
        let result: LanguageExpression
        if (isOptional) {
            result = writer.makeTernary(writer.makeDefinedCheck("value.tag"),
                writer.makeRuntimeType(RuntimeType.OBJECT), writer.makeRuntimeType(RuntimeType.UNDEFINED))
        } else if (idl.isEnum(target)) {
            result = writer.makeRuntimeType(RuntimeType.NUMBER)
        } else if (idl.isInterface(target) && isMaterialized(target, this.library)) {
            return undefined
        } else if (idl.isUnionType(target)) {
            return writer => {
                writer.print("switch (value.selector) {")
                writer.pushIndent()
                for (let i = 0; i < target.types.length; i++) {
                    writer.print(`case ${i}: return runtimeType(value.value${i});`)
                }
                writer.print(`default: throw "Bad selector in ${writer.getNodeName(targetType)}: " + std::to_string(value.selector);`)
                writer.popIndent()
                writer.print("}")
            }
        } else {
            const targetName = idl.isContainerType(target)
                ? undefined
                : idl.forceAsNamedNode(target).name
            switch (targetName) {
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
                case idl.IDLNumberType.name:
                    result = writer.makeRuntimeType(RuntimeType.NUMBER)
                    break
                case "Length":
                    result = writer.makeCast(writer.makeString("value.type"), resultType)
                    break
                case idl.IDLStringType.name:
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
        printer.print(`inline void WriteToString(std::string* result, const ${nameOptional}* value) {`)
        printer.pushIndent()
        printer.print(`result->append("{.tag=");`)
        printer.print(`result->append(tagNameExact((${PrimitiveType.Tag.getText()})(value->tag)));`)
        printer.print(`result->append(", .value=");`)
        printer.print(`if (value->tag != ${PrimitiveType.UndefinedTag}) {`)
        printer.pushIndent()
        printer.print(`WriteToString(result, ${isPointer ? "&" : ""}value->value);`)
        printer.popIndent()
        printer.print(`} else {`)
        printer.pushIndent()
        printer.print(`${PrimitiveType.Undefined.getText()} undefined = { 0 };`)
        printer.print(`WriteToString(result, undefined);`)
        printer.popIndent()
        printer.print(`}`)
        printer.print(`result->append("}");`)
        printer.popIndent()
        printer.print(`}`)
    }

    private generateArrayWriteToString(name: string, target: idl.IDLContainerType, printer: LanguageWriter) {
        let convertor = this.library.typeConvertor("param", target.elementType[0])
        let isPointerField = convertor.isPointerType()
        let elementNativeType = printer.getNodeName(convertor.nativeType())
        let constCast = isPointerField ? `(const ${elementNativeType}*)` : ``

        printer.print(
`
template <>
inline void WriteToString(std::string* result, const ${elementNativeType}${isPointerField ? "*" : ""} value);

inline void WriteToString(std::string* result, const ${name}* value) {
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
        let keyNativeType = printer.getNodeName(keyConvertor.nativeType())
        let valueNativeType = printer.getNodeName(valueConvertor.nativeType())
        let keyConstCast = isPointerKeyField ? `(const ${keyNativeType}*)` : ``
        let valueConstCast = isPointerValueField ? `(const ${valueNativeType}*)` : ``

        // Provide prototype of keys printer.
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(std::string* result, const ${keyNativeType}${isPointerKeyField ? "*" : ""} value);`)
        // Provide prototype of values printer.
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(std::string* result, const ${valueNativeType}${isPointerValueField ? "*" : ""} value);`)

        // Printer.
        printer.print(`template <>`)
        printer.print(`inline void WriteToString(std::string* result, const ${name}* value) {`)
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

    private generateWriteToString(name: string, target: idl.IDLNode, printer: LanguageWriter, isPointer: boolean) {
        let access = isPointer ? "->" : "."
        if (idl.isContainerType(target)) {
            if (idl.IDLContainerUtils.isSequence(target)) {
                this.generateArrayWriteToString(name, target, printer)
            } else if (idl.IDLContainerUtils.isRecord(target)) {
                this.generateMapWriteToString(name, target, printer)
            }
        } else if (idl.isEnum(target)) {
            printer.print(`template <>`)
            printer.print(`inline void WriteToString(std::string* result, const ${name} value) {`)
            printer.pushIndent()
            printer.print(`result->append("${name}(");`)
            printer.print(`WriteToString(result, (${PrimitiveType.Int32.getText()}) value);`)
            printer.print(`result->append(")");`)
            printer.popIndent()
            printer.print(`}`)
        } else if (idl.isCallback(target)) {
            printer.print(`template <>`)
            printer.print(`inline void WriteToString(std::string* result, const ${name}${isPointer ? "*" : ""} value) {`)
            printer.pushIndent()
            printer.print(`result->append("{");`)
            printer.print(`result->append(".resource=");`)
            printer.print(`WriteToString(result, &value${access}resource);`)
            printer.print(`result->append(", .call=0");`)
            printer.print(`result->append("}");`)
            printer.popIndent()
            printer.print(`}`)
        }
        else {
            printer.print(`template <>`)
            printer.print(`inline void WriteToString(std::string* result, const ${name}${isPointer ? "*" : ""} value) {`)
            printer.pushIndent()

            if (idl.isUnionType(target)) {
                printer.print(`result->append("{");`);
                printer.print(`result->append(".selector=");`)
                printer.print(`result->append(std::to_string(value->selector));`);
                printer.print(`result->append(", ");`);
                target.types.forEach((type, index) => {
                    const isPointerField = this.isPointerDeclaration(this.library.toDeclaration(type))
                    printer.print(`// ${printer.getNodeName(type)}`)
                    printer.print(`if (value${access}selector == ${index}) {`)
                    printer.pushIndent()
                    printer.print(`result->append(".value${index}=");`);
                    printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}value${index});`)
                    printer.popIndent()
                    printer.print(`}`)
                })
                printer.print(`result->append("}");`);
            } else if (idl.isInterface(target) && target.subkind === idl.IDLInterfaceSubkind.Tuple) {
                printer.print(`result->append("{");`)
                collectProperties(target, this.library)
                    .forEach((field, index) => {
                        printer.print(`// ${printer.getNodeName(field.type)} ${field.name}`)
                        let isPointerField = this.isPointerDeclaration(this.library.toDeclaration(field.type), field.isOptional)
                        if (index > 0) printer.print(`result->append(", ");`)
                        printer.print(`result->append(".${field.name}=");`)
                        printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${field.name});`)
                    })
                printer.print(`result->append("}");`)
            } else if (idl.isInterface(target) && target.name === "Optional") {
                printer.print(`result->append("{");`)
                collectProperties(target, this.library)
                    .forEach((field, index) => {
                        printer.print(`// ${printer.getNodeName(field.type)} ${field.name}`)
                        if (index > 0) printer.print(`result->append(", ");`)
                        printer.print(`result->append("${field.name}: ");`)
                        const isPointerField = this.isPointerDeclaration(this.library.toDeclaration(field.type), field.isOptional)
                        printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${field.name});`)
                        if (index == 0) {
                            printer.print(`if (value${access}${field.name} != ${PrimitiveType.UndefinedTag}) {`)
                            printer.pushIndent()
                        }
                    })
                printer.popIndent()
                printer.print("}")
                printer.print(`result->append("}");`)
            } else if (idl.isInterface(target)) {
                printer.print(`result->append("{");`)
                collectProperties(target, this.library)
                    .forEach((field, index) => {
                        printer.print(`// ${printer.getNodeName(field.type)} ${field.name}`)
                        if (index > 0) printer.print(`result->append(", ");`)
                        printer.print(`result->append(".${field.name}=");`)
                        let isPointerField = this.isPointerDeclaration(this.library.toDeclaration(field.type), field.isOptional)
                        printer.print(`WriteToString(result, ${isPointerField ? "&" : ""}value${access}${printer.escapeKeyword(field.name)});`)
                    })
                printer.print(`result->append("}");`)
            }
            printer.popIndent()
            printer.print(`}`)
        }
    }

    private ignoreTarget(target: idl.IDLNode): target is idl.IDLPrimitiveType | idl.IDLEnum {
        if (idl.isNamedNode(target) && PeerGeneratorConfig.ignoreSerialization.includes(target.name)) return true
        if (idl.isPrimitiveType(target)) return true
        if (idl.isEnum(target)) return true
        if (isImport(target)) return true
        return false
    }
}

export function collectProperties(decl: idl.IDLInterface, library: LibraryInterface): idl.IDLProperty[] {
    const superType = idl.getSuperType(decl)
    const superDecl = superType ? library.resolveTypeReference(/* FIX */ superType as idl.IDLReferenceType) : undefined
    return [
        ...(superDecl ? collectProperties(superDecl as idl.IDLInterface, library) : []),
        ...decl.properties,
        ...collectBuilderProperties(decl, library)
    ].filter(it => !it.isStatic && !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.CommonMethod))
}

class NameWithType {
    constructor(public readonly name: string, public readonly type: idl.IDLType) { }
}

function groupProps(properties: NameWithType[]): NameWithType[] {
    const typeMap = new Map<string, idl.IDLType[]>()
    for (const prop of properties) {
        const type = prop.type
        if (type === undefined) {
            continue
        }
        typeMap.set(prop.name, [...typeMap.get(prop.name) ?? [], type])
    }
    const result: NameWithType[] = []
    for (const [name, types] of typeMap.entries()) {
        const type = types.length === 1 ? types[0] : idl.createUnionType(types)
        result.push(new NameWithType(name, type))
    }
    return result
}

function collectBuilderProperties(decl: idl.IDLInterface, library: LibraryInterface): idl.IDLProperty[] {
    if (!isBuilderClass(decl)) {
        return []
    }
    return groupProps([
            ...decl.constructors
                .flatMap(cons =>
                    cons.parameters.map(param => new NameWithType(param.name, param.type!))),
            ...decl.methods
                .filter(m => !m.isStatic && m.parameters.length === 1)
                .map(m => new NameWithType(m.name, m.parameters[0].type!))
        ])
        .map(it => {
            return {
                kind: idl.IDLKind.Property,
                name: "_" + it.name,
                type: it.type,
                isReadonly: false,
                isStatic: false,
                isOptional: true
            } as idl.IDLProperty
        })
}
