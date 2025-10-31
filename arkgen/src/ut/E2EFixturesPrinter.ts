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

import * as path from 'path'
import { camelCaseToLowerSnakeCase, ETSLanguageWriter, PeerLibrary } from '@idlizer/core'
import { cStyleCopyright } from '@idlizer/libohos'
import { LibaceInstall } from '../ArkoalaInstall'
import { AceTypesTs, Fixture, Import } from './AceTypes'
import { Target } from './E2EPrinter'
import { Enum } from './E2ESuitesCreator'
import { createEtsWriter, makeTsImports, printEtsResource, quoted1 } from './PrinterUtils'

export function printTsFixtures(
    aceTypes: AceTypesTs, enums: readonly Enum[], peerLibrary: PeerLibrary, libace: LibaceInstall, target: Target
): void {
    // TestFixturesEnums.ets
    const testFixturesEnumsEts = createEtsWriter(peerLibrary)
    testFixturesEnumsEts.writeLines(cStyleCopyright)
    const folders = libace.endToEndTest()
    const testEnums = makeFixturesEnums(enums, target, peerLibrary)
    testFixturesEnumsEts.concat(testEnums)
    testFixturesEnumsEts.printTo(path.join(folders.fixtures, "TestFixturesEnums.ets"))
    // TestFixtures.ets
    const testFixturesEts = createEtsWriter(peerLibrary)
    testFixturesEts.writeLines(cStyleCopyright)
    const testData = makeFixtures(aceTypes.getFixturesTs(), aceTypes.imports, target, peerLibrary)
    testFixturesEts.concat(testData.fixtures)
    testFixturesEts.printTo(path.join(folders.fixtures, "TestFixtures.ets"))
    // Resources
    printEtsResource(folders.element, "color.json", testData.color.json)
    printEtsResource(folders.element, "float.json", testData.float.json)
    printEtsResource(folders.element, "string.json", testData.string.json)
}

function makeFixturesEnums(enums: readonly Enum[], target: Target, peerLibrary: PeerLibrary): ETSLanguageWriter {
    const testPlans = createEtsWriter(peerLibrary)
    const prefix = "testFixtureEnum"
    const enumTypes = new Set<string>()
    for (const en of enums) {
        enumTypes.add(en.name)
        // ValidInputs
        testPlans.print(`export const ${prefix}${en.name}ValidInputs: ${en.name}[] = [`)
        testPlans.pushIndent()
        en.values.forEach(value => testPlans.print(`${en.name}.${value},`))
        testPlans.popIndent()
        testPlans.print("]")
        testPlans.print("")
        // ValidExpects
        testPlans.print(`export const ${prefix}${en.name}ValidExpects: string[] = [`)
        testPlans.pushIndent()
        en.values.forEach(value => testPlans.print(`'${en.name}.${value}',`))
        testPlans.popIndent()
        testPlans.print("]")
        testPlans.print("")
        // InvalidInputs
        testPlans.print(`export const ${prefix}${en.name}InvalidInputs: ${en.name}[] = [`)
        // Now ArkTS 1.2 is not supporting value casting.
        if (target !== Target.ARK_TS_1_2) {
            testPlans.pushIndent()
            if (en.isString) {
                testPlans.print(`'' as ${en.name}, 'INVALID_ENUM' as ${en.name}`)
            } else {
                testPlans.print(`-1 as ${en.name}, 0x7FFFFFFF as ${en.name}`)
            }
            testPlans.popIndent()
        }
        testPlans.print("]")
        testPlans.print("")
    }
    const body = createEtsWriter(peerLibrary)
    if (target === Target.ARK_TS_1_2) {
        body.concat(makeTsImports(enumTypes, "@ohos.arkui.component", peerLibrary))
        body.print("")
    }
    body.concat(testPlans)
    return body
}

