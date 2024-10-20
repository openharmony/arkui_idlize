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
import { ArrayConvertor, MapConvertor, OptionConvertor, TupleConvertor, UnionConvertor } from "../../Convertors"
import { FieldRecord } from "../../DeclarationTable"
import { mapType, TSTypeNodeNameConvertor } from "../../TypeNodeNameConvertor"
import { AssignStatement, ExpressionStatement, FieldModifier, LanguageExpression, LanguageStatement, LanguageWriter, Method, MethodModifier, MethodSignature, ObjectArgs, ReturnStatement, Type } from "../LanguageWriter"
import { IDLContainerType, IDLF32Type, IDLF64Type, IDLI16Type, IDLI32Type, IDLI64Type, IDLI8Type, IDLNumberType, IDLPointerType, IDLPrimitiveType, IDLStringType, IDLU16Type, IDLU32Type, IDLU64Type, IDLU8Type, IDLVoidType } from '../../../idl'
import * as ts from 'typescript'
import { ArgConvertor, RuntimeType } from "../../ArgConvertors"

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

// maybe FIX ME: dependency on TS writer
export abstract class LambdaExpression implements LanguageExpression {
    constructor(
        protected signature: MethodSignature,
        private body?: LanguageStatement[]) { }

    protected abstract get statementHasSemicolon(): boolean
    abstract asString(): string

    bodyAsString(): string {
        const writer = new TSLanguageWriter(new IndentedPrinter(), Language.TS)
        if (this.body) {
            for (const stmt of this.body) {
                stmt.write(writer)
            }
        }

        return writer.printer.getOutput()
            .map(line => line.trim())
            .filter(line => line !== "")
            .map(line => line === "{" || line === "}" || this.statementHasSemicolon ? line : `${line};`)
            .join(" ")
    }
}

export class TSLambdaExpression extends LambdaExpression {
    constructor(
        signature: MethodSignature,
        body?: LanguageStatement[]) {
        super(signature, body)
    }
    protected get statementHasSemicolon(): boolean {
        return false
    }
    asString(): string {
        const params = this.signature.args.map((it, i) => `${this.signature.argName(i)}: ${it.name}`)
        return `(${params.join(", ")}) => { ${this.bodyAsString()} }`
    }
}

