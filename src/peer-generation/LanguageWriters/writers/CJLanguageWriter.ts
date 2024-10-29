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

import { DebugUtils, getIDLTypeName, IDLBooleanType, IDLCallback, IDLContainerType, IDLContainerUtils, IDLF32Type, IDLF64Type, IDLI16Type, IDLI32Type, IDLI64Type, IDLI8Type, IDLNumberType, IDLParameter, IDLPointerType, IDLPrimitiveType, IDLReferenceType, IDLStringType, IDLType, IDLU16Type, IDLU32Type, IDLU64Type, IDLU8Type, IDLVoidType, isContainerType, isPrimitiveType, toIDLType } from "../../../idl"
import { IndentedPrinter } from "../../../IndentedPrinter"
import { Language } from "../../../Language"
import { CJKeywords } from "../../../languageSpecificKeywords"
import { isDefined } from "../../../util"
import { ArgConvertor, BaseArgConvertor, RuntimeType } from "../../ArgConvertors"
import { EnumConvertor as EnumConvertorDTS, MapConvertor } from "../../Convertors"
import { FieldRecord } from "../../DeclarationTable"
import * as idl from '../../../idl'
import { EnumConvertor } from "../../idl/IdlArgConvertors"
import { EnumEntity } from "../../PeerFile"
import { ReferenceResolver } from "../../ReferenceResolver"
import { mapType } from "../../TypeNodeNameConvertor"
import { AssignStatement, ExpressionStatement, FieldModifier, LambdaExpression, LanguageExpression, LanguageStatement, LanguageWriter, Method, MethodModifier, MethodSignature, NamedMethodSignature, ObjectArgs, ReturnStatement } from "../LanguageWriter"
import { TSCastExpression, TsObjectAssignStatement, TsObjectDeclareStatement, TsTupleAllocStatement } from "./TsLanguageWriter"
import { cjCustomTypeMapping, convertCJOptional } from "../../printers/lang/Cangjie"
import { convertType, TypeConvertor } from "../../idl/IdlTypeConvertor"
import { ARK_CUSTOM_OBJECT } from "../../printers/lang/Java"

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
        return true
    }
    asString(): string {
        const params = this.signature.args.map((it, i) => `${this.writer.convert(it)} ${this.signature.argName(i)}`)
        return `(${params.join(", ")}) -> { ${this.bodyAsString()} }`
    }
}

