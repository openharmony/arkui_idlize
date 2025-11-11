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

import { PeerClass, PeerMethod } from '@idlizer/core'
import { AceTypesTs, Fixture } from './AceTypes'
import { ComponentOptions, MultiFileVisitor, OPTIONAL_FIXTURE, TestData, UNION_UNDEF_FIXTURE } from './MultiFileVisitor'
import { TestValue } from './TestValue'
import { TypeHelper } from './TypeHelper'

// Printable data for all tests regarding suits.
export interface Suite {
    component: string
    constants: {
        name: string
        value: string
    }[]
    tests: Test[]
}

export type Test = DefaultTest|ValidTest|InvalidTest

interface BaseTest {
    type: "Default"|"Valid"|"Invalid"
    testName: string
    component: string
    parent?: string
    parentOptions?: string[]
    isDisabled: boolean
    constantImports: string[]
    fixtureImports?: string[]
    fixtureNames?: string[]
    fixtureTypes?: string[]
    options?: Argument[] // The component constructor arguments. For testing or mandatory arguments.
    methods?: Method[] // The component methods. For testing or mandatory arguments.
    checks: TestCheck[] // A sequence of attribute names. Corresponds to the sequence of nested fields in JSON.
    fails: string[] // Comments for unconditional test failures.
    fatal?: boolean // If the component cannot be used. Default false.
    additionalValues?: string[] // Additional values in the test component.
}

interface TestPlan extends BaseTest {
    fixtureImports: string[] // Full names of fixtures for import. For a test plan and init values.
    fixtureNames: string[] // Base names of fixtures without postfix (without Inputs and Expects). For a test plan.
    fixtureTypes: string[] // Types of fixtures for a test plan. Duplication is allowed.
}

interface DefaultTest extends BaseTest {
    type: "Default"
}

interface ValidTest extends TestPlan {
    type: "Valid"
}

interface InvalidTest extends TestPlan {
    type: "Invalid"
}

export interface Enum {
    name: string
    values: string[]
    isString?: boolean // Default false.
}

interface Method {
	name: string
	args: Argument[] // Arguments for methods.
}

// true - if you need to insert a test value
// string - for value
// ArgumentObj - for object
export type Argument = true|string|ArgumentObj
export interface ArgumentObj {
    props: {
        name: string
        arg: Argument
    }[]
    typeName?: string
}

interface TestCheck {
    attributes: string[]
    expected?: string
}

export class E2ESuitesCreator extends MultiFileVisitor {
    private readonly enumsData: Enum[] = []
    private readonly suitesData = new Map<string, Suite>()
    private suite?: Suite
    private attributes: TestValue[] = []
    private parents: TestValue[] = []

    get enums(): Enum[] {
        return this.enumsData.sort((a, b) => a.name.localeCompare(b.name))
    }

    get suites(): Suite[] {
        return [...this.suitesData.values()]
            .filter(suite => suite.tests.length > 0)
            .sort((a, b) => a.component.localeCompare(b.component))
    }

    protected override makeTest(peer: PeerClass): void {
        if (!this.compDesc) throw new Error("The 'compDesc' must be!")
        this.suite = MultiFileVisitor.startComponent(peer.componentName, this.suitesData, () => ({
            component: peer.componentName,
            constants: [],
            tests: []
        }))
        this.attributes = []
        this.parents = []
        this.makeTestByClass(peer)
        this.suite.constants = makeConstants(this.attributes, this.parents)
        this.suite.tests.sort((a, b) => a.testName.localeCompare(b.testName))
    }

    protected override makePlaceholderTest(testName: string, component: string): void {
        // TODO: Add empty disabled test for statistic
    }

