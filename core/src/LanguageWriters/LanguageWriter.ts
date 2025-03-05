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

import { Language } from "../Language"
import { IndentedPrinter } from "../IndentedPrinter"

import * as idl from "../idl"
import { indentedBy, stringOrNone } from "../util";
import * as fs from "fs"
import { NativeModuleType, RuntimeType } from "./common"
import { ArgConvertor } from "./ArgConvertors";
import { ReferenceResolver } from "../peer-generation/ReferenceResolver";

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

export interface LanguageExpression {
    asString(): string
}

export class TernaryExpression implements LanguageExpression {
    constructor(public condition: LanguageExpression,
        public trueExpression: LanguageExpression,
        public falseExpression: LanguageExpression) {}
    asString(): string {
        return `(${this.condition.asString()}) ? (${this.trueExpression.asString()}) : (${this.falseExpression.asString()})`
    }
}

export class NaryOpExpression implements LanguageExpression {
    constructor(public op: string, public args: LanguageExpression[]) { }
    asString(): string {
        if (this.args.length === 1) return this.args[0].asString()
        return `${this.args.map(arg => `(${arg.asString()})`).join(` ${this.op} `)}`
    }
}

export class StringExpression implements LanguageExpression {
    constructor(public value: string) { }
    asString(): string {
        return this.value
    }
}

export class NewObjectExpression implements LanguageExpression {
    constructor(
        private objectName: string,
        private params: LanguageExpression[]) { }
    asString(): string {
        return `new ${this.objectName}(${this.params.map(it => it.asString()).join(", ")})`
    }
}

export class FunctionCallExpression implements LanguageExpression {
    constructor(
        private name: string,
        private params: LanguageExpression[]) { }
    asString(): string {
        return `${this.name}(${this.params.map(it => it.asString()).join(", ")})`
    }
}

export class MethodCallExpression extends FunctionCallExpression {
    constructor(
        public receiver: string,
        method: string,
        params: LanguageExpression[],
        public nullable = false)
    {
        super(method, params)
    }
    asString(): string {
        return `${this.receiver}${this.nullable ? "?" : ""}.${super.asString()}`
    }
}

export class FieldAccessExpression  {
    constructor(
        public receiver: string,
        public field: string,
        public nullable = false)
    { }
    asString(): string {
        return `${this.receiver}${this.nullable ? "?" : ""}.${this.field}`
    }
}


export class CheckDefinedExpression implements LanguageExpression {
    constructor(private value: string) { }
    asString(): string {
        return `${this.value} != undefined`
    }
}

////////////////////////////////////////////////////////////////
//                         STATEMENTS                         //
////////////////////////////////////////////////////////////////

export interface LanguageStatement {
    write(writer: LanguageWriter): void
}

export class ProxyStatement implements LanguageStatement {
    constructor(private cb: (writer: LanguageWriter) => void) {}

    write(writer: LanguageWriter): void {
        this.cb(writer)
    }
}

export class AssignStatement implements LanguageStatement {
    constructor(public variableName: string,
                public type: idl.IDLType | undefined,
                public expression: LanguageExpression | undefined,
                public isDeclared: boolean = true,
                protected isConst: boolean = true,
                protected options?: MakeAssignOptions) {}
    write(writer: LanguageWriter): void {
        if (this.isDeclared) {
            const typeSpec =
                this.options?.overrideTypeName
                    ? `: ${this.options.overrideTypeName}`
                    : this.type
                        ? `: ${writer.getNodeName(this.type)}${/*SHOULD BE REMOVED*/idl.isOptionalType(this.type) ? "|undefined" : ""}`
                        : ""
            const initValue = this.expression ? `= ${this.expression.asString()}` : ""
            const constSpec = this.isConst ? "const" : "let"
            writer.print(`${constSpec} ${this.variableName}${typeSpec} ${initValue}`)
        } else {
            writer.print(`${this.variableName} = ${this.expression?.asString()}`)
        }
    }
}

export class ExpressionStatement implements LanguageStatement {
    constructor(public expression: LanguageExpression) { }
    write(writer: LanguageWriter): void {
        const text = this.expression.asString()
        if (text.length > 0) {
            writer.print(`${this.expression.asString()}${writer.maybeSemicolon()}`)
        }
    }
}

