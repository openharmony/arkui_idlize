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

import { IndentedPrinter } from "../../IndentedPrinter"
import {
    LambdaExpression,
    LanguageExpression,
    LanguageStatement,
    LanguageWriter,
    MakeCastOptions,
    Method,
    MethodModifier,
    MethodSignature,
    NamedMethodSignature,
    ObjectArgs
} from "../LanguageWriter"
import { TSCastExpression, TSLanguageWriter } from "./TsLanguageWriter"
import { getExtAttribute, IDLEnum, IDLI32Type, IDLThisType, IDLType, IDLVoidType } from '../../idl'
import {
    ArgConvertor,
    AggregateConvertor,
    ArrayConvertor,
    CustomTypeConvertor,
    InterfaceConvertor,
    MaterializedClassConvertor,
    OptionConvertor,
    UnionConvertor,
    BufferConvertor
} from "../ArgConvertors"
import * as idl from '../../idl'
import { convertDeclaration, IdlNameConvertor } from "../nameConvertor"
import { createDeclarationNameConvertor } from "../../peer-generation/idl/IdlNameConvertor";
import { Language } from "../../Language";
import { RuntimeType } from "../common";
import { throwException } from "../../util";
import { ReferenceResolver } from "../../peer-generation/ReferenceResolver";

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
            const typeClause = this.type !== undefined ? `: ${writer.getNodeName(this.type)}` : ''
            const maybeAssign = this.expression !== undefined ? " = " : ""
            const initValue = this.expression !== undefined ? this.expression : writer.makeString("")
            writer.print(`${this.isConst ? "const" : "let"} ${this.variableName} ${typeClause}${maybeAssign}${initValue.asString()}`)
        } else {
            writer.print(`${this.variableName} = ${this.expression.asString()}`)
        }
    }
}

class ArkTSMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private op: () => void) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (const pair of ${this.map}) {`)
        writer.pushIndent()
        writer.print(`const ${this.key} = pair[0]`)
        writer.print(`const ${this.value} = pair[1]`)
        this.op()
        writer.popIndent()
        writer.print(`}`)
    }
}

export class ArkTSEnumEntityStatement implements LanguageStatement {
    constructor(private readonly enumEntity: IDLEnum, private readonly isExport: boolean) {}

    write(writer: LanguageWriter) {
        let enumName = convertDeclaration(createDeclarationNameConvertor(Language.ARKTS), this.enumEntity)
        enumName = enumName.split('.').at(-1)!
        const members
            = this.enumEntity.elements
            .flatMap((member, index) => {
                const initText = member.initializer ?? index
                const isTypeString = typeof initText !== "number"
                const originalName = getExtAttribute(member, idl.IDLExtendedAttributes.OriginalEnumMemberName)
                const res: {
                    name: string,
                    alias: string | undefined,
                    stringId: string | undefined,
                    numberId: number
                }[] = [{
                    name: member.name,
                    alias: undefined,
                    stringId: isTypeString ? initText : undefined,
                    numberId: initText as number
                }]
                if (originalName !== undefined) {
                    res.push({
                        name: originalName,
                        alias: undefined,
                        stringId: isTypeString ? initText : undefined,
                        numberId: initText as number
                    })
                    //TODO: enums do not support member aliases
                    // res.push({
                    //     name: originalName,
                    //     alias: member.name,
                    //     stringId: undefined,
                    //     numberId: initText as number
                    // })
                }
                return res
            })

        const nss = idl.getNamespacesPathFor(this.enumEntity)
        nss.forEach(it => writer.pushNamespace(it.name))
        writer.writeEnum(enumName, members)
        nss.forEach(() => writer.popNamespace())
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
            const maybeOptional = idl.isOptionalType(it) ? "?" : ""
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
            ? "" : `:${this.convertor.convert(this.signature.returnType)}`} => { ${this.bodyAsString()} }`
    }
}

////////////////////////////////////////////////////////////////
//                           UTILS                            //
////////////////////////////////////////////////////////////////

export function generateTypeCheckerName(typeName: string): string {
    typeName = typeName.replaceAll('[]', 'BracketsArray')
    .replaceAll('.', '') // Todo: hack for namespaces
    return `is${typeName.replaceAll('[]', 'Brackets')}`
}

export function generateEnumToOrdinalName(typeName: string): string {
    typeName = typeName.split(".").join("_")
    return `${typeName}_ToOrdinal`
}

