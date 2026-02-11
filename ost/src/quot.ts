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

import { LWDeclaration, LWExpression, LWStatement, LWType } from "./lws";

class LWParser {

    static consume(line:string): LWParser {
        throw new Error("NOT IMPLEMENTED") 
    }

    parseType(): LWType {
        // NOTE: hole type is not supported
        throw new Error("NOT IMPLEMENTED")
    }
    parseExpression(): LWExpression {
        // NOTE: lambda expression is not supported for now
        // NOTE: hole expression is not supported
        throw new Error("NOT IMPLEMENTED")
    }
    parseStatement(): LWStatement {
        throw new Error("NOT IMPLEMENTED")
    }
    parseDeclaration(): LWDeclaration {
        throw new Error("NOT IMPLEMENTED")
    }
}

function quotType(template: TemplateStringsArray): LWType {
    return LWParser.consume(template.join('')).parseType()
}
function quotExpression(template: TemplateStringsArray): LWExpression {
    return LWParser.consume(template.join('')).parseExpression()
}
function quotStatement(template: TemplateStringsArray): LWStatement {
    return LWParser.consume(template.join('')).parseStatement()
}
function quotDeclaration(template: TemplateStringsArray): LWDeclaration {
    return LWParser.consume(template.join('')).parseDeclaration()
}

export const quot = {
    T: quotType,
    E: quotExpression,
    S: quotStatement,
    D: quotDeclaration,
}
