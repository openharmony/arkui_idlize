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
    DelegationCall,
    DelegationType,
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
import { isDefined, rightmostIndexOf, throwException } from "../../util"
import { ReferenceResolver } from "../../peer-generation/ReferenceResolver";
import { removePoints } from '../convertors/CJConvertors';

export class KotlinLambdaReturnStatement implements LanguageStatement {
    constructor(public expression?: LanguageExpression) { }
    write(writer: LanguageWriter): void {
        if (this.expression) writer.print(`${this.expression.asString()}`)
    }
}
export class KotlinEnumEntityStatement implements LanguageStatement {
    constructor(
        private readonly enumEntity: idl.IDLEnum,
        private readonly options: { isExport: boolean, isDeclare: boolean },
    ) {}
    write(writer: LanguageWriter): void {
        let mangledName = removePoints(idl.getQualifiedName(this.enumEntity, 'namespace.name'))
        writer.print(`${this.options.isExport ? "public " : ""}enum class ${mangledName}(val value: Int) {`)
        writer.pushIndent()
        this.enumEntity.elements.forEach((member, index) => {
            const initValue = member.initializer != undefined
                ? `(${this.maybeQuoted(member.initializer)})` : ``
            writer.print(`${member.name}${initValue},`)

            let originalName = idl.getExtAttribute(member, idl.IDLExtendedAttributes.OriginalEnumMemberName)
            if (originalName) {
                const initValue = `(${member.name}.value)`
                writer.print(`${originalName}${initValue},`)
            }
        })
        writer.popIndent()
        writer.print(`}`)
    }

    private maybeQuoted(value: string|number): string {
        if (typeof value == "string")
            return `"${value}"`
        else
            return `${value}`
    }
}
export class KotlinEnumWithGetter implements LanguageStatement {
    constructor(private readonly enumEntity: idl.IDLEnum, private readonly isExport: boolean) {}

