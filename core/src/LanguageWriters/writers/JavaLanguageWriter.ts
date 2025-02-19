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

import { Language } from '../../Language'
import { IndentedPrinter } from "../../IndentedPrinter";
import {
    AssignStatement,
    CheckOptionalStatement,
    ClassModifier,
    FieldModifier,
    LambdaExpression,
    LanguageExpression,
    LanguageStatement,
    LanguageWriter,
    MakeCastOptions,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature,
    ObjectArgs,
} from "../LanguageWriter"
import {
    CLikeExpressionStatement,
    CLikeLanguageWriter,
    CLikeLoopStatement,
    CLikeReturnStatement
} from "./CLikeLanguageWriter"
import * as idl from '../../idl'
import { ArgConvertor, BaseArgConvertor } from "../ArgConvertors"
import { IdlNameConvertor } from "../nameConvertor"
import { RuntimeType } from "../common";
import { ReferenceResolver } from "../../peer-generation/ReferenceResolver";

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

class JavaLambdaExpression extends LambdaExpression {
    constructor(
        writer: LanguageWriter,
        signature: MethodSignature,
        resolver: ReferenceResolver,
        body?: LanguageStatement[]) {
        super(writer, signature, resolver, body)
    }
    protected get statementHasSemicolon(): boolean {
        return true
    }
    asString(): string {
        const params = this.signature.args.map((it, i) => `${idl.forceAsNamedNode(it).name} ${this.signature.argName(i)}`)
        return `(${params.join(", ")}) -> { ${this.bodyAsString()} }`
    }
}

export class JavaCheckDefinedExpression implements LanguageExpression {
    constructor(private value: string) { }
    asString(): string {
        return `${this.value} != null`
    }
}

export class JavaCastExpression implements LanguageExpression {
    constructor(public value: LanguageExpression, public type: string, private unsafe = false) {}
    asString(): string {
        return `(${this.type})(${this.value.asString()})`
    }
}

////////////////////////////////////////////////////////////////
//                         STATEMENTS                         //
////////////////////////////////////////////////////////////////

export class JavaAssignStatement extends AssignStatement {
    constructor(public variableName: string,
                public type: idl.IDLType | undefined,
                public expression: LanguageExpression,
                public isDeclared: boolean = true,
                protected isConst: boolean = true) {
        super(variableName, type, expression, isDeclared, isConst)
     }
     write(writer: LanguageWriter): void{
        if (this.isDeclared) {
            const typeSpec = this.type ? writer.getNodeName(this.type) : "var"
            writer.print(`${typeSpec} ${this.variableName} = ${this.expression.asString()};`)
        } else {
            writer.print(`${this.variableName} = ${this.expression.asString()};`)
        }
    }
}

class JavaMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private op: () => void) {}
    write(writer: LanguageWriter): void {
        const entryVar = `${this.map}Entry`
        writer.print(`for (var ${entryVar}: ${this.map}.entrySet()) {`)
        writer.pushIndent()
        writer.print(`var ${this.key} = ${entryVar}.getKey();`)
        writer.print(`var ${this.value} = ${entryVar}.getValue();`)
        this.op()
        writer.popIndent()
        writer.print(`}`)
    }
}

