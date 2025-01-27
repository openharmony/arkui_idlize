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
import {
    Language, LanguageExpression, LanguageStatement, LanguageWriter, ExpressionAssigner,
    RuntimeType, BaseArgConvertor, InterfaceConvertor, ImportTypeConvertor
} from "@idlize/core";
import { ArkPrimitiveTypesInstance } from "./ArkPrimitiveType"

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
