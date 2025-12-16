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
import * as path from 'path'

import {
    CppLanguageWriter,
    IndentedPrinter,
    Language,
    PeerClass,
    PeerLibrary,
    PeerMethod,
    camelCaseToUpperSnakeCase,
    createLanguageWriter,
} from '@idlizer/core'
import { cStyleCopyright, gniFile, makeFileNameFromClassName } from '@idlizer/libohos'
import { AceTypes } from './AceTypes'
import {
    Debug, MultiFileVisitor, TestData, OPTIONAL_FIXTURE, UNION_FIXTURE, UNION_UNDEF_FIXTURE
} from './MultiFileVisitor'
import { TestValue } from './TestValue'
import { TypeHelper } from './TypeHelper'
import { LibaceInstall } from '../ArkoalaInstall'

const CPP_FILE_LENGTH_LIMIT = 2000
const TEST_PLACEHOLDER = 'Placeholder'

function escapeQuote(str: string) {
    return str.replaceAll('"', '\\"')
}

function createWriter(library: PeerLibrary) {
    return createLanguageWriter(Language.CPP, library) as CppLanguageWriter
}

class FileState {
    constructor(protected library: PeerLibrary) {}
    writer = createWriter(this.library)
    prolog = createWriter(this.library)
    includes: string[] = []
    attributes: TestValue[] = []
    parents: TestValue[] = []
}

abstract class MultiFileUnittestVisitor extends MultiFileVisitor {
    private stateByFile = new Map<string, FileState>()
    private fileState = new FileState(this.library)
    private testName = ''
    private gni = new IndentedPrinter()

    protected abstract printClassProlog(clazz: PeerClass): void
    protected abstract printClassEpilog(clazz: PeerClass): void

    protected get testClassName() {
        return this.testName
    }

    protected get state() {
        return this.fileState
    }

    override makeTest(clazz: PeerClass): void {
        this.fileState = MultiFileVisitor.startComponent(
            clazz.componentName, this.stateByFile, () => new FileState(this.library)
        )

        this.testName = `${clazz.componentName}ModifierTest`

        this.printClassProlog(clazz)
        this.makeTestByClass(clazz)
        this.printClassEpilog(clazz)
    }

    emitSync(libace: LibaceInstall): void {
        for (const [clazz, state] of this.stateByFile) {
            let slug = makeFileNameFromClassName(clazz)
            let output = state.writer.getOutput()
            let findSplit = (inp: string[]) =>
                inp.findIndex((str, idx) => idx > CPP_FILE_LENGTH_LIMIT && str.startsWith('/*'))
            if (findSplit(output) == -1) {
                let writer = createWriter(this.library)
                printModifiersHeaderFile(writer, clazz, state)
                printModifiersImplFile(writer, clazz, output)
                const filePath = libace.modifierUnittest(slug)
                writer.printTo(filePath)
                this.gni.print(`"${path.basename(filePath)}",`)
            } else {
                let header = createWriter(this.library)
                printModifiersHeaderFile(header, clazz, state, 'standalone')
                const headerFilePath = libace.modifierUnittest(slug, 0)
                header.printTo(headerFilePath)

                let remain = output
                let index = 1
                while (remain.length > 0) {
                    let splitIdx = findSplit(remain)
                    if (splitIdx == -1) splitIdx = remain.length
                    let writer = createWriter(this.library)
                    printModifiersImplFile(writer, clazz, remain.slice(0, splitIdx), path.basename(headerFilePath))
                    const filePath = libace.modifierUnittest(slug, index++)
                    writer.printTo(filePath)
                    this.gni.print(`"${path.basename(filePath)}",`)
                    remain.splice(0, splitIdx)
                }
            }
        }
        let gniString = `generated_sources = [${this.gni.getOutput().join('\n')}]`
        fs.writeFileSync(libace.unitTestGni, gniFile(gniString))
    }
}

class MultiFileUnittestVisitorImpl extends MultiFileUnittestVisitor {
    enums = new Map<string, TypeHelper>()

