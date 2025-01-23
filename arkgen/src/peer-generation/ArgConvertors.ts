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

import * as idl from "@idlize/core/idl"
import { Language, hashCodeFromString, warn, generatorConfiguration } from "@idlize/core"
import { RuntimeType, AggregateConvertor, ArgConvertor, BaseArgConvertor, ExpressionAssigner } from "@idlize/core"
import { LibraryInterface } from "@idlize/core"
import { ArkPrimitiveTypesInstance } from "./ArkPrimitiveType"
import { BlockStatement, LanguageExpression, LanguageStatement, LanguageWriter, StringExpression } from "@idlize/core"
import { IDLNodeToStringConvertor } from "./LanguageWriters/convertors/InteropConvertor"
import { createEmptyReferenceResolver } from "@idlize/core"
import { createTypeNameConvertor } from "./LanguageWriters";
import { InterfaceConvertor } from "@idlize/core";

export class ArkoalaInterfaceConvertor extends InterfaceConvertor {
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        if (writer.language === Language.ARKTS)
            return writer.instanceOf(this, value, duplicates)

        // First, tricky special cases
        if (this.declaration.name.endsWith("GestureInterface")) {
            const gestureType = this.declaration.name.slice(0, -"GestureInterface".length)
            const castExpr = writer.makeCast(writer.makeString(value), idl.createReferenceType("GestureComponent<Object>"), { unsafe: true })
            return writer.makeNaryOp("===", [
                writer.makeString(`${castExpr.asString()}.type`),
                writer.makeString(`GestureName.${gestureType}`)])
        }
        if (this.declaration.name === "CancelButtonSymbolOptions") {
            if (writer.language === Language.ARKTS) {
                //TODO: Need to check this in TypeChecker
                return this.discriminatorFromFields(value, writer, this.declaration.properties, it => it.name, it => it.isOptional, duplicates)
            } else {
                return writer.makeHasOwnProperty(value,
                    "CancelButtonSymbolOptions", "icon", "SymbolGlyphModifier")
            }
        }
        return super.unionDiscriminator(value, index, writer, duplicates)
    }
}

export class ProxyConvertor extends BaseArgConvertor {
    constructor(public convertor: ArgConvertor, suggestedName?: string) {
        super(suggestedName ? idl.createReferenceType(suggestedName, undefined, convertor.idlType) : convertor.idlType, convertor.runtimeTypes, convertor.isScoped, convertor.useArray, convertor.param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return this.convertor.convertorArg(param, writer)
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return this.convertor.convertorDeserialize(bufferName, deserializerName, assigneer, writer)
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        this.convertor.convertorSerialize(param, value, printer)
    }
    nativeType(): idl.IDLType {
        return this.convertor.nativeType()
    }
    interopType(): idl.IDLType {
        return this.convertor.interopType()
    }
    isPointerType(): boolean {
        return this.convertor.isPointerType()
    }
    unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return this.convertor.unionDiscriminator(value, index, writer, duplicates)
    }
    getMembers(): string[] {
        return this.convertor.getMembers()
    }
}

