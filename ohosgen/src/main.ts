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

import * as path from "path"
import { createCommand } from "commander"
import * as fs from "fs"
import {
    Language,
    findVersion,
    setDefaultConfiguration,
    PeerLibrary,
    verifyIDLLinter,
    parseIDLFile,
    scanInputDirs,
    D,
    formatInputPaths,
    NativeModuleType,
    validatePaths,
    fqnTransformer,
    createAlgotithmicReferenceResolver,
    nullsTransformer,
    transformOnSerializeTransformer,
    genericsTransformer,
} from "@idlizer/core"
import {
    getFQName,
    IDLFile,
    IDLNode,
    linearizeNamespaceMembers,
    linkParentBack,
    transformMethodsAsync2ReturnPromise,
} from "@idlizer/core/idl"
import { loadPeerConfiguration,
    IdlPeerProcessor,
    loadPlugin, peerGeneratorConfiguration,
    libohosPredefinedFiles,
    PeerGeneratorConfigurationSchema,
    NativeModule,
    syntheticTransformer,
} from "@idlizer/libohos"
import { readLibrary } from "@idlizer/interfaces"
import { generateOhos } from "./ohos"
import { suggestLibraryName } from "./OhosNativeVisitor"
import { ohosgenDefaultConfigurationPaths } from "./config"

const command = createCommand()
    .option('--show-config-schema', 'Prints JSON schema for config')
    .option('--input-dir <path>', 'Path to input dir(s), comma separated')
    .option('--base-dir <path>', 'Base directories, for the purpose of packetization of IDL modules, comma separated, defaulted to --input-dir if missing')
    .option('--output-dir <path>', 'Path to output dir')
    .option('--input-files <files...>', 'Comma-separated list of specific files to process')
    .option('--library-packages <packages>', 'Comma separated list of packages included into library')
    .option('--idl2peer', 'Convert IDL to peer drafts')
    .option('--verbose', 'Verbose processing')
    .option('--verify-idl', 'Verify produced IDL')
    .option('--api-version <version>', "API version for generated peers")
    .option('--dump-serialized', "Dump serialized data")
    .option('--call-log', "Call log")
    .option('--docs [all|opt|none]', 'How to handle documentation: include, optimize, or skip')
    .option('--language [ts|arkts|cangjie|kotlin]', 'Output language')
    .option('--api-prefix <string>', 'Cpp prefix to be compatible with manual arkoala implementation')
    .option('--version')
    .option('--plugin <file>', 'File with generator\'s plugin')
    .option('--default-idl-package <name>', 'Name of the default package for generated IDL')
    .option('--no-commented-code', 'Do not generate commented code in modifiers')
    .option('--use-new-ohos', 'Use new ohos generator')
    .option('--use-ost', 'Generate output using syntax trees (EXPERIMENTAL)')
    .option('--enable-log', 'Enable logging')
    .option('--split-files', 'Experimental feature to store declarations in different files for ohos generator')
    .option('--options-file <path...>', 'Paths to generator configuration options file (appends to defaults). Use --ignore-default-config to override default options.')
    .option('--ignore-default-config', 'Use with --options-file to override default generator configuration options.', false)
    .option('--arkts-extension <string> [.ts|.ets]', "Generated ArkTS language files extension.", ".ts")
    .option('--implicit-predefined', "Removes predefined from the generator input", false)
const options = command
    .parse()
    .opts()

let didJob = false
let apiVersion = options.apiVersion ?? 9999

options.inputFiles = processInputFiles(options.inputFiles)

setDefaultConfiguration(loadPeerConfiguration([
    ...(options.ignoreDefaultConfig ? [] : ohosgenDefaultConfigurationPaths()),
    ...(options.optionsFile ?? []),
]))

if (process.env.npm_package_version && !options.showConfigSchema) {
    console.log(`IDLize version ${findVersion()}`)
}

if (options.showConfigSchema) {
    console.log(D.printJSONSchema(PeerGeneratorConfigurationSchema))
    didJob = true
}

