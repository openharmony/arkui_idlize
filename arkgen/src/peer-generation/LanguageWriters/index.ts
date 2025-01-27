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

import { IndentedPrinter, Language } from "@idlize/core"
import { LanguageWriter } from "@idlize/core";
import { TSLanguageWriter } from "@idlize/core";
import { ETSLanguageWriter } from "@idlize/core";
import { JavaLanguageWriter } from "@idlize/core";
import { CppLanguageWriter } from "@idlize/core";
import { CJLanguageWriter } from "@idlize/core";
import { ReferenceResolver } from "@idlize/core";
import { IdlNameConvertor, CppInteropConvertor } from "@idlize/core";

import {
    CJIDLNodeToStringConvertor,
    CJIDLTypeToForeignStringConvertor,
    CJInteropArgConvertor
} from "./convertors/CJConvertors";
import { TsIDLNodeToStringConverter } from "./convertors/TSConvertors";
import { JavaIDLNodeToStringConvertor, JavaInteropArgConvertor } from "./convertors/JavaConvertors";
import { EtsIDLNodeToStringConvertor } from "./convertors/ETSConvertors";
import { CppInteropArgConvertor } from "./convertors/CppConvertors";
import { InteropArgConvertor } from "./convertors/InteropConvertor";
import { ArkPrimitiveTypesInstance } from "../ArkPrimitiveType";

//////////////////////////////////////////////////////////////////
// REEXPORTS

export { generateTypeCheckerName, makeArrayTypeCheckCall } from '@idlize/core'
export {
    Field,
    FieldModifier,
    Method,
    MethodModifier,
    MethodSignature,
    ExpressionStatement,
    NamedMethodSignature,
    BlockStatement,
    BranchStatement,
    LanguageExpression,
    FunctionCallExpression,
    LanguageStatement,
    StringExpression,
    PrinterLike,
    printMethodDeclaration
} from '@idlize/core'
export { CppLanguageWriter, TSLanguageWriter }

export function createLanguageWriter(language: Language, resolver:ReferenceResolver): LanguageWriter {
    switch (language) {
        case Language.TS: return new TSLanguageWriter(new IndentedPrinter(), resolver,
            new TsIDLNodeToStringConverter(resolver))
        case Language.ARKTS: return new ETSLanguageWriter(new IndentedPrinter(), resolver,
            new EtsIDLNodeToStringConvertor(resolver), new CppInteropConvertor(resolver))
        case Language.JAVA: return new JavaLanguageWriter(new IndentedPrinter(), resolver,
            new JavaIDLNodeToStringConvertor(resolver))
        case Language.CPP: return new CppLanguageWriter(new IndentedPrinter(), resolver,
            new CppInteropConvertor(resolver), ArkPrimitiveTypesInstance)
        case Language.CJ: return new CJLanguageWriter(new IndentedPrinter(), resolver,
            new CJIDLNodeToStringConvertor(resolver), new CJIDLTypeToForeignStringConvertor(resolver))
        default: throw new Error(`Language ${language.toString()} is not supported`)
    }
}

export const languageWritersUtils = {
    isCppWriter(writer: LanguageWriter): writer is CppLanguageWriter {
        return writer.language === Language.CPP
    },
    isJavaWriter(writer: LanguageWriter): writer is JavaLanguageWriter {
        return writer.language === Language.JAVA
    },
    isCJWriter(writer: LanguageWriter): writer is CJLanguageWriter {
        return writer.language === Language.CJ
    },
    isTsWriter(writer: LanguageWriter): writer is TSLanguageWriter {
        return writer.language === Language.TS
    },
    isArkTsWriter(writer: LanguageWriter): writer is ETSLanguageWriter {
        return writer.language === Language.ARKTS
    }
}

export function createTypeNameConvertor(language: Language , library: ReferenceResolver): IdlNameConvertor {
    if (language === Language.TS)
        return new TsIDLNodeToStringConverter(library)
    if (language === Language.JAVA)
        return new JavaIDLNodeToStringConvertor(library)
    if (language === Language.ARKTS)
        return new EtsIDLNodeToStringConvertor(library)
    if (language === Language.CJ)
        return new CJIDLNodeToStringConvertor(library)
    if (language === Language.CPP)
        return new CppInteropConvertor(library)
    throw new Error(`Convertor from IDL to ${language} not implemented`)
}

export function createInteropArgConvertor(language: Language): InteropArgConvertor {
    switch (language) {
        case Language.TS:
        case Language.ARKTS: return new InteropArgConvertor()
        case Language.CPP: return CppInteropArgConvertor.INSTANCE
        case Language.JAVA: return new JavaInteropArgConvertor()
        case Language.CJ: return new CJInteropArgConvertor()
    }
    throw new Error(`InteropArgConvertor for language ${language} not implemented`)
}
