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

import { IndentedPrinter } from "../../IndentedPrinter.js"
import {
    BlockStatement,
    LambdaExpression,
    LanguageExpression,
    LanguageStatement,
    LanguageWriter,
    MakeAssignOptions,
    MakeCastOptions,
    Method,
    MethodModifier,
    MethodSignature,
} from "../LanguageWriter.js"
import { TSCastExpression, TSLanguageWriter } from "./TsLanguageWriter.js"
import { IDLType, isPrimitiveType } from '../../idl/index.js'
import {
    ArgConvertor,
    getEnumToOrdinalName,
    makeETSDiscriminatorFromFields,
} from "../ArgConvertors.js"
import * as idl from '../../idl/index.js'
import { IdlNameConvertor, withInsideInstanceof } from "../nameConvertor.js"
import { Language } from "../../Language.js";
import { RuntimeType } from "../common.js";
import { ReferenceResolver } from "../../peer-generation/ReferenceResolver.js";

////////////////////////////////////////////////////////////////
//                        EXPRESSIONS                         //
////////////////////////////////////////////////////////////////

export class ETSStringExpression implements LanguageExpression {
    constructor(public value: string) { }

    private changeQuotes(value:string) {
        return `'${value.substring(1, value.length - 1)}'`
    }

    asString(): string {
        if (this.value.startsWith('"') && this.value.endsWith('"')) {
            return this.changeQuotes(this.value)
        }
        return this.value
    }
}

////////////////////////////////////////////////////////////////
//                         STATEMENTS                         //
////////////////////////////////////////////////////////////////

export class EtsAssignStatement implements LanguageStatement {
    constructor(public variableName: string,
                public type: IDLType | undefined,
                public expression: LanguageExpression,
                public isDeclared: boolean = true,
                protected isConst: boolean = true,
                protected options?: MakeAssignOptions
            ) { }
    write(writer: LanguageWriter): void {
        if (this.isDeclared) {
            const typeClause = this.type !== undefined ? `: ${writer.getNodeName(this.type)}` : ''
            const maybeAssign = this.expression !== undefined ? " = " : ""
            const initValue = this.expression !== undefined ? this.expression : writer.makeString("")
            writer.print(`${this.isConst ? "const" : "let"} ${this.variableName}${typeClause}${maybeAssign}${initValue.asString()}`)
        } else {
            const receiver = this.options?.receiver
            const withReceiver = receiver ? `${receiver}.` : ""
            writer.print(`${withReceiver}${this.variableName} = ${this.expression.asString()}`)
        }
    }
}

class ArkTSMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private body: LanguageStatement[]) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (const pair of ${this.map}) {`)
        writer.pushIndent()
        writer.print(`const ${this.key} = pair[0]`)
        writer.print(`const ${this.value} = pair[1]`)
        writer.writeStatement(new BlockStatement(this.body, false))
        writer.popIndent()
        writer.print(`}`)
    }
}

export class ETSLambdaExpression extends LambdaExpression {
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
            const maybeOptional = idl.isOptionalType(it) && !idl.hasExtAttribute(it, idl.IDLExtendedAttributes.UnionOnlyNull) ? "?" : ""
            return `${this.signature.argName(i)}${maybeOptional}: ${this.convertor.convert(it)}`
        })
        // Workaround to fix ArkTS error: SyntaxError: Unexpected token, arrow (=>)
        // Issue: https://rnd-gitlab-msc.huawei.com/rus-os-team/virtual-machines-and-tools/panda/-/issues/21333
        let isRetTypeCallback = idl.isCallback(this.signature.returnType)
        if (idl.isReferenceType(this.signature.returnType)) {
            const resolved = this.resolver.resolveTypeReference(this.signature.returnType)
            isRetTypeCallback = resolved !== undefined && idl.isCallback(resolved)
        }
        return `(${params.join(", ")})${isRetTypeCallback
            ? "" : `:${this.convertor.convert(this.signature.returnType)}`} =>${this.bodyAsString(true)}`
    }
}

////////////////////////////////////////////////////////////////
//                           UTILS                            //
////////////////////////////////////////////////////////////////

export function generateEnumToNumericName(entry: idl.IDLEntry): string {
    const typeName = idl.getQualifiedName(entry, "namespace.name").split('.').join('_')
    return `${typeName}_ToNumeric`
}

export function generateEnumFromNumericName(entry: idl.IDLEntry): string {
    const typeName = idl.getQualifiedName(entry, "namespace.name").split('.').join('_')
    return `${typeName}_FromNumeric`
}

////////////////////////////////////////////////////////////////
//                           WRITER                           //
////////////////////////////////////////////////////////////////

export class ETSLanguageWriter extends TSLanguageWriter {
    constructor(printer: IndentedPrinter,
                resolver: ReferenceResolver,
                typeConvertor: IdlNameConvertor,
                private arrayConvertor: IdlNameConvertor) {
        super(printer, resolver, typeConvertor, Language.ARKTS)
    }

    fork(options?: { resolver?: ReferenceResolver }): LanguageWriter {
        return new ETSLanguageWriter(new IndentedPrinter([], this.indentDepth()), options?.resolver ?? this.resolver, this.typeConvertor, this.arrayConvertor)
    }
    makeAssign(variableName: string, type: IDLType | undefined, expr: LanguageExpression, isDeclared: boolean = true, isConst: boolean = true, options?: MakeAssignOptions): LanguageStatement {
        return new EtsAssignStatement(variableName, type, expr, isDeclared, isConst, options)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        return new ETSLambdaExpression(this, this.typeConvertor, signature, this.resolver, body)
    }
    makeString(value: string): LanguageExpression {
        return new ETSStringExpression(value)
    }
    makeArrayInit(type: idl.IDLContainerType, size?: number | string, options?: { initializerFunction?: LanguageExpression }): LanguageExpression {
        if (options?.initializerFunction !== undefined) {
            if (size === undefined) {
                throw new Error("Size must be provided if initializer function is provided")
            }
            return this.makeString(`new Array<${this.getNodeName(type.elementType[0])}>(${size.toString()}, ${options.initializerFunction.asString()})`)
        } else {
            if (size !== undefined) {
                throw new Error("Size requires initializer function to be provided")
            }
            return this.makeString(`new Array<${this.getNodeName(type.elementType[0])}>()`)
        }
    }
    makeArrayResize(array: string, arrayType: string, length: string, deserializer: string): LanguageStatement {
        throw new Error("Resizing arrays is not supported in ETS")
    }
    override writeEnum(name: string, members: { name: string, alias?: string | undefined, stringId: string | undefined, numberId: number }[], options: { isDeclare?: boolean, isExport: boolean }): void {
        const needsLong = members.some(m => m.stringId === undefined && (m.numberId > 0x7FFFFFFF || m.numberId < -0x80000000))
        this.printer.print(`${options.isExport ? "export " : ""}${options.isDeclare ? "declare " : ""}enum ${name}${needsLong ? ": long" : ""} {`)
        this.printer.pushIndent()
        for (const [index, member] of members.entries()) {
            let value
            if (member.alias !== undefined) {
                value = member.alias
            } else {
                value = `${member.stringId != undefined ? `'${member.stringId}'` : `${member.numberId}`}`
            }
            const maybeComma = index < members.length - 1 ? "," : ""
            this.printer.print(`${member.name} = ${value}${maybeComma}`)
        }
        this.printer.popIndent()
        this.printer.print("}")
    }
    makeMapForEach(map: string, key: string, value: string, body: LanguageStatement[]): LanguageStatement {
        return new ArkTSMapForEachStatement(map, key, value, body)
    }
    makeMapSize(map: string): LanguageExpression {
        return this.makeString(`${super.makeMapSize(map).asString()}`) // Improve: cast really needed?
    }
    get supportedModifiers(): MethodModifier[] {
        return [
            MethodModifier.PUBLIC,
            MethodModifier.PRIVATE,
            MethodModifier.NATIVE,
            MethodModifier.STATIC,
            MethodModifier.ABSTRACT
        ]
    }
    runtimeType(param: ArgConvertor, valueType: string, value: string) {
        super.runtimeType(param, valueType, value)
    }
    makeUnionVariantCast(value: string, type: string, convertor: ArgConvertor, index?: number): LanguageExpression {
        return this.makeString(`${value} as ${type}`)
    }
    i32FromEnum(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        if (idl.isStringEnum(enumEntry)) {
            let extractorStatement = this.makeFunctionCall(getEnumToOrdinalName(this.language, enumEntry), [value])
            if (enumEntry.elements.some(it => idl.hasExtAttribute(it, idl.IDLExtendedAttributes.OriginalEnumMemberName))) {
                extractorStatement = this.makeNaryOp('%', [
                    extractorStatement,
                    this.makeString(enumEntry.elements.length.toString())
                ])
            }
            return extractorStatement
        } else {
            return this.makeMethodCall(value.asString(), 'valueOf', [])
        }
    }
    enumFromI32(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        const enumName = this.getNodeName(enumEntry)
        return idl.isStringEnum(enumEntry)
            ? this.makeString(`${enumName}.values()[${value.asString()}]`)
            : this.makeMethodCall(enumName, 'fromValue', [value])
    }
    makeDiscriminatorFromFields(convertor: {targetType: (writer: LanguageWriter) => string},
                                value: string,
                                accessors: string[],
                                duplicates: Set<string>): LanguageExpression {
        return makeETSDiscriminatorFromFields(this, convertor, value, accessors, duplicates)
    }
    makeValueFromOption(value: string, destinationConvertor: ArgConvertor): LanguageExpression {
        if (idl.isEnum(this.resolver.toDeclaration(destinationConvertor.nativeType()))) {
            return this.makeCast(this.makeString(value), destinationConvertor.idlType)
        }
        return super.makeValueFromOption(value, destinationConvertor)
    }

    writeMethodCall(receiver: string, method: string, params: string[], nullable: boolean = false) {
        // ArkTS does not support - 'this.?'
        super.writeMethodCall(receiver, method, params, nullable && receiver !== "this")
    }
    isQuickType(type: IDLType): boolean {
        return idl.asPromise(type) == undefined
    }
    writeNativeMethodDeclaration(method: Method): void {
        if (isPrimitiveType(method.signature.returnType, 'this')) {
            throw new Error('static method can not return this!')
        }
        this.writeMethodDeclaration(method.name, method.signature, [MethodModifier.STATIC, MethodModifier.NATIVE])
    }
    makeCastCustomObject(customName: string, isGenericType: boolean): LanguageExpression {
        if (isGenericType) {
            return this.makeCast(this.makeString(customName), idl.createPrimitiveType('Object'))
        }
        return super.makeCastCustomObject(customName, isGenericType)
    }
    makeEquals(args: LanguageExpression[]): LanguageExpression {
        // Improve: Error elimination: 'TypeError: Both operands have to be reference types'
        // the '==' operator must be used when one of the operands is a reference
        return super.makeNaryOp('==', args)
    }
    override discriminate(value: string, index: number, type: idl.IDLType, runtimeTypes: RuntimeType[]): string {
        return `${value} instanceof ${withInsideInstanceof(true, () => {
            return this.getNodeName(type)
        })}`
    }
    override castToInt(value: string, bitness: 8 | 32): string {
        // This fix is used to avoid unnecessary writeInt8(value as int32) call, which is generated if value is already an int32
        // The explicit cast forces ui2abc to call valueOf on an int, which fails the compilation
        // Improve Fix this cast
        if (bitness === 8) 
            return `(${value}).toByte()`
        return `(${value}).toInt()` // Improve: is there int8 in ARKTS?
    }
    override castToBoolean(value: string): string { return `${value} ? true : false` }

    makeCast(value: LanguageExpression, node: idl.IDLNode, options?: MakeCastOptions): LanguageExpression {
        if (idl.isPrimitiveType(node, 'i64'))
            return this.makeMethodCall(value.asString() + '!', `toLong`, [])
        if (idl.isPrimitiveType(node, 'i32'))
            return this.makeMethodCall(value.asString() + '!', `toInt`, [])
        if (idl.isPrimitiveType(node, 'i8'))
            return this.makeMethodCall(value.asString() + '!', `toByte`, [])
        if (idl.isPrimitiveType(node, 'f64'))
            return this.makeMethodCall(value.asString() + '!', `toDouble`, [])
        if (idl.isPrimitiveType(node, 'f32'))
            return this.makeMethodCall(value.asString() + '!', `toFloat`, [])
        return new TSCastExpression(value, `${this.getNodeName(node)}`, options?.unsafe ?? false)
    }
    override instanceOf(value: string, type: idl.IDLType): LanguageExpression {
        return this.makeString(this.discriminate(value, -1, type, []))
    }
}
