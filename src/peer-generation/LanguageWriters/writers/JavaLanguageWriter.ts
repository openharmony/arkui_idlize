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
import { EnumConvertor as EnumConvertorDTS, MapConvertor, OptionConvertor, TupleConvertor, UnionConvertor } from "../../Convertors"
import { ARK_CUSTOM_OBJECT, convertJavaOptional, javaCustomTypeMapping } from "../../printers/lang/Java"
import { AssignStatement, LambdaExpression, FieldModifier, LanguageExpression, LanguageStatement, LanguageWriter, Method, MethodModifier, MethodSignature, ObjectArgs, ReturnStatement } from "../LanguageWriter"
import { CLikeExpressionStatement, CLikeLanguageWriter, CLikeLoopStatement, CLikeReturnStatement } from "./CLikeLanguageWriter"
import * as idl from '../../../idl'
import { ArgConvertor, BaseArgConvertor, RuntimeType } from "../../ArgConvertors"
import { EnumConvertor } from "../../idl/IdlArgConvertors"
import { ReferenceResolver } from "../../ReferenceResolver"
import { convertType, TypeConvertor } from "../../idl/IdlTypeConvertor"

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
        const params = this.signature.args.map((it, i) => `${idl.getIDLTypeName(it)} ${this.signature.argName(i)}`)
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
            const typeSpec = this.type ? writer.mapIDLType(this.type) : "var"
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
//                            UTILS                           //
////////////////////////////////////////////////////////////////

class JavaTypeAlias {
    // Java type itself
    // string representation can contain special characters (e.g. String[])
    readonly type: {
        text: string,
        optional: boolean
    }

    // synthetic identifier for internal use cases: naming classes/files etc.
    // string representation contains only letters, numbers and underscores (e.g. Array_String)
    readonly alias: string

    static fromTypeName(typeName: string, optional: boolean): JavaTypeAlias {
        return new JavaTypeAlias({ text: typeName, optional }, optional ? convertJavaOptional(typeName) : typeName)
    }

