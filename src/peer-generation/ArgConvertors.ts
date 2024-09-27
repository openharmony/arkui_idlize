import { Language } from "../util"
import { PrimitiveType } from "./DeclarationTable"
import { LanguageExpression, LanguageStatement, LanguageWriter, Type } from "./LanguageWriters"

export enum RuntimeType {
    UNEXPECTED = -1,
    NUMBER = 1,
    STRING = 2,
    OBJECT = 3,
    BOOLEAN = 4,
    UNDEFINED = 5,
    BIGINT = 6,
    FUNCTION = 7,
    SYMBOL = 8,
    MATERIALIZED = 9,
}

export interface RetConvertor {
    isVoid: boolean
    nativeType: () => string
    macroSuffixPart: () => string
}

export interface ArgConvertor {
    param: string
    tsTypeName: string
    isScoped: boolean
    useArray: boolean
    runtimeTypes: RuntimeType[]
    scopeStart?(param: string, language: Language): string
    scopeEnd?(param: string, language: Language): string
    convertorArg(param: string, writer: LanguageWriter): string
    convertorSerialize(param: string, value: string, writer: LanguageWriter): void
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement
    interopType(language: Language): string
    nativeType(impl: boolean): string
    targetType(writer: LanguageWriter): Type
    isPointerType(): boolean
    unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression|undefined
    getMembers(): string[]
    getObjectAccessor(languge: Language, value: string, args?: Record<string, string>, writer?: LanguageWriter): string
}

export abstract class BaseArgConvertor implements ArgConvertor {
    constructor(
        public tsTypeName: string,
        public runtimeTypes: RuntimeType[],
        public isScoped: boolean,
        public useArray: boolean,
        public param: string
    ) { }

    nativeType(impl: boolean): string {
        throw new Error("Define")
    }
    isPointerType(): boolean {
        throw new Error("Define")
    }
    interopType(language: Language): string {
        throw new Error("Define")
    }
    targetType(writer: LanguageWriter): Type {
        return new Type(writer.mapType(new Type(this.tsTypeName), this))
    }
    scopeStart?(param: string, language: Language): string
    scopeEnd?(param: string, language: Language): string
    abstract convertorArg(param: string, writer: LanguageWriter): string
    abstract convertorSerialize(param: string, value: string, writer: LanguageWriter): void
    abstract convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement
    unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression|undefined {
        return undefined
    }
    getMembers(): string[] { return [] }
    getObjectAccessor(language: Language, value: string, args?: Record<string, string>, writer?: LanguageWriter): string {
        if (writer) return writer.getObjectAccessor(this, value, args)
        return this.useArray && args?.index ? `${value}[${args.index}]` : value
    }
    protected discriminatorFromFields<T>(value: string, writer: LanguageWriter,
        uniqueFields: T[] | undefined, nameAccessor: (field: T) => string, optionalAccessor: (field: T) => boolean)
    {
        if (!uniqueFields || uniqueFields.length === 0) return undefined
        const firstNonOptional = uniqueFields.find(it => !optionalAccessor(it))
        return writer.discriminatorFromExpressions(value, RuntimeType.OBJECT, writer, [
            writer.makeDiscriminatorFromFields(this, value,
                firstNonOptional ? [nameAccessor(firstNonOptional)] : uniqueFields.map(it => nameAccessor(it)))
        ])
    }
}

export class BooleanConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("boolean", [RuntimeType.BOOLEAN], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.castToBoolean(param)
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeBoolean", [value])
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = this.getObjectAccessor(printer.language, value, undefined, printer)
        return printer.makeAssign(accessor, undefined, printer.makeString(`${param}Deserializer.readBoolean()`), false)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Boolean.getText()
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Boolean.getText() : "KInt"
    }
    isPointerType(): boolean {
        return false
    }
}

export class UndefinedConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("undefined", [RuntimeType.UNDEFINED], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeUndefined().asString()
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {}
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = this.getObjectAccessor(printer.language, value, undefined, printer)
        return printer.makeAssign(accessor, undefined,
                printer.makeUndefined(), false)
    }
    nativeType(impl: boolean): string {
        return "Undefined"
    }
    interopType(language: Language): string {
        return PrimitiveType.NativePointer.getText()
    }
    isPointerType(): boolean {
        return false
    }
}