export class LengthConvertor extends BaseArgConvertor {
    constructor(name: string, param: string, language: Language) {
        // length convertor is only optimized for NAPI interop
        super(idl.createReferenceType(name), [RuntimeType.NUMBER, RuntimeType.STRING, RuntimeType.OBJECT], false,
            (language !== Language.TS && language !== Language.ARKTS), param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        switch (writer.language) {
            case Language.CPP: return `(const ${ArkPrimitiveTypesInstance.Length.getText()}*)&${param}`
            case Language.JAVA: return `${param}.value`
            case Language.CJ: return `${param}.value`
            default: return param
        }
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeStatement(
            printer.makeStatement(
                printer.makeMethodCall(`${param}Serializer`, 'writeLength', [printer.makeString(value)])
            )
        )
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const readExpr = writer.makeString(`${deserializerName}.readLength()`)
        if (writer.language === Language.CPP)
            return assigneer(readExpr)
        return assigneer(writer.makeCast(readExpr, this.idlType, { optional: false, unsafe: false }))
    }
    nativeType(): idl.IDLType {
        return idl.IDLLengthType
    }
    interopType(): idl.IDLType {
        return idl.IDLLengthType
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.makeNaryOp("||", [
            writer.makeNaryOp("==", [writer.makeRuntimeType(RuntimeType.NUMBER), writer.makeString(`${value}_type`)]),
            writer.makeNaryOp("==", [writer.makeRuntimeType(RuntimeType.STRING), writer.makeString(`${value}_type`)]),
            writer.makeNaryOp("&&", [
                writer.makeNaryOp("==", [writer.makeRuntimeType(RuntimeType.OBJECT), writer.makeString(`${value}_type`)]),
                writer.makeCallIsResource(value)
            ])])
    }
}

export class NumericConvertor extends BaseArgConvertor {
    private readonly interopNameConvertor = new IDLNodeToStringConvertor(createEmptyReferenceResolver())
    constructor(param: string, type: idl.IDLPrimitiveType) {
        // check numericPrimitiveTypes.include(type)
        super(type, [RuntimeType.NUMBER], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return param
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, `write${this.interopNameConvertor.convert(this.idlType)}`, [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(
            writer.makeString(`${deserializerName}.read${this.interopNameConvertor.convert(this.idlType)}()`)
        )
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    interopType(): idl.IDLType {
        return this.idlType
    }
    isPointerType(): boolean {
        return false
    }
}

export class PointerConvertor extends BaseArgConvertor {
    constructor(param: string) {
        // check numericPrimitiveTypes.include(type)
        super(idl.IDLPointerType, [RuntimeType.NUMBER, RuntimeType.OBJECT], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return param
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, `writePointer`, [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(
            writer.makeString(`${deserializerName}.readPointer()`)
        )
    }
    nativeType(): idl.IDLType {
        return this.idlType
    }
    interopType(): idl.IDLType {
        return this.idlType
    }
    isPointerType(): boolean {
        return false
    }
}

export class BufferConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super(idl.IDLBufferType, [RuntimeType.OBJECT], false, true, param)
    }
    convertorArg(param: string, _: LanguageWriter): string {
        return param
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeBuffer", [value])
    }
    convertorDeserialize(_: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeString(`${deserializerName}.readBuffer()`),
            this.idlType, { optional: false })
        )
    }
    nativeType(): idl.IDLType {
        return idl.IDLBufferType
    }
    interopType(): idl.IDLType {
        return idl.IDLBufferType
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.instanceOf(this, value);
    }
}

export class ImportTypeConvertor extends BaseArgConvertor { //
    private static knownTypes: Map<string, string[]> = new Map([
        ["CircleShape", ["isInstanceOf", "\"CircleShape\""]],
        ["EllipseShape", ["isInstanceOf", "\"EllipseShape\""]],
        ["PathShape", ["isInstanceOf", "\"PathShape\""]],
        ["RectShape", ["isInstanceOf", "\"RectShape\""]],
        ["ComponentContent", ["isInstanceOf", "\"ComponentContent\""]],
        ["DrawableDescriptor", ["isInstanceOf", "\"DrawableDescriptor\""]],
        ["SymbolGlyphModifier", ["isInstanceOf", "\"SymbolGlyphModifier\""]],
        ["Scene", ["isInstanceOf", "\"Scene\""]]])
    private importedName: string
    constructor(param: string, importedName: string) {
        super(idl.IDLObjectType, [RuntimeType.OBJECT], false, true, param)
        this.importedName = importedName
        warnCustomObject(importedName, `imported`)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeCustomObject", [`"${this.importedName}"`, value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeString(`${deserializerName}.readCustomObject("${this.importedName}")`))
    }
    nativeType(): idl.IDLType {
        // return this.importedName
        // treat ImportType as CustomObject
        return idl.IDLCustomObjectType
    }
    interopType(): idl.IDLType {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        const handler = ImportTypeConvertor.knownTypes.get(this.importedName)
        return handler
            ? writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
                [writer.makeString(`${handler[0]}(${handler.slice(1).concat(value).join(", ")})`)])
            : undefined
    }
}

export class CallbackConvertor extends BaseArgConvertor {
    constructor(
        private readonly library: LibraryInterface,
        param: string,
        private readonly decl: idl.IDLCallback,
    ) {
        super(idl.createReferenceType(decl.name, undefined, decl), [RuntimeType.FUNCTION], false, true, param)
    }

