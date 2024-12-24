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

import * as idl from "../../../idl"
import { IDLNumberType, IDLType } from "../../../idl"
import { IndentedPrinter } from "../../../IndentedPrinter"
import { Language } from "../../../Language"
import { CJKeywords } from "../../../languageSpecificKeywords"
import { isDefined } from "../../../util"
import { ArgConvertor, BaseArgConvertor, RuntimeType } from "../../ArgConvertors"
import { EnumConvertor } from "../../ArgConvertors"
import { ReferenceResolver } from "../../ReferenceResolver"
import {
    AssignStatement,
    BranchStatement,
    ExpressionStatement,
    FieldModifier,
    LambdaExpression,
    LanguageExpression,
    LanguageStatement,
    LanguageWriter,
    MakeCastOptions,
    Method,
    MethodModifier,
    MethodSignature,
    ObjectArgs,
    ReturnStatement,
    StringExpression,
    TernaryExpression
} from "../LanguageWriter"
import { IdlNameConvertor } from "../nameConvertor"
import { CJIDLTypeToForeignStringConvertor, CJIDLNodeToStringConvertor } from "../convertors/CJConvertors"

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

class CJLambdaExpression extends LambdaExpression {
    constructor(
        protected writer: LanguageWriter,
        signature: MethodSignature,
        resolver: ReferenceResolver,
        body?: LanguageStatement[]) {
        super(writer, signature, resolver, body)
    }
    protected get statementHasSemicolon(): boolean {
        return false
    }
    asString(): string {
        const params = this.signature.args.map((it, i) => `${this.signature.argName(i)}: ${this.writer.getNodeName(it)}`)
        return `{${params.join(", ")} => ${this.bodyAsString()} }`
    }
}

export class CJCheckDefinedExpression implements LanguageExpression {
    constructor(private value: string) { }
    asString(): string {
        return `${this.value}.isSome()`
    }
}

export class CJCastExpression implements LanguageExpression {
    constructor(public value: LanguageExpression, public type: string, private unsafe = false) {}
    asString(): string {
        return `match (${this.value.asString()} as ${this.type}) { case Some(x) => x; case None => throw Exception("Cast is not succeeded")}`
    }
}

export class CJUnionCastExpression implements LanguageExpression {
    constructor(public value: LanguageExpression, public type: string, private unsafe = false) {}
    asString(): string {
        return `${this.type}(${this.value.asString})`
    }
}

export class CJMatchExpression implements LanguageExpression {
    constructor(public matchValue: LanguageExpression, public matchCases: LanguageExpression[], public caseBlocks: LanguageExpression[]) {}
    asString(): string {
        let output: string[] = []
        output.push(`match (${this.matchValue.asString()}) {`)
        for (let index in this.matchCases) {
            output.push(`case ${this.matchCases[index].asString()} => ${this.caseBlocks[index].asString()} `)
        }
        output.push(`case _ => throw Exception(\"Unmatched pattern ${this.matchValue.asString()}\")`)
        output.push(`}`)
        return output.join('\n')
    }
}

export class CJTernaryExpression implements LanguageExpression {
    constructor(public condition: LanguageExpression,
        public trueExpression: LanguageExpression,
        public falseExpression: LanguageExpression) {}
    asString(): string {
        return `if (${this.condition.asString()}) { ${this.trueExpression.asString()} } else { ${this.falseExpression.asString()} }`
    }
}

////////////////////////////////////////////////////////////////
//                         STATEMENTS                         //
////////////////////////////////////////////////////////////////

export class CJAssignStatement extends AssignStatement {
    constructor(public variableName: string,
        public type: IDLType | undefined,
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
                const constSpec = this.isConst ? "let" : "var"
                const initValue = this.expression ? `= ${this.expression.asString()}` : ""
                writer.print(`${constSpec} ${this.variableName}${typeSpec} ${initValue}`)
            } else {
                writer.print(`${this.variableName} = ${this.expression.asString()}`)
            }
        }
}

class CJLoopStatement implements LanguageStatement {
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

class CJMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private op: () => void) {}
    write(writer: LanguageWriter): void {
        writer.print(`for ((key, value) in ${this.map}) {`)
        writer.pushIndent()
        this.op()
        writer.popIndent()
        writer.print(`}`)
    }
}

