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
import {
    FieldModifier,
    LanguageExpression,
    LanguageStatement,
    LanguageWriter,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature,
    ObjectArgs
} from "../LanguageWriter"
import { TSLambdaExpression, TSLanguageWriter } from "./TsLanguageWriter"
import { IDLEnum, IDLI32Type, IDLThisType, IDLType, IDLVoidType, toIDLType } from '../../../idl'
import { EnumEntity } from "../../PeerFile"
import {AggregateConvertor, ArgConvertor, ArrayConvertor, BaseArgConvertor, CustomTypeConvertor, EnumConvertor, InterfaceConvertor, makeInterfaceTypeCheckerCall, RuntimeType} from "../../ArgConvertors"
import { Language } from "../../../Language"
import { ReferenceResolver } from "../../ReferenceResolver"
import { EtsIDLNodeToStringConvertor } from "../convertors/ETSConvertors"
import {IdlPeerLibrary} from "../../idl/IdlPeerLibrary";
import {makeEnumTypeCheckerCall} from "../../printers/TypeCheckPrinter";

////////////////////////////////////////////////////////////////
//                         STATEMENTS                         //
////////////////////////////////////////////////////////////////

export class EtsAssignStatement implements LanguageStatement {
    constructor(public variableName: string,
                public type: IDLType | undefined,
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
                    toIDLType(this.enumEntity.name),
                    [FieldModifier.STATIC, FieldModifier.READONLY],
                    false,
                    writer.makeString(`new ${this.enumEntity.name}(${ctorArgs.join(",")})`))
            })
            const typeName = isTypeString ? "string" : "KInt"
            let argTypes = [toIDLType(typeName)]
            let argNames = ["value"]
            if (isTypeString) {
                argTypes.push(toIDLType("KInt"))
                argNames.push("ordinal")
            }
            writer.writeConstructorImplementation(this.enumEntity.name,
                new NamedMethodSignature(IDLVoidType, argTypes, argNames), (writer) => {
                    writer.writeStatement(writer.makeAssign("this.value", undefined, writer.makeString("value"), false))
                    if (isTypeString) {
                        writer.writeStatement(writer.makeAssign("this.ordinal", undefined, writer.makeString("ordinal"), false))
                    }
            })
            writer.writeFieldDeclaration("value", toIDLType(typeName), [FieldModifier.PUBLIC, FieldModifier.READONLY], false)
            if (isTypeString) {
                writer.writeFieldDeclaration("ordinal", IDLI32Type, [FieldModifier.PUBLIC, FieldModifier.READONLY], false)
            }
            writer.writeMethodImplementation(new Method("of", new MethodSignature(toIDLType(this.enumEntity.name), [argTypes[0]]), [MethodModifier.PUBLIC, MethodModifier.STATIC]),
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
//                           UTILS                            //
////////////////////////////////////////////////////////////////

export function generateTypeCheckerName(typeName: string): string {
    typeName = typeName.replaceAll('[]', 'BracketsArray')
    return `is${typeName.replaceAll('[]', 'Brackets')}`
}

export function makeArrayTypeCheckCall(
    valueAccessor: string,
    typeName: string,
    writer: LanguageWriter) {
    return writer.makeMethodCall(
        "TypeChecker",
        generateTypeCheckerName(typeName),
        [writer.makeString(valueAccessor)
    ])
}

////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export class ETSLanguageWriter extends TSLanguageWriter {
    constructor(printer: IndentedPrinter, resolver:ReferenceResolver) {
        super(printer, resolver, Language.ARKTS)
        this.typeConvertor = new EtsIDLNodeToStringConvertor(this.resolver)
    }
    fork(): LanguageWriter {
        return new ETSLanguageWriter(new IndentedPrinter(), this.resolver)
    }
    writeNativeMethodDeclaration(name: string, signature: MethodSignature): void {
        if (signature.returnType === IDLThisType) {
            throw new Error('static method can not return this!')
        }
        this.writeMethodDeclaration(name, signature, [MethodModifier.STATIC, MethodModifier.NATIVE])
    }
    makeAssign(variableName: string, type: IDLType | undefined, expr: LanguageExpression, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
        return new EtsAssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        return new TSLambdaExpression(this, this.typeConvertor, signature, this.resolver, body)
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new ArkTSMapForEachStatement(map, key, value, op)
    }
    makeMapSize(map: string): LanguageExpression {
        return this.makeString(`${super.makeMapSize(map).asString()} as int32`) // TODO: cast really needed?
    }
    get supportedModifiers(): MethodModifier[] {
        return [MethodModifier.PUBLIC, MethodModifier.PRIVATE, MethodModifier.NATIVE, MethodModifier.STATIC]
    }
    nativeReceiver(): string { return 'NativeModule' }
    makeUnsafeCast(convertor: ArgConvertor, param: string): string {
        if ((convertor instanceof EnumConvertor) && !param.endsWith(".value")) {
            return `(${param} as ${this.typeConvertor.convertEntry(convertor.enumEntry)}).${convertor.isStringEnum ? 'ordinal' : 'value'}`
        }
        return super.makeUnsafeCast(convertor, param)
    }
    runtimeType(param: ArgConvertor, valueType: string, value: string) {
        super.runtimeType(param, valueType, value);
    }
    makeUnionVariantCast(value: string, type: string, convertor: ArgConvertor, index?: number): LanguageExpression {
        if (convertor instanceof EnumConvertor) {
            return this.makeString(value)
        }
        return this.makeString(`${value} as ${type}`)
    }
    ordinalFromEnum(value: LanguageExpression, _: IDLEnum): LanguageExpression {
        return value;
    }
    makeDiscriminatorFromFields(convertor: {targetType: (writer: LanguageWriter) => string},
                                value: string,
                                accessors: string[],
                                duplicates: Set<string>): LanguageExpression {
        if (convertor instanceof CustomTypeConvertor) {
            return this.makeString(`${value} instanceof ${convertor.customTypeName}`)
        }
        if (convertor instanceof AggregateConvertor || convertor instanceof InterfaceConvertor) {
            return this.instanceOf(convertor, value, duplicates)
        }
        return this.makeString(`${value} instanceof ${convertor.targetType(this)}`)
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
        return super.getObjectAccessor(convertor, value, args);
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable: boolean = false) {
        // ArkTS does not support - 'this.?'
        super.writeMethodCall(receiver, method, params, nullable && receiver !== "this");
    }
    writeProperty(propName: string, propType: IDLType) {
        throw new Error("writeProperty for ArkTS is not implemented yet.")
    }
    override makeEnumCast(value: string, _unsafe: boolean, convertor: EnumConvertor | undefined): string {
        return this.makeCast(this.makeString(`${value}.${convertor?.isStringEnum ? "ordinal" : "value"}`),
            IDLI32Type).asString();
    }
    makeUnionVariantCondition(convertor: ArgConvertor, valueName: string, valueType: string, type: string, index?: number): LanguageExpression {
        if (convertor instanceof EnumConvertor) {
            return this.instanceOf(convertor, valueName);
        }
        return super.makeUnionVariantCondition(convertor, valueName, valueType, type, index);
    }
    makeCastCustomObject(customName: string, isGenericType: boolean): LanguageExpression {
        if (isGenericType) {
            return this.makeCast(this.makeString(customName), toIDLType("Object"))
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
    makeDiscriminatorConvertor(convertor: EnumConvertor, value: string, index: number): LanguageExpression {
        return this.discriminatorFromExpressions(value, RuntimeType.OBJECT, [
            makeEnumTypeCheckerCall(value, this.stringifyType(convertor.idlType), this)
        ])
    }
    override castToInt(value: string, bitness: 8 | 32): string {
        return `${value} as int32` // FIXME: is there int8 in ARKTS?
    }
    override castToBoolean(value: string): string { return `${value} ? 1 : 0` }

    override instanceOf(convertor: BaseArgConvertor, value: string, duplicateMembers?: Set<string>): LanguageExpression {
        if (convertor instanceof InterfaceConvertor && convertor.declaration.properties.length > 0) {
            return makeInterfaceTypeCheckerCall(value,
                this.stringifyType(convertor.idlType),
                convertor.declaration.properties.map(it => it.name),
                duplicateMembers!,
                this)
        }
        if (convertor instanceof AggregateConvertor) {
            return makeInterfaceTypeCheckerCall(value,
                convertor.aliasName !== undefined ? convertor.aliasName : this.stringifyType(convertor.idlType),
                convertor.members.map(it => it[0]), duplicateMembers!, this)
        }
        if (convertor instanceof ArrayConvertor) {
            return makeArrayTypeCheckCall(value,
                (this.resolver as IdlPeerLibrary).getTypeName(convertor.idlType), this)
        }
        if (convertor instanceof EnumConvertor) {
            return this.makeString(`${value} instanceof ${this.typeConvertor.convert(convertor.enumEntry)}`)
        }
        return super.instanceOf(convertor, value, duplicateMembers)
    }
}
