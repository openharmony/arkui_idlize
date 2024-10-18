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
import { capitalize } from "../../../util"
import { AggregateConvertor, ArrayConvertor, EnumConvertor, OptionConvertor, StringConvertor } from "../../Convertors"
import { FieldModifier, LanguageExpression, LanguageStatement, LanguageWriter, Method, MethodModifier, MethodSignature, NamedMethodSignature, ObjectArgs, Type } from "../LanguageWriter"
import { TSLambdaExpression, TSLanguageWriter } from "./TsLanguageWriter"
import { IDLBooleanType, IDLContainerType, IDLF32Type, IDLF64Type, IDLI16Type, IDLI32Type, IDLI64Type, IDLI8Type, IDLNumberType, IDLPointerType, IDLPrimitiveType, IDLStringType, IDLType, IDLU16Type, IDLU32Type, IDLU64Type, IDLU8Type, IDLVoidType  } from '../../../idl'
import { EnumEntity } from "../../PeerFile"
import { createLiteralDeclName } from "../../TypeNodeNameConvertor"
import { ArgConvertor, CustomTypeConvertor, RuntimeType } from "../../ArgConvertors"
import { makeArrayTypeCheckCall } from "../../printers/TypeCheckPrinter"
import { Language } from "../../../Language"

////////////////////////////////////////////////////////////////
//                         STATEMENTS                         //
////////////////////////////////////////////////////////////////

export class EtsAssignStatement implements LanguageStatement {
    constructor(public variableName: string,
                public type: Type | undefined,
                public expression: LanguageExpression,
                public isDeclared: boolean = true,
                protected isConst: boolean = true) { }
    write(writer: LanguageWriter): void {
        if (this.isDeclared) {
            const typeSpec = ""
            const initValue = this.expression !== undefined ? this.expression : writer.makeUndefined()
            writer.print(`${this.isConst ? "const" : "let"} ${this.variableName}${typeSpec} = ${initValue.asString()}`)
        } else {
            writer.print(`${this.variableName} = ${this.expression.asString()}`)
        }
    }
}

class ArkTSMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private op: () => void) {}
    write(writer: LanguageWriter): void {
        writer.print(`// TODO: map serialization not implemented`)
    }
}

export class ArkTSEnumEntityStatement implements LanguageStatement {
    constructor(private readonly enumEntity: EnumEntity, private readonly isExport: boolean) {}

    write(writer: LanguageWriter) {
        writer.print(this.enumEntity.comment.length > 0 ? this.enumEntity.comment : undefined)
        writer.writeClass(this.enumEntity.name, (writer) => {
            let isTypeString = true
            this.enumEntity.members.forEach((member, index) => {
                writer.print(member.comment.length > 0 ? member.comment : undefined)
                const initText = member.initializerText?.replaceAll('"', '').replaceAll("'", "") ?? `${index}`
                isTypeString &&= isNaN(Number(initText))
                const ctorArgs = [
                    isTypeString ? `"${initText}"` : initText,
                    isTypeString ? index : undefined
                ].filter(it => it !== undefined)
                writer.writeFieldDeclaration(member.name,
                    new Type(this.enumEntity.name),
                    [FieldModifier.STATIC, FieldModifier.READONLY],
                    false,
                    writer.makeString(`new ${this.enumEntity.name}(${ctorArgs.join(",")})`))
            })
            const typeName = isTypeString ? "string" : "KInt"
            let argTypes = [new Type(typeName)]
            let argNames = ["value"]
            if (isTypeString) {
                argTypes.push(new Type("KInt"))
                argNames.push("ordinal")
            }
            writer.writeConstructorImplementation(this.enumEntity.name,
                new NamedMethodSignature(Type.Void, argTypes, argNames), (writer) => {
                    writer.writeStatement(writer.makeAssign("this.value", undefined, writer.makeString("value"), false))
                    if (isTypeString) {
                        writer.writeStatement(writer.makeAssign("this.ordinal", undefined, writer.makeString("ordinal"), false))
                    }
            })
            writer.writeFieldDeclaration("value", new Type(typeName), [FieldModifier.PUBLIC, FieldModifier.READONLY], false)
            if (isTypeString) {
                writer.writeFieldDeclaration("ordinal", new Type("KInt"), [FieldModifier.PUBLIC, FieldModifier.READONLY], false)
            }
            writer.writeMethodImplementation(new Method("of", new MethodSignature(new Type(this.enumEntity.name), [argTypes[0]]), [MethodModifier.PUBLIC, MethodModifier.STATIC]),
                (writer)=> {
                    this.enumEntity.members.forEach((member) => {
                        const memberName = `${this.enumEntity.name}.${member.name}`
                        writer.writeStatement(
                            writer.makeCondition(
                                writer.makeEquals([writer.makeString('arg0'), writer.makeString(`${memberName}.value`)]),
                                writer.makeReturn(writer.makeString(memberName)))
                        )
                    })
                    writer.print("throw new Error(`Enum member '$\{arg0\}' not found`)")
            })
        })
    }
}

