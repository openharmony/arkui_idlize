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

import {
    createReferenceType,
    forceAsNamedNode,
    IDLContainerType,
    IDLEnum,
    IDLNode,
    IDLType,
    IDLU32Type,
    IDLUint8ArrayType,
    IDLVoidType
} from '../../idl'
import { Language } from '../../Language'
import { ArgConvertor, BaseArgConvertor } from "../ArgConvertors"
import { PrimitiveTypeList } from "../../peer-generation/PrimitiveType"
import {
    AssignStatement,
    BlockStatement,
    FieldModifier,
    LanguageExpression,
    LanguageStatement,
    LanguageWriter,
    MakeAssignOptions,
    MakeCastOptions,
    MakeRefOptions,
    Method,
    PrintHint,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature,
    ObjectArgs,
    StringExpression
} from "../LanguageWriter"
import {
    CDefinedExpression,
    CLikeExpressionStatement,
    CLikeLanguageWriter,
    CLikeLoopStatement,
    CLikeReturnStatement
} from "./CLikeLanguageWriter"
import { IdlNameConvertor } from "../nameConvertor"
import { RuntimeType } from "../common"
import { IndentedPrinter } from "../../IndentedPrinter";
import { throwException } from "../../util";
import { cppKeywords } from "../../languageSpecificKeywords";
import { ReferenceResolver } from "../../peer-generation/ReferenceResolver";

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

export class CppCastExpression implements LanguageExpression {
    constructor(public convertor:IdlNameConvertor, public value: LanguageExpression, public type: IDLType, private options?:MakeCastOptions) {}
    asString(): string {
        if (forceAsNamedNode(this.type).name === "Tag") {
            return `${this.value.asString()} == ${PrimitiveTypeList.UndefinedRuntime} ? ${PrimitiveTypeList.UndefinedTag} : ${PrimitiveTypeList.ObjectTag}`
        }
        let resultName = ''
        if (this.options?.overrideTypeName) {
            resultName = this.options.overrideTypeName
        } else {
            const pureName = this.mapTypeWithReceiver(this.type, this.options?.receiver)
            const qualifiedName = this.options?.toRef ? `${pureName}&` : pureName
            resultName = qualifiedName
        }
        return this.options?.unsafe
            ? `reinterpret_cast<${resultName}>(${this.value.asString()})`
            : `static_cast<${resultName}>(${this.value.asString()})`
    }
    private mapTypeWithReceiver(type: IDLType, receiver?: string): string {
        // make deducing type from receiver
        if (receiver !== undefined) {
            return `std::decay<decltype(${receiver})>::type`
        }
        return this.convertor.convert(type)
    }
}

export class CppPointerPropertyAccessExpression implements LanguageExpression {
    constructor(public expression: string, public name: string) {
    }

    asString(): string {
        return `${this.expression}->${this.name}`
    }
}

////////////////////////////////////////////////////////////////
//                         STATEMENTS                         //
////////////////////////////////////////////////////////////////

export class CppAssignStatement extends AssignStatement {
    constructor(public variableName: string,
                public type: IDLType | undefined,
                public expression: LanguageExpression | undefined,
                public isDeclared: boolean = true,
                public isConst: boolean = true,
                protected options?:MakeAssignOptions
            ) {
        super(variableName, type, expression, isDeclared, isConst, options)
     }
     write(writer: CppLanguageWriter): void{
        if (this.isDeclared) {
            const typeName = this.type ? writer.stringifyTypeWithReceiver(this.type, this.options?.receiver) : "auto"
            const typeSpec = this.options?.assignRef ? `${typeName}&` : typeName
            const initValue = this.expression ? this.expression.asString() : "{}"
            const constSpec = this.isConst ? "const " : ""
            writer.print(`${constSpec}${typeSpec} ${this.variableName} = ${initValue};`)
        } else {
            writer.print(`${this.variableName} = ${this.expression!.asString()};`)
        }
    }
}

class CppArrayResizeStatement implements LanguageStatement {
    constructor(private array: string, private length: string, private deserializer: string) {}
    write(writer: LanguageWriter): void {
        writer.print(`${this.deserializer}.resizeArray<std::decay<decltype(${this.array})>::type,
        std::decay<decltype(*${this.array}.array)>::type>(&${this.array}, ${this.length});`)
    }
}

class CppMapResizeStatement implements LanguageStatement {
    constructor(private mapTypeName: string, private keyType: IDLType, private valueType: IDLType, private map: string, private size: string, private deserializer: string) {}
    write(writer: LanguageWriter): void {
        writer.print(`${this.deserializer}.resizeMap<${this.mapTypeName}, ${writer.getNodeName(this.keyType)}, ${writer.getNodeName(this.valueType)}>(&${this.map}, ${this.size});`)
    }
}

class CppMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private op: () => void) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (int32_t i = 0; i < ${this.map}.size; i++) {`)
        writer.pushIndent()
        writer.print(`auto ${this.key} = ${this.map}.keys[i];`)
        writer.print(`auto ${this.value} = ${this.map}.values[i];`)
        this.op()
        writer.popIndent()
        writer.print(`}`)
    }
}

// todo:
class CppEnumEntityStatement implements LanguageStatement {
    constructor(private _enum: IDLEnum) {}
    write(writer: LanguageWriter): void {
        writer.print(`typedef enum ${this._enum.name} {`)
        writer.pushIndent()
        this._enum.elements.forEach((member, index) =>
            writer.print(`${member.name} = ${member.initializer ?? index},`))
        writer.popIndent()
        writer.print(`} ${this._enum.name};`)
    }
}
class CPPThrowErrorStatement implements LanguageStatement {
    constructor(public message: string) { }
    write(writer: LanguageWriter): void {
        writer.print(`throw "${this.message}";`)
    }
}


////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export class CppLanguageWriter extends CLikeLanguageWriter {
    protected typeConvertor: IdlNameConvertor

    constructor(printer: IndentedPrinter,
                resolver:ReferenceResolver,
                typeConvertor: IdlNameConvertor,
                private primitivesTypes: PrimitiveTypeList) {
        super(printer, resolver, Language.CPP)
        this.typeConvertor = typeConvertor
    }
    getNodeName(type: IDLNode): string {
        return this.typeConvertor.convert(type)
    }
    fork(options?: { resolver?: ReferenceResolver }): LanguageWriter {
        return new CppLanguageWriter(new IndentedPrinter(), options?.resolver ?? this.resolver, this.typeConvertor, this.primitivesTypes)
    }
    writeClass(name: string, op: (writer: this) => void, superClass?: string, interfaces?: string[]): void {
        const superClasses = (superClass ? [superClass] : []).concat(interfaces ?? [])
        const extendsClause = superClasses.length > 0 ? ` : ${superClasses.map(c => `public ${c}`).join(", ")}` : ''
        this.printer.print(`class ${name}${extendsClause} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`};`)
    }
    writeInterface(name: string, op: (writer: this) => void, superInterfaces?: string[]): void {
        throw new Error("Method not implemented.")
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable = false): void {
        if (nullable) {
            this.printer.print(`if (${receiver}) ${receiver}.${method}(${params.join(", ")});`)
        } else {
            super.writeMethodCall(receiver, method, params, nullable)
        }
    }

    writeFieldDeclaration(name: string, type: IDLType, modifiers: FieldModifier[] | undefined, optional: boolean, initExpr?: LanguageExpression): void {
        let filter = function(modifier_name : FieldModifier) {
            return modifier_name !== FieldModifier.STATIC
        }
        let prefix = this.makeFieldModifiersList(modifiers, filter)
        this.printer.print(`${prefix}:`)
        this.printer.pushIndent()
        this.printer.print(`${forceAsNamedNode(type).name} ${name};`)
        this.printer.popIndent()
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: this) => void, superCall?: Method, modifiers?: MethodModifier[]) {
        const superInvocation = superCall
            ? ` : ${superCall.name}(${superCall.signature.args.map((_, i) => superCall?.signature.argName(i)).join(", ")})`
            : ""
        const argList = signature.args.map((it, index) => {
            const maybeDefault = signature.defaults?.[index] ? ` = ${signature.defaults![index]}` : ""
            return `${this.stringifyMethodArgType(it, signature.argHint(index))} ${signature.argName(index)}${maybeDefault}`
        }).join(", ");
        this.print("public:")
        this.print(`${className}(${argList})${superInvocation} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.print(`}`)
    }
    writeProperty(propName: string, propType: IDLType, mutable: boolean = true) {
        throw new Error("writeProperty for c++ is not implemented yet.")
    }

    /**
     * Writes multiline comments decorated with stars
     */
    writeMultilineCommentBlock(lines: string) {
        this.print('/*')
        lines.split("\n").forEach(it => this.print(' * ' + it))
        this.print(' */')
    }

    /**
     * Writes `#include "path"`
     * @param path File path to be included
     */
    writeInclude(path: string) {
        this.print(`#include "${path}"`)
    }

    /**
     * Writes `#include <path>`
     * @param path File path to be included
     */
    writeGlobalInclude(path: string) {
        this.print(`#include <${path}>`)
    }

    override makeRef(type: IDLType, options?:MakeRefOptions): IDLType {
        return createReferenceType(`${this.stringifyTypeWithReceiver(type, options?.receiver)}&`, undefined, type)
    }
    override makeThis(): LanguageExpression {
        return new StringExpression("*this")
    }
    override makeNull(): LanguageExpression {
        return new StringExpression("nullptr")
    }
    override makeValueFromOption(value: string): LanguageExpression {
        return this.makeString(`${value}.value`)
    }
    override makeThrowError(message: string): LanguageStatement {
        return new CPPThrowErrorStatement(message)
    }
    makeAssign(variableName: string, type: IDLType | undefined, expr: LanguageExpression | undefined, isDeclared: boolean = true, isConst: boolean = true, options?:MakeAssignOptions): LanguageStatement {
        return new CppAssignStatement(variableName, type, expr, isDeclared, isConst, options)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        throw new Error(`TBD`)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new CLikeReturnStatement(expr)
    }
    makeCheckOptional(optional: LanguageExpression, doStatement: LanguageStatement): LanguageStatement {
        throw new Error(`TBD`)
    }
    makeStatement(expr: LanguageExpression): LanguageStatement {
        return new CLikeExpressionStatement(expr)
    }
    override makeArrayAccess(value: string, indexVar: string) {
        return this.makeString(`${value}.array[${indexVar}]`)
    }
    override makeTupleAccess(value: string, index: number): LanguageExpression {
        return this.makeString(`${value}.value${index}`)
    }
    override makeUnionSelector(value: string, valueType: string): LanguageStatement {
        return this.makeAssign(valueType, undefined, this.makeString(`${value}.selector`), false)
    }
    override makeUnionVariantCondition(_convertor: ArgConvertor, _valueName: string, valueType: string, type: string, convertorIndex: number) {
        return this.makeString(`${valueType} == ${convertorIndex}`)
    }
    override makeUnionVariantCast(value: string, type: string, convertor: ArgConvertor, index: number) {
        return this.makeString(`${value}.value${index}`)
    }
    makeLoop(counter: string, limit: string, statement?: LanguageStatement): LanguageStatement {
        return new CLikeLoopStatement(counter, limit, statement)
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new CppMapForEachStatement(map, key, value, op)
    }
    makeArrayInit(type: IDLContainerType): LanguageExpression {
        return this.makeString(`{}`)
    }
    makeClassInit(type: IDLType, paramenters: LanguageExpression[]): LanguageExpression {
        return this.makeString(`${this.getNodeName(type)}(${paramenters.map(it => it.asString()).join(", ")})`)
    }
    makeMapInit(type: IDLType): LanguageExpression {
        return this.makeString(`{}`)
    }
    makeArrayResize(array: string, arrayType: string, length: string, deserializer: string): LanguageStatement {
        return new CppArrayResizeStatement(array, length, deserializer)
    }
    makeMapResize(mapTypeName: string, keyType: IDLType, valueType: IDLType, map: string, size: string, deserializer: string): LanguageStatement {
        return new CppMapResizeStatement(mapTypeName, keyType, valueType, map, size, deserializer)
    }
    makeCast(expr: LanguageExpression, type: IDLType, options?:MakeCastOptions): LanguageExpression {
        return new CppCastExpression(this.typeConvertor, expr, type, options)
    }
    makePointerPropertyAccessExpression(expression: string, name: string): CppPointerPropertyAccessExpression {
        return new CppPointerPropertyAccessExpression(expression, name)
    }
    writePrintLog(message: string): void {
        this.print(`printf("${message}\n")`)
    }
    makeDefinedCheck(value: string): LanguageExpression {
        return new CDefinedExpression(value);
    }
    makeSetUnionSelector(value: string, index: string): LanguageStatement {
        return this.makeAssign(`${value}.selector`, undefined, this.makeString(index), false)
    }
    makeSetOptionTag(value: string, tag: LanguageExpression): LanguageStatement {
        return this.makeAssign(`${value}.tag`, undefined, tag, false)
    }
    getObjectAccessor(convertor: BaseArgConvertor, value: string, args?: ObjectArgs): string {
        return value
    }
    makeUndefined(): LanguageExpression {
        return this.makeString(`${this.primitivesTypes.Undefined.getText()}()`)
    }
    makeVoid(): LanguageExpression {
        return this.makeString(`${this.primitivesTypes.Void.getText()}()`)
    }
    makeRuntimeType(rt: RuntimeType): LanguageExpression {
        return this.makeString(`INTEROP_RUNTIME_${RuntimeType[rt]}`)
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        // TODO: maybe use std::move?
        return new BlockStatement([
            this.makeAssign(keyAccessor, undefined, this.makeString(key), false),
            this.makeAssign(valueAccessor, undefined, this.makeString(value), false)
        ], false)
    }
    getTagType(): IDLType {
        return createReferenceType('Tag')
    }
    getRuntimeType(): IDLType {
        return createReferenceType(`RuntimeType`)
    }
    makeTupleAssign(receiver: string, tupleFields: string[]): LanguageStatement {
        const statements =
            tupleFields.map((field, index) => {
                //TODO: maybe use std::move?
                return this.makeAssign(`${receiver}.value${index}`, undefined, this.makeString(field), false)
            })
        return new BlockStatement(statements, false)
    }
    get supportedModifiers(): MethodModifier[] {
        return [MethodModifier.INLINE, MethodModifier.STATIC]
    }
    get supportedFieldModifiers(): FieldModifier[] {
        return []
    }
    enumFromOrdinal(value: LanguageExpression, type: IDLType): LanguageExpression {
        return this.makeString(`static_cast<${this.typeConvertor.convert(type)}>(` + value.asString() + `)`);
    }
    ordinalFromEnum(value: LanguageExpression, _: IDLType): LanguageExpression {
        return value;
    }
    makeUnsafeCast(convertor: ArgConvertor, param: string): string {
        return param
    }
    makeUnsafeCast_(value: LanguageExpression, type: IDLType, typeOptions?: PrintHint): string {
        let typeName = this.getNodeName(type)
        switch (typeOptions) {
            case PrintHint.AsPointer:
                typeName = `${typeName}*`
                break
            case PrintHint.AsConstPointer:
                typeName = `const ${typeName}*`
                break;
            case PrintHint.AsConstReference:
                typeName = `const ${typeName}&`
                break
            default:
                break;
        }
        return `(${typeName}) (${value.asString()})`
    }
    override makeEnumCast(value: string, _unsafe: boolean, convertor: ArgConvertor | undefined): string {
        if (convertor !== undefined) {
            return `static_cast<${this.typeConvertor.convert(convertor.nativeType())}>(${value})`
        }
        throwException("Need pass EnumConvertor")
    }
    override escapeKeyword(name: string): string {
        return cppKeywords.has(name) ? name + "_" : name
    }
    makeEnumEntity(enumEntity: IDLEnum, isExport: boolean): LanguageStatement {
        return new CppEnumEntityStatement(enumEntity)
    }
    private decayTypeName(typeName: string) {
        if (typeName.endsWith('*') || typeName.endsWith('&')) {
            typeName = typeName.substring(0, typeName.length - 1)
        }
        if (typeName.startsWith('const ')) {
            typeName = typeName.substring(6)
        }

        return typeName
    }
    override stringifyMethodReturnType(type:IDLType, hint?: PrintHint): string {
        const name = this.getNodeName(type)
        let postfix = ''
        if (hint === PrintHint.AsPointer || hint === PrintHint.AsConstPointer) {
            postfix = '*'
        }
        let constModifier = ''
        if (hint === PrintHint.AsConstPointer) {
            constModifier = 'const '
        }
        return `${constModifier}${name}${postfix}`
    }
    override stringifyMethodArgType(type:IDLType, hint?: PrintHint): string {
        // we should decide pass by value or by reference here
        const name = this.getNodeName(type)
        let constModifier = ''
        let postfix = ''
        switch (hint) {
            case undefined:
            case PrintHint.AsValue:
                break;
            case PrintHint.AsPointer:
                postfix = '*'
                break;
            case PrintHint.AsConstPointer:
                constModifier = 'const ';
                postfix = '*'
                break;
            case PrintHint.AsConstReference:
                constModifier = 'const '
                postfix = '&'
                break;
            default:
                throw new Error(`Unknown hint ${hint}`)
        }
        return `${constModifier}${name}${postfix}`
    }
    stringifyTypeWithReceiver(type: IDLType, receiver?: string): string {
        // make deducing type from receiver
        if (receiver !== undefined) {
            return `std::decay<decltype(${receiver})>::type`
        }
        return this.getNodeName(type)
    }
    override makeSerializerConstructorSignature(): NamedMethodSignature | undefined {
        return new NamedMethodSignature(IDLVoidType, [
                IDLUint8ArrayType,
                IDLU32Type,
                createReferenceType("CallbackResourceHolder" /* ast */)
            ],
            ["data", "dataLength", "resourceHolder"],
            [undefined, `0`, `nullptr`],
            [undefined, undefined, undefined, PrintHint.AsPointer]
        )
    }
    override makeLengthSerializer(serializer: string, value: string): LanguageStatement | undefined {
        return  undefined
    }
    override makeLengthDeserializer(deserializer: string): LanguageStatement | undefined {
        return  undefined
    }
}