export class BlockStatement implements LanguageStatement {
    constructor(public statements: LanguageStatement[], private inScope: boolean = true) { }
    write(writer: LanguageWriter): void {
        if (this.inScope) {
            writer.print("{")
            writer.pushIndent()
        }
        this.statements.forEach(s => s.write(writer))
        if (this.inScope) {
            writer.popIndent()
            writer.print("}")
        }
    }
}

export class IfStatement implements LanguageStatement {
    constructor(public condition: LanguageExpression,
        public thenStatement: LanguageStatement,
        public elseStatement: LanguageStatement | undefined,
        public insideIfOp: (() => void) | undefined,
        public insideElseOp: (() => void) | undefined
    ) { }
    write(writer: LanguageWriter): void {
        writer.print(`if (${this.condition.asString()})`)
        this.writeBody(writer, this.thenStatement, () => {
            if (this.insideIfOp) { this.insideIfOp!() }
        })
        if (this.elseStatement !== undefined) {
            writer.print("else")
            this.writeBody(writer, this.elseStatement, () => {
                if (this.insideElseOp) { this.insideElseOp!() }
            })
        }
    }

    writeBody(writer: LanguageWriter, body:LanguageStatement, op: () => void) {
        if (!(body instanceof BlockStatement)) {
            writer.pushIndent()
        }
        body.write(writer)
        op()
        if (!(body instanceof BlockStatement)) {
            writer.popIndent()
        }
    }
}

export type BranchStatement = {expr: LanguageExpression, stmt: LanguageStatement}

export class MultiBranchIfStatement implements LanguageStatement {
    constructor(private readonly statements: BranchStatement[],
                private readonly elseStatement: LanguageStatement | undefined) { }
    write(writer: LanguageWriter): void {
        this.statements.forEach((value, index) => {
            const {expr, stmt}= value
            if (index == 0) {
                writer.print(`if (${expr.asString()}) {`)
            } else {
                writer.print(`else if (${expr.asString()}) {`)
            }
            writer.pushIndent()
            stmt.write(writer)
            writer.popIndent()
            writer.print("}")
        })

        if (this.statements.length > 0 && this.elseStatement !== undefined) {
            writer.print("else {")
            writer.pushIndent()
            this.elseStatement.write(writer)
            writer.popIndent()
            writer.print("}")
        }
    }
}

export class CheckOptionalStatement implements LanguageStatement {
    constructor(
        public undefinedValue: string,
        public optionalExpression: LanguageExpression,
        public doStatement: LanguageStatement
    ) { }
    write(writer: LanguageWriter): void {
        writer.print(`if (${this.optionalExpression.asString()} != ${this.undefinedValue})`)
        writer.pushIndent()
        this.doStatement.write(writer)
        writer.popIndent()
    }
}

// maybe rename or move of fix
export class TsEnumEntityStatement implements LanguageStatement {
    constructor(private readonly enumEntity: idl.IDLEnum, private readonly isExport: boolean) {}
    write(writer: LanguageWriter): void {
        // writer.print(this.enumEntity.comment)
        idl.getNamespacesPathFor(this.enumEntity).forEach(it => writer.pushNamespace(it.name))
        writer.print(`${this.isExport ? "export " : ""}enum ${this.enumEntity.name} {`)
        writer.pushIndent()
        this.enumEntity.elements.forEach((member, index) => {
            // writer.print(member.comment)
            const initValue = member.initializer
                ? ` = ${this.maybeQuoted(member.initializer)}` : ``
            writer.print(`${member.name}${initValue},`)

            let originalName = idl.getExtAttribute(member, idl.IDLExtendedAttributes.OriginalEnumMemberName)
            if (originalName) {
                const initValue = ` = ${member.name}`
                writer.print(`${originalName}${initValue},`)
            }
        })
        writer.popIndent()
        writer.print(`}`)
        idl.getNamespacesPathFor(this.enumEntity).forEach(it => writer.popNamespace())
    }

    private maybeQuoted(value: string|number): string {
        if (typeof value == "string")
            return `"${value}"`
        else
            return `${value}`
    }
 }

export class ReturnStatement implements LanguageStatement {
    constructor(public expression?: LanguageExpression) { }
    write(writer: LanguageWriter): void {
        writer.print(this.expression ? `return ${this.expression.asString()}` : "return")
    }
}