export class NullConvertor extends BaseArgConvertor {
    constructor(param: string) {
        super("null", [RuntimeType.OBJECT], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.makeNull().asString()
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {}
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const accessor = this.getObjectAccessor(printer.language, value, undefined, printer)
        return printer.makeAssign(accessor, undefined, printer.makeUndefined(), false)
    }
    nativeType(impl: boolean): string {
        return "nullptr"
    }
    interopType(language: Language): string {
        return PrimitiveType.NativePointer.getText()
    }
    isPointerType(): boolean {
        return false
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        return writer.makeString(`${value} === null`)
    }
}

export class LengthConvertorScoped extends BaseArgConvertor {
    constructor(param: string) {
        super("Length", [RuntimeType.NUMBER, RuntimeType.STRING, RuntimeType.OBJECT], false, false, param)
    }
    scopeStart(param: string): string {
        return `withLengthArray(${param}, (${param}Ptr) => {`
    }
    scopeEnd(param: string): string {
        return '})'
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return param
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeStatement(
            printer.makeStatement(
                printer.makeMethodCall(`${param}Serializer`, 'writeLength', [printer.makeString(value)])
            )
        )
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        return printer.makeAssign(value, undefined,
            printer.makeString(`${param}Deserializer.readLength()`), false)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Length.getText()
    }
    interopType(language: Language): string {
        switch (language) {
            case Language.CPP: return PrimitiveType.ObjectHandle.getText()
            case Language.TS: case Language.ARKTS: return 'object'
            case Language.JAVA: return 'Object'
            case Language.CJ: return 'Object'
            default: throw new Error("Unsupported language")
        }
    }
    isPointerType(): boolean {
        return true
    }
}

export class LengthConvertor extends BaseArgConvertor {
    constructor(name: string, param: string) {
        super(name, [RuntimeType.NUMBER, RuntimeType.STRING, RuntimeType.OBJECT], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        switch (writer.language) {
            case Language.CPP: return `(const ${PrimitiveType.Length.getText()}*)&${param}`
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
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const receiver = this.getObjectAccessor(printer.language, value, undefined, printer)
        return printer.makeAssign(receiver, undefined,
            printer.makeCast(
                printer.makeString(`${param}Deserializer.readLength()`),
                printer.makeType(this.tsTypeName, false, receiver), false), false)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.Length.getText()
    }
    interopType(language: Language): string {
        switch (language) {
            case Language.CPP: return 'KLength'
            case Language.TS: case Language.ARKTS: return 'string|number|object'
            case Language.JAVA: return 'String'
            case Language.CJ: return 'String'
            default: throw new Error("Unsupported language")
        }
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

export class CustomTypeConvertor extends BaseArgConvertor {
    private static knownTypes: Map<string, [string, boolean][]> = new Map([
        ["LinearGradient", [["angle", true], ["direction", true], ["colors", false], ["repeating", true]]]
    ])
    constructor(param: string,
                public readonly customTypeName: string,
                private readonly isGenericType: boolean = false,
                tsType?: string) {
        super(tsType ?? "Object", [RuntimeType.OBJECT], false, true, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("Must never be used")
    }
    /** todo: check */
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(
            `${param}Serializer`,
            `writeCustomObject`,
            [`"${this.customTypeName}"`, printer.makeCastCustomObject(value, this.isGenericType).asString()]
        )
    }
    convertorDeserialize(param: string, value: string, printer: LanguageWriter): LanguageStatement {
        const receiver = this.getObjectAccessor(printer.language, value, undefined, printer)
        return printer.makeAssign(receiver, undefined,
                printer.makeCast(printer.makeMethodCall(`${param}Deserializer`,
                        "readCustomObject",
                        [printer.makeString(`"${this.customTypeName}"`)]),
                    printer.makeType(this.tsTypeName, false, receiver)), false)
    }
    nativeType(impl: boolean): string {
        return PrimitiveType.CustomObject.getText()
    }
    interopType(language: Language): string {
        throw new Error("Must never be used")
    }
    isPointerType(): boolean {
        return true
    }
    override getMembers(): string[] {
        return CustomTypeConvertor.knownTypes.get(this.customTypeName)?.map(it => it[0]) ?? super.getMembers()
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        const uniqueFields = CustomTypeConvertor.knownTypes.get(this.customTypeName)?.filter(it => !duplicates.has(it[0]))
        return this.discriminatorFromFields(value, writer, uniqueFields, it => it[0], it => it[1])
    }
}

export class NumberConvertor extends BaseArgConvertor {
    constructor(param: string) {
        // TODO: as we pass tagged values - request serialization to array for now.
        // Optimize me later!
        super("number", [RuntimeType.NUMBER], false, false, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        return writer.language == Language.CPP ?  `(const ${PrimitiveType.Number.getText()}*)&${param}` : param
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, "writeNumber", [value])
    }
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        const receiver = this.getObjectAccessor(writer.language, value, undefined, writer)
        return writer.makeAssign(receiver, undefined,
            writer.makeCast(
                writer.makeString(`${param}Deserializer.readNumber()`),
                writer.makeType(this.tsTypeName, false, receiver)), false)
    }
    nativeType(): string {
        return PrimitiveType.Number.getText()
    }
    interopType(language: Language): string {
        return language == Language.CPP ?  "KInteropNumber" : "number"
    }
    isPointerType(): boolean {
        return true
    }
}

export class PredefinedConvertor extends BaseArgConvertor {
    constructor(param: string, tsType: string, private convertorName: string, private cType: string) {
        super(tsType, [RuntimeType.OBJECT, RuntimeType.UNDEFINED], false, true, param)
    }
    convertorArg(param: string, writer: LanguageWriter): string {
        throw new Error("unused")
    }
    convertorSerialize(param: string, value: string, printer: LanguageWriter): void {
        printer.writeMethodCall(`${param}Serializer`, `write${this.convertorName}`, [value])
    }
    convertorDeserialize(param: string, value: string, writer: LanguageWriter): LanguageStatement {
        const accessor = this.getObjectAccessor(writer.language, value, undefined, writer)
        return writer.makeAssign(accessor, undefined, writer.makeString(`${param}Deserializer.read${this.convertorName}()`), false)
    }
    nativeType(impl: boolean): string {
        return this.cType
    }
    interopType(language: Language): string {
        return language == Language.CPP ? PrimitiveType.Int32.getText() + "*" :  "Int32ArrayPtr"
    }
    isPointerType(): boolean {
        return true
    }
}