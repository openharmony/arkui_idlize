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

import { IndentedPrinter } from "../../../IndentedPrinter"
import { Language } from "../../../Language"
import { TSTypeNodeNameConvertor } from "../../TypeNodeNameConvertor"
import {
    AssignStatement,
    ExpressionStatement,
    FieldModifier,
    LambdaExpression,
    LanguageExpression,
    LanguageStatement,
    LanguageWriter,
    MakeAssignOptions,
    MakeCastOptions,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature,
    ObjectArgs,
    ReturnStatement,
    StringExpression
} from "../LanguageWriter"
import * as idl from '../../../idl'
import * as ts from 'typescript'
import { ArgConvertor, RuntimeType } from "../../ArgConvertors"
import { EnumConvertor } from "../../idl/IdlArgConvertors"
import { ReferenceResolver } from "../../ReferenceResolver"
import { convertType, IdlNameConvertor, TypeConvertor } from "../nameConvertor"
import { TsIDLNodeToStringConverter } from "../convertors/TSConvertors"

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

export class TSLambdaExpression extends LambdaExpression {
    constructor(
        writer: LanguageWriter,
        private convertor: IdlNameConvertor,
        signature: MethodSignature,
        resolver: ReferenceResolver,
        body?: LanguageStatement[]) {
        super(writer, signature, resolver, body)
    }
    protected get statementHasSemicolon(): boolean {
        return false
    }
    asString(): string {
        const params = this.signature.args.map((it, i) => {
            const maybeOptional = idl.isOptionalType(it) ? "?" : ""
            return `${this.signature.argName(i)}${maybeOptional}: ${this.convertor.convertType(it)}`
        })

        return `(${params.join(", ")}): ${this.convertor.convertType(this.signature.returnType)} => { ${this.bodyAsString()} }`
    }
}

export class TSCastExpression implements LanguageExpression {
    constructor(public value: LanguageExpression, public type: string, private unsafe = false) {}
    asString(): string {
        return this.unsafe
            ? `unsafeCast<${this.type}>(${this.value.asString()})`
            : `(${this.value.asString()} as ${this.type})`
    }
}

////////////////////////////////////////////////////////////////
//                         STATEMENTS                         //
////////////////////////////////////////////////////////////////

class TSThrowErrorStatement implements LanguageStatement {
    constructor(public message: string) { }
    write(writer: LanguageWriter): void {
        writer.print(`throw new Error("${this.message}")`)
    }
}
export class TSReturnStatement extends ReturnStatement {
    constructor(public expression: LanguageExpression) { super(expression) }
}

class TSLoopStatement implements LanguageStatement {
    constructor(private counter: string, private limit: string, private statement: LanguageStatement | undefined) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (let ${this.counter} = 0; ${this.counter} < ${this.limit}; ${this.counter}++) {`)
        if (this.statement) {
            writer.pushIndent()
            this.statement.write(writer)
            writer.popIndent()
            writer.print("}")
        }
    }
}

class TSMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private op: () => void) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (const [${this.key}, ${this.value}] of ${this.map}) {`)
        writer.pushIndent()
        this.op()
        writer.popIndent()
        writer.print(`}`)
    }
}

export class TsTupleAllocStatement implements LanguageStatement {
    constructor(private tuple: string) {}
    write(writer: LanguageWriter): void {
        writer.writeStatement(writer.makeAssign(this.tuple, undefined, writer.makeString("[]"), false, false))
    }
}

export class TsObjectAssignStatement implements LanguageStatement {
    constructor(private object: string, private type: idl.IDLType | undefined, private isDeclare: boolean) {}
    write(writer: LanguageWriter): void {
        writer.writeStatement(writer.makeAssign(this.object,
            this.type,
            writer.makeString(`{}`),
            this.isDeclare,
            false))
    }
}

///////////////////////////////////////////////////////////////
//                            UTILS                          //
///////////////////////////////////////////////////////////////

class TsObjectDeclareNodeNameConvertor extends TSTypeNodeNameConvertor {
    private useOptionalTypes = true

    override convertTuple(node: ts.TupleTypeNode): string {
        this.useOptionalTypes = false
        const name = super.convertTuple(node);
        this.useOptionalTypes = true
        return name
    }
    override convertOptional(node: ts.OptionalTypeNode): string {
        let name = super.convertOptional(node);
        if (!this.useOptionalTypes) {
            name = name.replace("?", "")
        }
        return name
    }
    override convertImport(_node: ts.ImportTypeNode): string {
        //TODO: to preventing an error IMPORT_* types were  not found
        return "object"
    }
    override convert(node: ts.Node | undefined): string {
        if (node) {
            return super.convert(node)
        }
        return "undefined";
    }
}

