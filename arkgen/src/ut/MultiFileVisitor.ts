/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

import * as idl from '@idlizer/core/idl'

import { capitalize, groupBy, PeerClass, PeerLibrary, PeerMethod } from '@idlizer/core'
import { collectPeersForFile } from '@idlizer/libohos'
import { AceTypes, Component } from './AceTypes'
import { TestValue } from './TestValue'
import { TypeHelper } from './TypeHelper'

const OPTIONS_NAME = 'options'
export const OPTIONAL_FIXTURE = '_optional'
export const UNION_FIXTURE = '_union'
export const UNION_UNDEF_FIXTURE = '_union_undef'

export const enum Debug {
    None = 0,
    DumpJson = 0x0001,
}

const DEBUG_MAP = new Map<string, Debug>([['dumpJson', Debug.DumpJson]])

type FixtureType = [string, boolean, boolean]

export interface TestData {
    readonly component: string
    readonly attributes: readonly TestValue[]
    readonly parents: readonly TestValue[]
    readonly fixtures: readonly string[][]
    readonly argNames: readonly string[]
    readonly options: boolean
    readonly method: PeerMethod
    readonly debug: Debug
}

export interface ComponentOptions {
    readonly attributes: readonly TestValue[]
    readonly fixtures: readonly string[][]
    readonly method: PeerMethod
}

export abstract class MultiFileVisitor {
    private genFixtures = new Map<string, string>()
    private componentDescription?: Component
    private componentOptions?: ComponentOptions

    constructor(
        protected library: PeerLibrary,
        protected aceTypes: AceTypes,
    ) {}

    makeTests() {
        this.library.files.forEach(file => {
            collectPeersForFile(this.library, file).forEach(peer => this.makeTestFile(peer))
        })
    }

    protected abstract makeTest(peer: PeerClass): void

    protected abstract makeDefaultTest(testName: string, data: TestData): void
    protected abstract makeValidTest(testName: string, attrIndex: number, data: TestData): void
    protected abstract makeInvalidTest(
        testName: string, attrIndex: number, invalidFixtures: readonly string[], data: TestData
    ): void
    protected abstract makePlaceholderTest(testName: string, component: string): void

    protected abstract addAttributes(attrs: TestValue[]): void
    protected abstract addParents(attrs: TestValue[]): void
    protected abstract addEnum(type: TypeHelper): void

    protected static startComponent<T>(
        componentName: string, componentMap: Map<string, T>, componentConstructor: () => T
    ): T {
        let componentState = componentMap.get(componentName)
        if (!componentState) {
            componentState = componentConstructor()
            componentMap.set(componentName, componentState)
        }
        return componentState
    }

    // It needs to be run from this.makeTest
    protected makeTestByClass(peer: PeerClass): void {
        this.componentOptions = undefined // Clean options from the previous component.
        console.info(`Generating tests for component: ${peer.componentName}`)
        try {
            peer.methods.forEach(method => this.makeTestByMethod(peer.componentName, method))
        } catch (e) {
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            console.error(`EXCEPTION! Component ${peer.componentName}: ${e}`)
            console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
        }
    }

    protected get compDesc(): Component|undefined {
        return this.componentDescription
    }

    protected get compOptions(): ComponentOptions|undefined {
        return this.componentOptions
    }

    protected get parametrized(): boolean {
        return (this.compDesc?.nodeTypes?.length ?? 0) > 0
    }

    protected getFixtureType(name: string): string | undefined {
        return this.genFixtures.get(name) ?? this.aceTypes.getFixtures().find(fix => fix.name == name)?.type
    }

    private makeTestFile(peer: PeerClass) {
        this.componentDescription = this.aceTypes.getComponents().find(it => it.name === peer.componentName)
        if (this.componentDescription) {
            this.makeTest(peer)
        }
    }