export function generateEnumFromOrdinalName(typeName: string): string {
    typeName = typeName.split(".").join("_")
    return `${typeName}_FromOrdinal`
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
    constructor(printer: IndentedPrinter,
                resolver: ReferenceResolver,
                typeConvertor: IdlNameConvertor,
                private arrayConvertor: IdlNameConvertor) {
        super(printer, resolver, typeConvertor, Language.ARKTS)
    }
    fork(options?: { resolver?: ReferenceResolver }): LanguageWriter {
        return new ETSLanguageWriter(new IndentedPrinter(), options?.resolver ?? this.resolver, this.typeConvertor, this.arrayConvertor)
    }
    makeAssign(variableName: string, type: IDLType | undefined, expr: LanguageExpression, isDeclared: boolean = true, isConst: boolean = true): LanguageStatement {
        return new EtsAssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        return new ETSLambdaExpression(this, this.typeConvertor, signature, this.resolver, body)
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
    runtimeType(param: ArgConvertor, valueType: string, value: string) {
        super.runtimeType(param, valueType, value)
    }
    makeUnionVariantCast(value: string, type: string, convertor: ArgConvertor, index?: number): LanguageExpression {
        return this.makeString(`${value} as ${type}`)
    }
    enumFromOrdinal(value: LanguageExpression, enumEntry: idl.IDLType): LanguageExpression {
        const enumName = this.getNodeName(enumEntry)
        return this.makeMethodCall('TypeChecker', generateEnumFromOrdinalName(enumName), [this.makeString(value.asString())])
    }
    ordinalFromEnum(value: LanguageExpression, enumEntry: idl.IDLType): LanguageExpression {
        const enumName = this.getNodeName(enumEntry)
        return this.makeMethodCall('TypeChecker', generateEnumToOrdinalName(enumName), [this.makeString(value.asString())])
    }
    makeDiscriminatorFromFields(convertor: {targetType: (writer: LanguageWriter) => string},
                                value: string,
                                accessors: string[],
                                duplicates: Set<string>): LanguageExpression {
        if (convertor instanceof AggregateConvertor
            || convertor instanceof InterfaceConvertor
            || convertor instanceof MaterializedClassConvertor
            || convertor instanceof CustomTypeConvertor) {
            return this.instanceOf(convertor, value, duplicates)
        }
        return this.makeString(`${value} instanceof ${convertor.targetType(this)}`)
    }
    makeValueFromOption(value: string, destinationConvertor: ArgConvertor): LanguageExpression {
        if (idl.isEnum(this.resolver.toDeclaration(destinationConvertor.nativeType()))) {
            return this.makeCast(this.makeString(value), destinationConvertor.idlType)
        }
        return super.makeValueFromOption(value, destinationConvertor)
    }
    override makeIsTypeCall(value: string, decl: idl.IDLInterface): LanguageExpression {
        return makeInterfaceTypeCheckerCall(value, decl.name,
            decl.properties.map(it => it.name), new Set(), this)
    }
    makeEnumEntity(enumEntity: IDLEnum, isExport: boolean): LanguageStatement {
        return new ArkTSEnumEntityStatement(enumEntity, isExport)
    }
    getObjectAccessor(convertor: ArgConvertor, value: string, args?: ObjectArgs): string {
        return super.getObjectAccessor(convertor, value, args)
    }
    writeMethodCall(receiver: string, method: string, params: string[], nullable: boolean = false) {
        // ArkTS does not support - 'this.?'
        super.writeMethodCall(receiver, method, params, nullable && receiver !== "this")
    }
    isQuickType(type: IDLType): boolean {
        return idl.asPromise(type) == undefined
    }
    writeNativeMethodDeclaration(method: Method): void {
        if (method.signature.returnType === IDLThisType) {
            throw new Error('static method can not return this!')
        }
        this.writeMethodDeclaration(method.name, method.signature, [MethodModifier.STATIC, MethodModifier.NATIVE])
    }

    writeProperty(propName: string, propType: IDLType) {
        throw new Error("writeProperty for ArkTS is not implemented yet.")
    }
    //makeSerializedBufferGetter(serializer: string): LanguageExpression {
    //    return this.makeMethodCall(serializer, `asPointer`, [])
    //}
    makeUnionVariantCondition(convertor: ArgConvertor, valueName: string, valueType: string, type: string,
                              convertorIndex: number,
                              runtimeTypeIndex: number): LanguageExpression {
        if (idl.isEnum(this.resolver.toDeclaration(convertor.nativeType()))) {
            return this.instanceOf(convertor, valueName)
        }
        // TODO: in ArkTS SerializerBase.runtimeType returns RuntimeType.OBJECT for enum type and not RuntimeType.NUMBER as in TS
        if (convertor instanceof UnionConvertor || convertor instanceof OptionConvertor) {
            // Unwrapping of type
            const idlType = convertor instanceof UnionConvertor
                ? (convertor.nativeType() as idl.IDLUnionType).types[runtimeTypeIndex]
                : idl.maybeUnwrapOptionalType(convertor.nativeType())
            if (idlType !== undefined && idl.isReferenceType(idlType)) {
                const resolved = this.resolver.resolveTypeReference(idlType)
                type = resolved != undefined && idl.isEnum(resolved) ? RuntimeType[RuntimeType.OBJECT] : type
            }
        }
        return super.makeUnionVariantCondition(convertor, valueName, valueType, type, convertorIndex)
    }
    makeCastCustomObject(customName: string, isGenericType: boolean): LanguageExpression {
        if (isGenericType) {
            return this.makeCast(this.makeString(customName), idl.IDLObjectType)
        }
        return super.makeCastCustomObject(customName, isGenericType)
    }
    makeHasOwnProperty(value: string,
                       valueTypeName: string,
                       property: string,
                       propertyTypeName: string): LanguageExpression {
        return this.makeNaryOp("&&", [
            this.makeString(`${value} instanceof ${valueTypeName}`),
            this.makeString(`isInstanceOf("${propertyTypeName}", ${value}.${property})`)])
    }
    makeEquals(args: LanguageExpression[]): LanguageExpression {
        // TODO: Error elimination: 'TypeError: Both operands have to be reference types'
        // the '==' operator must be used when one of the operands is a reference
        return super.makeNaryOp('==', args)
    }
    override makeDiscriminatorConvertor(convertor: ArgConvertor, value: string, index: number): LanguageExpression { //
        return this.instanceOf(convertor, value);
        // Or this ????????
        // return this.discriminatorFromExpressions(value, RuntimeType.OBJECT, [
        //     makeEnumTypeCheckerCall(value, this.getNodeName(convertor.idlType), this)
        // ])
    }
    override castToInt(value: string, bitness: 8 | 32): string {
        return `${value} as int32` // FIXME: is there int8 in ARKTS?
    }
    override castToBoolean(value: string): string { return `${value} ? 1 : 0` }

    override instanceOf(convertor: ArgConvertor, value: string, duplicateMembers?: Set<string>): LanguageExpression {
        if (convertor instanceof CustomTypeConvertor) {
            return makeInterfaceTypeCheckerCall(value,
                this.getNodeName(convertor.idlType),
                [],
                duplicateMembers!,
                this)
        }
        if (convertor instanceof InterfaceConvertor || convertor instanceof MaterializedClassConvertor) {
            return makeInterfaceTypeCheckerCall(value,
                this.getNodeName(convertor.idlType),
                convertor.declaration.properties.filter(it => !it.isStatic).map(it => it.name),
                duplicateMembers!,
                this)
        }
        if (convertor instanceof BufferConvertor) {
            return makeInterfaceTypeCheckerCall(value,
                this.getNodeName(convertor.idlType),
                [],
                new Set(),
                this)
        }
        if (convertor instanceof AggregateConvertor) {
            return makeInterfaceTypeCheckerCall(value,
                convertor.aliasName !== undefined ? convertor.aliasName : this.getNodeName(convertor.idlType),
                convertor.members.map(it => it[0]), duplicateMembers!, this)
        }
        if (convertor instanceof ArrayConvertor) {
            return makeArrayTypeCheckCall(value, this.arrayConvertor.convert(convertor.idlType), this)
        }
        if (idl.isEnum(this.resolver.toDeclaration(convertor.nativeType()))) {
            return makeEnumTypeCheckerCall(value, this.getNodeName(convertor.idlType), this)
        }
        return super.instanceOf(convertor, value, duplicateMembers)
    }
    override typeInstanceOf(type: idl.IDLEntry, value: string, members?: string[]): LanguageExpression {
        if (!members || members.length === 0) {
            throw new Error("At least one member needs to provided to pass it to TypeChecker!")
        }
        const prop = members[0]
        // Use the same typeInstanceOf<T>(...) method to compile the ETS code by two compilers ArkTS and TS
        return this.makeString(`TypeChecker.typeInstanceOf<${this.getNodeName(type)}>(value, "${prop}")`)
    }

    makeTypeCast(value: LanguageExpression, type: idl.IDLType, options?: MakeCastOptions): LanguageExpression {
        return this.makeString(`TypeChecker.typeCast<${this.getNodeName(type)}>(value)`)
    }
    makeCast(value: LanguageExpression, type: idl.IDLType, options?: MakeCastOptions): LanguageExpression {
        return new TSCastExpression(value, `${this.getNodeName(type)}`, options?.unsafe ?? false)
    }
}

function makeInterfaceTypeCheckerCall(
    valueAccessor: string,
    interfaceName: string,
    allFields: string[],
    duplicates: Set<string>,
    writer: LanguageWriter,
): LanguageExpression {
    return writer.makeMethodCall(
        "TypeChecker",
        generateTypeCheckerName(interfaceName), [writer.makeString(valueAccessor),
        ...allFields.map(it => {
            return writer.makeString(duplicates.has(it) ? "true" : "false")
        })
    ])
}

export function makeEnumTypeCheckerCall(valueAccessor: string, enumName: string, writer: LanguageWriter): LanguageExpression {
    return writer.makeMethodCall(
        "TypeChecker",
        generateTypeCheckerName(enumName),
        [writer.makeString(valueAccessor)]
    )
}
