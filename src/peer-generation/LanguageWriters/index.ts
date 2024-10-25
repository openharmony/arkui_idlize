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

import { IndentedPrinter } from "../../IndentedPrinter";
import { LanguageWriter, Method, MethodModifier, MethodSignature } from "./LanguageWriter";
import { TSLanguageWriter } from "./writers/TsLanguageWriter";
import { ETSLanguageWriter } from "./writers/ETSLanguageWriter";
import { JavaLanguageWriter } from "./writers/JavaLanguageWriter";
import { CppLanguageWriter } from "./writers/CppLanguageWriter";
import { CJLanguageWriter } from "./writers/CJLanguageWriter";
import { Language } from "../../Language";
import { ReferenceResolver } from "../ReferenceResolver";

//////////////////////////////////////////////////////////////////
// REEXPORTS

export { generateTypeCheckerName, makeArrayTypeCheckCall } from './writers/ETSLanguageWriter'
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
    LanguageWriter,
    StringExpression,
    PrinterLike,
    printMethodDeclaration
} from './LanguageWriter'
export { CppLanguageWriter, TSLanguageWriter }

export function createLanguageWriter(language: Language, resolver:ReferenceResolver): LanguageWriter {
    switch (language) {
        case Language.TS: return new TSLanguageWriter(new IndentedPrinter(), resolver, Language.TS)
        case Language.ARKTS: return new ETSLanguageWriter(new IndentedPrinter(), resolver)
        case Language.JAVA: return new JavaLanguageWriter(new IndentedPrinter(), resolver)
        case Language.CPP: return new CppLanguageWriter(new IndentedPrinter(), resolver)
        case Language.CJ: return new CJLanguageWriter(new IndentedPrinter(), resolver)
        default: throw new Error(`Language ${language.toString()} is not supported`)
    }
}