function makeFixtures(fixtures: readonly Fixture[], imports: Import[], target: Target, peerLibrary: PeerLibrary): {
    fixtures: ETSLanguageWriter
    color: ColorJson
    float: FloatJson
    string: StringJson
} {
    const testPlans = createEtsWriter(peerLibrary)
    const resColor = new ColorJson()
    const resFloat = new FloatJson()
    const resString = new StringJson()
    const fixtureTypes = new Set<string>(["$r"])
    for (const fixture of fixtures) {
        const makeInputValue: (value: string, index: number) => string|undefined =
            fixture.type === "Resource" ? (value, index) => {
                const file: JsonFile = fixture.resType === "COLOR" ? resColor
                    : fixture.resType === "FLOAT" ? resFloat
                    : fixture.resType === "STRING" ? resString
                    : new JsonFileStub()
                if (file instanceof JsonFileStub) return undefined
                const jsonValue = {
                    name: `${camelCaseToLowerSnakeCase(fixture.name)}_${index}`,
                    value: value,
                }
                file.add(jsonValue)
                return `\$r('${file.path}${jsonValue.name}')`
            }
            : (fixture.type === "string" && fixture.quoted !== false) || fixture.quoted === true
                ? value => quoted1(value) : value => value
        const printFixtureValues = (
            values: string[], label: "Valid"|"Invalid", variant: "Inputs"|"Expects", type: string
        ): void => {
            const types = type.split("|")
            if (types.length > 1) {
                type = `(${type})`
            }
            types.filter(t => t.at(0) === (t.at(0)?.toUpperCase() ?? "")).forEach(t => fixtureTypes.add(t))
            testPlans.print(`export const testFixture${fixture.name}${label}${variant}: ${type}[] = [`)
            testPlans.pushIndent()
            values.forEach(value => testPlans.print(value + ","))
            testPlans.popIndent()
            testPlans.print("]")
            testPlans.print("")
        }
        testPlans.print(`// Fixture '${fixture.name}' for type '${fixture.type}'`)
        if (fixture.validValues) {
            const inputs = new Array<string>()
            const expects = new Array<string>()
            fixture.validValues.forEach((validValue, index) => {
                const input = makeInputValue(validValue[0], index)
                if (input !== undefined) {
                    inputs.push(input)
                    expects.push(quoted1(validValue[1]))
                }
            })
            printFixtureValues(inputs, "Valid", "Inputs", fixture.type)
            printFixtureValues(expects, "Valid", "Expects", "string")
        }
        if (fixture.invalidValues) {
            const inputs = new Array<string>()
            const indexStart = fixture.validValues?.length ?? 0
            fixture.invalidValues.forEach((invalidValue, index) => {
                const input = makeInputValue(invalidValue, index + indexStart)
                if (input !== undefined) {
                    inputs.push(input)
                }
            })
            printFixtureValues(inputs, "Invalid", "Inputs", fixture.type)
        }
    }
    const body = createEtsWriter(peerLibrary)
    body.concat(makeFixtureImports(imports, fixtureTypes, target, peerLibrary))
    body.print("export * from './TestFixturesEnums'")
    body.print("")
    body.concat(testPlans)
    return {
        fixtures: body,
        color: resColor,
        float: resFloat,
        string: resString,
    }
}

function makeFixtureImports(
    imports: readonly Import[], fixtureTypes: Set<string>, target: Target, peerLibrary: PeerLibrary
): ETSLanguageWriter {
    const importList = new Map<string, Set<string>>()
    if (target === Target.ARK_TS_1_2) {
        importList.set("@ohos.arkui.component", fixtureTypes)
    } else {
        importList.set("../types", new Set(["int, long, double"]))
    }
    for (const item of imports) {
        let importItems = importList.get(item.from)
        if (importItems === undefined) {
            importItems = new Set<string>()
            importList.set(item.from, importItems)
        }
        importItems.add(item.name)
        if (target === Target.ARK_TS_1_2) {
            fixtureTypes.delete(item.name) // Remove from @ohos.arkui.component
        }
    }
    const importsWriter = createEtsWriter(peerLibrary)
    importList.forEach((names, from) => importsWriter.concat(makeTsImports(names, from, peerLibrary)))
    importsWriter.print("")
    return importsWriter
}

interface JsonValue {
    name: string
    value: string
}

interface JsonFile {
    add(value: JsonValue): void
    readonly path: string
}

class ColorJson implements JsonFile {
    color: JsonValue[] = [{
        name: "start_window_background",
        value: "#FFFFFF"
    }]
    add(value: JsonValue): void {
        this.color.push(value)
    }
    readonly path = "app.color."
    get json() {
        return {
            color: this.color
        }
    }
}

class FloatJson implements JsonFile {
    float: JsonValue[] = [{
        name: "page_text_font_size",
        value: "50fp"
    }]
    add(value: JsonValue): void {
        this.float.push(value)
    }
    readonly path = "app.float."
    get json() {
        return {
            float: this.float
        }
    }
}

class StringJson implements JsonFile {
    string: JsonValue[] = [{
        name: "module_desc",
        value: "E2E"
    }, {
        name: "EntryAbility_desc",
        value: "C-API end to end"
    }, {
        name: "EntryAbility_label",
        value: "E2E"
    }]
    add(value: JsonValue): void {
        this.string.push(value)
    }
    readonly path = "app.string."
    get json() {
        return {
            string: this.string
        }
    }
}

class JsonFileStub implements JsonFile {
    add(): void {}
    readonly path = ""
}