    protected override makeDefaultTest(testName: string, data: TestData): void {
        const test = this.createDefaultTest(testName, data.component)
        // Only if default options are not set.
        if (test.options === undefined) {
            const mandatoryOptions = getMandatoryOptions(this.compOptions)
            if (mandatoryOptions.attributes.length > 0) {
                test.fails = makeFixtureFails(mandatoryOptions.fixtures)
                if (test.fails.length === 0) {
                    const optInfo = makeArgumentInfo(mandatoryOptions.attributes)
                    const importFixtures: string[] = []
                    test.options = makeArguments(mandatoryOptions.fixtures, -1, optInfo, importFixtures)
                    addTypesToArguments(mandatoryOptions.attributes, test.options)
                    test.fixtureImports = makeFixtureImports(importFixtures)
                } else {
                    test.fatal = true
                    console.error(`ERROR! Test: ${test.testName}. `
                        + `The fixture for options of the ${test.component} is not found.`)
                    }
            }
        }
        if (test.fatal !== true) {
            test.checks = makeChecks(data.attributes)
            test.constantImports = makeImports(test.checks)
        }
        this.addTest(test)
    }

    protected override makeValidTest(testName: string, attrIndex: number, data: TestData): void {
        const test = this.createValidTest(testName, data.component)
        makeTestWithTestPlan(
            test, this.fixtures, this.enumsData, data.options, data.method, attrIndex,
            data.attributes, this.compOptions, data.fixtures
        )
        this.addTest(test, this.compDesc?.nodeTypes)
    }

    protected override makeInvalidTest(
        testName: string, attrIndex: number, invalidFixtures: readonly string[], data: TestData
    ): void {
        const test = this.createInvalidTest(testName, data.component)
        makeTestWithTestPlan(
            test, this.fixtures, this.enumsData, data.options, data.method, attrIndex,
            data.attributes, this.compOptions, data.fixtures, invalidFixtures
        )
        this.addTest(test, this.compDesc?.nodeTypes)
    }

    protected override addAttributes(attrs: readonly TestValue[]): void {
        this.attributes.push(...attrs)
    }

    protected override addParents(attrs: readonly TestValue[]): void {
        this.parents.push(...attrs)
    }

    protected override addEnum(type: TypeHelper): void {
        const enumName = type.tsName()
        if (this.enumsData.find(it => it.name === enumName) === undefined) {
            const enumValues = type.getEnumValues()
            if (enumValues.values.length > 0) {
                this.enumsData.push({ name: enumName, values: enumValues.values, isString: enumValues.isString })
            }
        }
    }

    private addTest(test: Test, nodeTypes: string[] = []): void {
        const suite = this.suite!
        if (test.checks.length > 0 || test.fails.length > 0 || test.fatal) {
            suite.tests.push(test)
            if (nodeTypes.length > 1) {
                for (let i = 1; i < nodeTypes.length; ++i) {
                    const nodeTest = structuredClone(test)
                    nodeTest.testName += `With${nodeTypes[i]}`
                    suite.tests.push(nodeTest)
                }
                test.testName += `With${nodeTypes[0]}`
            }
        }
    }

    private get fixtures(): Fixture[] {
        return this.aceTypes instanceof AceTypesTs ? this.aceTypes.getFixturesTs() : []
    }

    private isTestDisable(testName: string): boolean {
        return this.compDesc?.disable?.includes(testName) ?? false
    }

    private createDefaultTest(testName: string, component: string): DefaultTest {
        return { type: "Default", ...this.createBaseTest(testName, component) }
    }

    private createValidTest(testName: string, component: string): ValidTest {
        return { type: "Valid", ...this.createTestPlanTest(testName, component) }
    }

    private createInvalidTest(testName: string, component: string): InvalidTest {
        return { type: "Invalid", ...this.createTestPlanTest(testName, component) }
    }

    private createBaseTest(testName: string, component: string) {
        return {
            testName: getTestName(testName, component),
            component: this.compDesc?.nodeTypes?.at(0) ?? component,
            parent: this.compDesc?.ts?.parent,
            parentOptions: this.compDesc?.ts?.defaultParentOptions,
            isDisabled: this.isTestDisable(testName),
            constantImports: [],
            options: this.compDesc?.ts?.defaultOptions,
            checks: [],
            fails: [],
            additionalValues: this.compDesc?.ts?.values,
        }
    }