export class CJEnumWithGetter implements LanguageStatement {
    constructor(private readonly enumEntity: idl.IDLEnum, private readonly isExport: boolean) {}

    write(writer: LanguageWriter) {
        const initializers = this.enumEntity.elements.map(it => {
            return {name: it.name, id: it.initializer}
        })

        const isStringEnum = initializers.every(it => typeof it.id == 'string')

        let memberValue = 0
        const members: {
            name: string,
            stringId: string | undefined,
            numberId: number,
        }[] = []
        for (const initializer of initializers) {
            if (typeof initializer.id == 'string') {
                members.push({name: initializer.name, stringId: initializer.id, numberId: memberValue})
            }
            else if (typeof initializer.id == 'number') {
                memberValue = initializer.id
                members.push({name: initializer.name, stringId: undefined, numberId: memberValue})
            }
            else {
                members.push({name: initializer.name, stringId: undefined, numberId: memberValue})
            }
            memberValue += 1
        }

        let enumName = this.enumEntity.name
        writer.writeClass(enumName, () => {
            const enumType = idl.createReferenceType(enumName)
            members.forEach(it => {
                writer.writeFieldDeclaration(it.name, enumType, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                    writer.makeString(`${enumName}(${it.numberId})`)
                )
            })

            const value = 'value'
            const intType = idl.IDLI32Type
            writer.writeFieldDeclaration(value, intType, [FieldModifier.PUBLIC, FieldModifier.FINAL], false)

            const signature = new MethodSignature(idl.IDLVoidType, [intType])
            writer.writeConstructorImplementation(enumName, signature, () => {
                writer.writeStatement(
                    writer.makeAssign(value, undefined, writer.makeString(signature.argName(0)), false)
                )
            })
        })
    }
}

export class CJEnumEntityStatement implements LanguageStatement {
    constructor(private readonly enumEntity: idl.IDLEnum, private readonly isExport: boolean) {}

    write(writer: LanguageWriter) {
        writer.print(this.enumEntity.comment)
        writer.print(`${this.isExport ? "public " : ""}enum ${this.enumEntity.name} {`)
        writer.pushIndent()
        this.enumEntity.elements.forEach((member, index) => {
            writer.print(member.comment)
            const varticalBar = index < this.enumEntity.elements.length - 1 ? '|' : ''
            const initValue = member.initializer ? ` = ${member.initializer}` : ``
            writer.print(`${member.name}${initValue}${varticalBar}`)
        })
        writer.popIndent()
        writer.print(`}`)
    }
}

class CJThrowErrorStatement implements LanguageStatement {
    constructor(public message: string) { }
    write(writer: LanguageWriter): void {
        writer.print(`throw Exception("${this.message}")`)
    }
}

class CJCheckOptionalStatement implements LanguageStatement {
    constructor(
        public undefinedValue: string,
        public optionalExpression: LanguageExpression,
        public doStatement: LanguageStatement
    ) { }
    write(writer: LanguageWriter): void {
        writer.print(`if (let Some(${this.optionalExpression.asString()}) <- ${this.optionalExpression.asString()}) {`)
        writer.pushIndent()
        this.doStatement.write(writer)
        writer.popIndent()
        writer.print('}')
    }
}


class CJArrayResizeStatement implements LanguageStatement {
    constructor(private array: string, private arrayType: string, private length: string, private deserializer: string) {}
    write(writer: LanguageWriter) {
        writer.print(`${this.array} = ${this.arrayType}(Int64(${this.length}))`)
    }
}


