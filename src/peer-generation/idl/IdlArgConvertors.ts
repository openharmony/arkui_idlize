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
import * as idl from "../../idl"
import { Language } from "../../Language"
import { BlockStatement, BranchStatement, LanguageExpression, LanguageStatement, LanguageWriter, MethodSignature, NamedMethodSignature, StringExpression } from "../LanguageWriters"
import { cleanPrefix, IdlPeerLibrary } from "./IdlPeerLibrary"
import { PrimitiveType } from "../ArkPrimitiveType"
import { qualifiedName } from "./common"
import { RuntimeType, ArgConvertor, BaseArgConvertor, ProxyConvertor, UndefinedConvertor, UnionRuntimeTypeChecker, ExpressionAssigneer } from "../ArgConvertors"
import { generateCallbackAPIArguments } from "./StructPrinter"
import { CppCastExpression } from "../LanguageWriters/writers/CppLanguageWriter"
import { generateCallbackKindAccess } from "../printers/CallbacksPrinter"
import { LibraryInterface } from "../../LibraryInterface"


export class StringConvertor extends BaseArgConvertor {
    private literalValue?: string
    constructor(param: string) {
        super(idl.IDLStringType, [RuntimeType.STRING], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `(const ${PrimitiveType.String.getText()}*)&${param}` : param
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, `writeString`, [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeString(`${deserializerName}.readString()`),
            writer.makeType(this.idlType, false)
        ))
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.String.getText()
    }
    interopType(language: Language): string {
        return "KStringPtr"
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return this.literalValue
            ? writer.makeString(`${value} === "${this.literalValue}"`)
            : undefined
    }
    targetType(writer: LanguageWriter): string {
        if (this.literalValue) {
            return writer.convert(idl.toIDLType("string"))
        }
        return super.targetType(writer);
    }
}

export class ToStringConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super(idl.IDLStringType, [RuntimeType.OBJECT], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `(const ${PrimitiveType.String.getText()}*)&${param}` : `(${param}).toString()`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, `writeString`, [
            writer.language == Language.CPP ? value : `${value}.toString()`])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeString(`${deserializerName}.readString()`))
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.String.getText()
    }
    interopType(language: Language): string {
        return "KStringPtr"
    }
    isPointerType(): boolean {
        return true
    }
}

export class EnumConvertor extends BaseArgConvertor { //
    constructor(param: string,
                private enumType: idl.IDLEnum,
                public readonly isStringEnum: boolean) {
        super(isStringEnum ?  idl.IDLStringType : idl.IDLNumberType,
            [isStringEnum ? RuntimeType.STRING : RuntimeType.NUMBER],
            false, false, param)
    }
    enumTypeName(language: Language): string {
        const prefix = language === Language.CPP ? PrimitiveType.Prefix : ""
        return prefix + qualifiedName(this.enumType, language)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeEnumCast(param, false, this)
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        if (this.isStringEnum) {
            value = printer.ordinalFromEnum(printer.makeString(value), this.enumType.name).asString()
        }
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [printer.makeEnumCast(value, false, this)])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const name = this.enumTypeName(writer.language)
        const readExpr = writer.makeMethodCall(`${deserializerName}`, "readInt32", [])
        const enumExpr = this.isStringEnum && writer.language !== Language.CPP
            ? writer.enumFromOrdinal(readExpr, name)
            : writer.makeCast(readExpr, idl.toIDLType(name))
        return assigneer(enumExpr)
    }
    nativeType(impl: boolean): string {
        return this.enumTypeName(Language.CPP)
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int32.getText() : "KInt"
    }
    isPointerType(): boolean {
        return false
    }
    // TODO: bit clumsy.
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.makeDiscriminatorConvertor(this, value, index)
    }
    targetType(writer: LanguageWriter): string {
        return this.enumTypeName(writer.language)
    }
    extremumOfOrdinals(): {low: number, high: number} {
        let low: number = Number.MAX_VALUE
        let high: number = Number.MIN_VALUE
        this.enumType.elements.forEach((member, index) => {
            let value = index
            if (member.initializer && !this.isStringEnum) {
                value = parseInt(member.initializer.toString())
            }
            if (low > value) low = value
            if (high < value) high = value
        })
        return {low, high}
    }
}

export class UnionConvertor extends BaseArgConvertor { //
    private memberConvertors: ArgConvertor[]
    private unionChecker: UnionRuntimeTypeChecker

