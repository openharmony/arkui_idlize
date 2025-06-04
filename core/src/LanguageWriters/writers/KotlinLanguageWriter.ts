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
import { rightmostIndexOf, throwException } from "../../util"
import { ReferenceResolver } from "../../peer-generation/ReferenceResolver";

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
        throw new Error("Not implemented")
    }
    writeInterface(name: string, op: (writer: this) => void, superInterfaces?: string[], generics?: string[], isDeclared?: boolean): void {
        throw new Error("Not implemented")
    }
    writeFunctionDeclaration(name: string, signature: MethodSignature, generics?:string[]): void {
        throw new Error("Not implemented")
    }
    writeFunctionImplementation(name: string, signature: MethodSignature, op: (writer: this) => void, generics?:string[]): void {
        throw new Error("Not implemented")
    }
    writeEnum(name: string, members: { name: string, alias?: string | undefined, stringId: string | undefined, numberId: number }[], options: { isDeclare?: boolean, isExport: boolean }): void {
        throw new Error("Not implemented")
    }
    writeFieldDeclaration(name: string, type: idl.IDLType, modifiers: FieldModifier[]|undefined, optional: boolean, initExpr?: LanguageExpression): void {
        throw new Error("Not implemented")
    }
    writeNativeMethodDeclaration(method: Method): void {
        throw new Error("Not implemented")
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void {
        throw new Error("Not implemented")
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: this) => void, superCall?: Method, modifiers?: MethodModifier[]) {
        throw new Error("Not implemented")
    }
    writeMethodImplementation(method: Method, op: (writer: this) => void) {
        throw new Error("Not implemented")
    }
    writeProperty(propName: string, propType: idl.IDLType, modifiers: FieldModifier[], getter?: { method: Method, op: () => void }, setter?: { method: Method, op: () => void }): void {
        throw new Error("Not implemented")
    }
    writeTypeDeclaration(decl: idl.IDLTypedef): void {
        throw new Error("Not implemented")
    }
    writeConstant(constName: string, constType: idl.IDLType, constVal?: string): void {
        throw new Error("Not implemented")
    }
    makeNull(): LanguageExpression {
        throw new Error("Not implemented")
    }
    makeAssign(variableName: string, type: idl.IDLType | undefined, expr: LanguageExpression | undefined, isDeclared: boolean = true, isConst: boolean = true, options?:MakeAssignOptions): LanguageStatement {
        throw new Error("Not implemented")
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        throw new Error("Not implemented")
    }
    makeThrowError(message: string): LanguageStatement {
        throw new Error("Not implemented")
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        throw new Error("Not implemented")
    }
    makeCheckOptional(optional: LanguageExpression, doStatement: LanguageStatement): LanguageStatement {
        throw new Error("Not implemented")
    }
    makeStatement(expr: LanguageExpression): LanguageStatement {
        throw new Error("Not implemented")
    }
    makeLoop(counter: string, limit: string, statement?: LanguageStatement): LanguageStatement {
        throw new Error("Not implemented")
    }
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        throw new Error("Not implemented")
    }
    writePrintLog(message: string): void {
        throw new Error("Not implemented")
    }
    makeCast(value: LanguageExpression, node: idl.IDLNode, options?: MakeCastOptions): LanguageExpression {
        throw new Error("Not implemented")
    }
    typeInstanceOf(type: idl.IDLEntry, value: string, members?: string[]): LanguageExpression {
        throw new Error("Not implemented")
    }
    getObjectAccessor(convertor: ArgConvertor, value: string, args?: ObjectArgs): string {
        throw new Error("Not implemented")
    }
    makeUndefined(): LanguageExpression {
        throw new Error("Not implemented")
    }
    makeRuntimeType(rt: RuntimeType): LanguageExpression {
        throw new Error("Not implemented")
    }
    makeTupleAlloc(option: string): LanguageStatement {
        throw new Error("Not implemented")
    }
    makeArrayInit(type: idl.IDLContainerType, size?:number): LanguageExpression {
        throw new Error("Not implemented")
    }
    makeClassInit(type: idl.IDLType, paramenters: LanguageExpression[]): LanguageExpression {
        throw new Error("Not implemented")
    }
    makeMapInit(type: idl.IDLType): LanguageExpression {
        throw new Error("Not implemented")
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        throw new Error("Not implemented")
    }
    makeUnwrapOptional(expression: LanguageExpression): LanguageExpression {
        throw new Error("Not implemented")
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
        throw new Error("Not implemented")
    }
    get supportedFieldModifiers(): FieldModifier[] {
        throw new Error("Not implemented")
    }
    enumFromI32(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        throw new Error("Not implemented")
    }
    i32FromEnum(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        throw new Error("Not implemented")
    }
    castToBoolean(value: string): string {
        throw new Error("Not implemented")
    }
    makeCallIsObject(value: string): LanguageExpression {
        throw new Error("Not implemented")
    }
    escapeKeyword(keyword: string): string {
        throw new Error("Not implemented")
    }
    makeDiscriminatorConvertor(convertor: ArgConvertor, value: string, index: number): LanguageExpression | undefined {
        throw new Error("Not implemented")
    }
    makeSerializerConstructorSignatures(): NamedMethodSignature[] | undefined {
        throw new Error("Not implemented")
    }
}