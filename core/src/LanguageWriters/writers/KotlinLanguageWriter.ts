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
import { Language } from '../../Language'
import { IndentedPrinter } from "../../IndentedPrinter";
import {
    AssignStatement,
    BlockStatement,
    DelegationCall,
    DelegationType,
    EnumMember,
    ExpressionStatement,
    FieldModifier,
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
    NamespaceOptions,
    ObjectArgs,
    ReturnStatement,
    TsEnumEntityStatement,
} from "../LanguageWriter"
import { ArgConvertor } from "../ArgConvertors"
import { IdlNameConvertor } from "../nameConvertor"
import { RuntimeType } from "../common";
import { isDefined } from "../../util"
import { ReferenceResolver } from "../../peer-generation/ReferenceResolver";

export class KotlinLambdaReturnStatement implements LanguageStatement {
    constructor(public expression?: LanguageExpression) { }
    write(writer: LanguageWriter): void {
        if (this.expression) writer.print(`${this.expression.asString()}`)
    }
}

export class KotlinEnumWithGetter extends TsEnumEntityStatement implements LanguageStatement {
    constructor(enumEntity: idl.IDLEnum) {
        super(enumEntity, { isExport: false, isDeclare: false })
    }

    static readonly value = "value"
    static readonly values = "values"
    static readonly ordinal = "ordinal"

    override write(writer: LanguageWriter) {
        const members = this.getMembers()
        const realCount = this.enumEntity.elements.length
        if (members.length !== realCount && members.length !== realCount * 2) {
            throw new Error(`Unexpected member count for enum ${this.enumEntity.name}`)
        }

        const isStringEnum = this.enumEntity.elements.some(it => typeof it.initializer == "string")

        writer.writeClass(this.enumEntity.name, () => {
            writer.writeStaticEntitiesBlock(() => {
                const mapping = new Map<number, string>()
                this.writeEnumMembers(writer, members, isStringEnum, mapping)
                this.writeValuesMap(writer, mapping)
            })
            this.writeFields(writer, isStringEnum)
            this.writeConstructor(writer, isStringEnum)
        })
    }
    protected writeEnumMembers(writer: LanguageWriter, members: EnumMember[],
        isStringEnum: boolean, mapping: Map<number, string>
    ): void {
        const enumType = idl.createReferenceType(this.enumEntity)
        const modifiers = [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.READONLY, FieldModifier.FINAL]
        for (let i = 0; i < members.length; i++) {
            const it = members[i]
            let initializer: string
            if (mapping.has(it.numberId)) {
                initializer = mapping.get(it.numberId)!
            }
            else {
                initializer = isStringEnum ?
                    `${this.enumEntity.name}(${it.numberId}, "${it.stringId}")` :
                    `${this.enumEntity.name}(${it.numberId})`
                mapping.set(it.numberId, it.name)
            }
            writer.writeFieldDeclaration(it.name, enumType, modifiers, false, writer.makeString(initializer))
        }
    }
    protected writeValuesMap(writer: LanguageWriter, mapping: Map<number, string>): void {
        const enumType = idl.createReferenceType(this.enumEntity)
        const mappingStr: string[] = Array.from(mapping).map(it => `${it[0]} to ${it[1]}`)
        const mapType = idl.createContainerType("record", [idl.IDLI32Type, enumType])
        const modifiers = [FieldModifier.PUBLIC, FieldModifier.READONLY, FieldModifier.FINAL]
        const initExpr = writer.makeString(`mutableMapOf(${mappingStr.join(", ")})`)
        writer.writeFieldDeclaration(KotlinEnumWithGetter.values, mapType, modifiers, false, initExpr)
    }
    protected writeConstructor(writer: LanguageWriter, isStringEnum: boolean): void {
        const modifiers = [MethodModifier.PRIVATE]
        if (isStringEnum) {
            const signature = new MethodSignature(idl.IDLVoidType, [idl.IDLI32Type, idl.IDLStringType])
            writer.writeConstructorImplementation("constructor", signature, () => {
                const initExpr = [0, 1].map(i => writer.makeString(signature.argName(i)))
                writer.writeStatement(
                    writer.makeAssign(KotlinEnumWithGetter.ordinal, undefined, initExpr[0], false)
                )
                writer.writeStatement(
                    writer.makeAssign(KotlinEnumWithGetter.value, undefined, initExpr[1], false)
                )
            }, undefined, modifiers)
        }
        else {
            const signature = new MethodSignature(idl.IDLVoidType, [idl.IDLI32Type])
            writer.writeConstructorImplementation("constructor", signature, () => {
                const initExpr = writer.makeString(signature.argName(0))
                writer.writeStatement(
                    writer.makeAssign(`this.${KotlinEnumWithGetter.value}`, undefined, initExpr, false)
                )
            }, undefined, modifiers)
        }
    }
    protected writeFields(writer: LanguageWriter, isStringEnum: boolean): void {
        const modifiers = [FieldModifier.PUBLIC, FieldModifier.READONLY, FieldModifier.FINAL]
        if (isStringEnum) {
            writer.writeFieldDeclaration(KotlinEnumWithGetter.ordinal, idl.IDLI32Type, modifiers, true)
            writer.writeFieldDeclaration(KotlinEnumWithGetter.value, idl.IDLStringType, modifiers, true)
        }
        else {
            writer.writeFieldDeclaration(KotlinEnumWithGetter.value, idl.IDLI32Type, modifiers, true)
        }
    }
}

class KotlinMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private body: LanguageStatement[]) {}
    write(writer: LanguageWriter): void {
        writer.print(`for ((${this.key}, ${this.value}) in ${this.map}) {`)
        writer.pushIndent()
        writer.writeStatement(new BlockStatement(this.body, false))
        writer.popIndent()
        writer.print(`}`)
    }
}

export class KotlinThrowErrorStatement implements LanguageStatement {
    constructor(public exception: LanguageExpression) { }
    write(writer: LanguageWriter): void {
        writer.print(`throw ${this.exception.asString()}`)
    }
}

export class KotlinLoopStatement implements LanguageStatement {
    constructor(private counter: string, private limit: string, private statement: LanguageStatement | undefined) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (${this.counter} in 0..<${this.limit}) {`)
        if (this.statement) {
            writer.pushIndent()
            this.statement.write(writer)
            writer.popIndent()
            writer.print("}")
        }
    }
}
export class KotlinAssignStatement extends AssignStatement {
    constructor(public variableName: string,
        public type: idl.IDLType | undefined,
        public expression: LanguageExpression,
        public isDeclared: boolean = true,
        public isConst: boolean = true) {
            super(variableName, type, expression, isDeclared, isConst)
        }

        write(writer: LanguageWriter): void {
            if (this.isDeclared) {
                const typeSpec =
                    this.options?.overrideTypeName
                        ? `: ${this.options.overrideTypeName}`
                        : this.type ? `: ${writer.getNodeName(this.type)}` : ""
                const constSpec = this.isConst ? "val" : "var"
                const initValue = this.expression ? `= ${this.expression.asString()}` : ""
                writer.print(`${constSpec} ${this.variableName}${typeSpec} ${initValue}`)
            } else {
                writer.print(`${this.variableName} = ${this.expression.asString()}`)
            }
        }
}

export class KotlinNewObjectExpression implements LanguageExpression {
    constructor(
        private objectName: string,
        private params: LanguageExpression[]) { }
    asString(): string {
        return `${this.objectName}(${this.params.map(it => it.asString()).join(", ")})`
    }
}

class KotlinUnwrapOptionalExpression implements LanguageExpression {
    constructor(public value: LanguageExpression) {}
    asString(): string {
        return `requireNotNull(${this.value.asString()})`
    }
}

class KotlinLambdaExpression extends LambdaExpression {
    constructor(
        protected writer: LanguageWriter,
        signature: MethodSignature,
        resolver: ReferenceResolver,
        body?: LanguageStatement[]) {
        super(writer, signature, resolver, body)
    }
    protected get statementHasSemicolon(): boolean {
        return false
    }
    asString(): string {
        const params = this.signature.args.map((it, i) => `${this.writer.escapeKeyword(this.signature.argName(i))}: ${this.writer.getNodeName(it)}`)
        return `{${params.join(", ")} -> ${this.bodyAsString()} }`
    }
}

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
        // another stub. Bad one.
        // I hope that I will rewrite LWs soon
        if (idl.isType(type) && idl.isReferenceType(type)) {
            if (type.name.startsWith('%TEXT%:')) {
                return type.name.substring(7)
            }
        }
       return this.typeConvertor.convert(type)
    }

    override get interopModule(): string {
        return "koalaui.interop"
    }

    override maybeSemicolon(): string { return "" }

    writeClass(
        name: string,
        op: (writer: this) => void,
        superClass?: string,
        interfaces?: string[],
        generics?: string[],
        isDeclared?: boolean,
        isAbstract?: boolean
    ): void {
        let extendsClause = superClass ? `${superClass}` : undefined
        let implementsClause = interfaces ? `${interfaces.join(', ')}` : undefined
        let inheritancePart = [extendsClause, implementsClause]
            .filter(isDefined)
            .join(', ')
        let genericsClause = generics?.length ? `<${generics.join(", ")}>` : ''
        inheritancePart = inheritancePart.length != 0 ? ': '.concat(inheritancePart) : ''
        this.printer.print(`public open class ${name}${genericsClause}${inheritancePart} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeInterface(name: string, op: (writer: this) => void, superInterfaces?: string[], generics?: string[], isDeclared?: boolean): void {
        const genericsClause = generics?.length ? `<${generics.join(", ")}>` : ''
        const inheritance = superInterfaces ? (superInterfaces.length > 0 ? `: ${superInterfaces.join(', ')}` : '') : ''
        this.printer.print(`public interface ${name}${genericsClause}${inheritance} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeFunctionDeclaration(name: string, signature: MethodSignature, generics?:string[]): void {
        this.printer.print(this.generateFunctionDeclaration(name, signature))
    }
    writeFunctionImplementation(name: string, signature: MethodSignature, op: (writer: this) => void, generics?:string[]): void {
        this.printer.print(`${this.generateFunctionDeclaration(name, signature)} {`)
        this.printer.pushIndent()
        op(this)
        this.printer.popIndent()
        this.printer.print('}')
    }
    private generateFunctionDeclaration(name: string, signature: MethodSignature): string {
        const args = signature.args.map((it, index) => `${signature.argName(index)}: ${this.getNodeName(it)}`)
        return `public fun ${name}(${args.join(", ")}): ${this.getNodeName(signature.returnType)}`
    }
    writeEnum(name: string, members: { name: string, alias?: string | undefined, stringId: string | undefined, numberId: number }[], options: { isDeclare?: boolean, isExport: boolean }): void {
        throw new Error("Try to avoid writeEnum")
    }
    private writeDeclaration(name: string, signature: MethodSignature, needReturn: boolean, needBracket: boolean, modifiers?: MethodModifier[], generics?: string[]) {
        let prefix = !modifiers ? undefined : this.supportedModifiers
            .filter(it => modifiers.includes(it))
            .map(it => this.mapMethodModifier(it)).join(" ")
        if (modifiers?.includes(MethodModifier.GETTER)) {
            prefix = `${prefix} get`
        } else if (modifiers?.includes(MethodModifier.SETTER)) {
            prefix = `${prefix} set`
            needReturn = false
        }
        prefix = prefix ? prefix.trim() + " " : ""
        const typeParams = generics?.length ? `<${generics.join(", ")}>` : ""
        const normalizedArgs = signature.args.map((it, i) =>
            idl.isOptionalType(it) && signature.isArgOptional(i) ? idl.maybeUnwrapOptionalType(it) : it
        )
        const parametersPart = normalizedArgs.map((it, index) => {
            const isOptional = signature.isArgOptional(index)
            let defaultValue: string
            if (modifiers && modifiers?.includes(MethodModifier.OVERRIDE)) {
                defaultValue = ""
            }
            else {
                if (signature.argDefault(index)) {
                    defaultValue = signature.argDefault(index)!
                }
                else {
                    defaultValue = isOptional ? "null" : ""
                }
            }
            return `${signature.argName(index)}: ${this.getNodeName(it)}${isOptional ? "?" : ""}${defaultValue ? " = " + defaultValue : ""}`
        }).join(", ")
        if (signature.returnType === idl.IDLThisType) {
            throw new Error(`Return type 'this' must be substituted when generating for Kotlin`)
        }
        const returnTypePart = needReturn ? ": " + this.getNodeName(signature.returnType) : ""
        this.printer.print(`${prefix}fun ${typeParams}${name}(${parametersPart})${returnTypePart}${needBracket ? " {" : ""}`)
    }
    writeFieldDeclaration(name: string, type: idl.IDLType, modifiers: FieldModifier[]|undefined, optional: boolean, initExpr?: LanguageExpression): void {
        const init = initExpr != undefined ? ` = ${initExpr.asString()}` : ``
        let prefix = this.makeFieldModifiersList(modifiers?.filter(m => m != FieldModifier.READONLY && m != FieldModifier.STATIC))
        prefix = prefix ? prefix.concat(" ") : ""
        let open = ""
        if (!modifiers?.includes(FieldModifier.PRIVATE) && !modifiers?.includes(FieldModifier.FINAL)) {
            open = "open "
        }
        const valOrVar = modifiers?.includes(FieldModifier.READONLY) ? "val" : "var"
        this.printer.print(`${prefix}${open}${valOrVar} ${name}: ${this.getNodeName(idl.maybeOptional(type, optional))}${init}`)
    }
    writeNativeMethodDeclaration(method: Method, isStub?: boolean): void {
        const originalName = method.name
        const methodName = originalName.replaceAll("$", "_")
        let interopCallName = `kotlin${originalName}`
        if (originalName.includes("$")) {
            interopCallName = "`" + interopCallName + "`"
        }
        const signature = method.signature
        this.writeMethodImplementation(new Method(methodName, signature, [MethodModifier.STATIC]), writer => {
            if (isStub) {
                this.writeStatement(this.makeThrowError("Object deserialization is not implemented."))
                return
            }

            const pins = signature.args.flatMap((type, index) => this.pinArrayArgument(signature.argName(index), type))
            const unpins = signature.args.flatMap((type, index) => this.unpinArrayArgument(signature.argName(index), type))
            pins.filter(it => !!it).forEach(it => this.writeStatement(it!))
            const args = signature.args.map((type, index) => this.convertInteropArgument(signature.argName(index), type))
            this.printForeignApiOptIn()
            const interopCallExpression = this.makeFunctionCall(interopCallName, args)
            if (signature.returnType === idl.IDLVoidType) {
                this.writeExpressionStatement(interopCallExpression)
                unpins.filter(it => !!it).forEach(it => this.writeStatement(it!))
                return
            }
            const retval = "retval"
            this.writeStatement(this.makeAssign(retval, undefined, interopCallExpression))
            unpins.filter(it => !!it).forEach(it => this.writeStatement(it!))
            this.printForeignApiOptIn()
            this.writeStatement(this.makeReturn(this.convertInteropReturnValue(retval, signature.returnType)))
        })
    }
    private printForeignApiOptIn() {
        this.writeStatement(this.foreignApiOptIn)
    }
    private get foreignApiOptIn(): LanguageStatement {
        return new ExpressionStatement(this.makeString("@OptIn(ExperimentalForeignApi::class)"))
    }
    private isPrimitiveArray(type: idl.IDLType): boolean {
        if (!idl.IDLContainerUtils.isSequence(type)) {
            return false
        }
        const elementType = (type as idl.IDLContainerType).elementType[0]
        const allowedTypes: idl.IDLType[] = [idl.IDLU8Type, idl.IDLI32Type, idl.IDLF32Type]
        return allowedTypes.includes(elementType)
    }
    private pinArrayArgument(varName: string, type: idl.IDLType): LanguageStatement[] {
        if (this.isPrimitiveArray(type)) {
            const pinCall = this.makeMethodCall(varName, "pin", [])
            const assign = this.makeAssign(`${varName}Pinned`, undefined, pinCall, true, true)
            return [this.foreignApiOptIn, assign]
        }
        return []
    }
    private unpinArrayArgument(varName: string, type: idl.IDLType): LanguageStatement[] {
        if (this.isPrimitiveArray(type)) {
            const call = new ExpressionStatement(this.makeMethodCall(`${varName}Pinned`, "unpin", []))
            return [this.foreignApiOptIn, call]
        }
        return []
    }
    private convertInteropArgument(varName: string, type: idl.IDLType): LanguageExpression {
        const realInteropType = this.getNodeName(type)
        let expr: string
        switch (realInteropType) {
            case "KUint8ArrayPtr":
            case "KInt32ArrayPtr":
            case "KFloat32ArrayPtr": expr = `${varName}Pinned.addressOf(0)`; break
            case "KNativePointer":
            case "KSerializerBuffer": expr = `${varName}.toCPointer<CPointed>()!!`; break
            case "KByte":
            case "KShort":
            case "KInt":
            case "KLong":
            case "KFloat":
            case "KDouble":
            case "KStringPtr": expr = varName; break
            case "KUShort":
            case "KUInt":
            case "KULong": {
                expr = `${varName}.to${realInteropType.substring(2)}()`; break
            }
            case "Boolean": {
                // small trick to hide all casts Boolean <=> KBoolean in a NativeModule
                expr = `${varName}.toByte()`; break
            }
            default: throw new Error(`Unexpected type ${realInteropType} in interop with Kotlin`)
        }
        return this.makeString(expr)
    }
    private convertInteropReturnValue(varName: string, type: idl.IDLType): LanguageExpression {
        const realInteropType = this.getNodeName(type)
        let expr: string
        switch (realInteropType) {
            case "KNativePointer": expr = `${varName}.toLong()`; break
            case "KByte":
            case "KShort":
            case "KInt":
            case "KLong":
            case "KFloat":
            case "KDouble": expr = varName; break
            case "KStringPtr": expr = `${varName}?.toKString() ?: ""`; break
            case "KUShort":
            case "KUInt":
            case "KULong": {
                expr = `${varName}.toU${realInteropType.substring(2)}()`; break
            }
            case "Boolean": {
                // small trick to hide all casts Boolean <=> KBoolean in a NativeModule
                expr = `${varName} != 0.toByte()`; break
            }
            case "Any": {
                // unsupported case for now, implementation returns Unit (analogue of void) instead of a real object
                expr = varName; break
            }
            case "KInteropReturnBuffer": expr = `${varName}.useContents { KInteropReturnBuffer(length, data.toLong()) }`; break
            default: throw new Error(`Unexpected type ${realInteropType} in interop with Kotlin`)
        }
        return this.makeString(expr)
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void {
        this.writeDeclaration(name, signature, true, false, modifiers, [])
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: this) => void, delegationCall?: DelegationCall, modifiers?: MethodModifier[]) {
        const delegationType = (delegationCall?.delegationType == DelegationType.THIS) ? "this" : "super"
        const superInvocation = delegationCall
            ? ` : ${delegationType}(${delegationCall.delegationArgs.map(it => it.asString()).join(", ")})`
            : ``
        const argList = signature.args.map((it, index) => {
            const maybeDefault = signature.defaults?.[index] ? ` = ${signature.defaults![index]}` : ""
            return `${signature.argName(index)}: ${this.getNodeName(it)}${maybeDefault}`
        }).join(", ")
        const modifierList = modifiers ? modifiers.map((it) => MethodModifier[it].toLowerCase()).join(" ") + " " : ""
        this.print(`${modifierList}constructor(${argList})${superInvocation} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeMethodImplementation(method: Method, op: (writer: this) => void) {
        this.writeDeclaration(method.name, method.signature, true, true, method.modifiers, method.generics)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeProperty(propName: string, propType: idl.IDLType, modifiers: FieldModifier[], getter?: { method: Method, op: () => void }, setter?: { method: Method, op: () => void }, initExpr?: LanguageExpression): void {
        let containerName = propName.concat("_container")
        let truePropName = this.escapeKeyword(propName)
        const isReadonly = modifiers.includes(FieldModifier.READONLY)
        const isGetter = modifiers.includes(FieldModifier.GET)
        const isSetter = modifiers.includes(FieldModifier.SET)
        const isImmutable = isReadonly || (isGetter && !isSetter)
        let isOverride = modifiers.includes(FieldModifier.OVERRIDE)
        let initializer = initExpr ? ` = ${initExpr.asString()}` : ""
        this.print(`${isOverride ? 'override ' : ''}public ${isImmutable ? "val " : "var "}${truePropName}: ${this.getNodeName(propType)}${initializer}`)
        if (getter) {
            this.pushIndent()
            this.writeGetterImplementation(getter.method, getter.op)
            this.popIndent()
        }
        if (setter) {
            this.pushIndent()
            this.writeSetterImplementation(setter.method, setter ? setter.op : (writer) => { writer.print(`${containerName} = ${truePropName}`) })
            this.popIndent()
        }
    }
    writeGetterImplementation(method: Method, op?: (writer: this) => void): void {
        this.print(`get() {`)
        this.pushIndent()
        op ? op!(this) : this.print(`return ${(method.signature as NamedMethodSignature).argsNames!.map(arg => `${arg}_container`).join(', ')}`)
        this.popIndent()
        this.print('}')
    }
    writeSetterImplementation(method: Method, op: (writer: this) => void): void {
        this.print(`set(${(method.signature as NamedMethodSignature).argsNames!.map(arg => this.escapeKeyword(arg)).join(', ')}) {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.print('}')
    }
    writeTypeDeclaration(decl: idl.IDLTypedef): void {
        throw new Error("Not implemented")
    }
    writeConstant(constName: string, constType: idl.IDLType, constVal?: string): void {
        this.print(`val ${constName} = ${constVal}`)
    }
    override writeImports(moduleName: string, importedFeatures: string[], aliases: string[]): void {
        if (importedFeatures.length !== aliases.length) {
            throw new Error(`Inconsistent imports from ${moduleName}`)
        }
        for (let i = 0; i < importedFeatures.length; i++) {
            const alias =  aliases[i] ? ` as ${aliases[i]}` : ``
            this.writeExpressionStatement(this.makeString(`import ${moduleName}.${importedFeatures[i]}` + alias))
        }
    }
    makeNull(): LanguageExpression {
        return this.makeString('null')
    }
    makeAssign(variableName: string, type: idl.IDLType | undefined, expr: LanguageExpression, isDeclared: boolean = true, isConst: boolean = true, options?: MakeAssignOptions): LanguageStatement {
        return new KotlinAssignStatement(variableName, type, expr, isDeclared, isConst)
    }
    makeLambda(signature: MethodSignature, body?: LanguageStatement[]): LanguageExpression {
        return new KotlinLambdaExpression(this, signature, this.resolver, body)
    }
    makeThrowError(message: string | LanguageExpression): LanguageStatement {
        if (typeof message === 'string')
            message = this.makeString(`Error("${message}")`)
        return new KotlinThrowErrorStatement(message)
    }
    makeReturn(expr: LanguageExpression): LanguageStatement {
        return new ReturnStatement(expr)
    }
    makeLambdaReturn (expr: LanguageExpression): LanguageStatement {
        return new KotlinLambdaReturnStatement(expr)
    }
    makeStatement(expr: LanguageExpression): LanguageStatement {
        return new ExpressionStatement(expr)
    }
    makeLoop(counter: string, limit: string, statement?: LanguageStatement): LanguageStatement {
        return new KotlinLoopStatement(counter, limit, statement)
    }
    makeMapForEach(map: string, key: string, value: string, body: LanguageStatement[]): LanguageStatement {
        return new KotlinMapForEachStatement(map, key, value, body)
    }
    writePrintLog(message: string): void {
        this.print(`println(\"${message}\")`)
    }
    makeCast(value: LanguageExpression, node: idl.IDLNode, options?: MakeCastOptions): LanguageExpression {
        return this.makeString(`${value.asString()} as ${this.getNodeName(node)}`)
    }
    typeInstanceOf(type: idl.IDLEntry, value: string, members?: string[]): LanguageExpression {
        throw new Error("Not implemented")
    }
    getObjectAccessor(convertor: ArgConvertor, value: string, args?: ObjectArgs): string {
        throw new Error("Not implemented")
    }
    makeUndefined(): LanguageExpression {
        return this.makeNull()
    }
    makeRuntimeType(rt: RuntimeType): LanguageExpression {
        return this.makeString(`RuntimeType.${RuntimeType[rt]}.value`)
    }
    makeTupleAlloc(option: string): LanguageStatement {
        throw new Error("Not implemented")
    }
    makeTupleAccess(value: string, index: number): LanguageExpression {
        return this.makeString(`${value}.component${index + 1}()`)
    }
    makeArrayInit(type: idl.IDLContainerType, size?: number): LanguageExpression {
        const elementType = this.getNodeName(type.elementType[0])
        return this.makeString(`@Suppress("UNCHECKED_CAST") run { arrayOfNulls<${elementType}>(${size ?? '0'}) as Array<${elementType}> }`)
    }
    makeArrayLength(array: string, length?: string): LanguageExpression {
        return this.makeString(`${array}.size`)
    }
    makeClassInit(type: idl.IDLType, paramenters: LanguageExpression[]): LanguageExpression {
        throw new Error("Not implemented")
    }
    makeMapInit(type: idl.IDLType): LanguageExpression {
        if (!idl.isContainerType(type)) {
            throw new Error(`Map initialization cannot be done with a type that is not container: ${this.getNodeName(type)}`)
        }
        const types = type.elementType.map(it => this.getNodeName(it))
        return this.makeString(`mutableMapOf<${types[0]}, ${types[1]}>()`)
    }
    makeMapInsert(keyAccessor: string, key: string, valueAccessor: string, value: string): LanguageStatement {
        return this.makeStatement(this.makeMethodCall(keyAccessor, "put", [this.makeString(key), this.makeString(value)]))
    }
    makeUnwrapOptional(expression: LanguageExpression): LanguageExpression {
        return new KotlinUnwrapOptionalExpression(expression)
    }
    makeDefinedCheck(value: string): LanguageExpression {
        return this.makeString(`${value} != null`)
    }
    makeUnionSelector(value: string, valueType: string): LanguageStatement {
        return this.makeAssign(valueType, undefined, this.makeMethodCall(value, "getSelector", []), false)
    }
    makeUnionVariantCast(value: string, type: string, convertor: ArgConvertor, index: number) {
        return this.makeMethodCall(value, `getValue${index}`, [])
    }
    makeValueFromOption(value: string, destinationConvertor: ArgConvertor): LanguageExpression {
        return this.makeString(`${value}!!`)
    }
    makeUnionVariantCondition(_convertor: ArgConvertor, _valueName: string, valueType: string, type: string,
        _convertorIndex?: number,
        _runtimeTypeIndex?: number): LanguageExpression {
        return this.makeString(`RuntimeType.${type.toUpperCase()}.value == ${valueType}`)
    }
    makeRuntimeTypeCondition(typeVarName: string, equals: boolean, type: RuntimeType, varName: string): LanguageExpression {
        if (varName) {
            return this.makeDefinedCheck(varName)
        } else {
            const op = equals ? "==" : "!="
            return this.makeNaryOp(op, [this.makeRuntimeType(type), this.makeString(`${typeVarName}`)])
        }
    }
    getTagType(): idl.IDLType {
        return idl.createReferenceType("Tag")
    }
    getRuntimeType(): idl.IDLType {
        return idl.IDLI8Type
    }
    makeTupleAssign(receiver: string, fields: string[]): LanguageStatement {
        throw new Error("Not implemented")
    }
    get supportedModifiers(): MethodModifier[] {
        return [MethodModifier.PUBLIC, MethodModifier.PROTECTED, MethodModifier.PRIVATE, MethodModifier.OVERRIDE, MethodModifier.OPEN]
    }
    get supportedFieldModifiers(): FieldModifier[] {
        return [FieldModifier.PUBLIC, FieldModifier.PRIVATE, FieldModifier.PROTECTED, FieldModifier.READONLY, FieldModifier.OVERRIDE]
    }
    enumFromI32(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        return this.makeString(`${this.getNodeName(enumEntry)}.${KotlinEnumWithGetter.values}[${value.asString()}]!!`)
    }
    i32FromEnum(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        const fieldName = idl.isStringEnum(enumEntry) ? KotlinEnumWithGetter.ordinal : KotlinEnumWithGetter.value
        return this.makeString(`${value.asString()}.${fieldName}!!`)
    }
    makeEnumEntity(enumEntity: idl.IDLEnum, options: { isExport: boolean, isDeclare?: boolean }): LanguageStatement {
        return new KotlinEnumWithGetter(enumEntity)
    }
    castToBoolean(value: string): string {
        return value
    }
    castToInt(value: string, bitness: 8|32): string {
        return `${this.escapeKeyword(value)}.${bitness == 8 ? 'toByte()' : 'toInt()'}`
    }
    makeCallIsObject(value: string): LanguageExpression {
        throw new Error("Not implemented")
    }
    makeNewObject(objectName: string, params: LanguageExpression[] = []): LanguageExpression {
        return new KotlinNewObjectExpression(objectName, params)
    }
    makeFunctionReference(name: string): LanguageExpression {
        return this.makeString(`::${name}`)
    }
    makeMethodReference(receiver: string, method: string): LanguageExpression {
        return this.makeString(`${receiver}::${method}`)
    }
    escapeKeyword(keyword: string): string {
        return keyword
    }
    makeCastCustomObject(customName: string, isGenericType: boolean): LanguageExpression {
        return this.makeCast(this.makeString(customName), idl.IDLAnyType)
    }
    writeStaticEntitiesBlock(op: (writer: LanguageWriter) => void) {
        this.writePrefixedBlock("companion object", op)
    }
    pushNamespace(namespace: string, options: NamespaceOptions) {
        this.print(`class ${namespace} {`)
        if (options.indent) this.pushIndent()
        this.namespaceStack.push(namespace)
    }
    popNamespace(options: { indent: boolean }) {
        this.namespaceStack.pop()
        if (options.indent) this.popIndent()
        this.print(`}`)
    }
}