    private createTestPlanTest(testName: string, component: string) {
        return {
            ...this.createBaseTest(testName, component),
            fixtureImports: [],
            fixtureNames: [],
            fixtureTypes: [],
        }
    }
}

function makeTestWithTestPlan(
    test: TestPlan, fixturesTs: readonly Fixture[], enums: readonly Enum[],
    options: boolean, method: PeerMethod, testIndex: number,
    attributes: readonly TestValue[], componentOptions: ComponentOptions|undefined,
    validValueFixtures: readonly string[][],
    invalidValueFixtures?: readonly string[],
): void {
    const methodName = method.method.name
    if (testIndex < 0) {
        test.fatal = true
        test.fails = ["Need to properly configure fixtures in configuration file for proper test generation!"]
        return
    }
    if (methodName === "id") return // We use "id" for all tests.
    const isValid = invalidValueFixtures === undefined
    const testFixtures = isValid ? validValueFixtures[testIndex] : invalidValueFixtures
    const testPlanFixtures = makeTestPlanFixtures(testFixtures, isValid, fixturesTs, enums)
    test.fails = makeFixtureFails(testPlanFixtures.fails)
    test.fixtureNames = testPlanFixtures.names
    test.fixtureTypes = testPlanFixtures.types
    if (testPlanFixtures.names.length === 0) {
        test.fatal = true
        if (test.fails.length === 0) {
            test.fails.push("There are no fixtures")
        }
    }
    const initFixtures = getInitFixtures(validValueFixtures)
    const argInfo = makeArgumentInfo(attributes, testIndex)
    if (options) {
        const args = makeArguments(initFixtures, testIndex, argInfo, testPlanFixtures.imports, test.options)
        addTypesToArguments(attributes, args, testIndex)
        test.options = args
    } else {
        const args = makeArguments(initFixtures, testIndex, argInfo, testPlanFixtures.imports)
        addTypesToArguments(attributes, args, testIndex)
        test.methods = [{ name: methodName, args: args }]
        // Only if default options are not set.
        if (test.options === undefined) {
            const mandatoryOptions = getMandatoryOptions(componentOptions)
            const optFixtureFails = makeFixtureFails(mandatoryOptions.fixtures)
            if (optFixtureFails.length === 0) {
                if (mandatoryOptions.attributes.length > 0) {
                    const optInfo = makeArgumentInfo(mandatoryOptions.attributes)
                    test.options = makeArguments(mandatoryOptions.fixtures, -1, optInfo, testPlanFixtures.imports)
                    addTypesToArguments(mandatoryOptions.attributes, test.options)
                }
            } else {
                test.fails.push(...optFixtureFails)
                test.fatal = true
                console.error(`ERROR! Test: ${test.testName}. `
                    + `The fixture for options of the ${test.component} is not found.`)
            }
        }
    }
    const attrFixtureFails = makeFixtureFails(initFixtures)
    if (attrFixtureFails.length > 0) {
        test.fails.push(...attrFixtureFails)
        test.fatal = true
        console.error(`Fatal error! Test: ${test.testName}. `
            + `The fixture for method ${methodName} of the ${test.component} is not found.`)
    }
    if (test.fatal !== true) {
        test.checks = makeChecks([attributes[testIndex]], !isValid)
        test.constantImports = makeImports(test.checks)
        test.fixtureImports = makeFixtureImports(testPlanFixtures.imports)
    }
}

function makeTestPlanFixtures(
    fixtures: readonly string[], valid: boolean, fixturesTs: readonly Fixture[], enums: readonly Enum[]
): { names: string[], types: string[], imports: string[], fails: string[] } {
    const result: ReturnType<typeof makeTestPlanFixtures> = { names: [], types: [], imports: [], fails: [] }
    for (const fixture of fixtures) {
        const fxInfo = getFixtureInfo(fixture, valid, fixturesTs, enums)
        if (fxInfo) {
            result.names.push(fxInfo.name)
            result.types.push(...fxInfo.type)
            result.imports.push(`${fxInfo.name}Inputs`)
            if (valid) {
                result.imports.push(`${fxInfo.name}Expects`)
            }
        } else if (fixture === OPTIONAL_FIXTURE || fixture === UNION_UNDEF_FIXTURE) {
            result.types.push("undefined")
        } else if (fixture.startsWith(":")) {
            result.fails.push(fixture)
        }
    }
    return result
}