export abstract class LambdaExpression implements LanguageExpression {
    constructor(
        private originalWriter: LanguageWriter,
        protected signature: MethodSignature,
        protected resolver: ReferenceResolver,
        private body?: LanguageStatement[]) { }

    protected abstract get statementHasSemicolon(): boolean
    abstract asString(): string

    bodyAsString(): string {
        const writer = this.originalWriter.fork()
        if (this.body) {
            for (const stmt of this.body) {
                stmt.write(writer)
            }
        }

        return (this.body ? this.body?.length > 1 ? '\n' : '' : '').concat(writer.getOutput()
            .filter(line => line !== "")
            .map(line => indentedBy(line.endsWith('{') || line.endsWith('}') || line.endsWith(';') ? line : `${line};`, 1))
            .join("\n"))
    }
}


////////////////////////////////////////////////////////////////
//                         SIGNATURES                         //
////////////////////////////////////////////////////////////////

export enum FieldModifier {
    READONLY,
    PRIVATE,
    PUBLIC,
    STATIC,
    PROTECTED,
    FINAL,
    VOLATILE,
    INTERNAL,
}

export enum MethodModifier {
    PUBLIC,
    PRIVATE,
    PROTECTED,
    STATIC,
    NATIVE,
    INLINE,
    GETTER,
    SETTER,
    THROWS,
    FREE, // not a member of interface/class
}

export enum ClassModifier {
    PUBLIC,
    PRIVATE,
    PROTECTED
}

export class Field {
    constructor(
        public name: string,
        public type: idl.IDLType,
        public modifiers: FieldModifier[] = []
    ) {}
}

export class Method {
    constructor(
        public name: string,
        public signature: MethodSignature,
        public modifiers: MethodModifier[]|undefined = undefined,
        public generics?: string[],
    ) {}
}

export class PrintHint {
    private constructor(
        public hint: string
    ) {}

    static AsPointer = new PrintHint('AsPointer')
    static AsConstPointer = new PrintHint('AsConstPointer')
    static AsValue = new PrintHint('AsValue')
    static AsConstReference = new PrintHint('AsConstReference')
}

type MethodArgPrintHintOrNone = PrintHint | undefined

export class MethodSignature {
    constructor(
        public returnType: idl.IDLType,
        public args: idl.IDLType[],
        public defaults: stringOrNone[]|undefined = undefined,
        public printHints?: MethodArgPrintHintOrNone[],
        public argNames?: string[]
    ) {}

    argName(index: number): string {
        return this?.argNames?.at(index) ?? `arg${index}`
    }
    argDefault(index: number): string|undefined {
        return this.defaults?.[index]
    }
    retHint(): PrintHint | undefined {
        return this.printHints?.[0]
    }
    argHint(index: number): PrintHint | undefined {
        return this.printHints?.[index + 1]
    }

    toString(): string {
        return `${this.args.map(it => idl.forceAsNamedNode(it).name)} => ${this.returnType}`
    }
}

export class NamedMethodSignature extends MethodSignature {
    constructor(
        returnType: idl.IDLType,
        args: idl.IDLType[] = [],
        public argsNames: string[] = [],
        defaults: stringOrNone[]|undefined = undefined,
        printHints?: MethodArgPrintHintOrNone[]
    ) {
        super(returnType, args, defaults, printHints)
    }

    static make(returnType: idl.IDLType, args: {name: string, type: idl.IDLType}[]): NamedMethodSignature {
        return new NamedMethodSignature(returnType, args.map(it => it.type), args.map(it => it.name))
    }

    argName(index: number): string {
        return this.argsNames[index]
    }
}

export interface ObjectArgs {
    [name: string]: string
}

export interface PrinterLike {
    getOutput(): string[]
}

////////////////////////////////////////////////////////////////
//                    LANGUAGE WRITER                         //
////////////////////////////////////////////////////////////////

export abstract class LanguageWriter {
    protected namespaceStack: string[] = []
    constructor(
        public printer: IndentedPrinter,
        public resolver: ReferenceResolver, // TODO make protected again (or better rework LWs)
        public language: Language,
    ) {}

    indentDepth(): number {
        return this.printer.indentDepth()
    }

    maybeSemicolon() { return ";" }

