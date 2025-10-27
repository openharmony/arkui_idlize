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
import * as idl from '@idlizer/core/idl'

import {
    CppLanguageWriter,
    IndentedPrinter,
    Language,
    PeerClass,
    PeerLibrary,
    PeerMethod,
    camelCaseToUpperSnakeCase,
    capitalize,
    createEmptyReferenceResolver,
    createLanguageWriter,
    groupBy,
    printMethodDeclaration,
} from '@idlizer/core'
import { collectPeersForFile, cStyleCopyright, gniFile, makeFileNameFromClassName } from '@idlizer/libohos'
import { AceTypes } from './AceTypes'
import { TestValue } from './TestValue'
import { TypeHelper } from './TypeHelper'
import { LibaceInstall } from '../ArkoalaInstall'

const CPP_FILE_LENGTH_LIMIT = 2000
const ALL_UPPER = new RegExp('^[A-Z0-9_]+$')
const OPTIONS_REGEXP = new RegExp('^set[A-Za-z0-9_]+Options[0-9]*$')

const GENERATE_ALL = false

const OPTIONAL_FIXTURE = '_optional'
const UNION_FIXTURE = '_union'
const UNION_UNDEF_FIXTURE = '_union_undef'
const OPTIONS_NAME = 'options'
const TEST_PLACEHOLDER = 'Placeholder'

type FixtureType = [string, boolean, boolean]

const enum Debug {
    None = 0,
    DumpJson = 0x0001,
}

const DEBUG_MAP = new Map<string, Debug>([['dumpJson', Debug.DumpJson]])

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
    parametrized = false
}

abstract class MultiFileVisitor {
    constructor(protected library: PeerLibrary, protected aceTypes: AceTypes) {
        this.state = new FileState(this.library)
    }

    protected state
    protected gni = new IndentedPrinter()
    private stateByFile = new Map<string, FileState>()

    printUnitTests() {
        this.library.files.forEach(file => {
            collectPeersForFile(this.library, file).forEach(clazz => this.printUnitTestFile(clazz))
        })
    }

    printUnitTestFile(clazz: PeerClass) {
        let compDesc = this.aceTypes.getComponents().find(it => it.name == clazz.componentName)
        if (!compDesc && !GENERATE_ALL) return
        this.onFileStart(clazz.componentName)
        this.printUnitTest(clazz)
        this.onFileEnd()
    }

    onFileStart(className: string) {
        let state = this.stateByFile.get(className)
        if (!state) {
            state = new FileState(this.library)
            this.stateByFile.set(className, state)
        }
        this.state = state
    }

    onFileEnd() {}

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

    abstract printUnitTest(clazz: PeerClass): void
}

class MultiFileUnittestVisitor extends MultiFileVisitor {
    private testClassName = ''
    public enums = new Map<string, TypeHelper>()
    public genFixtures = new Map<string, string>()

    override printUnitTest(clazz: PeerClass): void {
        this.testClassName = `${clazz.componentName}ModifierTest`

        this.printClassProlog(clazz)
        clazz.methods.forEach(method => this.printMethodUnittests(clazz.componentName, method))
        this.printClassEpilog(clazz)
    }