function getFixtureInfo(
    pureName: string, valid: boolean, fixturesTs: readonly Fixture[], enums: readonly Enum[]
): { name: string, type: string[] }|undefined {
    let fixture = fixturesTs.find(fix => fix.name === pureName)
    const enumType = pureName.replace("Enum", "")
    if (!fixture && enums.find(it => it.name === enumType) !== undefined) {
        fixture = { name: pureName, type: enumType, validValues: [], invalidValues: [] }
    }
    if (fixture && (valid ? fixture.validValues : fixture.invalidValues)) {
        return {
            name: getFixtureBaseName(pureName, valid),
            type: fixture.type.split("|")
        }
    }
    return undefined
}

function makeConstants(
    attributes: readonly TestValue[], parents: readonly TestValue[]
): { name: string, value: string }[] {
    const attrs = attributes.filter((attr, index, arr) =>
        attr.nameConst && index === arr.findIndex(it => it.nameConst === attr.nameConst)
    )
    const parentAttrs = parents.filter((attr, index, arr) =>
        attr.nameConst
        && index === arr.findIndex(it => it.nameConst === attr.nameConst)
        && attrs.find(it => it.nameConst === attr.nameConst) === undefined // Skip parents which coincide with attributes
    )
    const result = parentAttrs.map(attr => ({ name: attr.nameConst, value: attr.getParentName() }))
    for (const attr of attrs) {
        result.push({ name: attr.nameConst, value: attr.name })
        result.push({ name: attr.defaultConst, value: attr.defaultValue?.toString().replaceAll('"', "")
            ?? "!NOT-DEFINED!" })
    }
    return result
}

function makeChecks(attributes: readonly TestValue[], needDefault = true): TestCheck[] {
    const checks: TestCheck[] = []
    for (const attr of attributes) {
        const attrNames = fillAttrs(attr)
        if (attrNames.length > 0) {
            checks.push({
                attributes: attrNames,
                expected: needDefault ? attr.defaultConst : undefined
            })
        }
    }
    return checks
}

function fillAttrs(attr: TestValue): string[] {
    const parent = attr.getParent()
    const attrs = parent ? fillAttrs(parent) : []
    if (!attr.nameConst) return []
    attrs.push(attr.nameConst)
    return attrs
}

function makeImports(checks: readonly TestCheck[]): string[] {
    const imports = new Set<string>()
    for (const check of checks) {
        check.attributes.forEach(attr => imports.add(attr))
        if (check.expected) {
            imports.add(check.expected)
        }
    }
    return [...imports]
}

function getMandatoryOptions(
    componentOptions?: ComponentOptions
): { attributes: TestValue[], fixtures: string[] } {
    const result: ReturnType<typeof getMandatoryOptions> = { attributes: [], fixtures: [] }
    if (!componentOptions) return result
    const argsLength = componentOptions.method.method.signature.args.length ?? 0
    let lastMandatory = -1
    for (let i = 0; i < argsLength; ++i) {
        if (!componentOptions.method.method.signature.isArgOptional(i)) {
            lastMandatory = i
        }
    }
    const initFixtures = getInitFixtures(componentOptions.fixtures)
    for (const [i, attr] of componentOptions.attributes.entries()) {
        if (attr.getArgIndex() <= lastMandatory) {
            result.attributes.push(attr)
            result.fixtures.push(initFixtures[i])
        }
    }
    return result
}

// At the top level, it describes the argument of the function under test.
// Describes the field of the object for nested elements.
interface ArgumentInfo {
    name: string // object's field or argument name
    index?: number // an attribute index. It is used only for elements at the end.
    optional?: true // Whether the object's field or argument is optional. It is used only for root elements.
    args: ArgumentInfo[] // Describes the fields of objects.
}