    abstract writeClass(name: string, op: (writer: this) => void, superClass?: string, interfaces?: string[], generics?: string[], isDeclared?: boolean, isExport?: boolean): void
    abstract writeEnum(name: string, members: { name: string, alias?: string, stringId: string | undefined, numberId: number }[], op?: (writer: this) => void): void
    abstract writeInterface(name: string, op: (writer: this) => void, superInterfaces?: string[], generics?: string[], isDeclared?: boolean): void
    abstract writeFieldDeclaration(name: string, type: idl.IDLType, modifiers: FieldModifier[]|undefined, optional: boolean, initExpr?: LanguageExpression): void
    abstract writeFunctionDeclaration(name: string, signature: MethodSignature): void
    abstract writeFunctionImplementation(name: string, signature: MethodSignature, op: (writer: this) => void): void
    abstract writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void
    abstract writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: this) => void, superCall?: Method, modifiers?: MethodModifier[]): void
    abstract writeMethodImplementation(method: Method, op: (writer: this) => void): void
    abstract writeProperty(propName: string, propType: idl.IDLType, mutable?: boolean, getterLambda?: (writer: this) => void, setterLambda?: (writer: this) => void): void
    abstract writeTypeDeclaration(decl: idl.IDLTypedef): void
    abstract writeConstant(constName: string, constType: idl.IDLType, constVal?: string): void;
    abstract makeAssign(variableName: string, type: idl.IDLType | undefined, expr: LanguageExpression | undefined, isDeclared: boolean, isConst?: boolean, options?:MakeAssignOptions): LanguageStatement
    abstract makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression
    abstract makeThrowError(message: string): LanguageStatement
    abstract makeReturn(expr?: LanguageExpression): LanguageStatement
    abstract makeCheckOptional(optional: LanguageExpression, doStatement: LanguageStatement): LanguageStatement
    abstract makeRuntimeType(rt: RuntimeType): LanguageExpression
    abstract getObjectAccessor(convertor: ArgConvertor, value: string, args?: ObjectArgs): string
    abstract makeCast(value: LanguageExpression, type: idl.IDLType, options?:MakeCastOptions): LanguageExpression
    // version of makeCast which uses TypeCheck.typeCast<T>(value) call for ETS language writer
    // Use it only if TypeChecker class is added as import to the generated file
    makeTypeCast(value: LanguageExpression, type: idl.IDLType, options?: MakeCastOptions): LanguageExpression {
        return this.makeCast(value, type, options)
    }
    abstract writePrintLog(message: string): void
    abstract makeUndefined(): LanguageExpression
    makeUnwrapOptional(expression: LanguageExpression): LanguageExpression {
        return expression
    }
    abstract makeArrayInit(type: idl.IDLContainerType, size?:number|string): LanguageExpression
    abstract makeClassInit(type: idl.IDLType, paramenters: LanguageExpression[]): LanguageExpression
    abstract makeMapInit(type: idl.IDLType): LanguageExpression
    abstract makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement
    abstract makeLoop(counter: string, limit: string): LanguageStatement
    abstract makeLoop(counter: string, limit: string, statement: LanguageStatement): LanguageStatement
    abstract makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement
    // No need for these two.
    abstract getTagType(): idl.IDLType
    abstract getRuntimeType(): idl.IDLType
    abstract makeTupleAssign(receiver: string, tupleFields: string[]): LanguageStatement
    abstract get supportedModifiers(): MethodModifier[]
    abstract get supportedFieldModifiers(): FieldModifier[]
    abstract enumFromOrdinal(value: LanguageExpression, enumEntry: idl.IDLType): LanguageExpression
    abstract ordinalFromEnum(value: LanguageExpression, enumReference: idl.IDLType): LanguageExpression
    abstract makeEnumCast(enumName: string, unsafe: boolean, convertor: ArgConvertor | undefined): string
    abstract getNodeName(type: idl.IDLNode): string
    abstract fork(options?: { resolver?: ReferenceResolver }): LanguageWriter

    concat(other: PrinterLike): this {
        other.getOutput().forEach(it => this.print(it))
        return this
    }
    printTo(file: string): void {
        fs.writeFileSync(file, this.getOutput().join("\n"))
    }
    writeLines(lines: string): void {
        lines.split("\n").forEach(it => this.print(it))
    }
    writeGetterImplementation(method: Method, op: (writer: this) => void): void {
        this.writeMethodImplementation(new Method(method.name, method.signature, [MethodModifier.GETTER].concat(method.modifiers ?? [])), op)
    }
    writeSetterImplementation(method: Method, op: (writer: this) => void): void {
        this.writeMethodImplementation(new Method(method.name, method.signature, [MethodModifier.SETTER].concat(method.modifiers ?? [])), op)
    }
    writeSuperCall(params: string[]): void {
        this.printer.print(`super(${params.join(", ")})${this.maybeSemicolon()}`)
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable = false): void {
        this.printer.print(`${receiver}${nullable ? "?" : ""}.${method}(${params.join(", ")})`)
    }
    writeStatement(stmt: LanguageStatement) {
        stmt.write(this)
    }
    writeStatements(...statements: LanguageStatement[]) {
        statements.forEach(it => this.writeStatement(it))
    }
    writeExpressionStatement(smth: LanguageExpression) {
        this.writeStatement(new ExpressionStatement(smth))
    }
    writeExpressionStatements(...statements: LanguageExpression[]) {
        statements.forEach(it => this.writeExpressionStatement(it))
    }
    writeStaticBlock(op: (writer: this) => void) {
        this.print("static {")
        this.pushIndent()
        op(this)
        this.popIndent()
        this.print("}")
    }
    makeRef(type: idl.IDLType, _options?: MakeRefOptions): idl.IDLType {
        return type
    }
    makeThis(): LanguageExpression {
        return new StringExpression("this")
    }
    makeNull(value?: string): LanguageExpression {
        return new StringExpression("null")
    }
    makeVoid(): LanguageExpression {
        return this.makeUndefined()
    }
    makeRuntimeTypeCondition(typeVarName: string, equals: boolean, type: RuntimeType, varName?: string): LanguageExpression {
        const op = equals ? "==" : "!="
        return this.makeNaryOp(op, [this.makeRuntimeType(type), this.makeString(typeVarName)])
    }
    makeValueFromOption(value: string, destinationConvertor: ArgConvertor): LanguageExpression {
        return this.makeString(`${value}!`)
    }
    makeNewObject(objectName: string, params: LanguageExpression[] = []): LanguageExpression {
        return new NewObjectExpression(objectName, params)
    }
    makeFunctionCall(name: string | LanguageExpression, params: LanguageExpression[]): LanguageExpression {
        if (typeof name === "string") {
        return new FunctionCallExpression(name, params)
    }
        return new FunctionCallExpression(name.asString(), params)
    }
    makeMethodCall(receiver: string, method: string, params: LanguageExpression[], nullable?: boolean): LanguageExpression {
        return new MethodCallExpression(receiver, method, params, nullable)
    }
    makeFieldAccess(receiver: string, method: string, nullable?: boolean): LanguageExpression {
        return new FieldAccessExpression(receiver, method, nullable)
    }
    makeNativeCall(nativeModule: NativeModuleType, method: string, params: LanguageExpression[], nullable?: boolean): LanguageExpression {
        return new MethodCallExpression(this.nativeReceiver(nativeModule), method, params, nullable)
    }
    makeBlock(statements: LanguageStatement[], inScope: boolean = true) {
        return new BlockStatement(statements, inScope)
    }
    nativeReceiver(nativeModule: NativeModuleType): string {
        return nativeModule.name
    }
    makeDefinedCheck(value: string): LanguageExpression {
        return new CheckDefinedExpression(value)
    }
    makeRuntimeTypeDefinedCheck(runtimeType: string): LanguageExpression {
        return this.makeRuntimeTypeCondition(runtimeType, false, RuntimeType.UNDEFINED)
    }
    makeCondition(condition: LanguageExpression, thenStatement: LanguageStatement, elseStatement?: LanguageStatement, insideIfOp?: () => void, insideElseOp?: () => void): LanguageStatement {
        return new IfStatement(condition, thenStatement, elseStatement, insideIfOp, insideElseOp)
    }
    makeMultiBranchCondition(conditions: BranchStatement[], elseStatement?: LanguageStatement): LanguageStatement {
        return new MultiBranchIfStatement(conditions, elseStatement)
    }
    makeTernary(condition: LanguageExpression, trueExpression: LanguageExpression, falseExpression: LanguageExpression): LanguageExpression {
        return new TernaryExpression(condition, trueExpression, falseExpression)
    }
    makeArrayLength(array: string, length?: string): LanguageExpression {
        return this.makeString(`${array}.length`)
    }
    makeArrayAccess(value: string, indexVar: string) {
        return this.makeString(`${value}[${indexVar}]`)
    }
    makeTupleAccess(value: string, index: number): LanguageExpression {
        return this.makeString(`${value}[${index}]`)
    }
    makeUnionSelector(value: string, valueType: string): LanguageStatement {
        return this.makeAssign(valueType, undefined, this.makeString(`runtimeType(${value})`), false)
    }
    makeUnionVariantCondition(_convertor: ArgConvertor, _valueName: string, valueType: string, type: string,
                              _convertorIndex?: number,
                              _runtimeTypeIndex?: number): LanguageExpression {
        return this.makeString(`RuntimeType.${type.toUpperCase()} == ${valueType}`)
    }
    makeUnionVariantCast(value: string, type: string, convertor: ArgConvertor, index?: number): LanguageExpression {
        return this.makeString(`unsafeCast<${type}>(${value})`)
    }
    makeUnionTypeDefaultInitializer() {
        return this.makeRuntimeType(RuntimeType.UNDEFINED)
    }
    makeRuntimeTypeGetterCall(value: string): LanguageExpression {
        return this.makeFunctionCall("runtimeType", [ this.makeString(value) ])
    }
    makeArrayResize(array: string, arrayType: string, length: string, deserializer: string): LanguageStatement {
        return new ExpressionStatement(new StringExpression(""))
    }
    makeMapResize(mapTypeName: string, keyType: idl.IDLType, valueType: idl.IDLType, map: string, size: string, deserializer: string): LanguageStatement {
        return new ExpressionStatement(new StringExpression("// TODO: TS map resize"))
    }
    makeMapSize(map: string): LanguageExpression {
        return this.makeString(`${map}.size`)
    }
    makeTupleAlloc(option: string): LanguageStatement {
        return new ExpressionStatement(new StringExpression(""))
    }
    makeSetUnionSelector(value: string, index: string): LanguageStatement {
        // empty expression
        return new ExpressionStatement(new StringExpression(""))
    }
    makeSetOptionTag(value: string, tag: LanguageExpression): LanguageStatement {
        // empty expression
        return new ExpressionStatement(new StringExpression(""))
    }
    makeString(value: string): LanguageExpression {
        return new StringExpression(value)
    }
    makeNaryOp(op: string, args: LanguageExpression[]): LanguageExpression {
        return new NaryOpExpression(op, args)
    }
    makeStatement(expr: LanguageExpression): LanguageStatement {
        return new ExpressionStatement(expr)
    }
    writeNativeMethodDeclaration(name: string, signature: MethodSignature, isNative?: boolean): void {
        this.writeMethodDeclaration(name, signature)
    }
    writeUnsafeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        return
    }
    pushIndent() {
        this.printer.pushIndent()
    }
    popIndent() {
        this.printer.popIndent()
    }
    print(string: stringOrNone) {
        this.printer.print(string)
    }
    getOutput(): string[] {
        return this.printer.getOutput()
    }
    makeSignature(returnType: idl.IDLType, parameters: idl.IDLParameter[]): MethodSignature {
        return new MethodSignature(returnType,
            parameters.map(it => it.type!))
    }
    makeNamedSignature(returnType: idl.IDLType, parameters: idl.IDLParameter[]): NamedMethodSignature {
        return NamedMethodSignature.make(
            returnType,
            parameters.map(it => ({
                name: it.name,
                type:  it.isOptional ? idl.createOptionalType(it.type!) : it.type!
            }))
        )
    }
    makeNativeMethodNamedSignature(returnType: idl.IDLType, parameters: idl.IDLParameter[]): NamedMethodSignature {
        return this.makeNamedSignature(returnType, parameters)
    }
    makeSerializerConstructorSignatures(): NamedMethodSignature[] | undefined {
        return undefined
    }
    mapFieldModifier(modifier: FieldModifier): string {
        return `${FieldModifier[modifier].toLowerCase()}`
    }
    mapMethodModifier(modifier: MethodModifier): string {
        return `${MethodModifier[modifier].toLowerCase()}`
    }
    /**
     * TODO: replace me with {@link makeUnsafeCast_}
     */
    makeUnsafeCast(convertor: ArgConvertor, param: string): string {
        return `unsafeCast<int32>(${param})`
    }
    makeUnsafeCast_(value: LanguageExpression, type: idl.IDLType, typeOptions?: PrintHint) {
        return `(${value.asString()} as ${this.getNodeName(type)})`
    }
    runtimeType(param: ArgConvertor, valueType: string, value: string) {
        this.writeStatement(this.makeAssign(valueType, idl.IDLI32Type,
            this.makeFunctionCall("runtimeType", [this.makeString(value)]), false))
    }
    makeDiscriminatorFromFields(convertor: {targetType: (writer: LanguageWriter) => string}, value: string, accessors: string[], duplicates: Set<string>): LanguageExpression {
        return this.makeString(`(${this.makeNaryOp("||",
            accessors.map(it => this.makeString(`${value}!.hasOwnProperty("${it}")`))).asString()})`)
    }
    makeIsTypeCall(value: string, decl: idl.IDLInterface): LanguageExpression {
        return this.makeString(`is${decl.name}(${value})`)
    }
    makeEnumEntity(enumEntity: idl.IDLEnum, isExport: boolean): LanguageStatement {
        return new TsEnumEntityStatement(enumEntity, isExport)
    }
    makeFieldModifiersList(modifiers: FieldModifier[] | undefined, customFieldFilter?: (field :FieldModifier) => boolean) : string {
        let allowedModifiers = this.supportedFieldModifiers
        let modifierFilter = customFieldFilter ? customFieldFilter : function(field: FieldModifier) {
            return allowedModifiers.includes(field)
        }
        let prefix = modifiers
            ?.filter(modifierFilter)
            .map(it => this.mapFieldModifier(it)).join(" ")
        return prefix ? prefix : ""
    }
    escapeKeyword(keyword: string): string {
        return keyword
    }
    makeCastCustomObject(customName: string, _isGenericType: boolean): LanguageExpression {
        return this.makeString(customName)
    }
    makeHasOwnProperty(value: string,
                       _valueTypeName: string,
                       property: string,
                       propertyTypeName?: string): LanguageExpression {
        const expressions = [this.makeString(`${value}.hasOwnProperty("${property}")`)]
        if (propertyTypeName) {
            expressions.push(this.makeString(`isInstanceOf("${propertyTypeName}", ${value}.${property})`))
        }
        return this.makeNaryOp("&&", expressions)
    }
    discriminatorFromExpressions(value: string,
                                 runtimeType: RuntimeType,
                                 exprs: LanguageExpression[]): LanguageExpression {
        return this.makeNaryOp("&&", [
            this.makeNaryOp("==", [this.makeRuntimeType(runtimeType), this.makeString(`${value}_type`)]),
            ...exprs
        ])
    }
    makeDiscriminatorConvertor(_convertor: ArgConvertor, _value: string, _index: number): LanguageExpression | undefined {
        return undefined
    }
    makeNot(expr: LanguageExpression): LanguageExpression {
        return this.makeString(`!(${expr.asString()})`)
    }
    makeEquals(args: LanguageExpression[]): LanguageExpression {
        return this.makeNaryOp("===", args)
    }
    castToInt(value: string, bitness: 8|32): string{ return value }
    castToBoolean(value: string): string { return value }
    makeCallIsObject(value: string): LanguageExpression {
        return this.makeString(`typeof ${value} === "object"`)
    }
    instanceOf(convertor: ArgConvertor, value: string, _duplicateMembers?: Set<string>): LanguageExpression {
        return this.makeString(`${value} instanceof ${this.getNodeName(convertor.idlType)}`)
    }
    // The version of instanceOf() which does not use ArgConvertors
    typeInstanceOf(type: idl.IDLEntry, value: string, members?: string[]): LanguageExpression {
        return this.makeString(`${value} instanceof ${this.getNodeName(type)}`)
    }

    makeLengthSerializer(serializer: string, value: string): LanguageStatement | undefined {
        const valueType = "valueType"

        return this.makeBlock([
            this.makeAssign(valueType, undefined, this.makeFunctionCall("runtimeType", [this.makeString(value)]), true),
            this.makeStatement(this.makeMethodCall(serializer, "writeInt8", [this.makeString(valueType)])),

            this.makeMultiBranchCondition([
                {
                    expr: this.makeRuntimeTypeCondition(valueType, true, RuntimeType.NUMBER),
                    stmt: this.makeStatement(
                        this.makeMethodCall(serializer, "writeFloat32", [this.makeString(`${value} as float32`)])
                    )
                },
                {
                    expr: this.makeRuntimeTypeCondition(valueType, true, RuntimeType.STRING),
                    stmt: this.makeStatement(
                        this.makeMethodCall(serializer, "writeString", [this.makeString(`${value} as string`)])
                    )
                },
                {
                    expr: this.makeRuntimeTypeCondition(valueType, true, RuntimeType.OBJECT),
                    stmt: this.makeStatement(
                        this.makeMethodCall(serializer, "writeInt32", [this.makeString(`(${value} as Resource).id as int32`)])
                    )
                },
            ]),
        ], false)
    }
    makeLengthDeserializer(deserializer: string): LanguageStatement | undefined {
        const valueType = "valueType"

        return this.makeBlock([
            this.makeAssign(valueType, undefined, this.makeMethodCall(deserializer, "readInt8", []), true),

            this.makeMultiBranchCondition(
                [{
                    expr: this.makeRuntimeTypeCondition(valueType, true, RuntimeType.NUMBER),
                    stmt: this.makeReturn(this.makeString(`${deserializer}.readFloat32() as number`))
                },
                {
                    expr: this.makeRuntimeTypeCondition(valueType, true, RuntimeType.STRING),
                    stmt: this.makeReturn(this.makeMethodCall(deserializer, "readString", []))
                },
                {
                    expr: this.makeRuntimeTypeCondition(valueType, true, RuntimeType.OBJECT),
                    stmt: this.makeReturn(this.makeString(`({id: ${deserializer}.readInt32(), bundleName: "", moduleName: ""}) as Resource`))
                }],
                this.makeReturn(this.makeUndefined())
            ),
        ], false)
    }

    stringifyTypeOrEmpty(type: idl.IDLType | undefined): string {
        if (type === undefined) return ""
        return this.getNodeName(type)
    }
    /**
     * Writes `namespace <namespace> {` and adds extra indent
     * @param namespace Namespace to begin
     */
    pushNamespace(namespace: string, ident: boolean = true) { // TODO: namespace-related-to-rework
        this.print(`namespace ${namespace} {`)
        if (ident) this.pushIndent()
    }

    /**
     * Writes closing brace of namespace block and removes one level of indent
     */
    popNamespace(ident: boolean = true) { // TODO: namespace-related-to-rework
        this.namespaceStack.pop()
        if (ident) this.popIndent()
        this.print(`}`)
    }
}