    private makeTestByMethod(component: string, method: PeerMethod): void {
        let baseTestName = `${method.sig.name}Test`
        // console.info(`Generating test: ${baseTestName}`)
        if (this.compDesc?.ignoreAttributes?.includes(method.method.name)) {
            console.warn(`Attribute '${method.method.name}' is ignored due to ignoreAttributes!`)
            this.makePlaceholderTest(baseTestName, component);
            return
        }
        let removed = this.compDesc?.remove

        let attributes: TestValue[] = []
        let parents: TestValue[] = []
        let callback = false
        let noImpl = false
        let validValueVectors: string[] = []
        let argNames: string[] = []

        let processArgByType = (name: string, type: TypeHelper, parent?: TestValue, index?: number, ignore = false) => {
            if (type.isNonJsonType()) return false
            let attr = new TestValue(name, type, parent, ignore)
            if (index !== undefined) attr.argIndex = index
            attr.setDefault(this.aceTypes, component)
            if (type.isAggregate()) {
                if (!ignore) {
                    if (name != '|') parents.push(attr)
                    else if (attr.parent) parents.push(attr.parent)
                }
                type.getAggregateMembers().forEach((member, idx) => processArgByType(`${member[0]}`, member[1], attr))
            } else if (type.isUnion() && type.isComplex()) {
                type.getUnionMembers().forEach((member, index) => {
                    if (member.isComplex()) {
                        processArgByType('|', member, attr)
                    }
                })
            } else {
                attributes.push(attr)
            }
            return true
        }

        let processArg = (name: string, index: number, ignore = false, parent?: TestValue) => {
            if (idl.isCallback(method.sig.args[index].type)) return false
            let type = TypeHelper.fromMethodArg(this.library, this.aceTypes, method, index)
           argNames.push(capitalize(name))
            return processArgByType(name, type, parent, index, ignore)
        }

        let skip = false
        if (isOptionsMethod(method)) {
            method.sig.args.forEach((arg, index) => {
                // Parse options argument
                let ignore = arg.name == 'options' || arg.name == 'option'
                if (method.sig.args.length == 1) {
                    let type = TypeHelper.fromMethodArg(this.library, this.aceTypes, method, index)
                    if (type.getBaseTypeName().endsWith('Options')) ignore = true
                }
                let name = ignore ? OPTIONS_NAME : arg.name
                if (!ignore) {
                    const margs = this.compDesc?.attributes?.find(it => it.name == name)?.arguments
                    if (margs && margs[0].startsWith('^') && margs[0].substr(1)) name = margs[0].substr(1)
                }
                skip ||= !processArg(name, index, ignore)
            })
        } else {
            let name = method.method.name
            if (method.sig.args.length == 1) {
                skip ||= !processArg(name, 0)
            } else {
                const margs = this.compDesc?.attributes?.find(it => it.name == name)?.arguments
                if (margs && margs[0].startsWith('^')) {
                    method.sig.args.forEach((arg, index) => {
                        let valName = arg.name
                        if (valName == 'value') valName = name
                        if (margs[index].substr(1)) valName = margs[index].substr(1)
                        skip ||= !processArg(valName, index)
                    })
                } else {
                    let attr = new TestValue(name, TypeHelper.dummyType(this.library, this.aceTypes))
                    parents.push(attr)
                    method.sig.args.forEach((arg, index) => {
                        skip ||= !processArg(arg.name, index, false, attr)
                    })
                }
            }
        }

        if (skip) return

        //console.log(`Method: ${method.method.name}, Args: ${initNames.join(',')}, Attributes: ${attributes.map(it => it.name).join(',')}`)

        let debug: Debug = Debug.None
        DEBUG_MAP.forEach((val, key) => {
            if (this.compDesc?.debug?.includes(key)) debug |= val
        })

        let optionsMethod = method.method.name == `set${component}Options`
        let validFixtures = attributes.map(attr =>
            sortFixtureNames(
                this.getAttrFixtures(attr)
                    .filter(fix => fix[1])
                    .map(fix => fix[0])
            )
        )
        if (optionsMethod && this.componentOptions === undefined) {
            this.componentOptions = {
                attributes: attributes,
                fixtures: validFixtures,
                method: method,
            }
        }
        const testData: TestData = {
            component: component,
            attributes: attributes,
            parents: parents,
            fixtures: validFixtures,
            argNames: argNames,
            options: optionsMethod,
            method: method,
            debug: debug
        }
        const defaultTestName = `${baseTestName}DefaultValues`
        if (attributes.length > 0 && !removed?.includes(defaultTestName)) {
            parents.forEach(it => {
                if (it.name == '|') console.warn(`Wrong parent. Full name: ${it.getFullName()}`)
            })
            this.addAttributes(attributes)
            this.addParents(parents)
            this.makeDefaultTest(defaultTestName, testData)
        }
        if (validFixtures.find(fix => !fix[0] || fix[0].startsWith(':'))) {
            console.error(`ERROR! Incomplete fixtures for method ${method.method.name}. Skipping...`)
            attributes.forEach((attr, idx) => {
                //console.error(`TestValue: ${attr.name}. Valid fixtures: ${validFixtures[idx].join(',')}`)
            })
            console.error(
                `No fixtures for: ${attributes
                    .filter(attr => this.getAttrFixtures(attr).filter(fix => fix[1] && fix[0]))
                    .map(attr => `${attr.name}: ${attr.getTypeName()}`)}`
            )
            let testName = `${baseTestName}ValidValues`
            if (!removed?.includes(testName)) {
                this.makeValidTest(testName, -1, testData)
            }
            return
        }
        attributes.forEach((attribute, index) => {
            let idAttrName = attribute
                .getFullName()
                .split('.')
                .map(s => capitalize(s))
                .join('')
            let attrTestName = `${baseTestName}${idAttrName}`
            let testName = `${attrTestName}ValidValues`
            if (!removed?.includes(testName)) {
                this.addAttributes(attributes)
                this.addParents(parents)
                this.makeValidTest(testName, index, testData)
            }

            let invalidFixtures = this.getAttrFixtures(attribute)
                .filter(it => it[2])
                .map(fix => fix[0])
            if (invalidFixtures.find(fix => fix)) {
                testName = `${attrTestName}InvalidValues`
                if (!removed?.includes(testName)) {
                    this.addAttributes(attributes)
                    this.addParents(parents)
                    this.makeInvalidTest(testName, index, invalidFixtures, testData)
                }
            }
        })
    }