    write(writer: LanguageWriter) {
        const initializers = this.enumEntity.elements.map(it => {
            return {name: it.name, id: it.initializer}
        })

        const isStringEnum = initializers.every(it => typeof it.id == 'string')

        let memberValue = 0
        const members: {
            name: string,
            stringId: string | undefined,
            numberId: number,
        }[] = []
        for (const initializer of initializers) {
            if (typeof initializer.id == 'string') {
                members.push({name: initializer.name, stringId: initializer.id, numberId: memberValue})
            }
            else if (typeof initializer.id == 'number') {
                memberValue = initializer.id
                members.push({name: initializer.name, stringId: undefined, numberId: memberValue})
            }
            else {
                members.push({name: initializer.name, stringId: undefined, numberId: memberValue})
            }
            memberValue += 1
        }

        let mangledName = removePoints(idl.getQualifiedName(this.enumEntity, 'namespace.name'))
        writer.writeClass(mangledName, () => {
            const enumType = idl.createReferenceType(this.enumEntity)
            writer.makeStaticBlock(() => {
                members.forEach(it => {
                    writer.writeFieldDeclaration(it.name, idl.IDLAnyType, [FieldModifier.PUBLIC, FieldModifier.STATIC, FieldModifier.FINAL], false,
                        writer.makeString(`${mangledName}(${it.stringId ? `\"${it.stringId}\"` : it.numberId})`)
                    )
                })
            })

            const value = 'value'
            writer.writeFieldDeclaration(value, idl.IDLI32Type, [FieldModifier.PUBLIC], true, writer.makeNull())

            const signature = new MethodSignature(idl.IDLVoidType, [idl.IDLI32Type])
            writer.writeConstructorImplementation('constructor', signature, () => {
                writer.writeStatement(
                    writer.makeAssign(`this.${value}`, undefined, writer.makeString(signature.argName(0)), false)
                )
            })
            if (isStringEnum) {
                const stringValue = 'stringValue'
                writer.writeFieldDeclaration(stringValue, idl.IDLStringType, [FieldModifier.PUBLIC], true, writer.makeNull())
    
                const signature = new MethodSignature(idl.IDLVoidType, [idl.IDLStringType])
                writer.writeConstructorImplementation('constructor', signature, () => {
                    writer.writeStatement(
                        writer.makeAssign(`this.${stringValue}`, undefined, writer.makeString(signature.argName(0)), false)
                    )
                })
            }
        })
    }
}

class KotlinMapForEachStatement implements LanguageStatement {
    constructor(private map: string, private key: string, private value: string, private op: () => void) {}
    write(writer: LanguageWriter): void {
        writer.print(`for ((${this.key}, ${this.value}) in ${this.map}) {`)
        writer.pushIndent()
        this.op()
        writer.popIndent()
        writer.print(`}`)
    }
}

export class KotlinThrowErrorStatement implements LanguageStatement {
    constructor(public message: string) { }
    write(writer: LanguageWriter): void {
        writer.print(`throw Error("${this.message}")`)
    }
}

class KotlinArrayResizeStatement implements LanguageStatement {
    constructor(private array: string, private arrayType: string, private length: string, private deserializer: string) {}
    write(writer: LanguageWriter) {
        writer.print(`${this.array} = ${this.arrayType}(${this.length})`)
    }
}

export class KotlinLoopStatement implements LanguageStatement {
    constructor(private counter: string, private limit: string, private statement: LanguageStatement | undefined) {}
    write(writer: LanguageWriter): void {
        writer.print(`for (${this.counter} in 0..${this.limit}) {`)
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
        let implementsClause = interfaces ? `${interfaces.join(' , ')}` : undefined
        let inheritancePart = [extendsClause, implementsClause]
            .filter(isDefined)
            .join(' , ')
        inheritancePart = inheritancePart.length != 0 ? ' : '.concat(inheritancePart) : ''
        this.printer.print(`public open class ${name}${inheritancePart} {`)
        this.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print(`}`)
    }
    writeInterface(name: string, op: (writer: this) => void, superInterfaces?: string[], generics?: string[], isDeclared?: boolean): void {
        const inheritance = superInterfaces ? (superInterfaces.length > 0 ? `: ${superInterfaces.join(', ')}` : '') : ''
        this.printer.print(`public interface ${name}${inheritance} {`)
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
        this.printer.print(`${prefix}fun ${name}${typeParams}(${normalizedArgs.map((it, index) => `${signature.argName(index)}: ${this.getNodeName(it)}${signature.isArgOptional(index) ? "?" : ``}${signature.argDefault(index) ? ' = ' + signature.argDefault(index) : ""}`).join(", ")})${needReturn ? ": " + this.getNodeName(signature.returnType) : ""}${needBracket ? " {" : ""}`)
    }
    writeFieldDeclaration(name: string, type: idl.IDLType, modifiers: FieldModifier[]|undefined, optional: boolean, initExpr?: LanguageExpression): void {
        const init = initExpr != undefined ? ` = ${initExpr.asString()}` : ``
        let prefix = this.makeFieldModifiersList(modifiers?.filter(m => m != FieldModifier.READONLY && m != FieldModifier.STATIC))
        this.printer.print(`${prefix ? prefix.concat(" ") : ""}${modifiers?.includes(FieldModifier.READONLY) ? 'val' : 'var'} ${name}: ${this.getNodeName(idl.maybeOptional(type, optional))}${init}`)
    }
    writeNativeMethodDeclaration(method: Method): void {
        let name = method.name
        let signature = method.signature
        this.writeMethodImplementation(new Method(name, signature, [MethodModifier.STATIC]), writer => {
            const args = signature.args.map((type, index) => this.convertInteropArgument(signature.argName(index), type))
            const interopCallExpression = this.makeFunctionCall(`kotlin${name}`, args)
            if (signature.returnType === idl.IDLVoidType) {
                this.writeExpressionStatement(interopCallExpression)
                return
            }
            const retval = "retval"
            this.writeStatement(this.makeAssign(retval, undefined, interopCallExpression))
            this.writeStatement(this.makeReturn(this.convertInteropReturnValue(retval, signature.returnType)))
        })
    }
    private convertInteropArgument(varName: string, type: idl.IDLType): LanguageExpression {
        const realInteropType = this.getNodeName(type)
        let expr: string
        switch (realInteropType) {
            case "KPointer":
            case "KSerializerBuffer": expr = `${varName}.toCPointer<CPointed>()!!`; break
            case "KInt":
            case "KLong":
            case "KFloat":
            case "KDouble":
            case "KStringPtr":
            case "KBoolean":
            case "Float64":
            case "Float":
            case "Double":
            case "UInt":
            case "Int": expr = varName; break
            default: throw new Error(`Unexpected type ${realInteropType} in interop with Kotlin`)
        }
        return this.makeString(expr)
    }
    private convertInteropReturnValue(varName: string, type: idl.IDLType): LanguageExpression {
        const realInteropType = this.getNodeName(type)
        let expr: string
        switch (realInteropType) {
            case "KPointer": expr = `${varName}.toLong()`; break
            case "KInt":
            case "KLong":
            case "Float64":
            case "Float":
            case "Double":
            case "Long":
            case "Int": expr = varName; break
            case "String":
            case "KStringPtr": expr = `${varName}?.toKString() ?: ""`; break
            case "Boolean":
            case "KBoolean": expr = `${varName} != 0.toByte()`; break
            case "KInteropReturnBuffer": expr = `${varName}.useContents { KInteropReturnBuffer(length, data.toLong()) }`; break
            default: throw new Error(`Unexpected type ${realInteropType} in interop with Kotlin`)
        }
        return this.makeString(expr)
    }
    writeMethodDeclaration(name: string, signature: MethodSignature, modifiers?: MethodModifier[]): void {
        this.writeDeclaration(name, signature, true, false, modifiers)
    }
    writeConstructorImplementation(className: string, signature: MethodSignature, op: (writer: this) => void, delegationCall?: DelegationCall, modifiers?: MethodModifier[]) {
        const delegationType = (delegationCall?.delegationType == DelegationType.THIS) ? "this" : "super"
        const superInvocation = delegationCall
        ? ` : ${delegationType}(${delegationCall.delegationArgs.map(it => it.asString()).join(", ")})`
        : ""
        const argList = signature.args.map((it, index) => {
            const maybeDefault = signature.defaults?.[index] ? ` = ${signature.defaults![index]}` : ""
            return `${signature.argName(index)}: ${this.getNodeName(it)}${maybeDefault}`
        }).join(", ");
        this.print(`constructor(${argList})${superInvocation} {`)
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
        if (getter) {
            if(!getter!.op) {
                this.print(`private var ${containerName}: ${this.getNodeName(propType)}`)
            }
        }
        let isMutable = !modifiers.includes(FieldModifier.READONLY)
        let isOverride = modifiers.includes(FieldModifier.OVERRIDE)
        let initializer = initExpr ? ` = ${initExpr.asString()}` : ""
        this.print(`${isOverride ? 'override ' : ''}public ${isMutable ? "var " : "val "}${truePropName}: ${this.getNodeName(propType)}${initializer}`)
        if (getter) {
            this.pushIndent()
            this.writeGetterImplementation(getter.method, getter.op)
            if (isMutable) {
                if (setter) {
                    this.writeSetterImplementation(setter.method, setter ? setter.op : (writer) => {this.print(`${containerName} = ${truePropName}`)})
                } else {
                    this.print(`set(${truePropName}) {`)
                    this.pushIndent()
                    this.print(`${containerName} = ${truePropName}`)
                    this.popIndent()
                    this.print(`}`)
                }
            }
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
        throw new Error("Not implemented")
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
    makeThrowError(message: string): LanguageStatement {
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
    makeMapForEach(map: string, key: string, value: string, op: () => void): LanguageStatement {
        return new KotlinMapForEachStatement(map, key, value, op)
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
    makeArrayInit(type: idl.IDLContainerType, size?:number): LanguageExpression {
        return this.makeString(`ArrayList<${this.getNodeName(type.elementType[0])}>(${size ?? ''})`)
    }
    makeArrayLength(array: string, length?: string): LanguageExpression {
        return this.makeString(`${array}.size`)
    }
    makeArrayResize(array: string, arrayType: string, length: string, deserializer: string): LanguageStatement {
        return new KotlinArrayResizeStatement(array, arrayType, length, deserializer)
    }
    makeClassInit(type: idl.IDLType, paramenters: LanguageExpression[]): LanguageExpression {
        throw new Error("Not implemented")
    }
    makeMapInit(type: idl.IDLType): LanguageExpression {
        return this.makeString(`${this.getNodeName(type)}()`)
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
            return this.makeNaryOp(op, [this.makeRuntimeType(type), this.makeString(`${typeVarName}.toInt()`)])
        }
    }
    getTagType(): idl.IDLType {
        return idl.createReferenceType("Tag")
    }
    getRuntimeType(): idl.IDLType {
        return idl.IDLNumberType
    }
    makeTupleAssign(receiver: string, fields: string[]): LanguageStatement {
        throw new Error("Not implemented")
    }
    get supportedModifiers(): MethodModifier[] {
        return [MethodModifier.PUBLIC, MethodModifier.PRIVATE, MethodModifier.OVERRIDE]
    }
    get supportedFieldModifiers(): FieldModifier[] {
        return [FieldModifier.PUBLIC, FieldModifier.PRIVATE, FieldModifier.PROTECTED, FieldModifier.READONLY, FieldModifier.OVERRIDE]
    }
    enumFromI32(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        return this.makeString(`${this.getNodeName(enumEntry)}(${value.asString()})`)
    }
    i32FromEnum(value: LanguageExpression, enumEntry: idl.IDLEnum): LanguageExpression {
        return this.makeString(`${value.asString()}.value!!`)
    }
    makeEnumEntity(enumEntity: idl.IDLEnum, options: { isExport: boolean, isDeclare?: boolean }): LanguageStatement {
        return new KotlinEnumWithGetter(enumEntity, options.isExport)
    }
    castToBoolean(value: string): string {
        return `if (${value}) { 1 } else { 0 }`
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
    escapeKeyword(keyword: string): string {
        return keyword
    }
    makeStaticBlock(op: (writer: LanguageWriter) => void) {
        this.printer.print('companion object {')
        this.printer.pushIndent()
        op(this)
        this.popIndent()
        this.printer.print('}')
    }
    pushNamespace(namespace: string, options: { ident: boolean, isDeclared?: boolean }) {}
    popNamespace(options: { ident: boolean }) {}
}
