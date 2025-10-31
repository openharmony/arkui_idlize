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

import * as fs from 'fs'
import * as path from 'path'
import { ETSLanguageWriter, PeerLibrary } from '@idlizer/core'
import { cStyleCopyright } from '@idlizer/libohos'
import { LibaceInstall } from '../ArkoalaInstall'
import { AceTypesTs } from './AceTypes'
import { Target } from './E2EPrinter'
import { Argument, ArgumentObj, E2ESuitesCreator, Enum, Suite, Test } from './E2ESuitesCreator'
import { createEtsWriter, makeTsImports, printEtsResource, quoted1 } from './PrinterUtils'

export function printTsSuites(
    aceTypes: AceTypesTs, peerLibrary: PeerLibrary, libace: LibaceInstall, target: Target
): Enum[] {
    const creator = new E2ESuitesCreator(peerLibrary, aceTypes)
    creator.makeTests()
    const suites = creator.suites
    const paths = libace.endToEndTest()
    printMainPagesJson(suites, paths.profile)
    printSuitesEts(suites, paths.tests, peerLibrary)
    for (const suite of suites) {
        const pathToSuite = path.join(paths.tests, suite.component)
        fs.mkdirSync(pathToSuite)
        printConstEts(suite.constants, pathToSuite, peerLibrary)
        printTestsEts(suite.tests, pathToSuite, target, peerLibrary)
    }
    return creator.enums
}

function printMainPagesJson(suites: readonly Suite[], pathToFile: string): void {
    const json = {
        src: [
            "pages/Index",
            "pages/JsonChecker",
            "pages/RouterChecker",
            "pages/TestLoader",
            "pages/TestSkipper",
        ]
    }
    for (const suite of suites) {
        suite.tests.forEach(test => json.src.push(`tests/${suite.component}/${test.testName}`))
    }
    printEtsResource(pathToFile, "main_pages.json", json)
}

const suiteInterfaceCode =
`interface Suite {
    readonly name: string
    readonly tests: string[]
    readonly disabledTests?: string[]
}
`

function printSuitesEts(suites: readonly Suite[], pathToTests: string, peerLibrary: PeerLibrary): void {
    const suitesEts = createEtsWriter(peerLibrary)
    suitesEts.writeLines(cStyleCopyright)
    suitesEts.writeLines(suiteInterfaceCode)
    suitesEts.print("export const suites: readonly Suite[] = [")
    suitesEts.pushIndent()
    for (const suite of suites) {
        suitesEts.print("{")
        suitesEts.pushIndent()
        suitesEts.print(`name: '${suite.component}',`)
        suitesEts.print("tests: [")
        suitesEts.pushIndent()
        const testNames: string[] = []
        const disabledTestNames: string[] = []
        suite.tests.forEach(test =>
            test.isDisabled ? disabledTestNames.push(test.testName) : testNames.push(test.testName))
        testNames.forEach(test => suitesEts.print(`'${test}',`))
        suitesEts.popIndent()
        if (disabledTestNames.length > 0) {
            suitesEts.print("],")
            suitesEts.print("disabledTests: [")
            suitesEts.pushIndent()
            disabledTestNames.forEach(test => suitesEts.print(`'${test}',`))
            suitesEts.popIndent()
        }
        suitesEts.print("]")
        suitesEts.popIndent()
        suitesEts.print("},")
    }
    suitesEts.popIndent()
    suitesEts.print("]")
    suitesEts.print("")
    suitesEts.printTo(path.join(pathToTests, "Suites.ets"))
}

function printTestsEts(tests: readonly Test[], pathToSuite: string, target: Target, peerLibrary: PeerLibrary): void {
    for (const test of tests) {
        const imports = makeImports(test, target, peerLibrary)
        const blocks = makeTestBlocks(test, target, peerLibrary)
        const struct = makeStruct(test.testName, blocks.planValues, blocks.build, blocks.checks, peerLibrary)

        const fileEts = createEtsWriter(peerLibrary)
        fileEts.writeLines(cStyleCopyright)
        fileEts.concat(imports)
        fileEts.concat(blocks.planType)
        fileEts.concat(struct)
        fileEts.printTo(path.join(pathToSuite, `${test.testName}.ets`))
    }
}