////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export class TSLanguageWriter extends LanguageWriter {
    protected typeConvertor: IdlNameConvertor

    constructor(printer: IndentedPrinter, resolver: ReferenceResolver, language: Language = Language.TS) {
        super(printer, resolver, language)
        this.typeConvertor = new TsIDLNodeToStringConverter(this.resolver)
    }

    fork(): LanguageWriter {
        return new TSLanguageWriter(new IndentedPrinter(), this.resolver, this.language)
    }

    stringifyType(type: idl.IDLType): string {
        return this.typeConvertor.convertType(type)
    }

    writeClass(name: string, op: (writer: LanguageWriter) => void, superClass?: string, interfaces?: string[], generics?: string[], isDeclared?: boolean): void {
        let extendsClause = superClass ? ` extends ${superClass}` : ''
        let implementsClause = interfaces ? ` implements ${interfaces.join(",")}` : ''
        const genericsClause = generics?.length ? `<${generics.join(", ")}>` : ''
        this.printer.print(`export${isDeclared ? " declare" : ""} class ${name}${genericsClause}${extendsClause}${implementsClause} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeInterface(name: string, op: (writer: LanguageWriter) => void, superInterfaces?: string[], isDeclared?: boolean): void {
        let extendsClause = superInterfaces ? ` extends ${superInterfaces.join(",")}` : ''
        this.printer.print(`export ${isDeclared ? "declare " : ""}interface ${name}${extendsClause} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeFunctionDeclaration(name: string, signature: MethodSignature): void {
        this.printer.print(this.generateFunctionDeclaration(name, signature))
    }
    writeFunctionImplementation(name: string, signature: MethodSignature, op: (writer: LanguageWriter) => void): void {
        this.printer.print(`${this.generateFunctionDeclaration(name, signature)} {`)
        this.printer.pushIndent()
        op(this)
        this.printer.popIndent()
        this.printer.print('}')
    }
    private generateFunctionDeclaration(name: string, signature: MethodSignature): string {
        const args = signature.args.map((it, index) => `${signature.argName(index)}: ${this.stringifyType(it)}`)
        return `export function ${name}(${args.join(", ")})`
    }
    writeEnum(name: string, members: { name: string, stringId: string | undefined, numberId: number }[], op: (writer: LanguageWriter) => void): void {
        throw new Error("WriteEnum for TS is not implemented")
    }
    writeFieldDeclaration(name: string, type: idl.IDLType, modifiers: FieldModifier[]|undefined, optional: boolean, initExpr?: LanguageExpression): void {
        const init = initExpr != undefined ? ` = ${initExpr.asString()}` : ``
        let prefix = this.makeFieldModifiersList(modifiers)
        this.printer.print(`${prefix} ${name}${optional ? "?"  : ""}: ${this.stringifyType(type)}${init}`)
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void {
        this.writeDeclaration(name, signature, true, false, modifiers)
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void, superCall?: Method, modifiers?: MethodModifier[]) {
        this.writeDeclaration(`${modifiers ? modifiers.map((it) => MethodModifier[it].toLowerCase()).join(' ') : ''} constructor`, signature, false, true)
        this.pushIndent()
        if (superCall) {
            this.print(`super(${superCall.signature.args.map((_, i) => superCall?.signature.argName(i)).join(", ")})`)
        }
        op(this)
        this.popIndent()
        this.printer.print(`}`)

    }
    writeMethodImplementation(method: Method, op: (writer: LanguageWriter) => void) {
        this.writeDeclaration(method.name, method.signature, true, true, method.modifiers, method.generics)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeProperty(propName: string, propType: idl.IDLType) {
        throw new Error("writeProperty for TS is not implemented yet.")
    }
    private writeDeclaration(name: string, signature: MethodSignature, needReturn: boolean, needBracket: boolean, modifiers?: MethodModifier[], generics?: string[]) {
        let prefix = !modifiers ? undefined : this.supportedModifiers
            .filter(it => modifiers.includes(it))
            .map(it => this.mapMethodModifier(it)).join(" ")
        if (modifiers?.includes(MethodModifier.GETTER)) {
            prefix = `get ${prefix}`
        } else if (modifiers?.includes(MethodModifier.SETTER)) {
            prefix = `set ${prefix}`
            needReturn = false
        }
        prefix = prefix ? prefix.trim() + " " : ""
        const typeParams = generics ? `<${generics.join(", ")}>` : ""
        // FIXME:
        const isSetter = modifiers?.includes(MethodModifier.SETTER)
        this.printer.print(`${prefix}${name}${typeParams}(${signature.args.map((it, index) => `${signature.argName(index)}${idl.isOptionalType(it) && !isSetter ? "?" : ""}: ${this.stringifyType(it)}${signature.argDefault(index) ? ' = ' + signature.argDefault(index) : ""}`).join(", ")})${needReturn ? ": " + this.stringifyType(signature.returnType) : ""} ${needBracket ? "{" : ""}`)
    }
    makeNull(): LanguageExpression {
        return new StringExpression("undefined")
    }
    makeAssign(variableName: string, type: idl.IDLType | undefined, expr: LanguageExpression | undefined, isDeclared: boolean = true, isConst: boolean = true, options?:MakeAssignOptions): LanguageStatement {
        return new AssignStatement(variableName, type, expr, isDeclared, isConst, options)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        return new TSLambdaExpression(this, this.typeConvertor, signature, this.resolver, body)
    }
    makeThrowError(message: string): LanguageStatement {
        return new TSThrowErrorStatement(message)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new TSReturnStatement(expr)
    }
    makeStatement(expr: LanguageExpression): LanguageStatement {
        return new ExpressionStatement(expr)
    }
    makeLoop(counter: string, limit: string, statement?: LanguageStatement): LanguageStatement {
        return new TSLoopStatement(counter, limit, statement)
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new TSMapForEachStatement(map, key, value, op)
    }
    writePrintLog(message: string): void {
        this.print(`console.log("${message}")`)
    }
    makeCast(value: LanguageExpression, type: idl.IDLType, options?: MakeCastOptions): LanguageExpression {
        return new TSCastExpression(value, this.stringifyType(/* FIXME: */ idl.maybeOptional(type, false)), options?.unsafe ?? false)
    }
    getObjectAccessor(convertor: ArgConvertor, value: string, args?: ObjectArgs): string {
        if (convertor.useArray && args?.index != undefined) {
            return `${value}[${args.index}]`
        }
        return `${value}`
    }
    makeUndefined(): LanguageExpression {
        return this.makeString("undefined")
    }
    makeRuntimeType(rt: RuntimeType): LanguageExpression {
        return this.makeString(`RuntimeType.${RuntimeType[rt]}`)
    }
    makeTupleAlloc(option: string): LanguageStatement {
        return new TsTupleAllocStatement(option)
    }
    makeArrayInit(type: idl.IDLContainerType): LanguageExpression {
        return this.makeString(`new Array<${this.stringifyType(type.elementType[0])}>()`)
    }
    makeClassInit(type: idl.IDLType, paramenters: LanguageExpression[]): LanguageExpression {
        return this.makeString(`new ${this.stringifyType(type)}(${paramenters.map(it => it.asString()).join(", ")})`)
    }
    makeMapInit(type: idl.IDLType): LanguageExpression {
        return this.makeString(`new ${this.stringifyType(type)}()`)
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        // keyAccessor and valueAccessor are equal in TS
        return this.makeStatement(this.makeMethodCall(keyAccessor, "set", [this.makeString(key), this.makeString(value)]))
    }
    getTagType(): idl.IDLType {
        return idl.toIDLType("Tags");
    }
    getRuntimeType(): idl.IDLType {
        return idl.IDLI32Type;
    }
    makeTupleAssign(receiver: string, fields: string[]): LanguageStatement {
        return this.makeAssign(receiver, undefined,
            this.makeString(`[${fields.map(it=> `${it}!`).join(",")}]`), false)
    }
    get supportedModifiers(): MethodModifier[] {
        return [MethodModifier.PUBLIC, MethodModifier.PRIVATE, MethodModifier.STATIC]
    }
    get supportedFieldModifiers(): FieldModifier[] {
        return [FieldModifier.PUBLIC, FieldModifier.PRIVATE, FieldModifier.PROTECTED, FieldModifier.READONLY, FieldModifier.STATIC]
    }
    enumFromOrdinal(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        return this.makeString(`Object.values(${enumEntry.name})[${value.asString()}]`);
    }
    ordinalFromEnum(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        return this.makeString(`Object.keys(${enumEntry.name}).indexOf(${this.makeCast(value, idl.IDLStringType).asString()})`);
    }
    override makeEnumCast(enumName: string, unsafe: boolean, convertor: EnumConvertor): string {
        if (unsafe) {
            return this.makeUnsafeCast(convertor, enumName)
        }
        return enumName
    }
    override castToBoolean(value: string): string { return `+${value}` }
    override makeCallIsObject(value: string): LanguageExpression {
        return this.makeString(`${value} instanceof Object`)
    }
}