    private getFixtures(type: TypeHelper): FixtureType[] {
        if (type.isEnum()) {
            this.addEnum(type)
            let fixName = `Enum${type.tsName()}`
            let typeName = type.getBaseTypeName()
            this.genFixtures.set(fixName, typeName)
            return [[fixName, true, true]]
        }
        let result: FixtureType[] = []
        if (type.isNonJsonType()) return result

        let typeName = type.getBaseTypeName()
        let found = this.aceTypes.getTypes().find(it => it.name == typeName)
        if (found) {
            let fixtures = this.aceTypes.getFixtures()
            let fixNames = found.fixtures
            for (let fixName of fixNames) {
                let fix = fixtures.find(it => it.name == fixName)
                if (fix) {
                    result.push([fixName, !!fix.validValues, !!fix.invalidValues])
                }
            }
        }
        this.appendCommonFixtures(type, result)
        return result
    }

    private appendCommonFixtures(type: TypeHelper, result: FixtureType[]): void {
        let typeName = type.getBaseTypeName()
        if (typeName == 'Ark_Undefined') {
            result.push([UNION_UNDEF_FIXTURE, false, true])
            return
        }
        if (type.isUnion()) {
            /**/
            let unionTypes = type.getUnionMembers()
            let resultTypes = result.map(it => this.getFixtureType(it[0]))
            let covered = (type: TypeHelper): boolean => {
                if (resultTypes.includes(type.getTypeName())) return true
                if (type.isUnion()) {
                    for (let member of type.getUnionMembers()) {
                        if (!covered(member)) return false
                    }
                    return true
                }
                return false
            }
            unionTypes.forEach(it => {
                if (covered(it)) return
                result.push(...this.getFixtures(it))
            })
            /**/
            result.push([UNION_FIXTURE, false, true])
        }
        if (type.isOptional()) {
            result.push([OPTIONAL_FIXTURE, false, true])
        }
        if (result.length == 0) {
            result.push([`:${typeName}`, true, true])
        }
    }

    private getAttrFixtures(attr: TestValue): FixtureType[] {
        let result: FixtureType[] = []
        if (attr.fixtures) {
            let fixtures = this.aceTypes.getFixtures()
            for (let fixName of attr.fixtures) {
                let fix = fixtures.find(it => it.name == fixName)
                if (fix) {
                    result.push([fixName, !!fix.validValues, !!fix.invalidValues])
                }
            }
            this.appendCommonFixtures(attr.type, result)
        } else {
            result = this.getFixtures(attr.type)
        }
        result.filter(it => it[0].startsWith(':')).forEach(it => {
            console.log(`WARNING! No valid fixtures for attribute '${attr.name}' type ${it[0].substr(1)}`)
        })
        return result
    }
}

function sortFixtureNames(fixtureNames: string[]): string[] {
    return fixtureNames.sort((a, b) => {
        if (a.startsWith(':')) {
            if (b.startsWith(':')) {
                return a.localeCompare(b)
            } else {
                return 1
            }
        } else {
            if (b.startsWith(':')) {
                return -1
            } else {
                return a.localeCompare(b)
            }
        }
    })
}

function isOptionsMethod(method: PeerMethod): boolean {
    return method.isCallSignature
}