if (options.idl2peer) {
    const outDir = options.outputDir ?? "./out"
    const language = Language.fromString(options.language ?? "ts")

    const { inputFiles, inputDirs } = formatInputPaths(options)
    validatePaths(inputDirs, "dir")
    validatePaths(inputFiles, "file")

    let files: IDLFile[] = []
    const allInputFiles = scanInputDirs(inputDirs)
        .concat(inputFiles)
        .concat(libohosPredefinedFiles())
        .concat(skoalaPredefinedFiles())
        .concat(options.implicitPredefined ? readLibrary('arkuiExtra') : [])
    const idlInputFiles = allInputFiles.filter(it => it.endsWith('.idl'))
    idlInputFiles.forEach(idlFilename => {
        idlFilename = path.resolve(idlFilename)
        const file = parseIDLFile(idlFilename)
        linearizeNamespaceMembers(file.entries).forEach(transformMethodsAsync2ReturnPromise)
        files.push(file)
    })
    if (options.verifyIdl) {
        files.forEach(file => {
            verifyIDLLinter(file, createAlgotithmicReferenceResolver(files), peerGeneratorConfiguration().linter)
        })
    }
    initGeneratedNativeModuleName()

    files = fqnTransformer(files.map(linkParentBack), createAlgotithmicReferenceResolver(files, true))
    files = transformOnSerializeTransformer(files, (node: IDLNode) => {
        const transformation = peerGeneratorConfiguration().transformOnSerialize.find(
            it => it.from === getFQName(node))
        return transformation?.to
    })
    files = nullsTransformer(files)
    files = genericsTransformer(files, {
        ignoreGenerics: peerGeneratorConfiguration().ignoreGenerics,
        ignore: [],
    })
    files = syntheticTransformer(files)

    const idlLibrary = new PeerLibrary(language, NativeModule.Interop)
    idlLibrary.files = files
    initLibraryName(idlLibrary)
    new IdlPeerProcessor(idlLibrary).process()
    generateTarget(idlLibrary, outDir, options.useOst)

    didJob = true
}

if (!didJob) {
    command.help()
}

function processInputFiles(files: string[] | string | undefined): string[] {
    if (!files) return []

    const processPath = (path: string) => {
        const trimmedPath = path.trim()
        if (!fs.existsSync(trimmedPath)) {
            console.error(`Input file does not exist: ${trimmedPath}`)
            return false
        }
        return true
    }

    if (Array.isArray(files) && files.length === 1 && files[0].includes(',')) {
        const filesList = files[0].split(',').map(f => f.trim()).filter(Boolean)
        return filesList.filter(processPath)
    }

    if (Array.isArray(files)) {
        return files.map(f => f.trim()).filter(Boolean).filter(processPath)
    }

    const filesList = files.split(',').map(f => f.trim()).filter(Boolean)
    return filesList.filter(processPath)
}

function initLibraryName(idlLibrary: PeerLibrary) {
    // TODO really dirty - I do not like PeerLibrary.name at all, should be reworked in another way.
    idlLibrary.name = options.defaultIdlPackage?.toUpperCase() || suggestLibraryName()
    if (!idlLibrary.name.length) {
        throw new Error("No name can be assigned to generated package. please provide name via --default-idl-package ")
    }
}

function initGeneratedNativeModuleName() {
    const name = options.defaultIdlPackage?.toUpperCase() || suggestLibraryName()
    NativeModule.Generated = new NativeModuleType(name + 'NativeModule')
}

function generateTarget(idlLibrary: PeerLibrary, outDir: string, useOst: boolean) {
    generateOhos(outDir, idlLibrary, useOst, {
        ...peerGeneratorConfiguration(),
        LibraryPrefix: `${idlLibrary.name.toUpperCase()}_`,
        GenerateUnused: true,
        ApiVersion: apiVersion,
    })

    if (options.plugin) {
        loadPlugin(options.plugin)
            .then(plugin => plugin.process({ outDir: outDir }, idlLibrary))
            .then(result => {
                console.log(`Plugin ${options.plugin} process returned ${result}`)
            })
            .catch(error => console.error(`Plugin ${options.plugin} not found: ${error}`))
    }
}

function skoalaPredefinedFiles(): string[] {
    const PREDEFINED_PATH = path.resolve('tests', 'skoala', 'predefined')
    return scanInputDirs([PREDEFINED_PATH])
}
