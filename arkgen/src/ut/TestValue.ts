/*
 * Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

import { camelCaseToUpperSnakeCase, capitalize } from '@idlizer/core'
import { AceTypes } from './AceTypes'
import { TypeHelper } from './TypeHelper'

export class TestValue {
    name: string
    defaultValue?: string
    fixtures?: string[]
    type: TypeHelper
    argIndex?: number

    parent?: TestValue
    ignore: boolean

    constructor(name: string, type: TypeHelper, parent?: TestValue, ignore: boolean = false) {
        this.name = name
        this.type = type
        this.parent = parent
        this.ignore = ignore
    }

    getArgIndex(): number {
        if (this.argIndex !== undefined) return this.argIndex
        if (!this.parent) throw `TestValue ${this.name} doesn't have either parent or argIndex`
        return this.parent.getArgIndex()
    }

    getParentsSeq(ignore: boolean = false, unions: boolean = false): TestValue[] {
        if (this.parent) {
            let result = this.parent.getParentsSeq(ignore, unions)
            if (unions || this.name != '|') result.push(this)
            return result
        } else {
            if (ignore && this.ignore) return []
            return [this]
        }
    }

    get nameConst() {
        let seq = this.getParentsSeq(true)
        if (seq.length == 0) return ''
        return `ATTRIBUTE_${seq.map(it => camelCaseToUpperSnakeCase(it.safeName())).join('_I_')}_NAME`
    }

    get defaultConst() {
        let seq = this.getParentsSeq(true)
        return `ATTRIBUTE_${seq.map(it => camelCaseToUpperSnakeCase(it.safeName())).join('_I_')}_DEFAULT_VALUE`
    }

    safeName() {
        return this.name == '|' ? this.type.tsName() : this.name
    }

    getParent(ignore: boolean = true) {
        if (this.parent) {
            if (ignore) {
                return this.parent.ignore ? undefined : this.parent
            }
            return this
        }
        return undefined
    }

    setDefault(aceTypes: AceTypes, comp: string) {
        let attrs: string[] = [this.name]
        let parent = this.getParent()
        while (parent) {
            if (parent.name != '|') attrs.unshift(parent.name)
            parent = parent.getParent()
        }
        let attr = aceTypes.getAttribute(comp, attrs)
        if (attr?.default !== undefined) {
            this.defaultValue = attr.default
        }
        this.fixtures = attr?.fixtures
        if (attr?.type) {
            let type = aceTypes.getTypes().find(it => it.name == attr?.type)
            if (type) {
                this.fixtures ??= []
                this.fixtures.push(...type.fixtures)
            }
        }
    }

    getTypeName() {
        return this.type.getTypeName()
    }

    getFullName(): string {
        if (this.parent) {
            return `${this.parent.getFullName()}.${this.safeName()}`
        } else {
            return this.safeName()
        }
    }

    getResultName(): string {
        if (this.ignore || this.name == '|') return this.parent?.getResultName() ?? ''
        return `result${capitalize(this.name)}`
    }

    comparePaths(attr: TestValue) {
        let thisPath = this.getParentsSeq(true, true)
        let attrPath = attr.getParentsSeq(true, true)
        let len = Math.min(thisPath.length, attrPath.length)
        for (let idx = 0; idx < len; idx++) {
            if (thisPath[idx].name != attrPath[idx].name) return true
            if (
                thisPath[idx].name == '|' &&
                attrPath[idx].name == '|' &&
                thisPath[idx].type.tsName() != attrPath[idx].type.tsName()
            )
                return false
        }
        return true
    }
}