export class TSCastExpression implements LanguageExpression {
    constructor(public value: LanguageExpression, public type: Type, private unsafe = false) {}
    asString(): string {
        return this.unsafe
            ? `unsafeCast<${this.type.name}>(${this.value.asString()})`
            : `(${this.value.asString()} as ${this.type.name})`
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
    constructor(private object: string, private type: Type | undefined, private isDeclare: boolean) {}
    write(writer: LanguageWriter): void {
        writer.writeStatement(writer.makeAssign(this.object,
            this.type,
            writer.makeString(`{}`),
            this.isDeclare,
            false))
    }
}

export class TsObjectDeclareStatement implements LanguageStatement {
    constructor(private object: string, private type: Type | undefined, private fields: readonly FieldRecord[]) {}
    write(writer: LanguageWriter): void {
        const nameConvertor = new TsObjectDeclareNodeNameConvertor()
        // Constructing a new type with all optional fields
        const objectType = new Type(`{${this.fields.map(it => {
            return `${it.name}?: ${nameConvertor.convert(it.type)}`
        }).join(",")}}`)
        new TsObjectAssignStatement(this.object, objectType, true).write(writer)
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
    constructor(printer: IndentedPrinter, language: Language = Language.TS) {
        super(printer, language)
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
    writeFieldDeclaration(name: string, type: Type, modifiers: FieldModifier[]|undefined, optional: boolean, initExpr?: LanguageExpression): void {
        const init = initExpr != undefined ? ` = ${initExpr.asString()}` : ``
        let prefix = this.makeFieldModifiersList(modifiers)
        this.printer.print(`${prefix} ${name}${optional ? "?"  : ""}: ${type.name}${init}`)
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
        this.printer.print(`${prefix}${name}${typeParams}(${signature.args.map((it, index) => `${signature.argName(index)}${it.nullable ? "?" : ""}: ${this.mapType(it)}${signature.argDefault(index) ? ' = ' + signature.argDefault(index) : ""}`).join(", ")})${needReturn ? ": " + this.mapType(signature.returnType) : ""} ${needBracket ? "{" : ""}`)
    }
    makeAssign(variableName: string, type: Type | undefined, expr: LanguageExpression | undefined, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
        return new AssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        return new TSLambdaExpression(signature, body)
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
    makeCast(value: LanguageExpression, type: Type, unsafe = false): LanguageExpression {
        return new TSCastExpression(value, type, unsafe)
    }
    getObjectAccessor(convertor: ArgConvertor, value: string, args?: ObjectArgs): string {
        if (convertor instanceof OptionConvertor || convertor instanceof UnionConvertor) {
            return value
        }
        if (convertor instanceof ArrayConvertor && args?.index != undefined) {
            return `${value}${args.index}`
        }
        if (convertor instanceof ArrayConvertor) {
            return `${value}`
        }
        if (convertor instanceof TupleConvertor && args?.index != undefined) {
            return `${value}[${args.index}]`
        }
        if (convertor instanceof MapConvertor) {
            return `${value}`
        }
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
    makeObjectAlloc(object: string, fields: readonly FieldRecord[]): LanguageStatement {
        if (fields.length > 0) {
            return this.makeAssign(object, undefined,
                this.makeCast(this.makeString("{}"),
                    new Type(`{${fields.map(it=>`${it.name}: ${mapType(it.type)}`).join(",")}}`)),
                false)
        }
        return new TsObjectAssignStatement(object, undefined, false)
    }
    makeMapResize(mapTypeName: string, keyType: string, valueType: string, map: string, size: string, deserializer: string): LanguageStatement {
        return this.makeAssign(map, undefined, this.makeString(`new Map<${keyType}, ${valueType}>()`), false)
    }
    makeMapKeyTypeName(c: MapConvertor): string {
        return c.keyConvertor.tsTypeName;
    }
    makeMapValueTypeName(c: MapConvertor): string {
        return c.valueConvertor.tsTypeName;
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        // keyAccessor and valueAccessor are equal in TS
        return this.makeStatement(this.makeMethodCall(keyAccessor, "set", [this.makeString(key), this.makeString(value)]))
    }
    makeObjectDeclare(name: string, type: Type, fields: readonly FieldRecord[]): LanguageStatement {
        return new TsObjectDeclareStatement(name, type, fields)
    }
    getTagType(): Type {
        return new Type("Tags");
    }
    getRuntimeType(): Type {
        return new Type("number");
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
    enumFromOrdinal(value: LanguageExpression, enumType: string): LanguageExpression {
        return this.makeString(`Object.values(${enumType})[${value.asString()}]`);
    }
    ordinalFromEnum(value: LanguageExpression, enumType: string): LanguageExpression {
        return this.makeString(`Object.keys(${enumType}).indexOf(${this.makeCast(value, new Type('string')).asString()})`);
    }
    mapIDLContainerType(type: IDLContainerType, args: string[]): string {
        switch (type.name) {
            case 'sequence': {
                switch (type.elementType[0].name) {
                    case IDLU8Type.name: return 'Uint8Array'
                    case IDLI32Type.name: return 'Int32Array'
                    case IDLF32Type.name: return 'Float32Array'
                }
            }
        }
        return super.mapIDLContainerType(type, args)
    }
    mapType(type: Type, convertor?: ArgConvertor): string {
        switch (type.name) {
            case 'Function': return 'Object'
        }
        return super.mapType(type)
    }
    mapIDLPrimitiveType(type: IDLPrimitiveType): string {
        switch (type) {
            case IDLPointerType: return 'number | bigint'
            case IDLVoidType: return 'void'

            case IDLI8Type:
            case IDLU8Type:
            case IDLI16Type:
            case IDLU16Type:
            case IDLI32Type:
            case IDLU32Type:
            case IDLI64Type:
            case IDLU64Type:
            case IDLF32Type:
            case IDLF64Type:
            case IDLNumberType:
                return 'number'

            case IDLStringType:
                return 'string'
        }
        return super.mapIDLPrimitiveType(type)
    }
    override castToBoolean(value: string): string { return `+${value}` }
    override makeCallIsObject(value: string): LanguageExpression {
        return this.makeString(`${value} instanceof Object`)
    }
}