function printConstEts(
    constants: readonly { name: string, value: string }[], pathToSuite: string, peerLibrary: PeerLibrary
): void {
    const constEts = createEtsWriter(peerLibrary)
    constEts.writeLines(cStyleCopyright)
    constants.forEach(it => constEts.print(`export const ${it.name} = ${quoted1(it.value)}`))
    constEts.printTo(path.join(pathToSuite, "Const.ets"))
}

const arkTsImportsCodeStub = // Temporary stub for ArkTS.
"import { PageTransitionEnter, PageTransitionExit, RouteType } from '../../stubsArkTs1_2/PageTransition' // TODO ArkTS 1.2 is not supported."
const arkTsImportsCode =
`// Only for ArkTS
${arkTsImportsCodeStub}`

function makeImports(test: Test, target: Target, peerLibrary: PeerLibrary): ETSLanguageWriter {
    const imports = createEtsWriter(peerLibrary)
    if (target === Target.ARK_TS_1_2) {
        imports.print(arkTsImportsCode)
        const types = new Set(["Column", "Component", "Entry", test.component])
        if (test.parent) {
            types.add(test.parent)
        }
        if (test.fixtureImports !== undefined) {
            types.add("ForEach")
        }
        // Add fixtures types.
        const singleFixtureTypes: string[] = []
        test.fixtureTypes?.forEach(t => singleFixtureTypes.push(...t.split("|")))
        singleFixtureTypes.filter(t => t.at(0) === (t.at(0)?.toUpperCase() ?? "")).forEach(t => types.add(t))
        // Add object arguments types.
        const args: Argument[] = []
        test.options?.forEach(arg => args.push(arg))
        test.methods?.forEach(m => args.push(...m.args))
        for (const arg of args) {
            if (typeof arg === "object" && arg.typeName) {
                types.add(arg.typeName)
            }
        }
        // Add types from additionalValues
        for (const expression of test.additionalValues ?? []) {
            const typePositionStart = expression.indexOf(":")
            if (typePositionStart >= 0) {
                const typePositionEnd = expression.indexOf("=")
                if (typePositionStart < typePositionEnd) {
                    types.add(expression.substring(typePositionStart + 1, typePositionEnd).trim())
                }
            }
        }
        imports.concat(makeTsImports(types, "@ohos.arkui.component", peerLibrary))
        if (test.type === "Invalid" && test.fatal !== true) {
            imports.print("import { State } from '@ohos.arkui.stateManagement'")
        }
        imports.print("")
    } else {
        imports.concat(makeTsImports(new Set(["int, long, double"]), "../../types", peerLibrary))
    }
    const checkers = new Set<string>()
    if (test.fatal !== true) {
        checkers.add(getCheckerName(test.type))
    }
    if (test.fails.length > 0) {
        checkers.add("fail")
    }
    const fixtureImports = new Set(test.fixtureImports ?? [])
    if (test.type === "Invalid" && test.fatal !== true) {
        checkers.add("runTestAsync")
        if (fixtureImports.size > 0) {
            fixtureImports.add(getInitFixtureName(test))
        }
    } else {
       checkers.add("runTest")
    }
    imports.concat(makeTsImports(checkers, "../../testing/Test", peerLibrary))
    imports.concat(makeTsImports(fixtureImports, "../../fixtures/TestFixtures", peerLibrary))
    imports.concat(makeTsImports(new Set(test.constantImports), "./Const", peerLibrary))
    imports.print("")
    return imports
}

function getCheckerName(testType: "Default"|"Valid"|"Invalid"): string {
    return `check${testType}Value${testType === "Default" ? "" : "s"}`
}