    protected override printClassProlog(clazz: PeerClass): void {
        let comp = clazz.componentName
        if (this.compDesc?.includes) {
            this.state.includes.push(...this.compDesc.includes)
        }

        this.state.prolog.writeClass(
            this.testClassName,
            body => {
                body.print('public:')
                if (this.parametrized) {
                    body.print('void *CreateNodeImpl() override')
                    body.print('{')
                    body.print('typedef void *(*ConstructFunc)(Ark_Int32, Ark_Int32);')
                    body.print('const ConstructFunc constructors[] = {')
                    for (let nodeType of this.compDesc!.nodeTypes!) {
                        body.print(`nodeModifiers_->get${nodeType}Modifier()->construct,`)
                    }
                    body.print('};')
                    body.print('if (GetParam() < std::size(constructors)) {')
                    body.print('return constructors[GetParam()](GetId(), 0);')
                    body.print('}')
                    body.print('return nullptr;')
                    body.print('}')
                    body.print('')
                }
                body.pushIndent()
                body.print('static void SetUpTestCase()')
                body.print('{')
                body.pushIndent()
                body.print('ModifierTestBase::SetUpTestCase();')
                body.print('')
                if (this.compDesc?.themes) {
                    for (let theme of this.compDesc.themes) {
                        body.print(`SetupTheme<${theme}>();`)
                    }
                    body.print('')
                }
                body.print('for (auto& [id, strid, res]: Fixtures::resourceInitTable) {')
                body.pushIndent()
                body.print('AddResource(id, res);')
                body.print('AddResource(strid, res);')
                body.popIndent()
                body.print('}')
                body.popIndent()
                body.print('}')
                body.popIndent()
                if (this.compDesc?.setup) {
                    body.print('void SetUp() override')
                    body.print('{')
                    body.pushIndent()
                    body.print('ModifierTestBase::SetUp();')
                    this.compDesc?.setup.forEach(it => body.print(`${it};`))
                    body.popIndent()
                    body.print('}')
                }
            },
            `ModifierTestBase<GENERATED_ArkUI${comp}Modifier, ` +
                `&GENERATED_ArkUINodeModifiers::get${comp}Modifier, ` +
                `GENERATED_ARKUI_${camelCaseToUpperSnakeCase(comp)}>`,
            this.parametrized ? ['testing::WithParamInterface<int>'] : []
        )
        this.state.prolog.print('')
        if (this.parametrized) {
            this.state.writer.print(
                `INSTANTIATE_TEST_SUITE_P(Tests, ${this.testClassName}, testing::Range(0, ${this.compDesc?.nodeTypes?.length}));`
            )
            this.state.writer.print('')
        }
    }

    protected override printClassEpilog(clazz: PeerClass) {}

    protected override makePlaceholderTest(testName: string, component: string): void {
        this.printUnitTestHeader(`${testName}${TEST_PLACEHOLDER}`, component)
        this.state.writer.print('// This is placeholder to have disabled test')
        this.printUnitTestFooter()
    }

    protected override makeDefaultTest(testName: string, data: TestData): void {
            this.printUnitTestHeader(testName, data.component)
            this.state.writer.print('std::unique_ptr<JsonValue> jsonValue = GetJsonValue(node_);')
            let doneSet = new Set<string>()
            data.parents.forEach(attr => {
                if (attr.getResultName() == '') return
                if (doneSet.has(attr.nameConst)) return
                let parent = attr.getParent()
                let input = parent ? parent.getResultName() : 'jsonValue'
                //this.state.writer.print(`// ${attr.getFullName()} / ${parent?.getFullName()}`)
                this.state.writer.print(
                    `std::unique_ptr<JsonValue> ${attr.getResultName()} = ` +
                        `GetAttrValue<std::unique_ptr<JsonValue>>(${input}, ${attr.nameConst});`
                )
                doneSet.add(attr.nameConst)
            })
            this.state.writer.print('std::string resultStr;')
            for (let attr of data.attributes) {
                let parent = attr.getParent()
                let input = parent ? parent.getResultName() : 'jsonValue'
                if (input == '') input = 'jsonValue'
                this.state.writer.print('')
                this.state.writer.print(`resultStr = GetAttrValue<std::string>(${input}, ${attr.nameConst});`)
                this.state.writer.print(
                    `EXPECT_EQ(resultStr, ${attr.defaultConst}) << ` +
                        `"Default value for attribute '${attr.getFullName()}'";`
                )
            }
            this.printUnitTestFooter()
    }

