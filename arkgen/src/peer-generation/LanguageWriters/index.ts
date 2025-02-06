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

import { IndentedPrinter, Language } from "@idlizer/core"
import { LanguageWriter } from "@idlizer/core";
import { TSLanguageWriter } from "@idlizer/core";
import { ETSLanguageWriter } from "@idlizer/core";
import { JavaLanguageWriter } from "@idlizer/core";
import { CppLanguageWriter } from "@idlizer/core";
import { CJLanguageWriter, CJIDLTypeToForeignStringConvertor } from "@idlizer/core";
import { ReferenceResolver } from "@idlizer/core";
import { CppInteropConvertor } from "@idlizer/core"
import { ArkPrimitiveTypesInstance } from "../ArkPrimitiveType";
import { ArkoalaTSTypeNameConvertor, ArkoalaETSTypeNameConvertor,
    ArkoalaJavaTypeNameConvertor, ArkoalaCJTypeNameConvertor
} from '../../arkoala/ArkoalaTypeNameConvertors';

//////////////////////////////////////////////////////////////////
// REEXPORTS

export { generateTypeCheckerName, makeArrayTypeCheckCall } from '@idlizer/core'
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
} from '@idlizer/core'
export { CppLanguageWriter, TSLanguageWriter }

export function createLanguageWriter(language: Language, resolver:ReferenceResolver): LanguageWriter {
    switch (language) {
        case Language.TS: return new TSLanguageWriter(new IndentedPrinter(), resolver,
            new ArkoalaTSTypeNameConvertor(resolver))
        case Language.ARKTS: return new ETSLanguageWriter(new IndentedPrinter(), resolver,
            new ArkoalaETSTypeNameConvertor(resolver), new CppInteropConvertor(resolver))
        case Language.JAVA: return new JavaLanguageWriter(new IndentedPrinter(), resolver,
            new ArkoalaJavaTypeNameConvertor(resolver))
        case Language.CPP: return new CppLanguageWriter(new IndentedPrinter(), resolver,
            new CppInteropConvertor(resolver), ArkPrimitiveTypesInstance)
        case Language.CJ: return new CJLanguageWriter(new IndentedPrinter(), resolver,
            new ArkoalaCJTypeNameConvertor(resolver), new CJIDLTypeToForeignStringConvertor(resolver))
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
