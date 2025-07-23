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
    IDLTypedef,
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
    StringExpression,
    DelegationCall,
    MethodStaticCallExpression
} from "../LanguageWriter"
import {
    CLikeExpressionStatement,
    CLikeLanguageWriter,
    CLikeLoopStatement,
    CLikeReturnStatement
} from "./CLikeLanguageWriter"
import { IdlNameConvertor } from "../nameConvertor"
import { RuntimeType } from "../common"
import { IndentedPrinter } from "../../IndentedPrinter";
import { cppKeywords } from "../../languageSpecificKeywords";
import { ReferenceResolver } from "../../peer-generation/ReferenceResolver";
import * as idl from "../../idl";

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

export class CppCastExpression implements LanguageExpression {
    constructor(public convertor:IdlNameConvertor, public value: LanguageExpression, public node: IDLNode, private options?: MakeCastOptions) {}
    asString(): string {
        if (forceAsNamedNode(this.node).name === "Tag") {
            return `${this.value.asString()} == ${PrimitiveTypeList.UndefinedRuntime} ? ${PrimitiveTypeList.UndefinedTag} : ${PrimitiveTypeList.ObjectTag}`
        }
        let resultName = ''
        if (this.options?.overrideTypeName) {
            resultName = this.options.overrideTypeName
        } else {
            const pureName = this.mapTypeWithReceiver(this.options?.receiver)
            const qualifiedName = this.options?.toRef ? `${pureName}&` : pureName
            resultName = qualifiedName
        }
        return this.options?.unsafe
            ? `reinterpret_cast<${resultName}>(${this.value.asString()})`
            : `static_cast<${resultName}>(${this.value.asString()})`
    }
    private mapTypeWithReceiver(receiver?: string): string {
        // make deducing type from receiver
        if (receiver !== undefined) {
            return `std::decay<decltype(${receiver})>::type`
        }
        return this.convertor.convert(this.node)
    }
}

export class CppPointerPropertyAccessExpression implements LanguageExpression {
    constructor(public expression: string, public name: string) {
    }

    asString(): string {
        return `${this.expression}->${this.name}`
    }
}