function makeTestBlocks(test: Test, target: Target, peerLibrary: PeerLibrary) {
    const blocks = {
        planType: createEtsWriter(peerLibrary),
        planValues: createEtsWriter(peerLibrary),
        build: createEtsWriter(peerLibrary),
        checks: createEtsWriter(peerLibrary),
    }
    let runTest = "runTest"
    if (test.type === "Invalid" && test.fatal !== true) {
        blocks.checks.print("this.testPlanState = this.testPlanInputs")
        runTest += "Async"
    }
    blocks.checks.print(`${runTest}(() => {`)
    blocks.checks.pushIndent()
    if (test.fatal !== true) {
        if (test.additionalValues) {
            test.additionalValues.forEach(value => blocks.planValues.print(value))
            blocks.planValues.print("")
        }
        if (test.type === "Default") {
            const args = makeArgs(test.options ?? [])
            if (test.parent) {
                blocks.build.print(`${test.parent}(${(test.parentOptions ?? []).join(", ")}) {`)
                blocks.build.pushIndent()
            }
            blocks.build.writeLines(`${test.component}(${args}).id(this.name)`)
            if (test.parent) {
                blocks.build.popIndent()
                blocks.build.print("}")
            }
            for (const check of test.checks) {
                const checkBlock = makeCheckBlock(check.attributes, test.type, `${check.expected}`, peerLibrary)
                blocks.checks.concat(checkBlock)
            }
        } else {
            const testPlanTypeName = `${test.testName}Plan`
            blocks.planValues.print(`readonly testPlanInputs: ${testPlanTypeName}[] = [`)
            blocks.planValues.pushIndent()
            test.fixtureNames.forEach(fixture => blocks.planValues.print(`...${fixture}Inputs,`))

            const testPlanName = test.type === "Invalid" ? "testPlanState" : "testPlanInputs"
            const indexType = target === Target.ARK_TS_1_2 ? "int" : "number"
            blocks.build.print(`ForEach(this.${testPlanName}, (item: ${testPlanTypeName}, index: ${indexType}) => {`)
            blocks.build.pushIndent()
            if (test.parent) {
                blocks.build.print(`${test.parent}(${(test.parentOptions ?? []).join(", ")}) {`)
                blocks.build.pushIndent()
            }
            const args = makeArgs(test.options ?? [])
            blocks.build.writeLines(`${test.component}(${args}).id(this.name + index)`)
            blocks.build.pushIndent()
            for (const method of test.methods ?? []) {
                const args = makeArgs(method.args ?? [])
                blocks.build.writeLines(`.${method.name}(${args})`)
            }
            blocks.build.popIndent()
            if (test.parent) {
                blocks.build.popIndent()
                blocks.build.print("}")
            }
            blocks.build.popIndent()
            blocks.build.print("})")
            const fixtureTypesSet = new Set(test.fixtureTypes)
            if (fixtureTypesSet.size > 0) {
                blocks.planType.print(`type ${testPlanTypeName} = ${[...fixtureTypesSet].join("|")}`)
                blocks.planType.print("")
            }
            if (test.type === "Valid") {
                blocks.planValues.popIndent()
                blocks.planValues.print("]")
                blocks.planValues.print("")
                blocks.planValues.print(`readonly testPlanExpects: string[] = [`)
                blocks.planValues.pushIndent()
                test.fixtureNames.forEach(fixture => blocks.planValues.print(`...${fixture}Expects,`))
                blocks.planValues.popIndent()
                blocks.planValues.print("]")
                blocks.planValues.print("")
                for (const check of test.checks) {
                    const checkBlock = makeCheckBlock(check.attributes, test.type, "this.testPlanExpects", peerLibrary)
                    blocks.checks.concat(checkBlock)
                }
            } else {
                if (fixtureTypesSet.has("undefined")) {
                    blocks.planValues.print("undefined")
                }
                blocks.planValues.popIndent()
                blocks.planValues.print("]")
                blocks.planValues.print(`@State testPlanState: ${testPlanTypeName}[] = this.testPlanInputs`)
                blocks.planValues.pushIndent()
                blocks.planValues.print(`.map(() => ${getInitFixtureName(test)}[0] as ${testPlanTypeName})`)
                blocks.planValues.popIndent()
                blocks.planValues.print("")
                for (const check of test.checks) {
                    const checkBlock = makeCheckBlock(
                        check.attributes, test.type, `${check.expected}, this.testPlanInputs.length`, peerLibrary
                    )
                    blocks.checks.concat(checkBlock)
                }
            }
        }
    } else {
        blocks.build.print(`// The component ${test.component} cannot be generated.`)
        blocks.build.print(`// Define a fixture for the required arguments of the ${test.component} options or method.`)
    }
    [...new Set(test.fails)].forEach(msg => blocks.checks.print(`fail('${msg}')`))
    blocks.checks.popIndent()
    blocks.checks.print("}, this.getUIContext())")
    return blocks
}

