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

import * as idl from '../../idl'
import { isOptionalType } from '../../idl'
import { Language } from '../../Language'
import { IndentedPrinter } from "../../IndentedPrinter";
import {
    AssignStatement,
    BlockStatement,
    CheckOptionalStatement,
    ExpressionStatement,
    FieldModifier,
    IfStatement,
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
    NaryOpExpression,
    ObjectArgs,
    ReturnStatement,
    StringExpression
} from "../LanguageWriter"
import { ArgConvertor } from "../ArgConvertors"
import { IdlNameConvertor } from "../nameConvertor"
import { RuntimeType } from "../common";
import { isDefined, rightmostIndexOf, throwException } from "../../util"
import { ReferenceResolver } from "../../peer-generation/ReferenceResolver";
import { TSReturnStatement } from './TsLanguageWriter';

export class KotlinEnumEntityStatement implements LanguageStatement {
    constructor(
        private readonly enumEntity: idl.IDLEnum,
        private readonly options: { isExport: boolean, isDeclare: boolean },
    ) {}
    write(writer: LanguageWriter): void {
        writer.print(`${this.options.isExport ? "public " : ""}enum class ${this.enumEntity.name}(val value: Int) {`)
        writer.pushIndent()
        this.enumEntity.elements.forEach((member, index) => {
            const initValue = member.initializer != undefined
                ? `(${this.maybeQuoted(member.initializer)})` : ``
            writer.print(`${member.name}${initValue},`)

            let originalName = idl.getExtAttribute(member, idl.IDLExtendedAttributes.OriginalEnumMemberName)
            if (originalName) {
                const initValue = `(${member.name}.value)`
                writer.print(`${originalName}${initValue},`)
            }
        })
        writer.popIndent()
        writer.print(`}`)
    }

    private maybeQuoted(value: string|number): string {
        if (typeof value == "string")
            return `"${value}"`
        else
            return `${value}`
    }
}

class KotlinMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private op: () => void) {}
    write(writer: LanguageWriter): void {
        writer.print(`for ((${this.key}, ${this.value}) in ${this.map}) {`)
        writer.pushIndent()
        this.op()
        writer.popIndent()
        writer.print(`}`)
    }
}

export class KotlinThrowErrorStatement implements LanguageStatement {
    constructor(public message: string) { }
    write(writer: LanguageWriter): void {
        writer.print(`throw Error("${this.message}")`)
    }
}