////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export class CJLanguageWriter extends LanguageWriter {
    protected typeConvertor: IdlNameConvertor
    protected typeForeignConvertor: IdlNameConvertor
    constructor(printer: IndentedPrinter, resolver:ReferenceResolver, language: Language = Language.CJ) {
        super(printer, resolver, language)
        this.typeConvertor = new CJIDLNodeToStringConvertor(this.resolver)
        this.typeForeignConvertor = new CJIDLTypeToForeignStringConvertor(this.resolver)
    }
    fork(options?: { resolver?: ReferenceResolver }): LanguageWriter {
        return new CJLanguageWriter(new IndentedPrinter(), options?.resolver ?? this.resolver)
    }
    getNodeName(type: idl.IDLNode): string {
        return this.typeConvertor.convert(type)
    }

    writeClass(name: string, op: (writer: LanguageWriter) => void, superClass?: string, interfaces?: string[], generics?: string[]): void {
        let extendsClause = superClass ? `${superClass}` : undefined
        let implementsClause = interfaces ? `${interfaces.join(' & ')}` : undefined
        let inheritancePart = [extendsClause, implementsClause]
            .filter(isDefined)
            .join(' & ')
        inheritancePart = inheritancePart.length != 0 ? ' <: '.concat(inheritancePart) : ''
        this.printer.print(`public open class ${name}${inheritancePart} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeEnum(name: string, members: { name: string, stringId: string | undefined, numberId: number }[], op: (writer: LanguageWriter) => void): void {
        this.printer.print(`public enum ${name}{`)
        this.pushIndent()
        for (const member of members) {
            this.print('|'.concat(member.name))
        }
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeInterface(name: string, op: (writer: LanguageWriter) => void, superInterfaces?: string[]): void {
        let extendsClause = superInterfaces ? ` <: ${superInterfaces.join(" & ")}` : ''
        this.printer.print(`interface ${name}${extendsClause} {`)
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
        const args = signature.args.map((it, index) => `${signature.argName(index)}: ${this.getNodeName(it)}`)
        return `public func ${name}(${args.join(", ")})`
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable = false): void {
        receiver = this.escapeKeyword(receiver)
        params = params.map(argName => this.escapeKeyword(argName))
        if (nullable) {
            this.printer.print(`if (let Some(${receiver}) <- ${receiver}) { ${receiver}.${method}(${params.join(", ")}) }`)
        } else {
            super.writeMethodCall(receiver, method, params, nullable)
        }
    }
    writeFieldDeclaration(name: string, type: IDLType, modifiers: FieldModifier[]|undefined, optional: boolean, initExpr?: LanguageExpression): void {
        const init = initExpr != undefined ? ` = ${initExpr.asString()}` : ``
        name = this.escapeKeyword(name)
        let prefix = this.makeFieldModifiersList(modifiers)
        this.printer.print(`${prefix} var ${name}: ${this.getNodeName(type)}${init}`)
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void {
        this.writeDeclaration(name, signature, modifiers)
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void, superCall?: Method, modifiers?: MethodModifier[]) {
        this.printer.print(`${modifiers ? modifiers.map((it) => MethodModifier[it].toLowerCase()).join(' ') + ' ' : ''}${className}(${signature.args.map((it, index) => `${signature.argName(index)}: ${this.getNodeName(it)}`).join(", ")}) {`)
        this.pushIndent()
        if (superCall) {
            this.print(`super(${superCall.signature.args.map((_, i) => superCall?.signature.argName(i)).join(", ")})`)
        }
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeProperty(propName: string, propType: idl.IDLType, mutable?: boolean, getterLambda?: (writer: LanguageWriter) => void, setterLambda?: (writer: LanguageWriter) => void) {
        let shortName = propName.concat("_container")
        if(!getterLambda) {
            this.print(`private var ${shortName}: ${this.getNodeName(propType)}`)
        }
        this.print(`${mutable ? "mut " : ""}prop ${propName}: ${this.getNodeName(propType)} {`)

        this.pushIndent()
        this.print(`get() {`)
        this.pushIndent()
        if (getterLambda) {
            getterLambda(this)
        } else {
            this.print(`return ${shortName}`)
        }
        this.popIndent()
        this.print(`}`)
        if (mutable) {
            this.print(`set(x) { ${shortName} = x }`)
            this.pushIndent()
            if (setterLambda)
                setterLambda(this)
            this.popIndent()
        }
        this.popIndent()
        this.print(`}`)
    }
    writeMethodImplementation(method: Method, op: (writer: LanguageWriter) => void) {
        this.writeDeclaration(method.name, method.signature, method.modifiers, " {")
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeCJForeign(op: (writer: CJLanguageWriter) => void) {
        this.print(`foreign {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.print('}')
    }
    private writeDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[], postfix?: string): void {
        let prefix = modifiers
            ?.filter(it => this.supportedModifiers.includes(it))
            .map(it => this.mapMethodModifier(it)).join(" ")
        prefix = prefix ? prefix + " " : ""
        this.print(`${prefix}func ${name}(${signature.args.map((it, index) => `${signature.argName(index)}: ${this.getNodeName(it)}`).join(", ")}): ${this.getNodeName(signature.returnType)}${postfix ?? ""}`)
    }
    writeNativeFunctionCall(printer: LanguageWriter, name: string, signature: MethodSignature) {
        printer.print(`return unsafe { ${name}(${signature.args.map((it, index) => `${signature.argName(index)}`).join(", ")}) }`)
    }
    writeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        this.print(`func ${name}(${signature.args.map((it, index) => `${this.escapeKeyword(signature.argName(index))}: ${this.typeForeignConvertor.convert(it)}`).join(", ")}): ${this.typeForeignConvertor.convert(signature.returnType)}`)
    }
    override makeEnumCast(enumName: string, _unsafe: boolean, _convertor: EnumConvertor | undefined): string {
        // TODO: remove after switching to IDL
        return `${enumName}.getIntValue()`
    }
    makeAssign(variableName: string, type: IDLType | undefined, expr: LanguageExpression, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
        return new CJAssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeClassInit(type: idl.IDLType, paramenters: LanguageExpression[]): LanguageExpression {
        throw new Error(`makeClassInit`)
    }
    makeArrayInit(type: idl.IDLContainerType, size?:number): LanguageExpression {
        return this.makeString(`ArrayList<${this.getNodeName(type.elementType[0])}>(${size ?? ''})`)
    }
    makeMapInit(type: idl.IDLType): LanguageExpression {
        throw new Error(`TBD`)
    }
    makeArrayLength(array: string, length?: string): LanguageExpression {
        return this.makeString(`${array}.size`)
    }
    makeArrayResize(array: string, arrayType: string, length: string, deserializer: string): LanguageStatement {
        return new CJArrayResizeStatement(array, arrayType, length, deserializer)
    }
    override makeArrayAccess(value: string, indexVar: string) {
        return this.makeString(`${value}[Int64(${indexVar})]`)
    }
    makeRuntimeTypeCondition(typeVarName: string, equals: boolean, type: RuntimeType, varName: string): LanguageExpression {
        if (varName) {
            varName = this.escapeKeyword(varName)
            return this.makeString(`let Some(${varName}) <- ${varName}`)
        } else {
            const op = equals ? "==" : "!="
            return this.makeNaryOp(op, [this.makeRuntimeType(type), this.makeString(`Int32(${typeVarName})`)])
        }
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        return new CJLambdaExpression(this, signature, this.resolver, body)
    }
    makeThrowError(message: string): LanguageStatement {
        return new CJThrowErrorStatement(message)
    }
    makeTernary(condition: LanguageExpression, trueExpression: LanguageExpression, falseExpression: LanguageExpression): LanguageExpression {
        return new CJTernaryExpression(condition, trueExpression, falseExpression)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new ReturnStatement(expr)
    }
    makeCheckOptional(optional: LanguageExpression, doStatement: LanguageStatement): LanguageStatement {
        return new CJCheckOptionalStatement("undefined", optional, doStatement)
    }
    makeStatement(expr: LanguageExpression): LanguageStatement {
        return new ExpressionStatement(expr)
    }
    makeLoop(counter: string, limit: string, statement?: LanguageStatement): LanguageStatement {
        return new CJLoopStatement(counter, limit, statement)
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new CJMapForEachStatement(map, key, value, op)
    }
    makeDefinedCheck(value: string): LanguageExpression {
        return new CJCheckDefinedExpression(value)
    }
    writePrintLog(message: string): void {
        this.print(`println("${message}")`)
    }
    makeCast(value: LanguageExpression, type: IDLType, options?:MakeCastOptions): LanguageExpression {
        return new CJCastExpression(value, this.getNodeName(type), options?.unsafe ?? false)
    }
    getObjectAccessor(convertor: BaseArgConvertor, value: string, args?: ObjectArgs): string {
        return `${value}`
    }
    makeUndefined(): LanguageExpression {
        return this.makeString("Option.None")
    }
    override makeUnwrapOptional(expression: LambdaExpression): LanguageExpression {
        return new CJMatchExpression(expression, [this.makeString('Some(serializer)')], [this.makeString('serializer')])
    }
    makeValueFromOption(value: string, destinationConvertor: ArgConvertor): LanguageExpression {
        return this.makeString(`${value}`)
    }
    makeRuntimeType(rt: RuntimeType): LanguageExpression {
        return this.makeString(`RuntimeType.${RuntimeType[rt]}.ordinal`)
    }
    makeRuntimeTypeGetterCall(value: string): LanguageExpression {
        let methodCall = this.makeMethodCall("Ark_Object", "getRuntimeType", [this.makeString(value)])
        return this.makeString(methodCall.asString() + '.ordinal')
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        return this.makeStatement(this.makeMethodCall(keyAccessor, "set", [this.makeString(key), this.makeString(value)]))
    }
    makeNull(value?: string): LanguageExpression {
        return new StringExpression(`None<${value}>`)
    }
    getTagType(): IDLType {
        return idl.createReferenceType("Tags")
    }
    getRuntimeType(): IDLType {
        return IDLNumberType
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
    makeUnionSelector(value: string, valueType: string): LanguageStatement {
        return this.makeAssign(valueType, undefined, this.makeMethodCall(value, "getSelector", []), false)
    }
    makeUnionVariantCondition(_convertor: ArgConvertor, _valueName: string, valueType: string, type: string, index?: number): LanguageExpression {
        return this.makeString(`${valueType} == ${index}`)
    }
    makeUnionVariantCast(value: string, type: string, convertor: ArgConvertor, index: number) {
        return this.makeMethodCall(value, `getValue${index}`, [])
    }
    makeTupleAccess(value: string, index: number): LanguageExpression {
        return this.makeString(`${value}.value${index}`)
    }
    enumFromOrdinal(value: LanguageExpression, enumEntry: idl.IDLType): LanguageExpression {
        return this.makeString(`${this.getNodeName(enumEntry)}(${value.asString()})`)
    }
    ordinalFromEnum(value: LanguageExpression, _: idl.IDLType): LanguageExpression {
        return this.makeString(`Int32(${value.asString()}.value)`)
    }
    makeEnumEntity(enumEntity: idl.IDLEnum, isExport: boolean): LanguageStatement {
        return new CJEnumWithGetter(enumEntity, isExport)
        return new CJEnumEntityStatement(enumEntity, isExport)
    }
    makeEquals(args: LanguageExpression[]): LanguageExpression {
        return this.makeNaryOp('==', args)
    }
    runtimeType(param: ArgConvertor, valueType: string, value: string) {
        this.writeStatement(this.makeAssign(valueType, undefined,
            this.makeRuntimeTypeGetterCall(value), false))
    }
    escapeKeyword(word: string): string {
        return CJKeywords.has(word) ? word + "_" : word
    }
    override castToInt(value: string, bitness: 8|32): string {
        return `Int${bitness}(${value})`
    }
    override castToBoolean(value: string): string {
        return `if (${value}) { Int32(1) } else { Int32(0) }`
    }
    override makeLengthSerializer(serializer: string, value: string): LanguageStatement | undefined {
        return this.makeBlock([
            this.makeStatement(this.makeMethodCall(serializer, "writeInt8", [this.makeRuntimeType(RuntimeType.STRING)])),
            this.makeStatement(this.makeMethodCall(serializer, "writeString", [this.makeString(`${value}.getValue1()`)]))
        ], false)
    }
    override makeLengthDeserializer(deserializer: string): LanguageStatement | undefined {
        const valueType = "valueType"

        return this.makeBlock([
            this.makeAssign(valueType, undefined, this.makeMethodCall(deserializer, "readInt8", []), true),

            this.makeMultiBranchCondition(
                [{
                    expr: this.makeRuntimeTypeCondition(valueType, true, RuntimeType.NUMBER, ''),
                    stmt: this.makeReturn(this.makeString(`Ark_Length(${deserializer}.readFloat32())`))
                },
                {
                    expr: this.makeRuntimeTypeCondition(valueType, true, RuntimeType.STRING, ''),
                    stmt: this.makeReturn(this.makeString(`Ark_Length(${deserializer}.readString())`))
                },
                {
                    expr: this.makeRuntimeTypeCondition(valueType, true, RuntimeType.OBJECT, ''),
                    stmt: this.makeReturn(this.makeString(`Ark_Length(Resource(${deserializer}.readString(), "", 0.0, Option.None, Option.None))`))
                }],
                this.makeReturn(this.makeUndefined())
            ),
        ], false)
    }
}
