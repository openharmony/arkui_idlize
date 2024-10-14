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

import * as ts from "typescript"

export enum LinterError {
    NONE,
    TYPE_LITERAL,
    ENUM_WITH_INIT,
    COMPUTED_PROPERTY_NAME,
    TUPLE_TYPE,
    INDEXED_ACCESS_TYPE,
    TEMPLATE_LITERAL,
    IMPORT_TYPE,
    MULTIPLE_INHERITANCE,
    UNSUPPORTED_TYPE_PARAMETER,
    PARAMETER_INITIALIZER,
    DUPLICATE_INTERFACE,
    INDEX_SIGNATURE,
    NAMESPACE,
    NUMBER_TYPE,
    PRIVATE_VISIBILITY,
    TOP_LEVEL_FUNCTIONS,
    ANY_KEYWORD,
    TYPE_ELEMENT_TYPE,
    INTERFACE_METHOD_TYPE_INCONSISTENT_WITH_PARENT,
    USE_COMPONENT_AS_PARAM,
    METHOD_OVERLOADING,
    CPP_KEYWORDS,
    INCORRECT_DATA_CLASS,
    EMPTY_DECLARATION,
    UNION_CONTAINS_ENUM,
    EVENT_HANDLER_WITH_FUNCTIONAL_PARAM_TYPE,
    CALLBACK_WITH_FUNCTIONAL_PARAM_TYPE,
    CALLBACK_WITH_NON_VOID_RETURN_TYPE,
}

export interface LinterMessage {
    file: ts.SourceFile
    pos: string
    message: string,
    error: LinterError
    node: ts.Node
}