export class KotlinLoopStatement implements LanguageStatement {
    constructor(private counter: string, private limit: string, private statement: LanguageStatement | undefined) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (${this.counter} in 0..${this.limit}) {`)
        if (this.statement) {
            writer.pushIndent()
            this.statement.write(writer)
            writer.popIndent()
            writer.print("}")
        }
    }
}
export class KotlinAssignStatement extends AssignStatement {
    constructor(public variableName: string,
        public type: idl.IDLType | undefined,
        public expression: LanguageExpression,
        public isDeclared: boolean = true,
        public isConst: boolean = true) {
            super(variableName, type, expression, isDeclared, isConst)
        }

        write(writer: LanguageWriter): void {
            if (this.isDeclared) {
                const typeSpec =
                    this.options?.overrideTypeName
                        ? `: ${this.options.overrideTypeName}`
                        : this.type ? `: ${writer.getNodeName(this.type)}` : ""
                const constSpec = this.isConst ? "val" : "var"
                const initValue = this.expression ? `= ${this.expression.asString()}` : ""
                writer.print(`${constSpec} ${this.variableName}${typeSpec} ${initValue}`)
            } else {
                writer.print(`${this.variableName} = ${this.expression.asString()}`)
            }
        }
}

export class KotlinNewObjectExpression implements LanguageExpression {
    constructor(
        private objectName: string,
        private params: LanguageExpression[]) { }
    asString(): string {
        return `${this.objectName}(${this.params.map(it => it.asString()).join(", ")})`
    }
}

export class KotlinCheckDefinedExpression implements LanguageExpression {
    constructor(private value: string) { }
    asString(): string {
        return `${this.value} != null`
    }
}

class KotlinUnwrapOptionalExpression implements LanguageExpression {
    constructor(public value: LanguageExpression) {}
    asString(): string {
        return `requireNotNull(${this.value.asString()})`
    }
}

export class KotlinLanguageWriter extends LanguageWriter {
    protected typeConvertor: IdlNameConvertor

    constructor(printer: IndentedPrinter,
                resolver: ReferenceResolver,
                typeConvertor: IdlNameConvertor,
                language: Language = Language.KOTLIN) {
        super(printer, resolver, language)
        this.typeConvertor = typeConvertor
    }

    fork(options?: { resolver?: ReferenceResolver }): LanguageWriter {
        return new KotlinLanguageWriter(new IndentedPrinter(), options?.resolver ?? this.resolver, this.typeConvertor, this.language)
    }

    getNodeName(type: idl.IDLNode): string {
       return this.typeConvertor.convert(type)
    }

    writeClass(
        name: string,
        op: (writer: this) => void,
        superClass?: string,
        interfaces?: string[],
        generics?: string[],
        isDeclared?: boolean,
        isAbstract?: boolean
    ): void {
        let extendsClause = superClass ? `${superClass}` : undefined
        let implementsClause = interfaces ? `${interfaces.join(' , ')}` : undefined
        let inheritancePart = [extendsClause, implementsClause]
            .filter(isDefined)
            .join(' , ')
        inheritancePart = inheritancePart.length != 0 ? ' : '.concat(inheritancePart) : ''
        this.printer.print(`public open class ${name}${inheritancePart} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeInterface(name: string, op: (writer: this) => void, superInterfaces?: string[], generics?: string[], isDeclared?: boolean): void {
        this.printer.print(`public interface ${name} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeFunctionDeclaration(name: string, signature: MethodSignature, generics?:string[]): void {
        this.printer.print(this.generateFunctionDeclaration(name, signature))
    }
    writeFunctionImplementation(name: string, signature: MethodSignature, op: (writer: this) => void, generics?:string[]): void {
        this.printer.print(`${this.generateFunctionDeclaration(name, signature)} {`)
        this.printer.pushIndent()
        op(this)
        this.printer.popIndent()
        this.printer.print('}')
    }
    private generateFunctionDeclaration(name: string, signature: MethodSignature): string {
        const args = signature.args.map((it, index) => `${signature.argName(index)}: ${this.getNodeName(it)}`)
        return `public fun ${name}(${args.join(", ")}): ${this.getNodeName(signature.returnType)}`
    }
    writeEnum(name: string, members: { name: string, alias?: string | undefined, stringId: string | undefined, numberId: number }[], options: { isDeclare?: boolean, isExport: boolean }): void {
        throw new Error("Try to avoid writeEnum")
    }
    private writeDeclaration(name: string, signature: MethodSignature, needReturn: boolean, needBracket: boolean, modifiers?: MethodModifier[], generics?: string[]) {
        let prefix = !modifiers ? undefined : this.supportedModifiers
            .filter(it => modifiers.includes(it))
            .map(it => this.mapMethodModifier(it)).join(" ")
        if (modifiers?.includes(MethodModifier.GETTER)) {
            prefix = `${prefix} get`
        } else if (modifiers?.includes(MethodModifier.SETTER)) {
            prefix = `${prefix} set`
            needReturn = false
        }
        prefix = prefix ? prefix.trim() + " " : ""
        const typeParams = generics?.length ? `<${generics.join(", ")}>` : ""
        const normalizedArgs = signature.args.map((it, i) =>
            idl.isOptionalType(it) && signature.isArgOptional(i) ? idl.maybeUnwrapOptionalType(it) : it
        )
        this.printer.print(`${prefix}${name == 'constructor' ? name : `fun ${name}`}${typeParams}(${normalizedArgs.map((it, index) => `${signature.argName(index)}${signature.isArgOptional(index) ? "?" : ``}: ${this.getNodeName(it)}${signature.argDefault(index) ? ' = ' + signature.argDefault(index) : ""}`).join(", ")})${needReturn ? ": " + this.getNodeName(signature.returnType) : ""}${needBracket ? " {" : ""}`)
    }
    writeFieldDeclaration(name: string, type: idl.IDLType, modifiers: FieldModifier[]|undefined, optional: boolean, initExpr?: LanguageExpression): void {
        const init = initExpr != undefined ? ` = ${initExpr.asString()}` : ``
        let prefix = this.makeFieldModifiersList(modifiers?.filter(m => m != FieldModifier.READONLY && m != FieldModifier.STATIC))
        this.printer.print(`${prefix ? prefix.concat(" ") : ""}${modifiers?.includes(FieldModifier.READONLY) ? 'val' : 'var'} ${name}: ${this.getNodeName(idl.maybeOptional(type, optional))}${init}`)
    }
    writeNativeMethodDeclaration(method: Method): void {
        throw new Error("Not implemented")
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void {
        this.writeDeclaration(name, signature, true, false, modifiers)
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: this) => void, superCall?: Method, modifiers?: MethodModifier[]) {
        this.writeDeclaration('constructor', signature, false, true)
        this.pushIndent()
        if (superCall) {
            this.print(`super(${superCall.signature.args.map((_, i) => superCall?.signature.argName(i)).join(", ")})`)
        }
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeMethodImplementation(method: Method, op: (writer: this) => void) {
        this.writeDeclaration(method.name, method.signature, true, true, method.modifiers, method.generics)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeProperty(propName: string, propType: idl.IDLType, modifiers: FieldModifier[], getter?: { method: Method, op: () => void }, setter?: { method: Method, op: () => void }): void {
        this.writeFieldDeclaration(propName, propType, modifiers, idl.isOptionalType(propType))
    }
    writeTypeDeclaration(decl: idl.IDLTypedef): void {
        throw new Error("Not implemented")
    }
    writeConstant(constName: string, constType: idl.IDLType, constVal?: string): void {
        throw new Error("Not implemented")
    }
    makeNull(): LanguageExpression {
        return this.makeString('null')
    }
    makeAssign(variableName: string, type: idl.IDLType | undefined, expr: LanguageExpression, isDeclared: boolean = true, isConst: boolean = true, options?: MakeAssignOptions): LanguageStatement {
        return new KotlinAssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        throw new Error("Not implemented")
    }
    makeThrowError(message: string): LanguageStatement {
        return new KotlinThrowErrorStatement(message)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new TSReturnStatement(expr)
    }
    makeCheckOptional(optional: LanguageExpression, doStatement: LanguageStatement): LanguageStatement {
        throw new Error("Not implemented")
    }
    makeStatement(expr: LanguageExpression): LanguageStatement {
        return new ExpressionStatement(expr)
    }
    makeLoop(counter: string, limit: string, statement?: LanguageStatement): LanguageStatement {
        return new KotlinLoopStatement(counter, limit, statement)
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new KotlinMapForEachStatement(map, key, value, op)
    }
    writePrintLog(message: string): void {
        throw new Error("Not implemented")
    }
    makeCast(value: LanguageExpression, node: idl.IDLNode, options?: MakeCastOptions): LanguageExpression {
        return this.makeString(`${value.asString()} as ${this.getNodeName(node)}`)
    }
    typeInstanceOf(type: idl.IDLEntry, value: string, members?: string[]): LanguageExpression {
        throw new Error("Not implemented")
    }
    getObjectAccessor(convertor: ArgConvertor, value: string, args?: ObjectArgs): string {
        throw new Error("Not implemented")
    }
    makeUndefined(): LanguageExpression {
        return this.makeNull()
    }
    makeRuntimeType(rt: RuntimeType): LanguageExpression {
        return this.makeString(`RuntimeType.${RuntimeType[rt]}.ordinal`)
    }
    makeTupleAlloc(option: string): LanguageStatement {
        throw new Error("Not implemented")
    }
    makeArrayInit(type: idl.IDLContainerType, size?:number): LanguageExpression {
        return this.makeString(`Array<${this.getNodeName(type.elementType[0])}>(${size ?? ''})`)
    }
    makeArrayLength(array: string, length?: string): LanguageExpression {
        return this.makeString(`${array}.size`)
    }
    makeClassInit(type: idl.IDLType, paramenters: LanguageExpression[]): LanguageExpression {
        throw new Error("Not implemented")
    }
    makeMapInit(type: idl.IDLType): LanguageExpression {
        return this.makeString(`${this.getNodeName(type)}()`)
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        return this.makeStatement(this.makeMethodCall(keyAccessor, "set", [this.makeString(key), this.makeString(value)]))
    }
    makeUnwrapOptional(expression: LanguageExpression): LanguageExpression {
        return new KotlinUnwrapOptionalExpression(expression)
    }
    makeDefinedCheck(value: string): LanguageExpression {
        return new KotlinCheckDefinedExpression(value)
    }
    getTagType(): idl.IDLType {
        throw new Error("Not implemented")
    }
    getRuntimeType(): idl.IDLType {
        throw new Error("Not implemented")
    }
    makeTupleAssign(receiver: string, fields: string[]): LanguageStatement {
        throw new Error("Not implemented")
    }
    get supportedModifiers(): MethodModifier[] {
        return [MethodModifier.PUBLIC, MethodModifier.PRIVATE]
    }
    get supportedFieldModifiers(): FieldModifier[] {
        return [FieldModifier.PUBLIC, FieldModifier.PRIVATE, FieldModifier.PROTECTED, FieldModifier.READONLY]
    }
    enumFromI32(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        return this.makeString(`${this.getNodeName(enumEntry)}(${value.asString()})`)
    }
    i32FromEnum(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        return this.makeString(`${value.asString()}.value`)
    }
    makeEnumEntity(enumEntity: idl.IDLEnum, options: { isExport: boolean, isDeclare?: boolean }): LanguageStatement {
        return new KotlinEnumEntityStatement(enumEntity, { isExport: options.isExport, isDeclare: !!options.isDeclare})
    }
    castToBoolean(value: string): string {
        return `if (${value}) { 1 } else { 0 }`
    }
    castToInt(value: string, bitness: 8|32): string {
        return `${this.escapeKeyword(value)}.${bitness == 8 ? 'toByte()' : 'toInt()'}`
    }
    makeCallIsObject(value: string): LanguageExpression {
        throw new Error("Not implemented")
    }
    makeNewObject(objectName: string, params: LanguageExpression[] = []): LanguageExpression {
        return new KotlinNewObjectExpression(objectName, params)
    }
    escapeKeyword(keyword: string): string {
        return keyword
    }
    makeDiscriminatorConvertor(convertor: ArgConvertor, value: string, index: number): LanguageExpression | undefined {
        throw new Error("Not implemented")
    }
    makeStaticBlock(op: (writer: LanguageWriter) => void) {
        this.printer.print('companion object {')
        this.printer.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print('}')
    }
    pushNamespace(namespace: string, options: { ident: boolean, isDeclared?: boolean }) {}
    popNamespace(options: { ident: boolean }) {}
}