    constructor(private library: LibraryInterface, param: string, private type: idl.IDLUnionType) {
        super(idl.toIDLType(`object`), [], false, true, param)
        this.memberConvertors = type.types.map(member => library.typeConvertor(param, member))
        this.unionChecker = new UnionRuntimeTypeChecker(this.memberConvertors)
        this.runtimeTypes = this.memberConvertors.flatMap(it => it.runtimeTypes)
        this.idlType = type
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Do not use for union")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeStatement(printer.makeAssign(`${value}_type`, idl.IDLI32Type, printer.makeUnionTypeDefaultInitializer(), true, false))
        printer.writeStatement(printer.makeUnionSelector(value, `${value}_type`))
        this.memberConvertors.forEach((it, index) => {
            const maybeElse = (index > 0 && this.memberConvertors[index - 1].runtimeTypes.length > 0) ? "else " : ""
            const conditions = this.unionChecker.makeDiscriminator(value, index, printer)
            printer.print(`${maybeElse}if (${conditions.asString()}) {`)
            printer.pushIndent()
            printer.writeMethodCall(`${param}Serializer`, "writeInt8", [printer.castToInt(index.toString(), 8)])
            if (!(it instanceof UndefinedConvertor)) {
                printer.writeStatement(
                        printer.makeAssign(`${value}_${index}`, undefined,
                            printer.makeUnionVariantCast(it.getObjectAccessor(printer.language, value), it.targetType(printer), it, index), true))
                it.convertorSerialize(param, `${value}_${index}`, printer)
            }
            printer.popIndent()
            printer.print(`}`)
        })
        this.unionChecker.reportConflicts(this.library.getCurrentContext() ?? "<unknown context>")
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const statements: LanguageStatement[] = []
        let selectorBuffer = `${bufferName}_selector`
        statements.push(writer.makeAssign(selectorBuffer, idl.IDLI32Type,
            writer.makeString(`${deserializerName}.readInt8()`), true))
        const optionalUnion = writer.language === Language.CPP
            ? idl.createReferenceType(this.library.getTypeName(this.type))
            : idl.maybeOptional(this.type, true)
        statements.push(writer.makeAssign(bufferName, optionalUnion, undefined, true, false))
        if (writer.language === Language.CPP)
            statements.push(writer.makeAssign(`${bufferName}.selector`, undefined, writer.makeString(selectorBuffer), false))
        const branches: BranchStatement[] = this.memberConvertors.map((it, index) => {
            const receiver = this.getObjectAccessor(writer.language, bufferName, {index: `${index}`})
            const expr = writer.makeString(`${selectorBuffer} == ${index}`)
            const stmt = new BlockStatement([
                writer.makeSetUnionSelector(bufferName, `${index}`),
                it.convertorDeserialize(`${bufferName}_u`, deserializerName, (expr) => {
                    return writer.makeAssign(receiver, undefined, expr, false)
                }, writer),
            ], false)
            return { expr, stmt }
        })
        statements.push(writer.makeMultiBranchCondition(branches))
        statements.push(assigneer(writer.makeCast(writer.makeString(bufferName), stubReferenceIfCpp(this.library, this.type, writer.language))))
        return new BlockStatement(statements, false)
    }
    nativeType(impl: boolean): string {
        return impl
            ? `struct { ${PrimitiveType.Int32.getText()} selector; union { ` +
                `${this.memberConvertors.map((it, index) => `${it.nativeType(false)} value${index};`).join(" ")}` +
                `}; }`
            : this.library.getTypeName(this.type)
    }
    interopType(language: Language): string {
        throw new Error("Union")
    }
    isPointerType(): boolean {
        return true
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        return language === Language.CPP && args?.index ? `${value}.value${args.index}` : value
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
        super(idl.toIDLType("Object"), [RuntimeType.OBJECT], false, true, param)
        this.importedName = importedName
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeCustomObject", [`"${this.importedName}"`, value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeString(`${deserializerName}.readCustomObject("${this.importedName}")`))
    }
    nativeType(impl: boolean): string {
        // return this.importedName
        // treat ImportType as CustomObject
        return PrimitiveType.CustomObject.getText()
    }
    interopType(language: Language): string {
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

export class OptionConvertor extends BaseArgConvertor { //
    private typeConvertor: ArgConvertor
    // TODO: be smarter here, and for smth like Length|undefined or number|undefined pass without serializer.
    constructor(private library: LibraryInterface, param: string, public type: idl.IDLType) {
        let conv = library.typeConvertor(param, type)
        let runtimeTypes = conv.runtimeTypes;
        if (!runtimeTypes.includes(RuntimeType.UNDEFINED)) {
            runtimeTypes.push(RuntimeType.UNDEFINED)
        }
        super(idl.maybeOptional(conv.idlType, true), runtimeTypes, conv.isScoped, true, param)
        this.typeConvertor = conv
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        const valueType = `${value}_type`
        const serializedType = (printer.language == Language.JAVA ? undefined : idl.IDLI32Type)
        printer.writeStatement(printer.makeAssign(valueType, serializedType, printer.makeRuntimeType(RuntimeType.UNDEFINED), true, false))
        printer.runtimeType(this, valueType, value)
        printer.writeMethodCall(`${param}Serializer`, "writeInt8", [printer.castToInt(valueType, 8)])
        printer.print(`if (${printer.makeRuntimeTypeCondition(valueType, false, RuntimeType.UNDEFINED, value).asString()}) {`)
        printer.pushIndent()
        printer.writeStatement(printer.makeAssign(`${value}_value`, undefined, printer.makeValueFromOption(value, this.typeConvertor), true))
        this.typeConvertor.convertorSerialize(param, this.typeConvertor.getObjectAccessor(printer.language, `${value}_value`), printer)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorCArg(param: string): string {
        throw new Error("Must never be used")
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const runtimeBufferName = `${bufferName}_runtimeType`
        const statements: LanguageStatement[] = []
        statements.push(writer.makeAssign(runtimeBufferName, undefined,
            writer.makeCast(writer.makeString(`${deserializerName}.readInt8()`), writer.getRuntimeType()), true))
        const bufferType = writer.language === Language.CPP
            ? idl.createReferenceType(this.nativeType(false))
            : idl.maybeOptional(this.type, true)
        statements.push(writer.makeAssign(bufferName, bufferType, undefined, true, false))
        
        const thenStatement = new BlockStatement([
            this.typeConvertor.convertorDeserialize(`${bufferName}_`, deserializerName, (expr) => {
                const receiver = writer.language === Language.CPP
                    ? `${bufferName}.value` : bufferName
                return writer.makeAssign(receiver, undefined, expr, false)
            }, writer)
        ])
        statements.push(writer.makeSetOptionTag(bufferName, writer.makeCast(writer.makeString(runtimeBufferName), writer.getTagType())))
        statements.push(writer.makeCondition(writer.makeRuntimeTypeDefinedCheck(runtimeBufferName), thenStatement))
        statements.push(assigneer(writer.makeString(bufferName)))
        return writer.makeBlock(statements, false)
    }
    nativeType(impl: boolean): string {
        return impl
            ? `struct { ${PrimitiveType.Tag.getText()} tag; ${this.library.getTypeName(this.type, false)} value; }`
            : this.library.getTypeName(this.type, true)
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.NativePointer.getText() : "KNativePointer"
    }
    isPointerType(): boolean {
        return true
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        return language === Language.CPP ? `${value}.value` : value
    }
}

export class AggregateConvertor extends BaseArgConvertor { //
    protected memberConvertors: ArgConvertor[]
    private members: [string, boolean][] = []
    public readonly aliasName: string | undefined

    constructor(protected library: LibraryInterface, param: string, type: idl.IDLType, protected decl: idl.IDLInterface) {
        super(type, [RuntimeType.OBJECT], false, true, param)
        // this.aliasName = ts.isTypeAliasDeclaration(this.type.parent) ? identName(this.type.parent.name) : undefined
        this.memberConvertors = decl
            .properties
            // .filter(ts.isPropertySignature)
            .map((member, index) => {
                this.members[index] = [member.name, member.isOptional]
                return library.typeConvertor(param, member.type!, member.isOptional)
            })
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Do not use for aggregates")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        this.memberConvertors.forEach((it, index) => {
            let memberName = this.members[index][0]
            printer.writeStatement(
                printer.makeAssign(`${value}_${memberName}`, undefined,
                    printer.makeString(`${value}.${memberName}`), true))
            it.convertorSerialize(param, `${value}_${memberName}`, printer)
        })
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const statements: LanguageStatement[] = []
        if (writer.language === Language.CPP) {
            const bufferType = idl.createReferenceType(this.library.getTypeName(this.idlType))
            statements.push(writer.makeAssign(bufferName, bufferType, undefined, true, false))
        }
        for (let i = 0; i < this.decl.properties.length; i++) {
            const prop = this.decl.properties[i]
            const propConvertor = this.memberConvertors[i]
            statements.push(propConvertor.convertorDeserialize(`${bufferName}_${prop.name}_buf`, deserializerName, (expr) => {
                if (writer.language === Language.CPP) {
                    // prefix initialization for CPP, just easier. Waiting for easy work with nullables
                    return writer.makeAssign(`${bufferName}.${writer.escapeKeyword(prop.name)}`, undefined, expr, false)
                }
                /**
                 * todo: check UnionType name creation for union of unnamed nodes (isNamedNode() == false)
                 */
                const memberType = prop.isOptional
                    ? idl.createUnionType([idl.IDLUndefinedType, prop.type!], "$NOT TO BE PRINTED%")
                    : prop.type
                return writer.makeAssign(`${bufferName}_${prop.name}`, memberType, expr, true, true)
            }, writer))
        }
        if (writer.language === Language.CPP) {
            statements.push(assigneer(writer.makeString(bufferName)))
        } else {
            const resultExpression = this.makeAssigneeExpression(this.decl.properties.map(prop => {
                return [prop.name, writer.makeString(`${bufferName}_${prop.name}`)]
            }), writer)
            statements.push(assigneer(resultExpression))
        }
        return new BlockStatement(statements, false)
    }
    protected makeAssigneeExpression(fields: [string, LanguageExpression][], writer: LanguageWriter): LanguageExpression {
        const content = fields.map(it => `${it[0]}: ${it[1].asString()}`).join(', ')
        return writer.makeString(`{${content}}`)
    }
    nativeType(impl: boolean): string {
        return impl
            ? `struct { ${this.memberConvertors.map((it, index) => `${it.nativeType(true)} value${index};`).join(" ")} } `
            : this.library.getTypeName(this.decl, false)
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    getMembers(): string[] {
        return this.members.map(it => it[0])
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        const uniqueFields = this.members.filter(it => !duplicates.has(it[0]))
        return this.discriminatorFromFields(value, writer, uniqueFields, it => it[0], it => it[1])
    }
}

export class InterfaceConvertor extends BaseArgConvertor { //
    constructor(name: string, param: string, protected declaration: idl.IDLInterface) {
        super(idl.toIDLType(name), [RuntimeType.OBJECT], false, true, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, `write${printer.convert(this.idlType)}`, [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeMethodCall(`${deserializerName}`, `read${writer.convert(this.idlType)}`, []))
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Prefix + this.declaration.name
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    getMembers(): string[] {
        return this.declaration?.properties.map(it => it.name) ?? []
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        // First, tricky special cases
        if (this.declaration.name.endsWith("GestureInterface")) {
            const gestureType = this.declaration.name.slice(0, -"GestureInterface".length)
            const castExpr = writer.makeCast(writer.makeString(value), idl.toIDLType("GestureComponent<Object>"), true)
            return writer.makeNaryOp("===", [
                writer.makeString(`${castExpr.asString()}.type`),
                writer.makeString(`GestureName.${gestureType}`)])
        }
        if (this.declaration.name === "CancelButtonSymbolOptions") {
            return writer.makeNaryOp("&&", [
                writer.makeString(`${value}.hasOwnProperty("icon")`),
                writer.makeString(`isInstanceOf("SymbolGlyphModifier", ${value}.icon)`)])
        }
        // Try to figure out interface by examining field sets
        const uniqueFields = this.declaration?.properties.filter(it => !duplicates.has(it.name))
        return this.discriminatorFromFields(value, writer, uniqueFields, it => it.name, it => it.isOptional)
    }
}

export class ClassConvertor extends InterfaceConvertor { //
    constructor(name: string, param: string, declaration: idl.IDLInterface) {
        super(name, param, declaration)
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        // SubTabBarStyle causes inscrutable "SubTabBarStyle is not defined" error
        if (this.declaration.name === "SubTabBarStyle") return undefined
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
            [writer.makeString(`${value} instanceof ${writer.convert(this.idlType)}`)])
    }
}

export class FunctionConvertor extends BaseArgConvertor { //
    constructor(private library: LibraryInterface, param: string, protected type: idl.IDLReferenceType) {
        // TODO: pass functions as integers to native side.
        super(idl.toIDLType("Function"), [RuntimeType.FUNCTION], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ? `makeArkFunctionFromId(${param})` : `registerCallback(${param})`
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        writer.writeMethodCall(`${param}Serializer`, "writeFunction", [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        return assigneer(writer.makeCast(
            writer.makeString(`${deserializerName}.readFunction()`),
            writer.makeType(this.type, true)
        ))
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Function.getText()
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int32.getText() : "KInt"
    }
    isPointerType(): boolean {
        return false
    }
}

export class CallbackConvertor extends BaseArgConvertor {
    constructor(
        private readonly library: LibraryInterface,
        param: string,
        private readonly decl: idl.IDLCallback,
    ) {
        super(idl.toIDLType(library.mapType(decl)), [RuntimeType.FUNCTION], false, true, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void {
        if (writer.language == Language.CPP) {
            writer.writeMethodCall(`${param}Serializer`, "writeCallbackResource", [`${value}.resource`])
            writer.writeMethodCall(`${param}Serializer`, "writePointer", [new CppCastExpression(
                writer, new StringExpression(`${value}.call`), idl.toIDLType("void*"), true).asString()])
            return
        }
        writer.writeMethodCall(`${param}Serializer`, `holdAndWriteCallback`, 
            [`${value}, ${generateCallbackKindAccess(this.decl, writer.language)}`])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        if (writer.language == Language.CPP) {
            const callerInvocation = writer.makeString(`getManagedCallbackCaller(${generateCallbackKindAccess(this.decl, writer.language)})`)
            const resourceReadExpr = writer.makeMethodCall(`${deserializerName}`, `readCallbackResource`, [])
            const callReadExpr = new CppCastExpression(
                writer,
                writer.makeMethodCall(`${deserializerName}`, `readPointerOrDefault`, 
                    [writer.makeCast(callerInvocation, idl.IDLPointerType, true)]),
                idl.createReferenceType(`void(*)(${generateCallbackAPIArguments(this.library, this.decl).join(", ")})`),
                true
            )
            return assigneer(writer.makeString(`{${resourceReadExpr.asString()}, ${callReadExpr.asString()}}`))
        }
        return assigneer(writer.makeString(
            `${deserializerName}.read${this.library.computeTargetName(this.decl, false, "")}()`))
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Prefix + this.library.libraryPrefix + this.decl.name
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
        return writer.makeString(`[${fields.map(it => it[1].asString()).join(', ')}]`)
    }
    nativeType(impl: boolean): string {
        return impl
            ? `struct { ${this.memberConvertors.map((it, index) => `${it.nativeType(false)} value${index};`).join(" ")} } `
            : this.library.getTypeName(this.decl, false)
    }
    interopType(language: Language): string {
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

export class ArrayConvertor extends BaseArgConvertor { //
    elementConvertor: ArgConvertor
    constructor(private library: LibraryInterface, param: string, private type: idl.IDLContainerType, private elementType: idl.IDLType) {
        super(idl.createContainerType('sequence', [elementType]), [RuntimeType.OBJECT], false, true, param)
        this.elementConvertor = library.typeConvertor(param, elementType)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        // Array length.
        const valueLength = printer.makeArrayLength(value).asString()
        const loopCounter = "i"
        printer.writeMethodCall(`${param}Serializer`, "writeInt32", [printer.castToInt(valueLength, 32)])
        printer.writeStatement(printer.makeLoop(loopCounter, valueLength))
        printer.pushIndent()
        printer.writeStatement(
            printer.makeAssign(`${value}_element`, undefined, printer.makeArrayAccess(value, loopCounter), true))
        this.elementConvertor.convertorSerialize(param, this.elementConvertor.getObjectAccessor(printer.language, `${value}_element`), printer)
        printer.popIndent()
        printer.print(`}`)
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const lengthBuffer = `${bufferName}_length`
        const counterBuffer = `${bufferName}_i`
        const statements: LanguageStatement[] = []
        const arrayType = stubReferenceIfCpp(this.library, this.idlType, writer.language)
        statements.push(writer.makeAssign(lengthBuffer, idl.IDLI32Type, writer.makeString(`${deserializerName}.readInt32()`), true))
        statements.push(writer.makeAssign(bufferName, arrayType, writer.makeArrayInit(this.type), true, false))
        statements.push(writer.makeArrayResize(bufferName, lengthBuffer, deserializerName))
        statements.push(writer.makeLoop(counterBuffer, lengthBuffer, writer.makeBlock([
            this.elementConvertor.convertorDeserialize(`${bufferName}_buf`, deserializerName, (expr) => {
                return writer.makeAssign(writer.makeArrayAccess(bufferName, counterBuffer).asString(), undefined, expr, false)
            }, writer)
        ])))
        statements.push(assigneer(writer.makeString(bufferName)))
        return new BlockStatement(statements, false)
    }
    nativeType(impl: boolean): string {
        return this.library.makeCArrayName(this.elementType)
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
            [writer.makeString(`${value} instanceof ${this.targetType(writer)}`)])
    }
    override getObjectAccessor(language: Language, value: string, args?: Record<string, string>): string {
        const array = language === Language.CPP ? ".array" : ""
        return args?.index ? `${value}${array}${args.index}` : value
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
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const mapTypeName = writer.convert(stubReferenceIfCpp(this.library, this.idlType, writer.language))
        const keyTypeName = this.makeTypeName(this.keyType, writer.language)
        const valueTypeName = this.makeTypeName(this.valueType, writer.language)
        const sizeBuffer = `${bufferName}_size`
        const keyBuffer = `${bufferName}_key`
        const valueBuffer = `${bufferName}_value`
        const counterBuffer = `${bufferName}_i`
        const keyAccessor = this.getObjectAccessor(writer.language, bufferName, {index: counterBuffer, field: "keys"})
        const valueAccessor = this.getObjectAccessor(writer.language, bufferName, {index: counterBuffer, field: "values"})
        return new BlockStatement([
            writer.makeAssign(sizeBuffer, idl.IDLI32Type, 
                writer.makeString(`${deserializerName}.readInt32()`), true, true),
            writer.makeAssign(bufferName, idl.createReferenceType(mapTypeName), writer.makeMapInit(this.idlType), true, false),
            writer.makeMapResize(mapTypeName, idl.toIDLType(keyTypeName), idl.toIDLType(valueTypeName), bufferName, sizeBuffer, deserializerName),
            writer.makeLoop(counterBuffer, sizeBuffer, new BlockStatement([
                this.keyConvertor.convertorDeserialize(`${keyBuffer}_buf`, deserializerName, (expr) => {
                    return writer.makeAssign(keyBuffer, idl.toIDLType(keyTypeName), expr, true, true)
                }, writer),
                this.valueConvertor.convertorDeserialize(`${valueBuffer}_buf`, deserializerName, (expr) => {
                    return writer.makeAssign(valueBuffer, idl.toIDLType(valueTypeName), expr, true, true)
                }, writer),
                writer.makeMapInsert(keyAccessor, keyBuffer, valueAccessor, valueBuffer),
            ], false)),
            assigneer(writer.makeString(bufferName))
        ], false)
    }

    nativeType(impl: boolean): string {
        return this.library.makeCMapName(this.keyType, this.valueType)
    }
    interopType(language: Language): string {
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
    private makeTypeName(type: idl.IDLType, language: Language): string {///refac into LW
        switch (language) {
            case Language.TS: return this.library.mapType(type)
            case Language.CPP: return this.library.getTypeName(type, false)
            case Language.JAVA: return this.library.mapType(type)
            default: throw `Unsupported language ${language}`
        }
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
            return
        }
        writer.writeMethodCall(`${param}Serializer`, "writeInt64", [`${value}.getTime()`])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const deserializeTime = writer.makeMethodCall(`${deserializerName}`, "readInt64", [])
        if (writer.language === Language.CPP) {
            return assigneer(deserializeTime)
        }
        return assigneer(writer.makeString(`new Date(${deserializeTime.asString()})`))
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Date.getText()
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int64.getText() : "KLong"
    }
    isPointerType(): boolean {
        return false
    }
}

export class MaterializedClassConvertor extends BaseArgConvertor { //
    constructor(private library: LibraryInterface, name: string, param: string, private type: idl.IDLInterface) {
        super(idl.toIDLType(name), [RuntimeType.OBJECT], false, true, param)
    }

    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeMaterialized", [value])
    }
    convertorDeserialize(bufferName: string, deserializerName: string, assigneer: ExpressionAssigneer, writer: LanguageWriter): LanguageStatement {
        const prefix = writer.language === Language.CPP ? PrimitiveType.Prefix : ""
        const readStatement = writer.makeCast(
            writer.makeMethodCall(`${deserializerName}`, `readMaterialized`, []),
            idl.toIDLType(`${prefix}${this.type.name}`)
        )
        return assigneer(readStatement)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Materialized.getText()
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT,
            [writer.makeString(`${value} instanceof ${writer.convert(this.idlType)}`)])
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

export interface RetConvertor {
    isVoid: boolean
    nativeType: () => string
    macroSuffixPart: () => string
}

export function stubReferenceIfCpp(library: LibraryInterface, type: idl.IDLType, language: Language): idl.IDLType {
    if (language === Language.CPP)
        return idl.createReferenceType(library.getTypeName(type))
    return type
}