    private get isTransformed(): boolean {
        return this.decl !== this.transformedDecl
    }

    private get transformedDecl(): idl.IDLCallback {
        return maybeTransformManagedCallback(this.decl) ?? this.decl
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        if (writer.language == Language.CPP) {
            writer.writeMethodCall(`${param}Serializer`, "writeCallbackResource", [`${value}.resource`])
            writer.writeMethodCall(`${param}Serializer`, "writePointer", [writer.makeCast(
                new StringExpression(`${value}.call`), idl.IDLPointerType, { unsafe: true }).asString()])
            writer.writeMethodCall(`${param}Serializer`, "writePointer", [writer.makeCast(
                new StringExpression(`${value}.callSync`), idl.IDLPointerType, { unsafe: true }).asString()])
            return
        }
        if (this.isTransformed)
            value = `CallbackTransformer.transformFrom${this.library.getInteropName(this.decl)}(${value})`
        writer.writeMethodCall(`${param}Serializer`, `holdAndWriteCallback`, [`${value}`])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter, useSyncVersion: boolean = false): LanguageStatement {
        if (writer.language == Language.CPP) {
            const callerInvocation = writer.makeString(`getManagedCallbackCaller(${generateCallbackKindAccess(this.transformedDecl, writer.language)})`)
            const callerSyncInvocation = writer.makeString(`getManagedCallbackCallerSync(${generateCallbackKindAccess(this.transformedDecl, writer.language)})`)
            const resourceReadExpr = writer.makeMethodCall(`${deserializerName}`, `readCallbackResource`, [])
            const callReadExpr = writer.makeCast(
                writer.makeMethodCall(`${deserializerName}`, `readPointerOrDefault`,
                    [writer.makeCast(callerInvocation, idl.IDLPointerType, { unsafe: true })]),
                    idl.IDLUndefinedType /* not used */,
                    {
                        unsafe: true,
                        overrideTypeName: `void(*)(${generateCallbackAPIArguments(this.library, this.transformedDecl).join(", ")})`
                    }
            )
            const callSyncReadExpr = writer.makeCast(
                writer.makeMethodCall(`${deserializerName}`, `readPointerOrDefault`,
                    [writer.makeCast(callerSyncInvocation, idl.IDLPointerType, { unsafe: true })]),
                    idl.IDLUndefinedType /* not used */,
                    {
                        unsafe: true,
                        overrideTypeName: `void(*)(${[`${generatorConfiguration().param("TypePrefix")}VMContext vmContext`].concat(generateCallbackAPIArguments(this.library, this.transformedDecl)).join(", ")})`
                    }
            )
            return assigneer(writer.makeString(`{${resourceReadExpr.asString()}, ${callReadExpr.asString()}, ${callSyncReadExpr.asString()}}`))
        }
        let result = writer.makeString(
            `${deserializerName}.read${this.library.getInteropName(this.transformedDecl)}(${useSyncVersion ? 'true' : ''})`)
        if (this.isTransformed)
            result = writer.makeMethodCall(`CallbackTransformer`, `transformTo${this.library.getInteropName(this.decl)}`, [result])
        return assigneer(result)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType(this.transformedDecl.name, undefined, this.decl)
    }
    isPointerType(): boolean {
        return true
    }
}

export class TupleConvertor extends AggregateConvertor { //
    constructor(library: LibraryInterface, param: string, type: idl.IDLType, decl: idl.IDLInterface) {
        super(library, param, type, decl)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        this.memberConvertors.forEach((it, index) => {
            printer.writeStatement(
                printer.makeAssign(`${value}_${index}`, undefined, printer.makeTupleAccess(value, index), true))
            it.convertorSerialize(param, `${value}_${index}`, printer)
        })
    }
    protected override makeAssigneeExpression(fields: [string, LanguageExpression][], writer: LanguageWriter): LanguageExpression {
        return writer.makeCast(writer.makeString(`[${fields.map(it => it[1].asString()).join(', ')}]`), this.idlType)
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType(this.decl.name, undefined, this.decl)
    }
    interopType(): idl.IDLType {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        return args?.index
            ? language === Language.CPP
                ? `${value}.value${args.index}`
                : `${value}[${args.index}]`
            : value
    }
}

export class MapConvertor extends BaseArgConvertor { //
    keyConvertor: ArgConvertor
    valueConvertor: ArgConvertor
    constructor(private library: LibraryInterface, param: string, type: idl.IDLType, public keyType: idl.IDLType, public valueType: idl.IDLType) {
        super(
            idl.createContainerType(
                'record', [keyType, valueType]
            ),
            [RuntimeType.OBJECT],
            false,
            true,
            param
        )
        this.keyConvertor = library.typeConvertor(param, keyType)
        this.valueConvertor = library.typeConvertor(param, valueType)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        // Map size.
        const mapSize = printer.makeMapSize(value)
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [mapSize.asString()])
        printer.writeStatement(printer.makeMapForEach(value, `${value}_key`, `${value}_value`, () => {
            this.keyConvertor.convertorSerialize(param, `${value}_key`, printer)
            this.valueConvertor.convertorSerialize(param, `${value}_value`, printer)
        }))
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const mapTypeName = writer.getNodeName(this.idlType)
        const keyType = this.keyType
        const valueType = this.valueType
        const sizeBuffer = `${bufferName}_size`
        const keyBuffer = `${bufferName}_key`
        const valueBuffer = `${bufferName}_value`
        const counterBuffer = `${bufferName}_i`
        const keyAccessor = this.getObjectAccessor(writer.language, bufferName, {index: counterBuffer, field: "keys"})
        const valueAccessor = this.getObjectAccessor(writer.language, bufferName, {index: counterBuffer, field: "values"})
        return new BlockStatement([
            writer.makeAssign(sizeBuffer, idl.IDLI32Type,
                writer.makeString(`${deserializerName}.readInt32()`), true, true),
            writer.makeAssign(bufferName, this.idlType, writer.makeMapInit(this.idlType), true, false),
            writer.makeMapResize(mapTypeName, keyType, valueType, bufferName, sizeBuffer, deserializerName),
            writer.makeLoop(counterBuffer, sizeBuffer, new BlockStatement([
                this.keyConvertor.convertorDeserialize(`${keyBuffer}_buf`, deserializerName, (expr) => {
                    return writer.makeAssign(keyBuffer, keyType, expr, true, true)
                }, writer),
                this.valueConvertor.convertorDeserialize(`${valueBuffer}_buf`, deserializerName, (expr) => {
                    return writer.makeAssign(valueBuffer, valueType, expr, true, true)
                }, writer),
                writer.makeMapInsert(keyAccessor, keyBuffer, valueAccessor, valueBuffer),
            ], false)),
            assigneer(writer.makeString(bufferName))
        ], false)
    }

