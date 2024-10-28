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
import { ArrayConvertor, EnumConvertor as EnumConvertorDTS, MapConvertor, OptionConvertor, TupleConvertor, UnionConvertor } from "../../Convertors"
import { FieldRecord } from "../../DeclarationTable"
import { mapType, TSTypeNodeNameConvertor } from "../../TypeNodeNameConvertor"
import { AssignStatement, ExpressionStatement, FieldModifier, LambdaExpression, LanguageExpression, LanguageStatement, LanguageWriter, Method, MethodModifier, MethodSignature, NamedMethodSignature, ObjectArgs, ReturnStatement } from "../LanguageWriter"
import * as idl from '../../../idl'
import * as ts from 'typescript'
import { ArgConvertor, RuntimeType } from "../../ArgConvertors"
import { EnumConvertor } from "../../idl/IdlArgConvertors"
import { ReferenceResolver } from "../../ReferenceResolver"
import { convertType, IdlTypeNameConvertor, TypeConvertor } from "../../idl/IdlTypeConvertor"

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

export class TSLambdaExpression extends LambdaExpression {
    constructor(
        writer: LanguageWriter,
        private convertor: IdlTypeNameConvertor,
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

export class TsObjectDeclareStatement implements LanguageStatement {
    constructor(private object: string, private type: idl.IDLType | undefined, private fields: readonly FieldRecord[]) {}
    write(writer: LanguageWriter): void {
        const nameConvertor = new TsObjectDeclareNodeNameConvertor()
        // Constructing a new type with all optional fields
        const objectType = idl.toIDLType(`{${this.fields.map(it => {
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

export class TSLanguageWriter extends LanguageWriter implements TypeConvertor<string> {
    constructor(printer: IndentedPrinter, resolver: ReferenceResolver, language: Language = Language.TS) {
        super(printer, resolver, language)
    }

    fork(): LanguageWriter {
        return new TSLanguageWriter(new IndentedPrinter(), this.resolver, this.language)
    }

    /**** IdlTypeNameConvertor *******************************************/

    convert(type: idl.IDLType | idl.IDLCallback): string {
        return idl.isCallback(type)
            ? this.mapCallback(type)
            : convertType(this, type)
    }

    /***** TypeConvertor<string> *****************************************/

    convertOptional(type: idl.IDLOptionalType): string {
        return this.mapIDLOptionalType(type)
    }
    convertUnion(type: idl.IDLUnionType): string {
        return this.mapIDLUnionType(type)
    }
    convertContainer(type: idl.IDLContainerType): string {
        return this.mapIDLContainerType(type)
    }
    convertEnum(type: idl.IDLEnumType): string {
        return this.mapIDLEnumType(type)
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): string {
        const match = importClause.match(/import *\((['"`])(.+)\1\)\.(.+)/)
        if (!match)
            throw new Error(`Cannot parse import clause ${importClause}`)
        const [where, what] = match.slice(2)
        return `IMPORT_${what}_FROM_${where}`.match(/[a-zA-Z]+/g)!.join('_')
    }
    convertTypeReference(type: idl.IDLReferenceType): string {
        return this.mapIDLReferenceType(type)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): string {
        return idl.getIDLTypeName(type)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): string {
        return this.mapIDLPrimitiveType(type)
    }
    protected processTupleType(idlProperty: idl.IDLProperty): idl.IDLProperty {
        return idlProperty
    }
    protected mapCallback(decl: idl.IDLCallback): string {
        const params = decl.parameters.map(it =>
            `${it.isVariadic ? "..." : ""}${it.name}${it.isOptional ? "?" : ""}: ${this.mapIDLType(it.type!)}`)
        return `((${params.join(", ")}) => ${this.mapIDLType(decl.returnType)})`
    }

    protected productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): string {
        const name = `${
                isTuple ? "[" : "{"
            } ${
                decl.properties
                    .map(it => isTuple ? this.processTupleType(it) : it)
                    .map(it => {
                        const type = this.mapIDLType(it.type)
                        return it.isOptional
                            ? includeFieldNames ? `${it.name}?: ${type}` : `(${type})?`
                            : includeFieldNames ? `${it.name}: ${type}` : `${type}`
                }).join(", ")
            } ${
                isTuple ? "]" : "}"
            }`

        return name
    }

    /**********************************************************************/

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
    writeEnum(name: string, members: { name: string, stringId: string | undefined, numberId: number }[], op: (writer: LanguageWriter) => void): void {
        throw new Error("WriteEnum for TS is not implemented")
    }
    writeFieldDeclaration(name: string, type: idl.IDLType, modifiers: FieldModifier[]|undefined, optional: boolean, initExpr?: LanguageExpression): void {
        const init = initExpr != undefined ? ` = ${initExpr.asString()}` : ``
        let prefix = this.makeFieldModifiersList(modifiers)
        this.printer.print(`${prefix} ${name}${optional ? "?"  : ""}: ${this.mapIDLType(type)}${init}`)
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
        // FIXME:
        const isSetter = modifiers?.includes(MethodModifier.SETTER)
        this.printer.print(`${prefix}${name}${typeParams}(${signature.args.map((it, index) => `${signature.argName(index)}${it.optional && !isSetter ? "?" : ""}: ${this.mapIDLType(it)}${signature.argDefault(index) ? ' = ' + signature.argDefault(index) : ""}`).join(", ")})${needReturn ? ": " + this.mapIDLType(signature.returnType) : ""} ${needBracket ? "{" : ""}`)
    }
    makeAssign(variableName: string, type: idl.IDLType | undefined, expr: LanguageExpression | undefined, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
        return new AssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        return new TSLambdaExpression(this, this, signature, this.resolver, body)
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
    makeCast(value: LanguageExpression, type: idl.IDLType, unsafe = false): LanguageExpression {
        return new TSCastExpression(value, this.mapIDLType(/* FIXME: */ idl.maybeOptional(type, false)), unsafe)
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
                idl.toIDLType(`{${fields.map(it=>`${it.name}: ${mapType(it.type)}`).join(",")}}`)),
                false)
        }
        return new TsObjectAssignStatement(object, undefined, false)
    }
    makeMapResize(mapTypeName: string, keyType: idl.IDLType, valueType: idl.IDLType, map: string, size: string, deserializer: string): LanguageStatement {
        return this.makeAssign(map, undefined, this.makeString(`new Map<${this.convert(keyType)}, ${this.convert(valueType)}>()`), false)
    }
    makeMapKeyTypeName(c: MapConvertor): idl.IDLType {
        return c.keyConvertor.idlType;
    }
    makeMapValueTypeName(c: MapConvertor): idl.IDLType {
        return c.valueConvertor.idlType;
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        // keyAccessor and valueAccessor are equal in TS
        return this.makeStatement(this.makeMethodCall(keyAccessor, "set", [this.makeString(key), this.makeString(value)]))
    }
    makeObjectDeclare(name: string, type: idl.IDLType, fields: readonly FieldRecord[]): LanguageStatement {
        return new TsObjectDeclareStatement(name, type, fields)
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
    enumFromOrdinal(value: LanguageExpression, enumType: string): LanguageExpression {
        return this.makeString(`Object.values(${enumType})[${value.asString()}]`);
    }
    ordinalFromEnum(value: LanguageExpression, enumType: string): LanguageExpression {
        return this.makeString(`Object.keys(${enumType}).indexOf(${this.makeCast(value, idl.IDLStringType).asString()})`);
    }
    override makeCastEnumToInt(convertor: EnumConvertorDTS, enumName: string, unsafe?: boolean): string {
        // TODO: remove after switching to IDL
        if (unsafe) {
            return this.makeUnsafeCast(convertor, enumName)
        }
        return enumName
    }
    override makeEnumCast(enumName: string, unsafe: boolean, convertor: EnumConvertor): string {
        if (unsafe) {
            return this.makeUnsafeCast(convertor, enumName)
        }
        return enumName
    }
    mapIDLUnionType(type: idl.IDLUnionType): string {
        return type.types.
            map(it => {
                if (false /* add check if it is function */) {
                    return `(${this.mapIDLType(it)})`
                }
                return this.mapIDLType(it)
            })
            .join(' | ')
    }
    mapIDLReferenceType(type: idl.IDLReferenceType): string {
        const decl = this.resolver.resolveTypeReference(type)!
        if (decl && idl.isSyntheticEntry(decl)) {
            if (idl.isCallback(decl)) {
                return this.mapCallback(decl)
            }
            const entity = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity)
            if (entity) {
                const isTuple = entity === idl.IDLEntity.Tuple
                return this.productType(decl as idl.IDLInterface, isTuple, !isTuple)
            }
        }

        // FIXME: isEnumMember is not TYPE!
        if (decl && idl.isEnumMember(decl) && decl.parent) {
            // when `interface A { field?: MyEnum.Value1 }` is generated, it is not possible
            // to deserialize A, because there is no such type information in declaration target
            // (can not cast MyEnum to exact MyEnum.Value1)
            return decl.parent?.name
        }

        let typeSpec = idl.getIDLTypeName(type)
        let typeArgs = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)?.split(",")
        if (typeSpec === `AttributeModifier`)
            typeArgs = [`object`]
        if (typeSpec === `ContentModifier`)
            typeArgs = [this.convert(idl.IDLAnyType)] //this.convert(ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword))]
        if (typeSpec === `Optional`) {
            return `${typeArgs} | undefined`
        }
        const maybeTypeArguments = !typeArgs?.length ? '' : `<${typeArgs.join(', ')}>`
        return `${typeSpec}${maybeTypeArguments}`
    }
    mapIDLEnumType(type: idl.IDLEnumType): string {
        const entity = this.resolver.toDeclaration(type)
        if (idl.isEnum(entity)) {
            return entity.elements.map(it => this.mapIDLType(it.type)).join(' | ')
        }
        return idl.getIDLTypeName(type)
    }
    mapIDLOptionalType(type: idl.IDLOptionalType): string {
        return `${this.mapIDLType(type.element)} | undefined`
    }
    mapIDLContainerType(type: idl.IDLContainerType): string {
        if (idl.IDLContainerUtils.isSequence(type)) {
            switch (type.elementType[0]) {
                case idl.IDLU8Type: return 'Uint8Array'
                case idl.IDLI32Type: return 'Int32Array'
                case idl.IDLF32Type: return 'Float32Array'
                default: return `Array<${this.mapIDLType(type.elementType[0])}>`
            }
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            return `Map<${this.mapIDLType(type.elementType[0])}, ${this.mapIDLType(type.elementType[1])}>`
        }
        if (idl.IDLContainerUtils.isPromise(type)) {
            return `Promise<${this.mapIDLType(type.elementType[0])}>`
        }
        throw new Error(`Unmapped container type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    mapIDLPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLUnknownType: return 'unknown'
            case idl.IDLThisType: return 'this'
            case idl.IDLAnyType: return 'any'
            case idl.IDLUndefinedType: return 'undefined'
            case idl.IDLNullType: return 'null'
            case idl.IDLPointerType: return 'number | bigint'
            case idl.IDLVoidType: return 'void'
            case idl.IDLBooleanType: return 'boolean'

            case idl.IDLI32Type:
                return 'int32'

            case idl.IDLI8Type:
            case idl.IDLU8Type:
            case idl.IDLI16Type:
            case idl.IDLU16Type:
            case idl.IDLU32Type:
            case idl.IDLI64Type:
            case idl.IDLU64Type:
            case idl.IDLF32Type:
            case idl.IDLF64Type:
            case idl.IDLNumberType:
                return 'number'

            case idl.IDLStringType:
                return 'string'
        }
        throw new Error(`Unmapped primitive type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    override castToBoolean(value: string): string { return `+${value}` }
    override makeCallIsObject(value: string): LanguageExpression {
        return this.makeString(`${value} instanceof Object`)
    }
}
