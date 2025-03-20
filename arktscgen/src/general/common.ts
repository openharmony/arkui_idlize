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

import { Config } from "./Config"
import { IDLInterface, IDLMethod, isVoidType, throwException } from "@idlizer/core"
import { InteropConstructions } from "../constuctions/InteropConstructions"
import { nodeType, parent } from "../utils/idl"
import { dropPostfix, dropPrefix, pascalToCamel } from "../utils/string"

export function peerMethod(name: string): string {
    name = dropPostfix(name, Config.constPostfix)
    name = dropPrefix(name, Config.uselessPrefix)
    name = pascalToCamel(name)
    return name
}

export function splitCreateOrUpdate(fullName: string): { createOrUpdate: string, rest: string } {
    if (fullName.startsWith(Config.createPrefix)) {
        const createOrUpdate = Config.createPrefix
        const rest = dropPrefix(fullName, Config.createPrefix)
        return { createOrUpdate, rest }
    }
    if (fullName.startsWith(Config.updatePrefix)) {
        const createOrUpdate = Config.updatePrefix
        const rest = dropPrefix(fullName, Config.updatePrefix)
        return { createOrUpdate, rest }
    }
    throwException(`method name doesn't start neither with ${Config.createPrefix} nor with ${Config.updatePrefix}`)
}

export function mangleIfKeyword(name: string): string {
    if (InteropConstructions.keywords.includes(name)) {
        return `_${name}`
    }
    return name
}

export function isGetter(node: IDLMethod): boolean {
    if (node.parameters.length !== 0) {
        return false
    }
    if (isVoidType(node.returnType)) {
        return false
    }
    return true
}

export function isRegular(node: IDLMethod): boolean {
    if (!isVoidType(node.returnType)) {
        return false
    }
    return true
}

export function isAbstract(node: IDLInterface): boolean {
    if (isDataClass(node)) {
        return false
    }
    if (isReal(node)) {
        return false
    }
    return true
}

export function isReal(node: IDLInterface): boolean {
    return nodeType(node) !== undefined
}

export function isDataClass(node: IDLInterface): boolean {
    return parent(node) === Config.defaultAncestor
}

export function isCreate(name: string): boolean {
    return isCreateOrUpdate(name) && name.startsWith(Config.createPrefix)
}

export function isCreateOrUpdate(sourceMethodName: string): boolean {
    if (!sourceMethodName.startsWith(Config.createPrefix) && !sourceMethodName.startsWith(Config.updatePrefix)) {
        return false
    }
    const { rest } = splitCreateOrUpdate(sourceMethodName)
    return rest.length <= 1
}

export function fixEnumPrefix(name: string): string {
    if (name.startsWith(`es2panda_`)) {
        name = dropPrefix(name, `es2panda_`)
        name = `Es2panda${name}`
    }
    return name
}