    protected override makeValidTest(testName: string, attrIndex: number, data: TestData): void {
        this.printUnitTestHeader(testName, data.component)
        if (attrIndex >= 0) {
            this.printTestBody(
                data.debug, data.options, data.method, attrIndex, data.argNames, data.attributes, data.fixtures
            )
        } else {
            this.state.writer.print(
                'FAIL() << "Need to properly configure fixtures in configuration file for proper test generation!";'
            )
        }
        this.printUnitTestFooter()
    }

    protected override makeInvalidTest(
        testName: string, attrIndex: number, invalidValueFixtures: readonly string[], data: TestData
    ): void {
        this.printUnitTestHeader(testName, data.component)
        this.printTestBody(
            data.debug, data.options, data.method, attrIndex, data.argNames, data.attributes,
            data.fixtures, invalidValueFixtures
        )
        this.printUnitTestFooter()
    }

    protected override addAttributes(attrs: TestValue[]): void {
        for (let attr of attrs) {
            let idx = this.state.attributes.findIndex(item => item.nameConst == attr.nameConst)
            if (idx == -1) {
                this.state.attributes.push(attr)
            } else {
                let sattr = this.state.attributes[idx]
                if (!sattr.defaultValue) sattr.defaultValue = attr.defaultValue
            }
        }
    }

    protected override addParents(attrs: TestValue[]): void {
        for (let attr of attrs) {
            let idx = this.state.parents.findIndex(item => item.nameConst == attr.nameConst)
            if (idx == -1) {
                this.state.parents.push(attr)
            }
        }
    }

    protected override addEnum(type: TypeHelper): void {
        this.enums.set(type.getBaseTypeName(), type)
    }

    private convertType(dst: TypeHelper, src: string, value: string): string | undefined {
        //console.warn(`convertType: dst: ${dst.getTypeName()}, src: ${src}, opt: ${dst.isOptional()}, uni: ${dst.isUnion()}`)
        if (dst.getTypeName() == src) return value
        if (dst.isOptional() && dst.getBaseTypeName() == src) return `ArkValue<${dst.getTypeName()}>(${value})`
        if (dst.isUnion()) {
            for (let member of dst.getUnionMembers()) {
                let result = this.convertType(member, src, value)
                if (result) {
                    return `ArkUnion<${dst.getTypeName()}, ${member.getTypeName()}>(${result})`
                }
            }
        }
        return undefined
    }

    private getAttrAccessor(attr: TestValue, inputValue: string, child?: TestValue): string {
        let input: string
        if (attr.parent) {
            input = this.getAttrAccessor(attr.parent, inputValue, attr)
        } else {
            input = inputValue
        }
        if (!child) return input
        if (attr.type.isOptional()) input = `WriteTo(${input})`
        if (attr.type.isUnion()) {
            let childType = child.getTypeName()
            for (let member of attr.type.getUnionMembers()) {
                if (member.getTypeName() == childType) {
                    return `WriteToUnion<${childType}>(${input})`
                }
            }
            throw `Something unexpected happened!`
        }
        if (attr.type.isAggregate()) {
            let childName = child.name
            for (let member of attr.type.getAggregateMembers()) {
                if (member[0] == childName) {
                    return `${input}.${childName}`
                }
            }
            throw `Something unexpected happened!`
        }
        return input
    }