    static fromTypeAlias(typeAlias: JavaTypeAlias, optional: boolean): JavaTypeAlias {
        return new JavaTypeAlias({ text: typeAlias.type.text, optional: typeAlias.type.optional || optional }, optional ? convertJavaOptional(typeAlias.alias) : typeAlias.alias)
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


////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export class JavaLanguageWriter extends CLikeLanguageWriter implements TypeConvertor<JavaTypeAlias> {
    constructor(printer: IndentedPrinter, resolver:ReferenceResolver) {
        super(printer, resolver, Language.JAVA)
    }
    
    fork(): LanguageWriter {
        return new JavaLanguageWriter(new IndentedPrinter(), this.resolver)
    }
    
    /**** IdlTypeNameConvertor *******************************************/

    convert(type: idl.IDLType | idl.IDLCallback): string {
        const typeAlias = idl.isCallback(type) 
            ? this.convertCallback(type) 
            : convertType(this, type)
        const rowType = typeAlias.type.optional ? convertJavaOptional(typeAlias.type.text) : typeAlias.type.text 
        return this.mapTypeName(rowType)
    }

    /***** TypeConvertor<JavaTypeAlias> **********************************/

    convertOptional(type: idl.IDLOptionalType): JavaTypeAlias {
        return JavaTypeAlias.fromTypeName(convertJavaOptional(this.convert(type.element)), true)
    }
    convertUnion(type: idl.IDLUnionType): JavaTypeAlias {
        const aliases = type.types.map(it => convertType(this, it))
        return JavaTypeAlias.fromTypeName(`Union_${aliases.map(it => it.alias).join('_')}`, false)
    }
    convertContainer(type: idl.IDLContainerType): JavaTypeAlias {
        if (idl.IDLContainerUtils.isSequence(type)) {
            const javaTypeAlias = convertType(this, type.elementType[0])
            return new JavaTypeAlias(`${javaTypeAlias.type.text}[]`, `Array_${javaTypeAlias.alias}`)
        }
        if (idl.IDLContainerUtils.isRecord(type)) {
            const javaTypeAliases = type.elementType.slice(0, 2).map(it => convertType(this, it)).map(this.maybeConvertPrimitiveType, this)
            return new JavaTypeAlias(`Map<${javaTypeAliases[0].type.text}, ${javaTypeAliases[1].type.text}>`, `Map_${javaTypeAliases[0].alias}_${javaTypeAliases[1].alias}`)
        }
        throw new Error(`IDL type ${idl.DebugUtils.debugPrintType(type)} not supported`)
    }
    convertEnum(type: idl.IDLEnumType): JavaTypeAlias {
        // TODO: remove prefix after full migration to IDL
        return JavaTypeAlias.fromTypeName(`Ark_${idl.getIDLTypeName(type)}`, false)
    }
    convertCallback(type: idl.IDLCallback): JavaTypeAlias {
        // TODO
        return JavaTypeAlias.fromTypeName(`Callback`, false)
    }
    convertImport(type: idl.IDLReferenceType, importClause: string): JavaTypeAlias {
        return JavaTypeAlias.fromTypeName(idl.getIDLTypeName(type), false)
    }
    convertTypeReference(type: idl.IDLReferenceType): JavaTypeAlias {
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
        if (javaCustomTypeMapping.has(typeSpec)) {
            typeSpec = javaCustomTypeMapping.get(typeSpec)!
        }
        // const qualifier = idl.getExtAttribute(type, idl.IDLExtendedAttributes.Qualifier)
        // if (qualifier) {
        //     typeSpec = `${qualifier}.${typeSpec}`
        // }
        let typeArgs = idl.getExtAttribute(type, idl.IDLExtendedAttributes.TypeArguments)?.split(",")
        if (typeSpec === `Optional`) {
            return JavaTypeAlias.fromTypeName(typeArgs![0], true)
        }
        return JavaTypeAlias.fromTypeName(typeSpec, false)
    }
    convertTypeParameter(type: idl.IDLTypeParameterType): JavaTypeAlias {
        // TODO
        return JavaTypeAlias.fromTypeName(idl.getIDLTypeName(type), false)
    }
    convertPrimitiveType(type: idl.IDLPrimitiveType): JavaTypeAlias {
        switch (type) {
            case idl.IDLAnyType: return JavaTypeAlias.fromTypeName(ARK_CUSTOM_OBJECT, false)
            case idl.IDLStringType: return JavaTypeAlias.fromTypeName('String', false)
            case idl.IDLNumberType: return JavaTypeAlias.fromTypeName('double', false)
            case idl.IDLBooleanType: return JavaTypeAlias.fromTypeName('boolean', false)
            case idl.IDLUndefinedType: return JavaTypeAlias.fromTypeName('Ark_Undefined', false)
            case idl.IDLI8Type: return JavaTypeAlias.fromTypeName('byte', false)
            case idl.IDLU8Type: return JavaTypeAlias.fromTypeName('byte', false)
            case idl.IDLI16Type: return JavaTypeAlias.fromTypeName('short', false)
            case idl.IDLU16Type: return JavaTypeAlias.fromTypeName('short', false)
            case idl.IDLI32Type: return JavaTypeAlias.fromTypeName('int', false)
            case idl.IDLU32Type: return JavaTypeAlias.fromTypeName('int', false)
            case idl.IDLI64Type: return JavaTypeAlias.fromTypeName('long', false)
            case idl.IDLU64Type: return JavaTypeAlias.fromTypeName('long', false)
            case idl.IDLF32Type: return JavaTypeAlias.fromTypeName('float', false)
            case idl.IDLF64Type: return JavaTypeAlias.fromTypeName('double', false)
            case idl.IDLPointerType: return JavaTypeAlias.fromTypeName('long', false)
            case idl.IDLVoidType: return JavaTypeAlias.fromTypeName('void', false)
        }
        throw new Error(`Unsupported IDL primitive ${idl.DebugUtils.debugPrintType(type)}`)
    }
    private readonly javaPrimitiveToReferenceTypeMap = new Map([
        ['byte', JavaTypeAlias.fromTypeName('Byte', false)],
        ['short', JavaTypeAlias.fromTypeName('Short', false)],
        ['int', JavaTypeAlias.fromTypeName('Integer', false)],
        ['float', JavaTypeAlias.fromTypeName('Float', false)],
        ['double', JavaTypeAlias.fromTypeName('Double', false)],
        ['boolean', JavaTypeAlias.fromTypeName('Boolean', false)],
        ['char', JavaTypeAlias.fromTypeName('Character', false)],
    ])
    private maybeConvertPrimitiveType(javaType: JavaTypeAlias): JavaTypeAlias {
        if (this.javaPrimitiveToReferenceTypeMap.has(javaType.type.text)) {
            return this.javaPrimitiveToReferenceTypeMap.get(javaType.type.text)!
        }
        return javaType
    }

    private callbackType(decl: idl.IDLCallback): JavaTypeAlias {
        // TODO
        //const params = decl.parameters.map(it => `${it.isVariadic ? "..." : ""}${it.name}: ${this.library.mapType(it.type)}`)
        //`((${params.join(", ")}) => ${this.library.mapType(decl.returnType)})`
        return JavaTypeAlias.fromTypeName('Callback', false)
    }

    // Tuple + ??? AnonymousClass
    private productType(decl: idl.IDLInterface, isTuple: boolean, includeFieldNames: boolean): JavaTypeAlias {
        // // TODO: other types
        if (!isTuple) throw new Error('Only tuples supported from IDL synthetic types for now')
        const javaTypeAliases = decl.properties.map(it => JavaTypeAlias.fromTypeAlias(convertType(this, it.type), it.isOptional))
        return JavaTypeAlias.fromTypeName(`Tuple_${javaTypeAliases.map(it => it.alias, false).join('_')}`, false)
    }

    /**********************************************************************/

    writeClass(name: string, op: (writer: LanguageWriter) => void, superClass?: string, interfaces?: string[], generics?: string[]): void {
        let genericsClause = generics?.length ? `<${generics.join(', ')}> ` : ``
        let extendsClause = superClass ? ` extends ${superClass}` : ''
        let implementsClause = interfaces ? ` implements ${interfaces.join(",")}` : ''
        this.printer.print(`class ${name}${genericsClause}${extendsClause}${implementsClause} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeInterface(name: string, op: (writer: LanguageWriter) => void, superInterfaces?: string[]): void {
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
        this.printer.print(`${prefix} ${(this.mapIDLType(type))} ${name}${initExpr ? ` = ${initExpr.asString()}` : ""};`)
    }
    writeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        this.writeMethodDeclaration(name, signature, [MethodModifier.STATIC, MethodModifier.NATIVE])
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: LanguageWriter) => void, superCall?: Method, modifiers?: MethodModifier[]) {
        this.printer.print(`${modifiers ? modifiers.map((it) => MethodModifier[it].toLowerCase()).join(' ') : ''} ${className}(${signature.args.map((it, index) => `${this.mapIDLType(it)} ${signature.argName(index)}`).join(", ")}) {`)
        this.pushIndent()
        if (superCall) {
            this.print(`super(${superCall.signature.args.map((_, i) => superCall?.signature.argName(i)).join(", ")});`)
        }
        op(this)
        this.popIndent()
        this.printer.print(`}`)
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
    makeCast(value: LanguageExpression, type: idl.IDLType, unsafe = false): LanguageExpression {
        return new JavaCastExpression(value, this.mapIDLType(type), unsafe)
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
                              index: number): LanguageExpression {
        return this.makeString(`${valueType} == ${index}`)
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
        switch (idl.getIDLTypeName(type)) {
            case "sequence": return `${this.mapIDLType(type.elementType[0])}[]`
        }
        throw new Error(`Unmapped container type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    mapTypeName(name: string): string {
        switch (name) {
            case 'Length': return 'String'
            case 'KPointer': return 'long'
            case 'KBoolean': return 'boolean'
            case 'KUInt': return 'int'
            case 'int32': case 'KInt': return 'int'
            case 'int64': case 'KLong': return 'long'
            case 'float32': case 'KFloat': return 'float'
            case 'Uint8Array': return 'byte[]'
            case 'KUint8ArrayPtr': return 'byte[]'
            case 'KInt32ArrayPtr': return 'int[]'
            case 'KFloat32ArrayPtr': return 'float[]'
            case 'KStringPtr': return 'String'
            case 'string': return 'String'
        }

        return name
    }
    mapIDLPrimitiveType(type: idl.IDLPrimitiveType): string {
        switch (type) {
            case idl.IDLVoidType: return 'void'
            case idl.IDLBooleanType: return 'boolean'
            case idl.IDLI8Type: return 'byte'
            case idl.IDLU8Type: return 'byte' // not really
            case idl.IDLI16Type: return 'short'
            case idl.IDLU16Type: return 'short' // not really
            case idl.IDLI32Type: return 'int'
            case idl.IDLU32Type: return 'int' // not really
            case idl.IDLI64Type: return 'long'
            case idl.IDLU64Type: return 'long' // not really
            case idl.IDLF32Type: return 'float'
            case idl.IDLF64Type: case idl.IDLNumberType: return 'double'
            case idl.IDLStringType: return 'String'
            case idl.IDLPointerType: return'long'
        }
        throw new Error(`Unmapped primitive type ${idl.DebugUtils.debugPrintType(type)}`)
    }
    nativeReceiver(): string { return 'NativeModule' }
    applyToObject(p: BaseArgConvertor, param: string, value: string, args?: ObjectArgs): LanguageStatement {
        throw new Error("Method not implemented.")
    }
    getObjectAccessor(convertor: ArgConvertor, value: string, args?: ObjectArgs): string {
        if (convertor instanceof OptionConvertor) {
            return `${value}`
        }
        if (convertor instanceof TupleConvertor && args?.index) {
            return `${value}.value${args.index}`
        }
        if (convertor instanceof UnionConvertor && args?.index) {
            return `${value}.getValue${args.index}()`
        }
        return value
    }
    makeUndefined(): LanguageExpression {
        return this.makeString("undefined")
    }
    makeRuntimeType(rt: RuntimeType): LanguageExpression {
        return this.makeString(`RuntimeType.${RuntimeType[rt]}`)
    }
    makeRuntimeTypeGetterCall(value: string): LanguageExpression {
        return this.makeMethodCall("Ark_Object", "getRuntimeType", [this.makeString(value)])
    }
    makeMapKeyTypeName(c: MapConvertor): idl.IDLType {
        throw new Error("Method not implemented.")
    }
    makeMapValueTypeName(c: MapConvertor): idl.IDLType {
        throw new Error("Method not implemented.")
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
    makeTupleAccess(value: string, index: number): LanguageExpression {
        return this.makeString(`${value}.value${index}`)
    }
    enumFromOrdinal(value: LanguageExpression, enumType: string): LanguageExpression {
        throw new Error("Method not implemented.")
    }
    ordinalFromEnum(value: LanguageExpression, enumType: string): LanguageExpression {
        throw new Error("Method not implemented.")
    }
    makeValueFromOption(value: string): LanguageExpression {
        return this.makeString(`${value}`)
    }
    runtimeType(param: ArgConvertor, valueType: string, value: string) {
        this.writeStatement(this.makeAssign(valueType, undefined,
            this.makeRuntimeTypeGetterCall(value), false))
    }
    makeSerializerCreator() {
        return this.makeString('Serializer::createSerializer');
    }
    override makeCastEnumToInt(convertor: EnumConvertorDTS, enumName: string, _unsafe?: boolean): string {
        // TODO: remove after switching to IDL
        return `${enumName}.getIntValue()`
    }
    override makeEnumCast(enumName: string, _unsafe: boolean, _convertor: EnumConvertor | undefined): string {
        return `${enumName}.getIntValue()`
    }
    override castToBoolean(value: string): string { return `${value} ? 1 : 0` }
}