export class CPPMethodStaticCallExpression extends MethodStaticCallExpression {
    asString(): string {
        return `${this.receiver}::${this.name}(${this.params.map(it => it.asString()).join(', ')})`
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
    constructor(private map: string, private key: string, private value: string, private body: LanguageStatement[]) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (int32_t i = 0; i < ${this.map}.size; i++) {`)
        writer.pushIndent()
        writer.print(`auto ${this.key} = ${this.map}.keys[i];`)
        writer.print(`auto ${this.value} = ${this.map}.values[i];`)
        writer.writeStatement(new BlockStatement(this.body, false))
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
        writer.print(`INTEROP_FATAL("${this.message}");`)
    }
}


////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export class CppLanguageWriter extends CLikeLanguageWriter {
    protected typeConvertor: IdlNameConvertor

    protected classMode: 'normal' | 'detached' = 'normal'
    protected currentClass: string[] = []

    constructor(printer: IndentedPrinter,
                resolver:ReferenceResolver,
                typeConvertor: IdlNameConvertor,
                private primitivesTypes: PrimitiveTypeList) {
        super(printer, resolver, Language.CPP)
        this.typeConvertor = typeConvertor
    }
    changeModeTo(mode: typeof this.classMode) {
        this.classMode = mode
    }
    getNodeName(type: IDLNode): string {
        return this.typeConvertor.convert(type)
    }
    fork(options?: { resolver?: ReferenceResolver }): LanguageWriter {
        return new CppLanguageWriter(new IndentedPrinter([], this.indentDepth()), options?.resolver ?? this.resolver, this.typeConvertor, this.primitivesTypes)
    }
    protected writeDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[], postfix?: string): void {
        const realName = this.classMode === 'normal' ? name : `${this.currentClass.at(0)!}::${name}`
        const newModifiers = this.classMode === 'normal'
            ? modifiers
            : (modifiers ?? []).filter(it => it !== MethodModifier.STATIC).concat(MethodModifier.INLINE)
        super.writeDeclaration(realName, signature, newModifiers, postfix)
    }
    writeClass(name: string, op: (writer: this) => void, superClass?: string, interfaces?: string[]): void {
        if (this.classMode === 'normal') {
            const superClasses = (superClass ? [superClass] : []).concat(interfaces ?? [])
            const extendsClause = superClasses.length > 0 ? ` : ${superClasses.map(c => `public ${c}`).join(", ")}` : ''
            this.printer.print(`class ${name}${extendsClause} {`)
            this.pushIndent()
        }
        if (this.classMode === 'detached') {
            this.currentClass.push(name)
        }
        op(this)
        if (this.classMode === 'normal') {
            this.popIndent()
            this.printer.print(`};`)
        }
    }
    override writeInterface(name: string, op: (writer: this) => void, superInterfaces?: string[], generics?: string[]): void {
        throw new Error("Method not implemented.")
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable = false): void {
        if (nullable) {
            this.printer.print(`if (${receiver}) ${receiver}.${method}(${params.join(", ")});`)
        } else {
            super.writeMethodCall(receiver, method, params, nullable)
        }
    }
    writeStaticMethodCall(receiver: string, method: string, params: string[], nullable?: boolean): void {
        this.printer.print(`${receiver}::${method}(${params.join(', ')});`)
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
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: this) => void, delegationCall?: DelegationCall, modifiers?: MethodModifier[]) {
        const superInvocation = delegationCall
            ? ` : ${delegationCall.delegationName}(${delegationCall.delegationArgs.map(it => it.asString()).join(", ")})`
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
    writeProperty(propName: string, propType: IDLType, modifiers: FieldModifier[], getter?: { method: Method, op: () => void }, setter?: { method: Method, op: () => void }): void {
        throw new Error("writeProperty for c++ is not implemented yet.")
    }
    override writeTypeDeclaration(decl: IDLTypedef): void {
        throw new Error(`writeTypeDeclaration not implemented`)
    }
    writeConstant(constName: string, constType: IDLType, constVal?: string): void {
        this.print(`${this.getNodeName(constType)} ${constName}${constVal ? ' = ' + constVal : ''};`)
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
        return createReferenceType(`${this.stringifyTypeWithReceiver(type, options?.receiver)}&`)
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
        throw new Error(`Improve`)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new CLikeReturnStatement(expr)
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

    override makeUnionVariantCast(value: string, type: string, convertor: ArgConvertor, index: number) {
        return this.makeString(`${value}.value${index}`)
    }
    makeStaticMethodCall(receiver: string, method: string, params: LanguageExpression[], nullable?: boolean): LanguageExpression {
        return new CPPMethodStaticCallExpression(receiver, method, params, nullable)
    }
    makeLoop(counter: string, limit: string, statement?: LanguageStatement): LanguageStatement {
        return new CLikeLoopStatement(counter, limit, statement)
    }
    makeMapForEach(map: string, key: string, value: string, body: LanguageStatement[]): LanguageStatement {
        return new CppMapForEachStatement(map, key, value, body)
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
    makeCast(expr: LanguageExpression, node: IDLNode, options?:MakeCastOptions): LanguageExpression {
        return new CppCastExpression(this.typeConvertor, expr, node, options)
    }
    makePointerPropertyAccessExpression(expression: string, name: string): CppPointerPropertyAccessExpression {
        return new CppPointerPropertyAccessExpression(expression, name)
    }
    writePrintLog(message: string): void {
        this.print(`printf("${message}\\n");`)
    }
    makeDefinedCheck(value: string, isTag?: boolean): LanguageExpression {
        return this.makeString(
            isTag ? `${value} != ${PrimitiveTypeList.UndefinedTag}`
                  : `runtimeType(${value}) != ${PrimitiveTypeList.UndefinedRuntime}`)
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
    enumFromI32(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        return this.makeString(`static_cast<${this.typeConvertor.convert(enumEntry)}>(` + value.asString() + `)`);
    }
    makeUnsafeCast(param: string): string {
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
    override i32FromEnum(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        return this.makeString(`static_cast<${this.typeConvertor.convert(idl.createReferenceType(enumEntry))}>(${value.asString()})`)
    }
    override escapeKeyword(name: string): string {
        return cppKeywords.has(name) ? name + "_" : name
    }
    makeEnumEntity(enumEntity: IDLEnum, options: { isExport: boolean, isDeclare?: boolean }): LanguageStatement {
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
            case PrintHint.AsReference:
                postfix = '&'
                break
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

    override discriminate(value: string, index: number, type: idl.IDLType, runtimeTypes: RuntimeType[]): string {
        return `${value}.selector == ${index}`
    }
}