    printClassProlog(clazz: PeerClass): void {
        let comp = clazz.componentName

        console.log(`Generating UT for component ${comp}:`)
        let compDesc = this.aceTypes.getComponents().find(it => it.name == comp)
        if (compDesc?.includes) {
            this.state.includes.push(...compDesc.includes)
        }
        let parametrized = (compDesc?.nodeTypes?.length ?? 0) > 0

        this.state.prolog.writeClass(
            this.testClassName,
            body => {
                body.print('public:')
                if (parametrized) {
                    body.print('void *CreateNodeImpl() override')
                    body.print('{')
                    body.print('typedef void *(*ConstructFunc)(Ark_Int32, Ark_Int32);')
                    body.print('const ConstructFunc constructors[] = {')
                    for (let nodeType of compDesc!.nodeTypes!) {
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
                if (compDesc?.themes) {
                    for (let theme of compDesc.themes) {
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
                if (compDesc?.setup) {
                    body.print('void SetUp() override')
                    body.print('{')
                    body.pushIndent()
                    body.print('ModifierTestBase::SetUp();')
                    compDesc?.setup.forEach(it => body.print(`${it};`))
                    body.popIndent()
                    body.print('}')
                }
            },
            `ModifierTestBase<GENERATED_ArkUI${comp}Modifier, ` +
                `&GENERATED_ArkUINodeModifiers::get${comp}Modifier, ` +
                `GENERATED_ARKUI_${camelCaseToUpperSnakeCase(comp)}>`,
            parametrized ? ['testing::WithParamInterface<int>'] : []
        )
        this.state.prolog.print('')
        if (parametrized) {
            this.state.writer.print(
                `INSTANTIATE_TEST_SUITE_P(Tests, ${this.testClassName}, testing::Range(0, ${compDesc?.nodeTypes?.length}));`
            )
            this.state.writer.print('')
        }
    }

    printClassEpilog(clazz: PeerClass) {}

    addAttributes(attrs: TestValue[]): void {
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

    addParents(attrs: TestValue[]): void {
        for (let attr of attrs) {
            let idx = this.state.parents.findIndex(item => item.nameConst == attr.nameConst)
            if (idx == -1) {
                this.state.parents.push(attr)
            }
        }
    }

    getAttrFixtures(attr: TestValue): FixtureType[] {
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

    getFixtures(type: TypeHelper): FixtureType[] {
        if (type.isEnum()) {
            this.enums.set(type.getBaseTypeName(), type)
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

    appendCommonFixtures(type: TypeHelper, result: FixtureType[]): void {
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

    fullFixtureName(name: string, valid: boolean): string {
        if (name.startsWith(':')) throw `Not defined fixture ${name}!`
        if (valid) {
            return `Fixtures::testFixture${name}ValidValues`
        }
        return `Fixtures::testFixture${name}InvalidValues`
    }

    getFixtureType(name: string): string | undefined {
        return this.genFixtures.get(name) ?? this.aceTypes.getFixtures().find(fix => fix.name == name)?.type
    }

    sortFixtureNames(fixtureNames: string[]): string[] {
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

    convertType(dst: TypeHelper, src: string, value: string): string | undefined {
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

    getAttrAccessor(attr: TestValue, inputValue: string, child?: TestValue): string {
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

    isOptionsMethod(method: PeerMethod): boolean {
        return method.isCallSignature
    }

    printTestBody(
        debug: Debug,
        options: boolean,
        method: PeerMethod,
        index: number,
        argNames: string[],
        attributes: TestValue[],
        validValueFixtures: string[][],
        invalidValueFixtures?: string[]
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
            let argName = `std::get<1>(${this.fullFixtureName(validValueFixtures[idx][0], true)}[0])`
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
                    `${this.fullFixtureName(fixture, !invalidValueFixtures)}) {`
            )
            this.state.writer.pushIndent()
            let fixType = this.getFixtureType(fixture) ?? ''
            let inputValue = this.convertType(attr.type, fixType, 'value')
            this.state.writer.print(`${lambdaName}(input${invalidValueFixtures ? '' : ', expected'}, ${inputValue});`)
            this.state.writer.popIndent()
            this.state.writer.print('}')
        }
    }

    printMethodUnittests(component: string, method: PeerMethod): void {
        let baseTestName = `${method.sig.name}Test`
        let compDesc = this.aceTypes.getComponents().find(it => it.name == component)
        if (compDesc?.ignoreAttributes?.includes(method.method.name)) {
            console.warn(`Attribute '${method.method.name}' is ignored due to ignoreAttributes!`)
            this.printUnitTestHeader(`${baseTestName}${TEST_PLACEHOLDER}`, component)
            this.state.writer.print('// This is placeholder to have disabled test')
            this.printUnitTestFooter()
            
            return
        }
        let removed = compDesc?.remove
        this.state.parametrized = (compDesc?.nodeTypes?.length ?? 0) > 0
        /*/
        this.state.writer.print(`// Method: ${method.method.name} arguments:`)
        method.argConvertors.forEach((arg, index) => {
            let type = TypeHelper.fromMethodArg(this.library, this.aceTypes, method, index)
            this.state.writer.print(`//   ${arg.param} [${type.getTypeName()}]`)
            for (let mem of arg.getMembers()) {
                this.state.writer.print(`//     ${mem}`)
            }
        })
        /**/

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
            //this.state.writer.print(`// Arg: ${method.argConvertors[index].param}/${name}/${ignore}`)
            argNames.push(capitalize(name))
            return processArgByType(name, type, parent, index, ignore)
        }

        let skip = false
        if (this.isOptionsMethod(method)) {
            method.sig.args.forEach((arg, index) => {
                // Parse options argument
                let ignore = arg.name == 'options' || arg.name == 'option'
                if (method.sig.args.length == 1) {
                    let type = TypeHelper.fromMethodArg(this.library, this.aceTypes, method, index)
                    if (type.getBaseTypeName().endsWith('Options')) ignore = true
                }
                let name = ignore ? OPTIONS_NAME : arg.name
                if (!ignore) {
                    const margs = compDesc?.attributes?.find(it => it.name == name)?.arguments
                    if (margs && margs[0].startsWith('^') && margs[0].substr(1)) name = margs[0].substr(1)
                }
                skip ||= !processArg(name, index, ignore)
            })
        } else {
            let name = method.method.name
            if (method.sig.args.length == 1) {
                skip ||= !processArg(name, 0)
            } else {
                const margs = compDesc?.attributes?.find(it => it.name == name)?.arguments
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
            if (compDesc?.debug?.includes(key)) debug |= val
        })
        let testName = `${baseTestName}DefaultValues`
        if (attributes.length > 0 && !removed?.includes(testName)) {
            parents.forEach(it => {
                if (it.name == '|') console.warn(`Wrong parent. Full name: ${it.getFullName()}`)
            })
            this.addAttributes(attributes)
            this.addParents(parents)

            this.printUnitTestHeader(testName, component)
            this.state.writer.print('std::unique_ptr<JsonValue> jsonValue = GetJsonValue(node_);')
            let doneSet = new Set<string>()
            parents.forEach(attr => {
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
            for (let attr of attributes) {
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

        let optionsMethod = this.isOptionsMethod(method)
        let validFixtures = attributes.map(attr =>
            this.sortFixtureNames(
                this.getAttrFixtures(attr)
                    .filter(fix => fix[1])
                    .map(fix => fix[0])
            )
        )
        if (validFixtures.find(fix => !fix[0] || fix[0].startsWith(':'))) {
            console.error(`ERROR! Incomplete fixtures for method ${method.method.name}. Skipping...`)
            console.error(
                `No fixtures for: ${attributes
                    .filter(attr => this.getAttrFixtures(attr).filter(fix => fix[1] && fix[0]))
                    .map(attr => `${attr.name}: ${attr.getTypeName()}`)}`
            )
            if (!removed?.includes(`${baseTestName}ValidValues`)) {
                this.printUnitTestHeader(`${baseTestName}ValidValues`, component)
                this.state.writer.print(
                    'FAIL() << "Need to properly configure fixtures in configuration file for proper test generation!";'
                )
                this.printUnitTestFooter()
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
                this.printUnitTestHeader(testName, component)
                this.printTestBody(debug, optionsMethod, method, index, argNames, attributes, validFixtures)
                this.printUnitTestFooter()
            }

            let invalidFixtures = this.getAttrFixtures(attribute)
                .filter(it => it[2])
                .map(fix => fix[0])
            if (invalidFixtures.find(fix => fix)) {
                testName = `${attrTestName}InvalidValues`
                if (!removed?.includes(testName)) {
                    this.addAttributes(attributes)
                    this.addParents(parents)
                    this.printUnitTestHeader(testName, component)
                    this.printTestBody(
                        debug,
                        optionsMethod,
                        method,
                        index,
                        argNames,
                        attributes,
                        validFixtures,
                        invalidFixtures
                    )
                    this.printUnitTestFooter()
                }
            }
        })
    }

    printUnitTestHeader(name: string, component: string): void {
        let compDesc = this.aceTypes.getComponents().find(it => it.name == component)
        let disabled = compDesc?.disable?.includes(name) || name.endsWith(TEST_PLACEHOLDER)
        this.state.writer.print('')
        this.state.writer.writeMultilineCommentBlock(`@tc.name: ${name}\n@tc.desc:\n@tc.type: FUNC`)
        let type = this.state.parametrized ? 'HWTEST_P' : 'HWTEST_F'
        this.state.writer.print(
            `${type}(${this.testClassName}, ${disabled ? 'DISABLED_' : ''}${name}, TestSize.Level1)`
        )
        this.state.writer.print('{')
        this.state.writer.pushIndent()
    }

    printUnitTestFooter(): void {
        this.state.writer.popIndent()
        this.state.writer.print('}')
    }
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

    writer.pushNamespace('OHOS::Ace::NG', { ident: false })
    writer.print('using namespace testing;')
    writer.print('using namespace testing::ext;')
    writer.print('using namespace Converter;')
    writer.print('using namespace TypeHelper;')

    writer.pushNamespace(standalone ? `TestConst::${clazz}` : '', { ident: true })
    for (let attr of state.parents) {
        if (!attr.nameConst) continue
        // Skip parents which coincide with attributes
        if (state.attributes.find(it => it.nameConst == attr.nameConst)) continue
        let name = attr.name
        let parent = attr.parent
        while (name == '|' && parent) {
            name = parent.name
            parent = parent.parent
        }
        writer.print(`const auto ${attr.nameConst} = "${name}";`)
    }
    for (let attr of state.attributes) {
        writer.print(`const auto ${attr.nameConst} = "${attr.name}";`)
        writer.print(`const auto ${attr.defaultConst} = "${attr.defaultValue ?? '!NOT-DEFINED!'}";`)
    }
    writer.popNamespace({ ident: true })
    writer.print('')
    writer.concat(state.prolog)

    if (standalone) {
        writer.popNamespace({ ident: false })
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
        writer.pushNamespace('OHOS::Ace::NG', { ident: false })
        writer.print(`using namespace TestConst::${clazz};`)
    }
    strings.forEach(s => writer.print(s))
    writer.popNamespace({ ident: false })
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

    moduleFile.pushNamespace('OHOS::Ace::NG::Fixtures', { ident: false })
    headerFile.pushNamespace('OHOS::Ace::NG::Fixtures', { ident: false })
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

    moduleFile.popNamespace({ ident: false })
    headerFile.popNamespace({ ident: false })

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

    moduleEnums.pushNamespace('OHOS::Ace::NG::Fixtures', { ident: false })
    headerEnums.pushNamespace('OHOS::Ace::NG::Fixtures', { ident: false })

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
        let idlType = type.getIdlDecl()
        if (!idl.isEnum(idlType)) throw `Enum expected! Got ${JSON.stringify(idlType)}`
        idlType.elements.forEach(it => {
            let inputVal = `${camelCaseToUpperSnakeCase(type.getBaseTypeName())}_${it.name}`
            let expected = `${idl.getExtAttribute(it, idl.IDLExtendedAttributes.OriginalEnumMemberName) ?? it.name}`
            moduleEnums.print(`{"${inputVal}", ${inputVal}, "${type.tsName()}.${expected}"},`)
        })
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

    moduleEnums.popNamespace({ ident: false })
    headerEnums.popNamespace({ ident: false })

    headerEnums.print(`#endif // ${headerGuard}`)
    headerEnums.print('')
    moduleEnums.print('')
    headerEnums.printTo(libace.unittest('test_fixtures_enums.h'))
    moduleEnums.printTo(libace.unittest('test_fixtures_enums.cpp'))
}

export function printUnitTestsAsMultipleFiles(peerLibrary: PeerLibrary, libace: LibaceInstall, aceTypesJson?: string) {
    let aceTypes = new AceTypes(aceTypesJson)
    const visitor = new MultiFileUnittestVisitor(peerLibrary, aceTypes)
    visitor.printUnitTests()
    visitor.emitSync(libace)
    printTestFixtures(peerLibrary, libace, aceTypes, visitor.enums)
}