    nativeType(): idl.IDLType {
        return idl.createContainerType('record', [this.keyType, this.valueType])
    }
    interopType(): idl.IDLType {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
            [writer.makeString(`${value} instanceof Map`)])
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        return language === Language.CPP && args?.index && args?.field
            ? `${value}.${args.field}[${args.index}]`
            : value
    }
}

export class DateConvertor extends BaseArgConvertor { //
    constructor(param: string) {
        super(idl.IDLBigintType, [RuntimeType.NUMBER], false, false, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        if (writer.language === Language.CPP) {
            return param
        }
        return `${param}.getTime()`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        if (writer.language === Language.CPP) {
            writer.writeMethodCall(`${param}Serializer`, "writeInt64", [value])
        } else {
            writer.writeMethodCall(`${param}Serializer`, "writeInt64", [
                writer.makeCast(writer.makeString(`${value}.getTime()`), idl.IDLI64Type).asString()
            ])
        }
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigner, writer: LanguageWriter): LanguageStatement {
        const deserializeTime = writer.makeMethodCall(`${deserializerName}`, "readInt64", [])
        if (writer.language === Language.CPP) {
            return assigneer(deserializeTime)
        }
        return assigneer(writer.makeString(`new Date(${deserializeTime.asString()})`))
    }
    nativeType(): idl.IDLType {
        return idl.createReferenceType('Date')
    }
    interopType(): idl.IDLType {
        return idl.IDLDate
    }
    isPointerType(): boolean {
        return false
    }
}

export class TypeAliasConvertor extends ProxyConvertor { //
    constructor(library: LibraryInterface, param: string, typedef: idl.IDLTypedef) {///, private typeArguments?: ts.NodeArray<ts.TypeNode>) {
        super(library.typeConvertor(param, typedef.type), typedef.name)
    }
}

export function cppEscape(name: string) {
    return name === "template" ? "template_" : name
}

////////////////////////////////////////////////////////////////////////////////
// UTILS


export const CallbackKind = "CallbackKind"

export function generateCallbackKindName(callback: idl.IDLCallback) {
    return `Kind_${callback.name}`
}

export function generateCallbackKindAccess(callback: idl.IDLCallback, language: Language) {
    const name = generateCallbackKindName(callback)
    if (language == Language.CPP)
        return name
    return `${CallbackKind}.${name}`
}

export function generateCallbackKindValue(callback: idl.IDLCallback): number {
    const name = generateCallbackKindName(callback)
    return hashCodeFromString(name)
}

export function generateCallbackAPIArguments(library: LibraryInterface, callback: idl.IDLCallback): string[] {
    const nameConvertor = createTypeNameConvertor(Language.CPP, library)
    const args: string[] = [`const ${ArkPrimitiveTypesInstance.Int32.getText()} resourceId`]
    args.push(...callback.parameters.map(it => {
        const target = library.toDeclaration(it.type!)
        const type = library.typeConvertor(it.name, it.type!, it.isOptional)
        const constPrefix = !idl.isEnum(target) ? "const " : ""
        return `${constPrefix}${nameConvertor.convert(type.nativeType())} ${type.param}`
    }))
    if (!idl.isVoidType(callback.returnType)) {
        const type = library.typeConvertor(`continuation`,
            library.createContinuationCallbackReference(callback.returnType)!, false)
        args.push(`const ${nameConvertor.convert(type.nativeType())} ${type.param}`)
    }
    return args
}


////////////////////////////////////////////////////////////////////////////////
// UTILS

const customObjects = new Set<string>()
function warnCustomObject(type: string, msg?: string) {
    if (!customObjects.has(type)) {
        warn(`Use CustomObject for ${msg ? `${msg} ` : ``}type ${type}`)
        customObjects.add(type)
    }
}

export function maybeTransformManagedCallback(callback: idl.IDLCallback): idl.IDLCallback | undefined {
    if (callback.name === "CustomBuilder")
        return idl.createCallback(
            "CustomNodeBuilder",
            [idl.createParameter("parentNode", idl.IDLPointerType)],
            idl.IDLPointerType,
            { extendedAttributes: [{name: idl.IDLExtendedAttributes.Synthetic}] }
        )
    return undefined
}