function makeCheckBlock(
    attributes: readonly string[], testType: "Default"|"Valid"|"Invalid", expected: string, peerLibrary: PeerLibrary
): ETSLanguageWriter {
    const checks = createEtsWriter(peerLibrary)
    checks.print(`${getCheckerName(testType)}(this.name, [`)
    checks.pushIndent()
    attributes.forEach(attr => checks.print(`${attr},`))
    checks.popIndent()
    checks.print(`], ${expected})`)
    return checks
}

function makeArgs(args: readonly Argument[]): string {
    let lines: string[] = [""]
    for (const arg of args) {
        if (lines.at(-1)!.length > 80) {
            lines.push(`${lines.pop()},`)
            lines.push("    ")
        } else if (lines.at(-1)!.length > 0) {
            lines.push(`${lines.pop()}, `)
        }
        lines.push(lines.pop() + (typeof arg === "object" ? getArgumentObj(arg) : getArgument(arg)))
    }
    return lines.join("\n")
}

function getArgument(arg: string|true): string {
    return typeof arg === "boolean" ? "item" : arg
}

function getArgumentObj(arg: ArgumentObj, indent = 0): string {
    const props: string[] = []
    const [spaces, propsIndent] = arg.props.length > 1 ? ["    ", indent + 1] : ["", indent]
    for (const prop of arg.props) {
        props.push(`${spaces.repeat(propsIndent)}${prop.name}: ${
            typeof prop.arg === "object" ? getArgumentObj(prop.arg, propsIndent) : getArgument(prop.arg)
        }`)
    }
    const argType = arg.typeName ? ` as ${arg.typeName}` : ""
    return props.length === 1 ? `{ ${props[0]} }${argType}`
        : ["{", props.join(",\n"), `${spaces.repeat(indent)}}${argType}`].join("\n")
}

function makeStruct(
    testName: string, testPlan: ETSLanguageWriter, build: ETSLanguageWriter, checks: ETSLanguageWriter,
    peerLibrary: PeerLibrary
): ETSLanguageWriter {
    const struct = createEtsWriter(peerLibrary)
    struct.print("@Entry")
    struct.print("@Component")
    struct.print(`struct ${testName} {`)
    struct.pushIndent()

    struct.print(`readonly name: string = '${testName}'`)
    struct.print("")
    struct.concat(testPlan)

    struct.print("build() {")
    struct.pushIndent()
    struct.print("Column() {")
    struct.pushIndent()
    struct.concat(build)
    struct.popIndent()
    struct.print("}")
    struct.popIndent()
    struct.print("}")
    struct.print("")

    struct.print("onPageShow() {")
    struct.pushIndent()
    struct.concat(checks)
    struct.popIndent()
    struct.print("}")
    struct.print("")

    struct.print("pageTransition() {")
    struct.pushIndent()
    struct.print("PageTransitionEnter({ type: RouteType.None, duration: 0 })")
    struct.print("PageTransitionExit({ type: RouteType.None, duration: 0 })")
    struct.popIndent()
    struct.print("}")

    struct.popIndent()
    struct.print("}")
    struct.print("")
    return struct
}

function getInitFixtureName(test: Test): string {
    const invalidFixtureBaseName = (test.fixtureNames?.length ?? 0) > 0 ? test.fixtureNames![0] : ""
    return `${invalidFixtureBaseName.includes("Invalid")
        ? invalidFixtureBaseName.replace("Invalid", "Valid")
        : "unknownFixtureValid"
    }Inputs`
}