////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export class ETSLanguageWriter extends TSLanguageWriter {
    constructor(printer: IndentedPrinter) {
        super(printer, Language.ARKTS)
    }
    writeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        this.writeMethodDeclaration(name, signature, [MethodModifier.STATIC, MethodModifier.NATIVE])
    }
    makeAssign(variableName: string, type: Type | undefined, expr: LanguageExpression, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
        return new EtsAssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        return new TSLambdaExpression(signature, body)
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new ArkTSMapForEachStatement(map, key, value, op)
    }
    makeMapSize(map: string): LanguageExpression {
        return this.makeString(`${super.makeMapSize(map).asString()} as int32`) // TODO: cast really needed?
    }
    mapIDLContainerType(type: IDLContainerType, args: string[]): string {
        switch (type.name) {
            case 'sequence': {
                switch (type.elementType[0].name) {
                    case IDLU8Type.name: return 'KUint8ArrayPtr'
                    case IDLI32Type.name: return 'KInt32ArrayPtr'
                    case IDLF32Type.name: return 'KFloat32ArrayPtr'
                }
            }
        }
        return super.mapIDLContainerType(type, args)
    }
    mapType(type: Type, convertor?: ArgConvertor): string {
        if (convertor instanceof EnumConvertor) {
            return convertor.enumTypeName(this.language)
        }
        if (convertor instanceof AggregateConvertor && convertor.aliasName !== undefined) {
            return convertor.aliasName
        }
        if (convertor instanceof ArrayConvertor) {
            return convertor.isArrayType
                ? `${convertor.elementTypeName()}[]`
                : `Array<${convertor.elementTypeName()}>`
        }
        switch (type.name) {
            case 'Uint8Array': return 'KUint8ArrayPtr'
        }
        return super.mapType(type)
    }
    mapIDLPrimitiveType(type: IDLPrimitiveType): string {
        switch (type) {
            case IDLPointerType: return 'KPointer'
            case IDLVoidType: return 'void'
            case IDLBooleanType: return 'KBoolean'

            case IDLI8Type:
            case IDLU8Type:
            case IDLI16Type:
            case IDLU16Type:
            case IDLI32Type:
            case IDLU32Type:
                return 'KInt'

            case IDLI64Type:
            case IDLU64Type:
                return 'KLong'

            case IDLF32Type:
                return 'KFloat'

            case IDLF64Type:
            case IDLNumberType:
                return 'number'

            case IDLStringType: return 'KStringPtr'
        }
        return super.mapIDLPrimitiveType(type)
    }
    get supportedModifiers(): MethodModifier[] {
        return [MethodModifier.PUBLIC, MethodModifier.PRIVATE, MethodModifier.NATIVE, MethodModifier.STATIC]
    }
    nativeReceiver(): string { return 'NativeModule' }
    makeUnsafeCast(convertor: ArgConvertor, param: string): string {
        if (convertor instanceof EnumConvertor && !param.endsWith(".value")) {
            return `(${param} as ${convertor.enumTypeName(this.language)}).${convertor.isStringEnum ? 'ordinal' : 'value'}`
        }
        return super.makeUnsafeCast(convertor, param)
    }
    runtimeType(param: ArgConvertor, valueType: string, value: string) {
        if (param instanceof OptionConvertor) {
            this.writeStatement(this.makeCondition(this.makeString(`${value} != undefined`), this.makeAssign(valueType, undefined,
                this.makeRuntimeType(RuntimeType.OBJECT), false)))
        } else {
            super.runtimeType(param, valueType, value);
        }
    }
    makeUnionVariantCast(value: string, type: Type, convertor: ArgConvertor, index?: number): LanguageExpression {
        return this.makeString(`${value} as ${type.name}`)
    }
    ordinalFromEnum(value: LanguageExpression, enumType: string): LanguageExpression {
        return value;
    }
    makeDiscriminatorFromFields(convertor: {targetType: (writer: LanguageWriter) => Type}, value: string, accessors: string[]): LanguageExpression {
        if (convertor instanceof CustomTypeConvertor) {
            return this.makeString(`${value} instanceof ${convertor.customTypeName}`)
        }
        return this.makeString(`${value} instanceof ${convertor.targetType(this).name}`)
    }
    makeValueFromOption(value: string, destinationConvertor: ArgConvertor): LanguageExpression {
        if (destinationConvertor instanceof EnumConvertor) {
            return this.makeString(`${value}!`)
        }
        return super.makeValueFromOption(value, destinationConvertor)
    }
    makeCallIsResource(value: string): LanguageExpression {
        return this.makeString(`isResource(${value})`);
    }
    makeEnumEntity(enumEntity: EnumEntity, isExport: boolean): LanguageStatement {
        return new ArkTSEnumEntityStatement(enumEntity, isExport);
    }
    getObjectAccessor(convertor: ArgConvertor, value: string, args?: ObjectArgs): string {
        if (convertor instanceof StringConvertor && convertor.isLiteral()) {
            return `${value}.toString()`
        }
        return super.getObjectAccessor(convertor, value, args);
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable: boolean = false) {
        // ArkTS does not support - 'this.?'
        super.writeMethodCall(receiver, method, params, nullable && receiver !== "this");
    }
    compareLiteral(expr: LanguageExpression, literal: string): LanguageExpression {
        return super.makeNaryOp('instanceof', [expr, this.makeString(createLiteralDeclName(capitalize(literal)))]);
    }
    makeCastEnumToInt(convertor: EnumConvertor, value: string, _unsafe?: boolean): string {
        return this.makeCast(this.makeString(`${value}.${convertor.isStringEnum ? "ordinal" : "value"}`),
            new Type('int32')).asString();
    }
    makeUnionVariantCondition(convertor: ArgConvertor, valueName: string, valueType: string, type: string, index?: number): LanguageExpression {
        if (convertor instanceof EnumConvertor) {
            return this.makeString(`${valueName} instanceof ${convertor.enumTypeName(this.language)}`)
        } else if (convertor instanceof StringConvertor && convertor.isLiteral()) {
            return this.makeString(`${valueName} instanceof ${convertor.tsTypeName}`)
        }
        return super.makeUnionVariantCondition(convertor, valueName, valueType, type, index);
    }
    makeCastCustomObject(customName: string, isGenericType: boolean): LanguageExpression {
        if (isGenericType) {
            return this.makeCast(this.makeString(customName), new Type("Object"))
        }
        return super.makeCastCustomObject(customName, isGenericType);
    }
    makeHasOwnProperty(value: string,
                       valueTypeName: string,
                       property: string,
                       propertyTypeName: string): LanguageExpression {
        return this.makeNaryOp("&&", [
            this.makeString(`${value} instanceof ${valueTypeName}`),
            this.makeString(`${value}.${property} instanceof ${propertyTypeName}`)])
    }
    makeEquals(args: LanguageExpression[]): LanguageExpression {
        // TODO: Error elimination: 'TypeError: Both operands have to be reference types'
        // the '==' operator must be used when one of the operands is a reference
        return super.makeNaryOp('==', args);
    }
    override arrayDiscriminatorFromTypeOrExpressions(value: string,
                                                     checkedType: string,
                                                     runtimeType: RuntimeType,
                                                     exprs: LanguageExpression[]): LanguageExpression {
        return makeArrayTypeCheckCall(value, checkedType, this)
    }
    makeDiscriminatorConvertor(convertor: EnumConvertor, value: string, index: number): LanguageExpression {
        return this.discriminatorFromExpressions(value, RuntimeType.OBJECT, [
            this.makeString(`${value} instanceof ${convertor.enumTypeName(this.language)}`)
        ])
    }
    override castToInt(value: string, bitness: 8 | 32): string {
        return `${value} as int32` // FIXME: is there int8 in ARKTS?
    }
    override castToBoolean(value: string): string { return `${value} ? 1 : 0` }
}