    private printTestBody(
        debug: Debug,
        options: boolean,
        method: PeerMethod,
        index: number,
        argNames: readonly string[],
        attributes: readonly TestValue[],
        validValueFixtures: readonly string[][],
        invalidValueFixtures?: readonly string[]
    ): void {
        let baseMethodName = method.sig.name

        if (invalidValueFixtures !== undefined) {
            if (invalidValueFixtures.length == 0) return
        } else {
            //this.state.writer.print(`// Valid value fixtures: ${validValueFixtures[index]}.`)
            if (validValueFixtures[index].length == 0) {
                this.state.writer.print(`FAIL() << "No valid fixtures is defined!";`)
                return
            }
        }
        // Initial state variable declarations
        argNames.forEach((name, idx) => {
            let type = TypeHelper.fromMethodArg(this.library, this.aceTypes, method, idx)
            this.state.writer.print(`${type.getTypeName()} initValue${name};`)
        })

        // Start with all values initialized to first possible value
        this.state.writer.print('')
        this.state.writer.print('// Initial setup')
        attributes.forEach((attr, idx) => {
            if (!attributes[index].comparePaths(attr)) return
            let attrType = attr.type
            let argName = `std::get<1>(${fullFixtureName(validValueFixtures[idx][0], true)}[0])`
            let inputType = this.getFixtureType(validValueFixtures[idx][0]) ?? ''
            let value = this.convertType(attr.type, inputType, argName)
            if (!value) {
                throw `Configuration error! Can't convert type '${inputType}' to '${attr.getTypeName()}' for '${attr.getFullName()}'.`
            }
            this.state.writer.print(
                `${this.getAttrAccessor(attr, `initValue${argNames[attr.getArgIndex()]}`)} = ${value};`
            )
        })
        let callSignature =
            `modifier_->${baseMethodName}(${options ? 'node' : 'node_'}, ` +
            `${method
                .argConvertors(this.library)
                .map((cnv, idx) => `${cnv.isPointerType() ? '&' : ''}inputValue${argNames[idx]}`)
                .join(', ')});`

        let attr = attributes[index]
        // Start labda code
        this.state.writer.print('')
        let lambdaName = `checkValue`
        let capture = argNames.map(it => `&initValue${it}`).join(', ')
        this.state.writer.print(
            `auto ${lambdaName} = [this, ${capture}](const std::string& input` +
                (invalidValueFixtures ? '' : ', const std::string& expectedStr') +
                `, const ${attr.getTypeName()}& value) {`
        )
        this.state.writer.pushIndent()
        argNames.forEach((name, idx) => {
            let type = TypeHelper.fromMethodArg(this.library, this.aceTypes, method, idx)
            this.state.writer.print(`${type.getTypeName()} inputValue${name} = initValue${name};`)
        })

        this.state.writer.print('')

        if (options) {
            this.state.writer.print("// Re-create node for 'options' attribute")
            this.state.writer.print('auto node = CreateNode();')
        }
        if (invalidValueFixtures && !options) {
            this.state.writer.print(callSignature)
        }
        let idx = attr.getArgIndex()
        this.state.writer.print(`${this.getAttrAccessor(attr, `inputValue${argNames[idx]}`)} = value;`)
        this.state.writer.print(callSignature)
        this.state.writer.print(`auto jsonValue = GetJsonValue(${options ? 'node' : 'node_'});`)
        let input = 'jsonValue'
        let parents = attr.getParentsSeq(true)
        parents.pop() // Last element is current attr
        attr.getParentsSeq(true)
            .slice(0, -1)
            .forEach(it => {
                this.state.writer.print(
                    `auto ${it.getResultName()} = GetAttrValue<std::unique_ptr<JsonValue>>(${input}, ${it.nameConst});`
                )
                input = it.getResultName()
            })
        this.state.writer.print(`auto resultStr = GetAttrValue<std::string>(${input}, ${attr.nameConst});`)
        let expected = invalidValueFixtures ? attr.defaultConst : 'expectedStr'
        if (options) {
            this.state.writer.print('DisposeNode(node);')
        }
        this.state.writer.print(
            `EXPECT_EQ(resultStr, ${expected}) << "Input value is: " << input << ` +
                `", method: ${baseMethodName}, attribute: ${attr.getFullName()}";`
        )
        if ((debug & Debug.DumpJson) != 0) {
            this.state.writer.print(`static int runIndex = 0;`)
            this.state.writer.print(`DumpJsonToFile(node_, runIndex++);`)
        }
        this.state.writer.popIndent()
        this.state.writer.print('};')
        this.state.writer.print('')
        // End lambda code

        let fixtures = invalidValueFixtures ? invalidValueFixtures : validValueFixtures[index]
        for (let fixture of fixtures) {
            if (!fixture) continue
            if (fixture == OPTIONAL_FIXTURE) {
                this.state.writer.print('// Check empty optional')
                this.state.writer.print(`${lambdaName}("undefined", ArkValue<${attr.type.getTypeName()}>());`)
                continue
            }
            if (fixture == UNION_FIXTURE) {
                this.state.writer.print('// Check invalid union')
                this.state.writer.print(
                    `${lambdaName}("invalid union", ArkUnion<${attr.type.getTypeName()}, Ark_Empty>(nullptr));`
                )
                continue
            }
            if (fixture == UNION_UNDEF_FIXTURE) {
                this.state.writer.print(
                    `${lambdaName}("undefined", ArkUnion<${attr.type.getTypeName()}, Ark_Undefined>(Ark_Undefined()));`
                )
                continue
            }
            if (fixture.startsWith(':')) {
                this.state.writer.print(`ADD_FAILURE() << "No fixture is defined for type ${fixture.substr(1)}";`)
                continue
            }
            this.state.writer.print(
                `for (auto& [input, value${invalidValueFixtures ? '' : ', expected'}]: ` +
                    `${fullFixtureName(fixture, !invalidValueFixtures)}) {`
            )
            this.state.writer.pushIndent()
            let fixType = this.getFixtureType(fixture) ?? ''
            let inputValue = this.convertType(attr.type, fixType, 'value')
            this.state.writer.print(`${lambdaName}(input${invalidValueFixtures ? '' : ', expected'}, ${inputValue});`)
            this.state.writer.popIndent()
            this.state.writer.print('}')
        }
    }