////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export class JavaLanguageWriter extends CLikeLanguageWriter {
    protected typeConvertor: IdlNameConvertor
    constructor(printer: IndentedPrinter,
                resolver: ReferenceResolver,
                typeConvertor: IdlNameConvertor) {
        super(printer, resolver, Language.JAVA)
        this.typeConvertor = typeConvertor
    }

    getNodeName(type: idl.IDLNode): string {
        return this.typeConvertor.convert(type)
    }

    fork(options?: { resolver?: ReferenceResolver }): LanguageWriter {
        return new JavaLanguageWriter(new IndentedPrinter(), options?.resolver ?? this.resolver, this.typeConvertor)
    }

    writeClass(name: string, op: (writer: this) => void, superClass?: string, interfaces?: string[], generics?: string[], isDeclared?: boolean, isExport: boolean = true): void {
        let genericsClause = generics?.length ? `<${generics.join(', ')}> ` : ``
        let extendsClause = superClass ? ` extends ${superClass}` : ''
        let implementsClause = interfaces ? ` implements ${interfaces.join(",")}` : ''
        this.printer.print(`${isExport ? 'public ' : ''}class ${name}${genericsClause}${extendsClause}${implementsClause} {`) // TODO check for multiple classes in file
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeInterface(name: string, op: (writer: this) => void, superInterfaces?: string[]): void {
        let extendsClause = superInterfaces ? ` extends ${superInterfaces.join(",")}` : ''
        this.printer.print(`interface ${name}${extendsClause} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable = false): void {
        if (nullable) {
            this.printer.print(`if (${receiver} != null) ${receiver}.${method}(${params.join(", ")});`)
        } else {
            super.writeMethodCall(receiver, method, params, nullable)
        }
    }
    writeFieldDeclaration(name: string, type: idl.IDLType, modifiers: FieldModifier[] | undefined, optional: boolean, initExpr?: LanguageExpression): void {
        let prefix = this.makeFieldModifiersList(modifiers)
        this.printer.print(`${prefix} ${(this.getNodeName(type))} ${name}${initExpr ? ` = ${initExpr.asString()}` : ""};`)
    }
    writeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        this.writeMethodDeclaration(name, signature, [MethodModifier.STATIC, MethodModifier.NATIVE])
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: this) => void, superCall?: Method, modifiers?: MethodModifier[]) {
        this.printer.print(`${modifiers ? modifiers.map((it) => MethodModifier[it].toLowerCase()).join(' ') : ''} ${className}(${signature.args.map((it, index) => `${this.getNodeName(it)} ${signature.argName(index)}`).join(", ")}) {`)
        this.pushIndent()
        if (superCall) {
            this.print(`super(${superCall.signature.args.map((_, i) => superCall?.signature.argName(i)).join(", ")});`)
        }
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeProperty(propName: string, propType: idl.IDLType) {
        throw new Error("writeProperty for Java is not implemented yet.")
    }
    makeAssign(variableName: string, type: idl.IDLType | undefined, expr: LanguageExpression, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
        return new JavaAssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        return new JavaLambdaExpression(this, signature, this.resolver, body)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new CLikeReturnStatement(expr)
    }
    makeCheckOptional(optional: LanguageExpression, doStatement: LanguageStatement): LanguageStatement {
        return new CheckOptionalStatement("null", optional, doStatement)
    }
    makeDefinedCheck(value: string): LanguageExpression {
        return new JavaCheckDefinedExpression(value)
    }
    makeLoop(counter: string, limit: string, statement?: LanguageStatement): LanguageStatement {
        return new CLikeLoopStatement(counter, limit, statement)
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new JavaMapForEachStatement(map, key, value, op)
    }
    makeMapSize(map: string): LanguageExpression {
        return this.makeString(`${map}.size()`)
    }
    makeCast(value: LanguageExpression, type: idl.IDLType, options?: MakeCastOptions): LanguageExpression {
        return new JavaCastExpression(value, this.getNodeName(type), options?.unsafe ?? false)
    }
    makeStatement(expr: LanguageExpression): LanguageStatement {
        return new CLikeExpressionStatement(expr)
    }
    makeUnionSelector(value: string, valueType: string): LanguageStatement {
        return this.makeAssign(valueType, undefined, this.makeMethodCall(value, "getSelector", []), false)
    }
    makeUnionVariantCondition(_convertor: ArgConvertor,
                              _valueName: string,
                              valueType: string,
                              _type: string,
                              convertorIndex: number): LanguageExpression {
        return this.makeString(`${valueType} == ${convertorIndex}`)
    }
    makeUnionVariantCast(value: string, type: string, convertor: ArgConvertor, index: number) {
        return this.makeMethodCall(value, `getValue${index}`, [])
    }
    makeUnionTypeDefaultInitializer() {
        return this.makeString("-1")
    }
    writePrintLog(message: string): void {
        this.print(`System.out.println("${message}")`)
    }
    mapIDLContainerType(type: idl.IDLContainerType): string {
        switch (type.containerKind) {
            case "sequence": return `${this.getNodeName(type.elementType[0])}[]`
        }
        throw new Error(`Unmapped container type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    applyToObject(p: BaseArgConvertor, param: string, value: string, args?: ObjectArgs): LanguageStatement {
        throw new Error("Method not implemented.")
    }
    getObjectAccessor(convertor: ArgConvertor, value: string, args?: ObjectArgs): string {
        return value
    }
    makeUndefined(): LanguageExpression {
        return this.makeString("null")
    }
    makeRuntimeType(rt: RuntimeType): LanguageExpression {
        return this.makeString(`RuntimeType.${RuntimeType[rt]}`)
    }
    makeRuntimeTypeGetterCall(value: string): LanguageExpression {
        return this.makeMethodCall("Ark_Object", "getRuntimeType", [this.makeString(value)])
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        throw new Error("Method not implemented.")
    }
    getTagType(): idl.IDLType {
        throw new Error("Method not implemented.")
    }
    getRuntimeType(): idl.IDLType {
        throw new Error("Method not implemented.")
    }
    makeTupleAssign(receiver: string, tupleFields: string[]): LanguageStatement {
        throw new Error("Method not implemented.")
    }
    get supportedModifiers(): MethodModifier[] {
        return [MethodModifier.PUBLIC, MethodModifier.PRIVATE, MethodModifier.STATIC, MethodModifier.NATIVE]
    }
    get supportedFieldModifiers(): FieldModifier[] {
        return [FieldModifier.PUBLIC, FieldModifier.PRIVATE, FieldModifier.PROTECTED, FieldModifier.STATIC, FieldModifier.FINAL]
    }
    makeArrayInit(type: idl.IDLContainerType, size?:number): LanguageExpression {
        return this.makeString(`new ${this.getNodeName(type.elementType[0])}[${size ?? 0}]`)
    }
    makeClassInit(type: idl.IDLType, paramenters: LanguageExpression[]): LanguageExpression {
        throw new Error("Method not implemented.")
    }
    makeMapInit(type: idl.IDLType): LanguageExpression {
        throw new Error("Method not implemented.")
    }
    makeTupleAccess(value: string, index: number): LanguageExpression {
        return this.makeString(`${value}.value${index}`)
    }
    enumFromOrdinal(value: LanguageExpression, _: idl.IDLType): LanguageExpression {
        throw new Error("Method not implemented.")
    }
    ordinalFromEnum(value: LanguageExpression, _: idl.IDLType): LanguageExpression {
        return this.makeString(`${value.asString()}.value`)
    }
    makeValueFromOption(value: string): LanguageExpression {
        return this.makeString(`${value}`)
    }
    runtimeType(param: ArgConvertor, valueType: string, value: string) {
        this.writeStatement(this.makeAssign(valueType, undefined,
            this.makeRuntimeTypeGetterCall(value), false))
    }
    override makeEnumCast(enumName: string, _unsafe: boolean, _convertor: ArgConvertor | undefined): string {
        return `${enumName}.value`
    }
    override castToBoolean(value: string): string { return value }
    override makeLengthSerializer(serializer: string, value: string): LanguageStatement | undefined {
        return this.makeBlock([
            this.makeStatement(this.makeMethodCall(serializer, "writeInt8", [this.makeRuntimeType(RuntimeType.STRING)])),
            this.makeStatement(this.makeMethodCall(serializer, "writeString", [this.makeString(`${value}.value`)]))
        ], false)
    }
}