// Converts information from attributes to ArgumentInfo structures.
// For each argument of the function under test, its own ArgumentInfo is returned.
// testIndex is used to resolve the conflict for the union types.
function makeArgumentInfo(attributes: readonly TestValue[], testIndex = 0): ArgumentInfo[] {
    const args: ArgumentInfo[] = []
    const optionalArgName = new Set<string>()
    const activeAttributes = splitAttributes(attributes, testIndex)
    // Groups all attributes into objects with the Groups all attributes into objects with the relevant hierarchy.
    for (const [index, attr] of attributes.entries()) {
        if (!activeAttributes[index]) continue
        const attrNames = attr.getFullTsName().split(".")
        attrNames[0] = attr.getArgIndex().toString() // Change first name to arg index for sort.
        if (attr.isArgOptional()) {
            optionalArgName.add(attrNames[0])
        }
        let infoList = args
        // All attribute nodes will be joined to the existing ones or a new node will be created.
        for (const [i, name] of attrNames.entries()) {
            const info = findOrCreateArgumentInfo(name, infoList)
            if (i === attrNames.length - 1) {
                info.index = index
            } else {
                infoList = info.args
            }
        }
    }
    const result = args.sort((a, b) => a.name.localeCompare(b.name))
    for (const it of result) {
        if (optionalArgName.has(it.name)) {
            it.optional = true
        }
    }
    return result
}

// A sign of its activity is returned for each attribute.
// If an attribute is not compatible with the attribute under test, it is marked as false.
function splitAttributes(attributes: readonly TestValue[], testIndex: number): boolean[] {
    if (testIndex >= attributes.length) {
        testIndex = 0
    }
    const active = attributes.map(() => false)
    for (const arg of groupAttrsByArgs(attributes)) {
        const mainTypes = [getAttrTypes(arg?.at(testIndex))]
        attributes.forEach((attr, i) => active[i] ||= areTypesCompatible(mainTypes, getAttrTypes(attr)))
    }
    return active
}

// Groups attributes by arguments.
// Returns an array of attributes for each argument while maintaining the original index.
// Attributes of the other argument are undefined.
function groupAttrsByArgs(attributes: readonly TestValue[]): (TestValue|undefined)[][] {
    const attrsByArgs: (TestValue|undefined)[][] = []
    for (const [attrIndex, attr] of attributes.entries()) {
        const attrArgIndex = attr.getArgIndex()
        if (attrsByArgs.at(attrArgIndex) === undefined) {
            attrsByArgs[attrArgIndex] = []
        }
        attrsByArgs[attrArgIndex][attrIndex] = attr
    }
    return attrsByArgs
}

// An array of its types is returned for the attribute.
// Where the first element is the type of the first parent. Where the last element is the type of the last parent.
// The type of the attribute itself is not used.
function getAttrTypes(attr?: TestValue): TypeHelper[] {
    const getTypes = (v?: TestValue): TypeHelper[] => {
        if (v) {
            return [...getTypes(v.parent), v.type]
        }
        return []
    }
    return getTypes(attr).slice(0, -1) // The last item is not counted in the path.
}

// Checks whether the attribute is compatible with the main attributes.
// If the attribute is compatible, it is added to the list of main attributes
// so that the following attributes do not conflict with it too.
function areTypesCompatible(mainTypes: TypeHelper[][], checkedTypes: TypeHelper[]): boolean {
    for (const mainType of mainTypes) {
        let isLastUnion = false
        for (const [index, typeName] of mainType.entries()) {
            if (typeName.getTypeName() === checkedTypes.at(index)?.getTypeName()) {
                isLastUnion = typeName.isUnion()
            } else if (isLastUnion) {
                return false // There is a conflict.
            }
        }
    }
    mainTypes.push(checkedTypes)
    return true
}

function findOrCreateArgumentInfo(attrName: string, mInfo: ArgumentInfo[]): ArgumentInfo {
    let item = mInfo.find(it => it.name === attrName)
    if (item === undefined) {
        const newItem = { name: attrName, args: [] }
        mInfo.push(newItem)
        item = newItem
    }
    return item
}