    private printUnitTestHeader(name: string, component: string): void {
        let disabled = this.compDesc?.disable?.includes(name) || name.endsWith(TEST_PLACEHOLDER)
        this.state.writer.print('')
        this.state.writer.writeMultilineCommentBlock(`@tc.name: ${name}\n@tc.desc:\n@tc.type: FUNC`)
        let type = this.parametrized ? 'HWTEST_P' : 'HWTEST_F'
        this.state.writer.print(
            `${type}(${this.testClassName}, ${disabled ? 'DISABLED_' : ''}${name}, TestSize.Level1)`
        )
        this.state.writer.print('{')
        this.state.writer.pushIndent()
    }

    private printUnitTestFooter(): void {
        this.state.writer.popIndent()
        this.state.writer.print('}')
    }
}

function fullFixtureName(name: string, valid: boolean): string {
    if (name.startsWith(':')) throw `Not defined fixture ${name}!`
    if (valid) {
        return `Fixtures::testFixture${name}ValidValues`
    }
    return `Fixtures::testFixture${name}InvalidValues`
}

function printModifiersHeaderFile(
    writer: CppLanguageWriter,
    clazz: string,
    state: FileState,
    standalone?: 'standalone'
) {
    writer.writeLines(cStyleCopyright)

    let headerGuard = `GENERATED_FOUNDATION_ACE_CAPI_TEST_${camelCaseToUpperSnakeCase(clazz)}_H`
    if (standalone) {
        writer.print(`#ifndef ${headerGuard}`)
        writer.print(`#define ${headerGuard}`)
    }

    writer.writeGlobalInclude('gtest/gtest.h')
    writer.print('')

    writer.writeInclude(`modifier_test_base.h`)
    writer.writeInclude(`modifiers_test_utils.h`)
    writer.writeInclude(`test_fixtures.h`)
    writer.writeInclude(`type_helpers.h`)

    writer.print('')
    writer.writeInclude('core/interfaces/native/utility/reverse_converter.h')

    writer.print('')
    for (let include of state.includes.sort()) {
        writer.writeInclude(include)
    }
    writer.print('')

    writer.pushNamespace('OHOS::Ace::NG', { indent: false })
    writer.print('using namespace testing;')
    writer.print('using namespace testing::ext;')
    writer.print('using namespace Converter;')
    writer.print('using namespace TypeHelper;')

    writer.pushNamespace(standalone ? `TestConst::${clazz}` : '', { indent: true })
    for (let attr of state.parents) {
        if (!attr.nameConst) continue
        // Skip parents which coincide with attributes
        if (state.attributes.find(it => it.nameConst == attr.nameConst)) continue
        writer.print(`const auto ${attr.nameConst} = "${attr.getParentName()}";`)
    }
    for (let attr of state.attributes) {
        writer.print(`const auto ${attr.nameConst} = "${attr.name}";`)
        writer.print(`const auto ${attr.defaultConst} = "${attr.defaultValue ?? '!NOT-DEFINED!'}";`)
    }
    writer.popNamespace({ indent: true })
    writer.print('')
    writer.concat(state.prolog)

    if (standalone) {
        writer.popNamespace({ indent: false })
        writer.print('')
        writer.print(`#endif // ${headerGuard}`)
        writer.print('')
    }
}

