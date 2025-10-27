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

import * as fs from 'fs'

const JSON5 = require('json5')

type Enums = Record<string, string>

interface Type {
    name: string
    fixtures: string[]
}

type ValidValue = [string, string]

interface Fixture {
    name: string
    type: string
    resType?: string
    resFixture?: string
    quoted?: boolean
    validValues?: ValidValue[]
    invalidValues?: string[]
}

interface Attribute {
    name: string
    type?: string
    default?: string
    fixtures?: string[]
    attributes?: Attribute[]
    arguments?: string[]
}

interface Component {
    name: string
    debug?: string[]
    includes?: string[]
    themes?: string[]
    disable?: string[]
    remove?: string[]
    attributes?: Attribute[]
    ignoreAttributes?: string[]
    nodeTypes?: string[]
    setup?: string[]
}

interface JsonScheme {
    enums: Enums
    simpleTypes: string[]
    fixtures: Fixture[]
    types: Type[]
    components: Component[]
}

export class AceTypes {
    private static ALL_UPPER = new RegExp('^[A-Z0-9_]+$')

    private data = {
        enums: new Object() as Enums,
        simpleTypes: [],
        fixtures: [],
        types: [],
        components: [],
    } as JsonScheme

    constructor(filename?: string) {
        if (!filename) return
        let content = fs.readFileSync(filename)?.toString()
        if (!content) throw new Error(`Cannot read ace types file ${filename}`)
        let json = JSON5.parse(content) as JsonScheme
        if (!json) throw new Error(`Cannot parse ace types file ${filename}`)
        this.data = json
        this.cloneResFixtures()
    }

    cloneResFixtures() {
        let resFixtures: Fixture[] = []
        this.data.fixtures.forEach(it => {
            if (it.resFixture) {
                let res: Fixture = {
                    name: it.resFixture,
                    type: 'Ark_Resource',
                    resType: it.resType,
                    quoted: it.quoted,
                    validValues: it.validValues,
                    invalidValues: it.invalidValues,
                }
                resFixtures.push(res)
            }
        })
        this.data.fixtures.push(...resFixtures)
    }

    getTypeName(tsType: string): string {
        return this.data.enums[tsType]
    }

    getFixtures(): Fixture[] {
        return this.data.fixtures
    }

    getTypes(): Type[] {
        return this.data.types
    }

    getComponents(): Component[] {
        return this.data.components
    }

    getSimpleTypes(): string[] {
        return this.data.simpleTypes
    }

    getAttribute(comp: string, attr: string[]): Attribute | undefined {
        let component = this.data.components.find(it => it.name == comp)
        if (component?.attributes) {
            let aname = attr.shift()
            let attribute = component.attributes.find(it => it.name == aname)
            while (attr && attribute?.attributes) {
                aname = attr.shift()
                attribute = attribute.attributes.find(it => it.name == aname)
            }
            if (attr.length != 0) return undefined
            return attribute
        }
        return undefined
    }
}