export function mangleMethodName(method: Method, id?: number): string {
    return `${method.name}${id ?? ""}`
}

export function printMethodDeclaration(printer: IndentedPrinter, retType: string, methodName: string, apiParameters: string[], postfix: string = "") {
    if (apiParameters.length > 1) {
        const methodTypeName = `${retType} ${methodName}`
        const indent = ` `.repeat(methodTypeName.length + 1)
        printer.print(`${methodTypeName}(${apiParameters[0]},`)
        for (let i = 1; i < apiParameters.length; i++) {
            printer.print(indent + apiParameters[i] + ((i === apiParameters.length - 1) ? `)${postfix}` : ","))
        }
    } else {
        const signature = `${retType} ${methodName}(${apiParameters.join(", ")})${postfix}`
        printer.print(signature)
    }
}

export function copyMethod(method: Method, overrides: {
    name?: string,
    signature?: MethodSignature,
    modifiers?: MethodModifier[],
    generics?: string[],
}) {
    return new Method(
        overrides.name ?? method.name,
        overrides.signature ?? method.signature,
        overrides.modifiers ?? method.modifiers,
        overrides.generics ?? method.generics,
    )
}

export type MakeCastOptions = {
    unsafe?: boolean
    optional?: boolean
    receiver?: string
    toRef?: boolean
    overrideTypeName?: string
}

export type MakeRefOptions = {
    receiver?: string
}

export type MakeAssignOptions = {
    receiver?: string,
    assignRef?: boolean
    overrideTypeName?: string
}

/////////////////////////////////////////////////////////////////////////////////

export type ExpressionAssigner = (expression: LanguageExpression) => LanguageStatement