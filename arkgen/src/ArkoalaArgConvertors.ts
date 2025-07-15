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

import * as idl from "@idlizer/core/idl"
import {
    Language, LanguageExpression, LanguageWriter, InterfaceConvertor, ImportTypeConvertor, MaterializedClassConvertor,
} from "@idlizer/core";

export class ArkoalaInterfaceConvertor extends InterfaceConvertor {
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        if (writer.language === Language.ARKTS)
            return writer.instanceOf(value, this.idlType)
        if (this.declaration.name === "CancelButtonSymbolOptions") {
            if (writer.language === Language.ARKTS) {
                //TODO: Need to check this in TypeChecker
                return this.discriminatorFromFields(value, writer, this.declaration.properties, it => it.name, it => it.isOptional)
            } else {
                return writer.makeHasOwnProperty(value, "icon", "SymbolGlyphModifier")
            }
        }
        return super.unionDiscriminator(value, index, writer, duplicates)
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
            ? writer.makeString(`${handler[0]}(${handler.slice(1).concat(value).join(", ")})`)
            : undefined
    }
}

export class ArkoalaMaterializedClassConvertor extends MaterializedClassConvertor {
    override unionDiscriminator(value: string, index: number, writer: LanguageWriter, duplicates: Set<string>): LanguageExpression | undefined {
        if (writer.language === Language.ARKTS)
            return writer.instanceOf(value, this.idlType)
        if (this.declaration.name === "GestureGroupInterface" ||
            this.declaration.name.endsWith("GestureInterface"))
        {
            const gestureType = this.declaration.name === "GestureGroupInterface"
                ? "Group"
                : this.declaration.name.slice(0, -"GestureInterface".length)
            const castExpr = writer.makeCast(writer.makeString(value), idl.createReferenceType("GestureComponent", [idl.IDLObjectType]), { unsafe: true })
            return writer.makeNaryOp("===", [
                writer.makeString(`${castExpr.asString()}.type`),
                writer.makeString(`GestureName.${gestureType}`)])
        }
        return super.unionDiscriminator(value, index, writer, duplicates)
    }
}