function printModifiersImplFile(writer: CppLanguageWriter, clazz: string, strings: string[], header?: string) {
    if (header) {
        writer.writeLines(cStyleCopyright)
        writer.print('')
        writer.writeInclude(header)
        writer.print('')
        writer.pushNamespace('OHOS::Ace::NG', { indent: false })
        writer.print(`using namespace TestConst::${clazz};`)
    }
    strings.forEach(s => writer.print(s))
    writer.popNamespace({ indent: false })
    writer.print('')
}

function printTestFixtures(
    peerLibrary: PeerLibrary,
    libace: LibaceInstall,
    aceTypes: AceTypes,
    enums: Map<string, TypeHelper>
) {
    let header = createWriter(peerLibrary)
    let module = createWriter(peerLibrary)
    let resTable = createWriter(peerLibrary)
    let resIds: string[] = []
    let resStrs: string[] = []

    for (let fixture of aceTypes.getFixtures()) {
        let name = `testFixture${fixture.name}`
        header.print('')
        module.print(`// Fixture '${fixture.name}' for type '${fixture.type}'`)
        header.print(`// Fixture '${fixture.name}' for type '${fixture.type}'`)
        if (fixture.validValues) {
            header.print(
                `extern std::vector<std::tuple<std::string, ${fixture.type}, std::string>> ${name}ValidValues;`
            )
            module.print(`std::vector<std::tuple<std::string, ${fixture.type}, std::string>> ${name}ValidValues = {`)
            module.pushIndent()
            fixture.validValues.forEach((value, index) => {
                let inVal = fixture.quoted ? `"${escapeQuote(value[0])}"` : value[0]
                if (fixture.type == 'Ark_Resource') {
                    if (!fixture.resType) throw `Resource type is not defined for fixture ${fixture.name}`
                    let resName = `${camelCaseToUpperSnakeCase(fixture.name)}_${index}`
                    module.print(
                        `{"ResId:${resName}_ID", CreateResource(${resName}_ID, ` +
                            `ResourceType::${fixture.resType}), "${value[1]}"},`
                    )
                    module.print(
                        `{"ResName:${resName}_STR", CreateResource(${resName}_STR, ` +
                            `ResourceType::${fixture.resType}), "${value[1]}"},`
                    )
                    resTable.print(`{${resName}_ID, ${resName}_STR, ${inVal}},`)
                    resIds.push(`${resName}_ID`)
                    resStrs.push(`${resName}_STR`)
                } else {
                    module.print(
                        `{"${escapeQuote(inVal)}", ` +
                            `Converter::ArkValue<${fixture.type}>(${inVal}, &fixCtx), "${value[1]}"},`
                    )
                }
            })
            module.popIndent()
            module.print('};')
            module.print('')
        }
        if (fixture.invalidValues) {
            header.print(`extern std::vector<std::tuple<std::string, ${fixture.type}>> ${name}InvalidValues;`)
            module.print(`std::vector<std::tuple<std::string, ${fixture.type}>> ${name}InvalidValues = {`)
            module.pushIndent()
            let indexStart = fixture.validValues?.length ?? 0
            fixture.invalidValues.forEach((value, index) => {
                let inVal = fixture.quoted ? `"${escapeQuote(value)}"` : value
                if (fixture.type == 'Ark_Resource') {
                    if (!fixture.resType) throw `Resource type is not defined for fixture ${fixture.name}`
                    let resName = `${camelCaseToUpperSnakeCase(fixture.name)}_${index + indexStart}`
                    module.print(
                        `{"ResId:${resName}_ID", CreateResource(${resName}_ID, ` +
                            `ResourceType::${fixture.resType})},`
                    )
                    module.print(
                        `{"ResName:${resName}_STR", CreateResource(${resName}_STR, ` +
                            `ResourceType::${fixture.resType})},`
                    )
                    resTable.print(`{${resName}_ID, ${resName}_STR, ${inVal}},`)
                    resIds.push(`${resName}_ID`)
                    resStrs.push(`${resName}_STR`)
                } else {
                    module.print(`{"${escapeQuote(inVal)}", Converter::ArkValue<${fixture.type}>(${inVal}, &fixCtx)},`)
                }
            })
            module.popIndent()
            module.print('};')
            module.print('')
        }
    }

    let headerFile = createWriter(peerLibrary)
    let moduleFile = createWriter(peerLibrary)

    headerFile.writeLines(cStyleCopyright)
    moduleFile.writeLines(cStyleCopyright)

    let headerGuard = 'GENERATED_FOUNDATION_ACE_CAPI_TEST_FIXTURES_H'
    headerFile.print(`#ifndef ${headerGuard}`)
    headerFile.print(`#define ${headerGuard}`)
    headerFile.print('')

    headerFile.writeGlobalInclude('string')
    headerFile.writeGlobalInclude('tuple')
    headerFile.writeGlobalInclude('vector')
    headerFile.print('')
    headerFile.writeInclude('core/interfaces/native/utility/reverse_converter.h')
    headerFile.print('')
    headerFile.writeInclude('test_fixtures_enums.h')
    headerFile.print('')

    moduleFile.writeInclude(`test_fixtures.h`)
    moduleFile.print('')
    moduleFile.writeInclude(`core/components/theme/theme_style.h`)
    moduleFile.writeInclude(`modifiers_test_utils.h`)
    moduleFile.print('')

    moduleFile.pushNamespace('OHOS::Ace::NG::Fixtures', { indent: false })
    headerFile.pushNamespace('OHOS::Ace::NG::Fixtures', { indent: false })
    moduleFile.print('Converter::ConvContext fixCtx;')

    headerFile.print(`enum ResID {`)
    headerFile.pushIndent()
    for (let id of resIds) {
        headerFile.print(`${id},`)
    }
    headerFile.popIndent()
    headerFile.print(`};`)
    headerFile.print('')
    for (let s of resStrs) {
        headerFile.print(`inline constexpr auto ${s} = "${s}";`)
    }
    headerFile.print('')
    headerFile.print('extern std::vector<std::tuple<ResID, std::string, ResRawValue>> resourceInitTable;')
    moduleFile.print('std::vector<std::tuple<ResID, std::string, ResRawValue>> resourceInitTable = {')
    moduleFile.pushIndent()
    moduleFile.concat(resTable)
    moduleFile.popIndent()
    moduleFile.print(`};`)
    moduleFile.print('')

    headerFile.concat(header)
    moduleFile.concat(module)

    moduleFile.popNamespace({ indent: false })
    headerFile.popNamespace({ indent: false })

    headerFile.print(`#endif // ${headerGuard}`)
    headerFile.print('')
    moduleFile.print('')
    headerFile.printTo(libace.unittest('test_fixtures.h'))
    moduleFile.printTo(libace.unittest('test_fixtures.cpp'))

    // Enums
    let headerEnums = createWriter(peerLibrary)
    let moduleEnums = createWriter(peerLibrary)

    headerEnums.writeLines(cStyleCopyright)
    moduleEnums.writeLines(cStyleCopyright)

    let enumsHeaderGuard = 'GENERATED_FOUNDATION_ACE_CAPI_TEST_FIXTURES_ENUMS_H'
    headerEnums.print(`#ifndef ${enumsHeaderGuard}`)
    headerEnums.print(`#define ${enumsHeaderGuard}`)
    headerEnums.print('')

    headerEnums.writeGlobalInclude('string')
    headerEnums.writeGlobalInclude('tuple')
    headerEnums.writeGlobalInclude('vector')
    headerEnums.print('')
    headerEnums.writeInclude('arkoala_api_generated.h')
    headerEnums.print('')

    moduleEnums.writeGlobalInclude('climits')
    moduleEnums.print('')
    moduleEnums.writeInclude(`test_fixtures_enums.h`)
    moduleEnums.print('')

    moduleEnums.pushNamespace('OHOS::Ace::NG::Fixtures', { indent: false })
    headerEnums.pushNamespace('OHOS::Ace::NG::Fixtures', { indent: false })

    let keys = Array.from(enums.keys()).sort()
    for (let key of keys) {
        let type = enums.get(key)!
        let name = type.getBaseTypeName()
        if (name.startsWith('enum ')) {
            name = name.substr(5)
        }
        let shortName = type.tsName()
        headerEnums.print(
            `extern std::vector<std::tuple<std::string, ${name}, std::string>> testFixtureEnum${shortName}ValidValues;`
        )
        moduleEnums.print(
            `std::vector<std::tuple<std::string, ${name}, std::string>> testFixtureEnum${shortName}ValidValues = {`
        )
        moduleEnums.pushIndent()
        const enumValues = type.getEnumValues()
        if (enumValues.names.length === 0) throw `Enum expected! Got ${JSON.stringify(type.getIdlDecl())}`
        for (const [index, it] of enumValues.names.entries()) {
            let inputVal = `${camelCaseToUpperSnakeCase(type.getBaseTypeName())}_${it}`
            let expected = `${enumValues.values[index]}`
            moduleEnums.print(`{"${inputVal}", ${inputVal}, "${type.tsName()}.${expected}"},`)
        }
        moduleEnums.popIndent()
        moduleEnums.print('};')
        moduleEnums.print('')

        headerEnums.print(
            `extern std::vector<std::tuple<std::string, ${name}>> testFixtureEnum${shortName}InvalidValues;`
        )
        moduleEnums.print(`std::vector<std::tuple<std::string, ${name}>> testFixtureEnum${shortName}InvalidValues = {`)
        moduleEnums.pushIndent()
        moduleEnums.print(`{"-1", static_cast<${name}>(-1)},`)
        moduleEnums.print(`{"INT_MAX", static_cast<${name}>(INT_MAX)},`)
        moduleEnums.popIndent()
        moduleEnums.print('};')
        moduleEnums.print('')
    }

    moduleEnums.popNamespace({ indent: false })
    headerEnums.popNamespace({ indent: false })

    headerEnums.print(`#endif // ${headerGuard}`)
    headerEnums.print('')
    moduleEnums.print('')
    headerEnums.printTo(libace.unittest('test_fixtures_enums.h'))
    moduleEnums.printTo(libace.unittest('test_fixtures_enums.cpp'))
}

export function printUnitTestsAsMultipleFiles(peerLibrary: PeerLibrary, libace: LibaceInstall, aceTypesJson?: string) {
    let aceTypes = new AceTypes(aceTypesJson)
    const visitor = new MultiFileUnittestVisitorImpl(peerLibrary, aceTypes)
    visitor.makeTests()
    visitor.emitSync(libace)
    printTestFixtures(peerLibrary, libace, aceTypes, visitor.enums)
}
