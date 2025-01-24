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
import { Language, hashCodeFromString, warn, generatorTypePrefix } from "@idlize/core"
import { RuntimeType, BaseArgConvertor, ExpressionAssigner } from "@idlize/core"
import { LibraryInterface } from "@idlize/core"
import { ArkPrimitiveTypesInstance } from "./ArkPrimitiveType"
import { LanguageExpression, LanguageStatement, LanguageWriter, StringExpression } from "@idlize/core"
import { maybeTransformManagedCallback, warnCustomObject } from "@idlize/core"
import { createTypeNameConvertor } from "./LanguageWriters";
import { InterfaceConvertor, ImportTypeConvertor } from "@idlize/core";

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

export class ArkoalaImportTypeConvertor extends ImportTypeConvertor {
    private static knownTypes: Map<string, string[]> = new Map([
        ["CircleShape", ["isInstanceOf", "\"CircleShape\""]],
        ["EllipseShape", ["isInstanceOf", "\"EllipseShape\""]],
        ["PathShape", ["isInstanceOf", "\"PathShape\""]],
        ["RectShape", ["isInstanceOf", "\"RectShape\""]],
        ["ComponentContent", ["isInstanceOf", "\"ComponentContent\""]],
        ["DrawableDescriptor", ["isInstanceOf", "\"DrawableDescriptor\""]],
        ["SymbolGlyphModifier", ["isInstanceOf", "\"SymbolGlyphModifier\""]],
        ["Scene", ["isInstanceOf", "\"Scene\""]]])
    constructor(param: string, importedName: string) {
        super(param, importedName)
    }
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        const handler = ArkoalaImportTypeConvertor.knownTypes.get(this.importedName)
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
                        overrideTypeName: `void(*)(${[`${generatorTypePrefix()}VMContext vmContext`].concat(generateCallbackAPIArguments(this.library, this.transformedDecl)).join(", ")})`
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