export class CJCheckDefinedExpression implements LanguageExpression {
    constructor(private value: string) { }
    asString(): string {
        return `${this.value}.isNotNone()}`
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
                const typeSpec = this.type ? ': ' + writer.mapIDLType(this.type) : ''
                writer.print(`${this.isConst ? "let" : "var"} ${this.variableName}${typeSpec} = ${this.expression.asString()}`)
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

export class CJEnumEntityStatement implements LanguageStatement {
    constructor(private readonly enumEntity: EnumEntity, private readonly isExport: boolean) {}

    write(writer: LanguageWriter) {
        writer.print(this.enumEntity.comment.length > 0 ? this.enumEntity.comment : undefined)
        writer.print(`${this.isExport ? "public " : ""}enum ${this.enumEntity.name} {`)
        writer.pushIndent()
        this.enumEntity.members.forEach((member, index) => {
            writer.print(member.comment.length > 0 ? member.comment : undefined)
            const varticalBar = index < this.enumEntity.members.length - 1 ? '|' : ''
            const initValue = member.initializerText ? ` = ${member.initializerText}` : ``
            writer.print(`${member.name}${initValue}${varticalBar}`)
        })
        writer.popIndent()
        writer.print(`}`)
    }
}

////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export class CJLanguageWriter extends LanguageWriter {
    constructor(printer: IndentedPrinter, resolver:ReferenceResolver, language: Language = Language.CJ) {
        super(printer, resolver, language)
    }
    fork(): LanguageWriter {
        return new CJLanguageWriter(new IndentedPrinter(), this.resolver)
    }

    /**** IdlTypeNameConvertor *******************************************/

    convert(type: idl.IDLType | idl.IDLCallback): string {
        const typeAlias = idl.isCallback(type) 
            ? this.convertCallback(type) 
            : convertType(this, type)
        const rawType = typeAlias.type.optional ? convertCJOptional(typeAlias.type.text) : typeAlias.type.text 
        return this.mapTypeName(rawType)
    }

    /***** TypeConvertor<CJTypeAlias> **********************************/
    convertOptional(type: idl.IDLOptionalType): CJTypeAlias {
        return CJTypeAlias.fromTypeName(convertCJOptional(this.convert(type.element)), true)
    }
    convertUnion(type: idl.IDLUnionType): CJTypeAlias {
        const aliases = type.types.map(it => convertType(this, it))
        return CJTypeAlias.fromTypeName(`Union_${aliases.map(it => it.alias).join('_')}`, false)
    }
    convertContainer(type: idl.IDLContainerType): CJTypeAlias {
        if (idl.IDLContainerUtils.isSequence(type)) {
            const cjTypeAlias = convertType(this, type.elementType[0])
            return new CJTypeAlias(`ArrayList<${cjTypeAlias.type.text}>`, `Array_${cjTypeAlias.alias}`)
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            const CJTypeAliases = type.elementType.slice(0, 2).map(it => convertType(this, it)).map(this.maybeConvertPrimitiveType, this)
            return new CJTypeAlias(`Map<${CJTypeAliases[0].type.text}, ${CJTypeAliases[1].type.text}>`, `Map_${CJTypeAliases[0].alias}_${CJTypeAliases[1].alias}`)
        }
        throw new Error(`IDL type ${idl.DebugUtils.debugPrintType(type)} not supported`)
    }
    convertEnum(type: idl.IDLEnumType): CJTypeAlias {
        // TODO: remove prefix after full migration to IDL
        return CJTypeAlias.fromTypeName(`Ark_${idl.getIDLTypeName(type)}`, false)
    }
    convertCallback(type: idl.IDLCallback): CJTypeAlias {
        // TODO
        return CJTypeAlias.fromTypeName(`Callback`, false)
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): CJTypeAlias {
        return CJTypeAlias.fromTypeName(idl.getIDLTypeName(type), false)
    }
    convertTypeReference(type: idl.IDLReferenceType): CJTypeAlias {
        const importAttr = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Import)
        if (importAttr) {
            return this.convertImport(type, importAttr)
        }
        // resolve synthetic types
        const decl = this.resolver.resolveTypeReference(type)!
        if (decl && idl.isSyntheticEntry(decl)) {
            if (idl.isCallback(decl)) {
                return this.callbackType(decl)
            }
            const entity = idl.getExtAttribute(decl, idl.IDLExtendedAttributes.Entity)
            if (entity) {
                const isTuple = entity === idl.IDLEntity.Tuple
                return this.productType(decl as idl.IDLInterface, isTuple, !isTuple)
            }
        }

        let typeSpec = idl.getIDLTypeName(type)
        if (cjCustomTypeMapping.has(typeSpec)) {
            typeSpec = cjCustomTypeMapping.get(typeSpec)!
        }
        // const qualifier = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Qualifier)
        // if (qualifier) {
        //     typeSpec = `${qualifier}.${typeSpec}`
        // }
        let typeArgs = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)?.split(",")
        if (typeSpec === `Optional`) {
            return CJTypeAlias.fromTypeName(typeArgs![0], true)
        }
        return CJTypeAlias.fromTypeName(typeSpec, false)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): CJTypeAlias {
        // TODO
        return CJTypeAlias.fromTypeName(idl.getIDLTypeName(type), false)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): CJTypeAlias {
        switch (type) {
            case idl.IDLAnyType: return CJTypeAlias.fromTypeName(ARK_CUSTOM_OBJECT, false)
            case idl.IDLStringType: return CJTypeAlias.fromTypeName('String', false)
            case idl.IDLBooleanType: return CJTypeAlias.fromTypeName('Bool', false)
            case idl.IDLNumberType: return CJTypeAlias.fromTypeName('Float64', false)
            case idl.IDLUndefinedType: return CJTypeAlias.fromTypeName('Ark_Undefined', false)
            case idl.IDLI8Type: return CJTypeAlias.fromTypeName('Int8', false)
            case idl.IDLU8Type: return CJTypeAlias.fromTypeName('UInt8', false)
            case idl.IDLI16Type: return CJTypeAlias.fromTypeName('Int16', false)
            case idl.IDLU16Type: return CJTypeAlias.fromTypeName('UInt16', false)
            case idl.IDLI32Type: return CJTypeAlias.fromTypeName('Int32', false)
            case idl.IDLU32Type: return CJTypeAlias.fromTypeName('UInt32', false)
            case idl.IDLI64Type: return CJTypeAlias.fromTypeName('Int64', false)
            case idl.IDLU64Type: return CJTypeAlias.fromTypeName('UInt64', false)
            case idl.IDLF32Type: return CJTypeAlias.fromTypeName('Float32', false)
            case idl.IDLF64Type: return CJTypeAlias.fromTypeName('Float64', false)
            case idl.IDLPointerType: return CJTypeAlias.fromTypeName('Int64', false)
            case idl.IDLVoidType: return CJTypeAlias.fromTypeName('Unit', false)
        }
        throw new Error(`Unsupported IDL primitive ${idl.DebugUtils.debugPrintType(type)}`)
    }
    private readonly CJPrimitiveToReferenceTypeMap = new Map([
        ['byte', CJTypeAlias.fromTypeName('Byte', false)],
        ['short', CJTypeAlias.fromTypeName('Short', false)],
        ['int', CJTypeAlias.fromTypeName('Integer', false)],
        ['float', CJTypeAlias.fromTypeName('Float', false)],
        ['double', CJTypeAlias.fromTypeName('Double', false)],
        ['boolean', CJTypeAlias.fromTypeName('Boolean', false)],
        ['char', CJTypeAlias.fromTypeName('Character', false)],
    ])
    private maybeConvertPrimitiveType(CJType: CJTypeAlias): CJTypeAlias {
        if (this.CJPrimitiveToReferenceTypeMap.has(CJType.type.text)) {
            return this.CJPrimitiveToReferenceTypeMap.get(CJType.type.text)!
        }
        return CJType
    }

    private callbackType(decl: idl.IDLCallback): CJTypeAlias {
        // TODO
        //const params = decl.parameters.map(it => `${it.isVariadic ? "..." : ""}${it.name}: ${this.library.mapType(it.type)}`)
        //`((${params.join(", ")}) => ${this.library.mapType(decl.returnType)})`
        return CJTypeAlias.fromTypeName('Callback', false)
    }

    // Tuple + ??? AnonymousClass
    private productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): CJTypeAlias {
        // // TODO: other types
        if (!isTuple) throw new Error('Only tuples supported from IDL synthetic types for now')
        const CJTypeAliases = decl.properties.map(it => CJTypeAlias.fromTypeAlias(convertType(this, it.type), it.isOptional))
        return CJTypeAlias.fromTypeName(`Tuple_${CJTypeAliases.map(it => it.alias, false).join('_')}`, false)
    }
    /**********************************************************************/

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
        this.printer.print(`${prefix} var ${name}: ${optional ? '?' : ''}${this.mapIDLType(type)}${init}`)
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void {
        this.writeDeclaration(name, signature, modifiers)
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void, superCall?: Method, modifiers?: MethodModifier[]) {
        this.printer.print(`${modifiers ? modifiers.map((it) => MethodModifier[it].toLowerCase()).join(' ') + ' ' : ''}${className}(${signature.args.map((it, index) => `${signature.argName(index)}: ${it.optional ? '?' : ''}${this.mapIDLType(it)}`).join(", ")}) {`)
        this.pushIndent()
        if (superCall) {
            this.print(`super(${superCall.signature.args.map((_, i) => superCall?.signature.argName(i)).join(", ")});`)
        }
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeMethodImplementation(method: Method, op: (writer: LanguageWriter) => void) {
        this.writeDeclaration(method.name, method.signature, method.modifiers, " {")
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    private writeDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[], postfix?: string): void {
        let prefix = modifiers
            ?.filter(it => this.supportedModifiers.includes(it))
            .map(it => this.mapMethodModifier(it)).join(" ")
        prefix = prefix ? prefix + " " : ""
        this.print(`${prefix}func ${name}(${signature.args.map((it, index) => `${signature.argName(index)}: ${it.optional ? '?' : ''}${this.mapIDLType(it)}`).join(", ")}): ${this.mapIDLType(signature.returnType)}${postfix ?? ""}`)
    }
    nativeReceiver(): string { return 'NativeModule' }
    writeNativeFunctionCall(printer: LanguageWriter, name: string, signature: MethodSignature) {
        printer.print(`return unsafe { ${name}(${signature.args.map((it, index) => `${signature.argName(index)}`).join(", ")}) }`)
    }
    writeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        this.print(`func ${name}(${signature.args.map((it, index) => `${this.escapeKeyword(signature.argName(index))}: ${it.optional ? '?' : ''}${this.mapCIDLType(it)}`).join(", ")}): ${this.mapCIDLType(signature.returnType)}`)
    }
    override makeCastEnumToInt(convertor: EnumConvertorDTS, enumName: string, _unsafe?: boolean): string {
        return `${enumName}.getIntValue()`
    }
    override makeEnumCast(enumName: string, _unsafe: boolean, _convertor: EnumConvertor | undefined): string {
        // TODO: remove after switching to IDL
        return `${enumName}.getIntValue()`
    }
    makeAssign(variableName: string, type: IDLType | undefined, expr: LanguageExpression, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
        return new CJAssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeArrayLength(array: string, length?: string): LanguageExpression {
        return this.makeString(`${array}.size`)
    }
    makeRuntimeTypeCondition(typeVarName: string, equals: boolean, type: RuntimeType, varName: string): LanguageExpression {
        varName = this.escapeKeyword(varName)
        return this.makeString(`let Some(${varName}) <- ${varName}`)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        return new CJLambdaExpression(this, signature, this.resolver, body)
    }
    makeThrowError(message: string): LanguageStatement {
        throw new Error(`TBD`)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new ReturnStatement(expr)
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
    writePrintLog(message: string): void {
        this.print(`println("${message}")`)
    }
    makeCast(value: LanguageExpression, type: IDLType, unsafe = false): LanguageExpression {
        return new TSCastExpression(value, this.mapIDLType(type), unsafe)
    }
    getObjectAccessor(convertor: BaseArgConvertor, value: string, args?: ObjectArgs): string {
        return `${value}`
    }
    makeUndefined(): LanguageExpression {
        return this.makeString("Option.None")
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
    makeTupleAlloc(option: string): LanguageStatement {
        return new TsTupleAllocStatement(option)
    }
    makeObjectAlloc(object: string, fields: readonly FieldRecord[]): LanguageStatement {
        if (fields.length > 0) {
            return this.makeAssign(object, undefined,
                this.makeCast(this.makeString("{}"),
                   toIDLType(`{${fields.map(it=>`${it.name}: ${mapType(it.type)}`).join(",")}}`)),
                false)
        }
        return new TsObjectAssignStatement(object, undefined, false)
    }
    makeMapResize(mapType: string, keyType: IDLType, valueType: IDLType, map: string, size: string, deserializer: string): LanguageStatement {
        return this.makeAssign(
            map, 
            undefined, 
            this.makeString(`new Map<${this.mapIDLType(keyType)}, ${this.mapIDLType(valueType)}>()`), 
            false
        )
    }
    makeMapKeyTypeName(c: MapConvertor): IDLType {
        return c.keyConvertor.idlType;
    }
    makeMapValueTypeName(c: MapConvertor): IDLType {
        return c.valueConvertor.idlType;
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        // keyAccessor and valueAccessor are equal in TS
        return this.makeStatement(this.makeMethodCall(keyAccessor, "set", [this.makeString(key), this.makeString(value)]))
    }
    makeObjectDeclare(name: string, type: IDLType, fields: readonly FieldRecord[]): LanguageStatement {
        return new TsObjectDeclareStatement(name, type, fields)
    }
    getTagType(): IDLType {
        return toIDLType("Tags");
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
    enumFromOrdinal(value: LanguageExpression, enumType: string): LanguageExpression {
        throw new Error('Not yet implemented')
    }
    ordinalFromEnum(value: LanguageExpression, enumType: string): LanguageExpression {
        throw new Error('Not yet implemented')
    }
    makeEnumEntity(enumEntity: EnumEntity, isExport: boolean): LanguageStatement {
        return new CJEnumEntityStatement(enumEntity, isExport)
    }
    runtimeType(param: ArgConvertor, valueType: string, value: string) {
        this.writeStatement(this.makeAssign(valueType, undefined,
            this.makeRuntimeTypeGetterCall(value), false))
    }
    makeSerializerCreator() {
        return this.makeString('createSerializer');
    }
    mapIDLContainerType(type: IDLContainerType, args: string[]): string {
        if (IDLContainerUtils.isSequence(type)) {
            return `ArrayList<${args[0]}>`
        }
        throw new Error(`Unmapped container type ${DebugUtils.debugPrintType(type)}`)
    }
    mapCIDLType(type: IDLType): string {
        if (isPrimitiveType(type)) {
            switch (type) {
                case IDLStringType: return 'CString'
            }
        }
        if (isContainerType(type)) {
            if (IDLContainerUtils.isSequence(type)) {
                return `CPointer<${this.mapCIDLType(type.elementType[0])}>`
            }
        }
        if (idl.isReferenceType(type) && this.mapIDLType(type).startsWith('Array')) {
            // Fix, actual mapping has to be due to IDLType
            return `CPointer<UInt8>`
        }
        return this.mapIDLType(type)
    }
    mapTypeName(name: string): string {
        switch (name) {
            case 'Length': return 'String'
            case 'KPointer': return 'Int64'
            case 'KBoolean': return 'Bool'
            case 'KUInt': return 'UInt32'
            case 'int32': case 'KInt': return 'Int32'
            case 'int64': case 'KLong': return 'Int64'
            case 'float32': case 'KFloat': return 'Float32'
            case 'Uint8Array': return 'ArrayList<UInt8>'
            case 'KUint8ArrayPtr': return 'Int64'
            case 'KInt32ArrayPtr': return 'Int64'
            case 'KFloat32ArrayPtr': return 'Int64'
            case 'KStringPtr': return 'Int64'
            case 'string': return 'String'
        }
        return name
    }
    mapIDLPrimitiveType(type: IDLPrimitiveType): string {
        switch (type) {
            case IDLPointerType: return 'Int64'
            case IDLVoidType: return 'Unit'
            case IDLBooleanType:  return 'Bool'
            case IDLI8Type: return 'Int8'
            case IDLU8Type: return 'UInt8'
            case IDLI16Type: return 'Int16'
            case IDLU16Type: return 'UInt16'
            case IDLI32Type: return 'Int32'
            case IDLU32Type: return 'UInt32'
            case IDLI64Type: return 'Int64'
            case IDLU64Type: return 'UInt64'
            case IDLF32Type: return 'Float32'
            case IDLF64Type: case IDLNumberType: return 'Float64'
            case IDLStringType: return 'String'
        }
        throw new Error(`Unmapped primitive type ${DebugUtils.debugPrintType(type)}`)
    }
    mapIDLReferenceType(type: IDLReferenceType): string {
        throw new Error(`Unmapped reference type ${DebugUtils.debugPrintType(type)}`)
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
}

class CJTypeAlias {
    // CJ type itself
    // string representation can contain special characters (e.g. String[])
    readonly type: {
        text: string,
        optional: boolean
    }

    // synthetic identifier for internal use cases: naming classes/files etc.
    // string representation contains only letters, numbers and underscores (e.g. Array_String)
    readonly alias: string

    static fromTypeName(typeName: string, optional: boolean): CJTypeAlias {
        return new CJTypeAlias({ text: typeName, optional }, optional ? convertCJOptional(typeName) : typeName)
    }

    static fromTypeAlias(typeAlias: CJTypeAlias, optional: boolean): CJTypeAlias {
        return new CJTypeAlias({ text: typeAlias.type.text, optional: typeAlias.type.optional }, optional ? convertCJOptional(typeAlias.alias) : typeAlias.alias)
    }

    constructor(type: { text: string, optional: boolean } | string, alias: string) {
        if (typeof type === 'string') {
            this.type = {
                text: type,
                optional: false
            }
        } else {
            this.type = type
        }
        this.alias = alias
    }
}
