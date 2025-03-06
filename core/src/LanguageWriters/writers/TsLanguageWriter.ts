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
import { throwException } from "../../util";
import { ReferenceResolver } from "../../peer-generation/ReferenceResolver";
import { TSKeywords } from '../../languageSpecificKeywords';

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
            return `${this.signature.argName(i)}${maybeOptional}: ${this.convertor.convert(it)}`
        })

        return `(${params.join(", ")}): ${this.convertor.convert(this.signature.returnType)} => { ${this.bodyAsString()} }`
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

class TSUnwrapOptionalExpression implements LanguageExpression {
    constructor(public value: LanguageExpression) {}
    asString(): string {
        return `(${this.value.asString()})!`
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

////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export class TSLanguageWriter extends LanguageWriter {
    protected typeConvertor: IdlNameConvertor

    constructor(printer: IndentedPrinter,
                resolver: ReferenceResolver,
                typeConvertor: IdlNameConvertor,
                language: Language = Language.TS) {
        super(printer, resolver, language)
        this.typeConvertor = typeConvertor
    }

    maybeSemicolon() { return "" }

    pushNamespace(namespace: string, ident: boolean = true): void {
        this.namespaceStack.push(namespace)
        this.print(`export namespace ${namespace} {`)
        if (ident) this.pushIndent()
    }

    fork(options?: { resolver?: ReferenceResolver }): LanguageWriter {
        return new TSLanguageWriter(new IndentedPrinter(), options?.resolver ?? this.resolver, this.typeConvertor, this.language)
    }

    getNodeName(type: idl.IDLNode): string {
        // just stub.
        // language writers and name convertors are subject to rework for namespaces
        const row = this.typeConvertor.convert(type)
        const nsPrefix = this.namespaceStack.join('.') + '.'
        if (row.startsWith(nsPrefix)) {
            return row.substring(nsPrefix.length)
        }
        return row
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
        let extendsClause = superClass ? ` extends ${superClass}` : ''
        let implementsClause = interfaces ? ` implements ${interfaces.join(",")}` : ''
        let genericsClause = generics?.length ? `<${generics.join(", ")}>` : ''
        let declaredClause = isDeclared ? ` declare` : ''
        let abstractClause = isAbstract ? ` abstract` : ''
        this.printer.print(`export${declaredClause}${abstractClause} class ${name}${genericsClause}${extendsClause}${implementsClause} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    override writeInterface(name: string, op: (writer: this) => void, superInterfaces?: string[], generics?: string[], isDeclared?: boolean): void {
        const genericsClause = generics?.length ? `<${generics.join(", ")}>` : ''
        let extendsClause = superInterfaces ? ` extends ${superInterfaces.join(",")}` : ''
        this.printer.print(`export ${isDeclared ? "declare " : ""}interface ${name}${genericsClause}${extendsClause} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeFunctionDeclaration(name: string, signature: MethodSignature): void {
        this.printer.print(this.generateFunctionDeclaration(name, signature))
    }
    writeFunctionImplementation(name: string, signature: MethodSignature, op: (writer: this) => void): void {
        this.printer.print(`${this.generateFunctionDeclaration(name, signature)} {`)
        this.printer.pushIndent()
        op(this)
        this.printer.popIndent()
        this.printer.print('}')
    }
    private generateFunctionDeclaration(name: string, signature: MethodSignature): string {
        const args = signature.args.map((it, index) =>
            `${signature.argName(index)}${idl.isOptionalType(it) ? '?' : ''}: ${this.getNodeName(it)}`
        )
        const returnType = this.getNodeName(signature.returnType)
        return `export function ${name}(${args.join(", ")}): ${returnType}`
    }
    writeEnum(name: string, members: { name: string, alias?: string | undefined, stringId: string | undefined, numberId: number }[]): void {
        this.printer.print(`export enum ${name} {`)
        this.printer.pushIndent()
        for (const [index, member] of members.entries()) {
            let value
            if (member.alias !== undefined) {
                value = member.alias
            } else {
                value = `${member.stringId != undefined ? `"${member.stringId}"` : `${member.numberId}`}`
            }
            const maybeComma = index < members.length - 1 ? "," : ""
            this.printer.print(`${member.name} = ${value}${maybeComma}`)
        }
        this.printer.popIndent()
        this.printer.print("}")
    }
    writeFieldDeclaration(name: string, type: idl.IDLType, modifiers: FieldModifier[]|undefined, optional: boolean, initExpr?: LanguageExpression): void {
        const init = initExpr != undefined ? ` = ${initExpr.asString()}` : ``
        let prefix = this.makeFieldModifiersList(modifiers)
        if (prefix) prefix += " "
        this.printer.print(`${prefix}${name}${optional ? "?"  : ""}: ${this.getNodeName(type)}${init}`)
    }
    writeNativeMethodDeclaration(method: Method): void {
        let name = method.name
        let signature = method.signature
        this.writeMethodImplementation(new Method(name, signature, [MethodModifier.STATIC]), writer => {
            const selfCallExpression = writer.makeFunctionCall(
                `this.${name}`,
                signature.args.map((_, i) => writer.makeString(this.escapeKeyword(signature.argName(i))))
            )
            writer.writeStatement(new IfStatement(
                new NaryOpExpression("==", [writer.makeFunctionCall("this._LoadOnce", []), writer.makeString("true")]),
                new BlockStatement([
                    writer.makeReturn(selfCallExpression)
                ]),
                undefined, undefined, undefined
            ))
            writer.writeStatement(writer.makeThrowError("Not implemented"))
        })
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void {
        this.writeDeclaration(name, signature, true, false, modifiers)
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: this) => void, superCall?: Method, modifiers?: MethodModifier[]) {
        this.writeDeclaration(`${modifiers ? modifiers.map((it) => MethodModifier[it].toLowerCase()).join(' ') : ''} constructor`, signature, false, true)
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
    writeProperty(propName: string, propType: idl.IDLType) {
        throw new Error("writeProperty for TS is not implemented yet.")
    }
    override writeTypeDeclaration(decl: idl.IDLTypedef): void {
        const type = this.getNodeName(decl.type)
        const typeParams = decl.typeParameters?.length ? `<${decl.typeParameters.join(",").replace("[]", "")}>` : ""
        this.print(`export type ${decl.name}${typeParams} = ${type};`)
    }
    writeConstant(constName: string, constType: idl.IDLType, constVal?: string): void {
        this.print(`export const ${constName}: ${this.getNodeName(constType)}${constVal ? ' = ' + constVal : ''}`)
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
        } else if (modifiers?.includes(MethodModifier.FREE)) {
            prefix = `${needBracket ? "" : "declare "}function ${prefix}`
        }
        prefix = prefix ? prefix.trim() + " " : ""
        const typeParams = generics?.length ? `<${generics.join(", ")}>` : ""
        // FIXME:
        const isSetter = modifiers?.includes(MethodModifier.SETTER)
        const canBeOptional: boolean[] =  []
        for (let i = signature.args.length - 1; i >= 0; --i) {
            const prevCanBeOptional = canBeOptional.at(-1) ?? true
            const curr = signature.args[i]

            const result = prevCanBeOptional && (idl.isOptionalType(curr) || signature.argDefault(i) !== undefined)
            canBeOptional.push(result)
        }
        canBeOptional.reverse()
        const isOptional = signature.args.map((it, i) => idl.isOptionalType(it) && canBeOptional[i] && !isSetter)
        const normalizedArgs = signature.args.map((it, i) =>
            idl.isOptionalType(it) && isOptional[i] ? idl.maybeUnwrapOptionalType(it) : it
        )
        this.printer.print(`${prefix}${name}${typeParams}(${normalizedArgs.map((it, index) => `${this.escapeKeyword(signature.argName(index))}${isOptional[index] ? "?" : ""}: ${this.getNodeName(it)}${signature.argDefault(index) ? ' = ' + signature.argDefault(index) : ""}`).join(", ")})${needReturn ? ": " + this.getNodeName(signature.returnType) : ""}${needBracket ? " {" : ""}`)
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
    makeCheckOptional(optional: LanguageExpression, doStatement: LanguageStatement): LanguageStatement {
        return new CheckOptionalStatement("undefined", optional, doStatement)
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
        return new TSCastExpression(value, this.getNodeName(/* FIXME: */ idl.maybeUnwrapOptionalType(type)), options?.unsafe ?? false)
    }
    override typeInstanceOf(type: idl.IDLEntry, value: string, members?: string[]): LanguageExpression {

        if (idl.isInterface(type)) {
            if (idl.isInterfaceSubkind(type)) {
                if (!members) {
                    throw new Error("Members must be defined for interface type recognition!")
                }
                return this.makeString(
                    members!.map(it => `${value}.hasOwnProperty("${it}")`).join("&&")
                )
            }
            if (idl.isClassSubkind(type)) {
                return super.typeInstanceOf(type, value, members)
            }
        }
        throw new Error(`typeInstanceOf fails: not class or interface: ${this.getNodeName(type)}`)
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
    makeArrayInit(type: idl.IDLContainerType, size?:number): LanguageExpression {
        return this.makeString(`new Array<${this.getNodeName(type.elementType[0])}>(${size?.toString() ?? ''})`)
    }
    makeClassInit(type: idl.IDLType, paramenters: LanguageExpression[]): LanguageExpression {
        return this.makeString(`new ${this.getNodeName(type)}(${paramenters.map(it => it.asString()).join(", ")})`)
    }
    makeMapInit(type: idl.IDLType): LanguageExpression {
        return this.makeString(`new ${this.getNodeName(type)}()`)
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        // keyAccessor and valueAccessor are equal in TS
        return this.makeStatement(this.makeMethodCall(keyAccessor, "set", [this.makeString(key), this.makeString(value)]))
    }
    makeUnwrapOptional(expression: LanguageExpression): LanguageExpression {
        return new TSUnwrapOptionalExpression(expression)
    }

    getTagType(): idl.IDLType {
        return idl.createReferenceType("Tags")
    }
    getRuntimeType(): idl.IDLType {
        return idl.IDLI32Type
    }
    makeTupleAssign(receiver: string, fields: string[]): LanguageStatement {
        return this.makeAssign(receiver, undefined,
            this.makeString(`[${fields.map(it=> `${it}!`).join(",")}]`), false)
    }
    get supportedModifiers(): MethodModifier[] {
        return [MethodModifier.PUBLIC, MethodModifier.PRIVATE, MethodModifier.PROTECTED, MethodModifier.STATIC]
    }
    get supportedFieldModifiers(): FieldModifier[] {
        return [FieldModifier.PUBLIC, FieldModifier.PRIVATE, FieldModifier.PROTECTED, FieldModifier.READONLY, FieldModifier.STATIC]
    }
    enumFromOrdinal(value: LanguageExpression, enumEntry: idl.IDLType): LanguageExpression {
        return this.makeString(`Object.values(${idl.forceAsNamedNode(enumEntry).name})[${value.asString()}]`)
    }
    ordinalFromEnum(value: LanguageExpression, enumEntry: idl.IDLType): LanguageExpression {
        const enumName = idl.forceAsNamedNode(enumEntry).name
        const decl = idl.isReferenceType(enumEntry) ? this.resolver.resolveTypeReference(enumEntry) : undefined
        if (decl && idl.isEnum(decl) && idl.isStringEnum(decl)) {
            return this.makeString(`Object.values(${enumName}).indexOf(${value.asString()})`)
        }
        return value
    }
    override makeEnumCast(enumName: string, unsafe: boolean, convertor: ArgConvertor): string {
        if (unsafe) {
            return this.makeUnsafeCast(convertor, enumName)
        }
        return enumName
    }
    override castToBoolean(value: string): string { return `+${value}` }
    override makeCallIsObject(value: string): LanguageExpression {
        return this.makeString(`${value} instanceof Object`)
    }

    override escapeKeyword(keyword: string): string {
        return TSKeywords.has(keyword) ? keyword + "_" : keyword
    }

    makeDiscriminatorConvertor(convertor: ArgConvertor, value: string, index: number): LanguageExpression | undefined {
        const convertorNativeType = convertor.nativeType()
        const decl = this.resolver.resolveTypeReference(
            idl.isReferenceType(convertorNativeType)
                ? convertorNativeType
                : idl.createReferenceType(this.getNodeName(convertorNativeType))
        )
        if (decl === undefined || !idl.isEnum(decl)) {
            throwException(`The type reference ${decl?.name} must be Enum`)
        }
        const ordinal = idl.isStringEnum(decl)
            ? this.ordinalFromEnum(
                this.makeCast(this.makeString(this.getObjectAccessor(convertor, value)), convertor.idlType),
                idl.createReferenceType(this.getNodeName(convertor.nativeType()))
            )
            : this.makeUnionVariantCast(this.getObjectAccessor(convertor, value), this.getNodeName(idl.IDLI32Type), convertor, index)
        const {low, high} = idl.extremumOfOrdinals(decl)
        return this.discriminatorFromExpressions(value, convertor.runtimeTypes[0], [
            this.makeNaryOp(">=", [ordinal, this.makeString(low.toString())]),
            this.makeNaryOp("<=",  [ordinal, this.makeString(high.toString())])
        ])
    }

    override makeSerializerConstructorSignatures(): NamedMethodSignature[] | undefined {
        return [new NamedMethodSignature(idl.IDLVoidType, [], [])]
    }
}