function makeArguments(
    initFixtures: readonly string[], index: number, mArgsInfo: ArgumentInfo[], mUsingFixtures: string[],
    defaultArgs: readonly Argument[] = []
): Argument[] {
    const args: Argument[] = []
    const inputArgs = [...mArgsInfo]
    mArgsInfo.length = 0 // Only using arguments will be kept.
    for (const [infoIndex, info] of inputArgs.entries()) {
        const isTestedArg = (argInfo: ArgumentInfo): boolean => {
            if (argInfo.index === index) return true
            for (const it of argInfo.args) {
                if (isTestedArg(it)) return true
            }
            return false
        }
        if (!isTestedArg(info)) {
            const defaultArg = defaultArgs.at(infoIndex)
            if (defaultArg) {
                args.push(defaultArg)
                continue // Go to next argument.
            }
            if (info.optional) {
                args.push("undefined")
                continue // Go to next argument.
            }
        }
        const deepArgs = makeArguments(initFixtures, index, info.args, mUsingFixtures)
        if (deepArgs.length === 0) {
            if (info.index === index) {
                args.push(true) // Tested argument
                mArgsInfo.push(info)
            } else if ((info.index ?? Infinity) < initFixtures.length) {
                const fixture = getFixtureFullName(initFixtures[info.index!], true, true)
                args.push(`${fixture}[0]`) // Fixture
                mArgsInfo.push(info)
                mUsingFixtures.push(fixture)
            }
        } else {
            const argObj: ArgumentObj = { props: [] }
            for (const [objI, deepArg] of deepArgs.entries()) {
                argObj.props.push({ name: info.args.at(objI)?.name ?? "undefined", arg: deepArg }) // Object
            }
            args.push(argObj)
            mArgsInfo.push(info)
        }
    }
    // Remove last optional arguments. TODO ArkTS requires explicit arguments.
    // for (let i = args.length - 1; i >= 0; --i) {
    //     if (args[i] === "undefined") {
    //         args.pop()
    //     } else {
    //         break
    //     }
    // }
    return args
}

function addTypesToArguments(attributes: readonly TestValue[], args: readonly Argument[], testIndex = 0): void {
    for (const [argIndex, arg] of args.entries()) {
        if (typeof arg === "object") {
            const attr = attributes.at(testIndex)
            arg.typeName = (
                attr?.getArgIndex() === argIndex ? attr : attributes.find(it => it.getArgIndex() === argIndex)
            )?.getArgTsType()
        }
    }
}

function makeFixtureImports(usingFixtures: readonly string[]): string[] {
    return [...new Set(usingFixtures)].sort()
}

function getTestName(testName: string, component: string): string {
    if (testName.startsWith("set")) {
        testName = testName.substring(3)
    }
    if (!testName.startsWith(component)) {
        testName = component + testName
    }
    return testName
}

function getInitFixtures(fixtures: readonly string[][]): string[] {
    return fixtures.map(it => {
        const unknownTypes = []
        for (const fixture of it) {
            const fail = getFixtureFailType(fixture)
            if (fail === undefined) {
                return fixture
            } else {
                unknownTypes.push(fail)
            }
        }
        return `:Ark_${unknownTypes.join("|")}`
    })
}

function getFixtureBaseName(pureName: string, valid: boolean): string {
    return `testFixture${pureName}${valid ? "Valid" : "Invalid"}`
}

function getFixtureFullName(pureName: string, valid: boolean, input: boolean): string {
    return `${getFixtureBaseName(pureName, valid)}${input ? "Inputs" : "Expects"}`
}

function getFixtureFailType(fixture = ":Ark_undefined"): string|undefined {
    const index = fixture.indexOf(":")
    if (index < 0) return undefined
    return fixture.substring(index + 5)
}

function makeFixtureFails(fixtures: readonly string[]): string[] {
    const fails: string[] = []
    for (const fixture of fixtures) {
        const fail = getFixtureFailType(fixture)
        if (fail !== undefined) {
            fails.push(`Unknown fixture for type: ${fail}`)
        }
    }
    return fails
}
