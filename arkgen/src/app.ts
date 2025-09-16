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

import { createCommand } from "commander"
import * as path from "path"
import {
    Language,
    findVersion,
    verifyIDLLinter,
    scanInputDirs,
    parseIDLFile,
    setDefaultConfiguration,
    D,
    inplaceGenerics,
    PeerLibrary,
    inplaceNullsAsUndefined,
    inplaceTransformOnSerializeFromConfig,
} from "@idlizer/core"
import {
    transformMethodsAsync2ReturnPromise,
    linearizeNamespaceMembers,
    IDLNode,
    hasExtAttribute,
    IDLExtendedAttributes,
} from "@idlizer/core/idl"
import { loadPeerConfiguration,
    generateTracker, IdlPeerProcessor, loadPlugin,
    fillSyntheticDeclarations,
    formatInputPaths,
    libohosPredefinedFiles,
    PeerGeneratorConfigurationSchema,
    peerGeneratorConfiguration,
    NativeModule,
} from "@idlizer/libohos"
import { generateArkoalaFromIdl, generateLibaceFromIdl } from "./arkoala"
import { ArkoalaPeerLibrary } from "./ArkoalaPeerLibrary"
import { makeInteropBridges } from "./InteropBridges"
import { loadKnownReferences } from "./knownReferences"
import { readLibrary } from "@idlizer/interfaces"
import { arkgenDefaultConfigurationPaths } from "./config"

export function arkgen(argv:string[]) {
    const command = createCommand()
        .option('--show-config-schema', 'Prints JSON schema for config')
        .option('--dts2peer', 'Convert .d.ts to peer drafts. Deprecated! Use dtsgen --dts2idl and --idl2peer instead')
        .option('--ets2ts', 'Convert .ets to .ts')
        .option('--input-dir <path>', 'Path to input dir(s), comma separated')
        .option('--aux-input-dir <path>', 'Path to aux input dir(s), comma separated')
        .option('--base-dir <path>', 'Base directories, for the purpose of packetization of IDL modules, comma separated, defaulted to --input-dir if missing')
        .option('--output-dir <path>', 'Path to output dir')
        .option('--input-files <files...>', 'Comma-separated list of specific files to process')
        .option('--aux-input-files <files...>', 'Comma-separated list of specific aux files to process')
        .option('--library-packages <packages>', 'Comma separated list of packages included into library')
        .option('--idl2peer', 'Convert IDL to peer drafts')
        .option('--verbose', 'Verbose processing')
        .option('--verify-idl', 'Verify produced IDL')
        .option('--common-to-attributes', 'Transform common attributes as IDL attributes')
        .option('--test-interface <name>', 'Interfaces to test (comma separated)')
        .option('--test-method <name>', 'Methods to test (comma separated)')
        .option('--test-property <name>', 'Properties to test (comma separated)')
        .option('--generate-interface <name>', 'Interfaces to generate (comma separated)')
        .option('--disable-enum-initializers', "Don't include enum member initializers in the interface")
        .option('--native-bridge-path <name>', "Path to native bridge")
        .option('--api-version <version>', "API version for generated peers")
        .option('--dump-serialized', "Dump serialized data")
        .option('--call-log', "Call log")
        .option('--docs [all|opt|none]', 'How to handle documentation: include, optimize, or skip')
        .option('--language [ts|ts|cangjie|kotlin]', 'Output language')
        .option('--api-prefix <string>', 'Cpp prefix to be compatible with manual arkoala implementation')
        .option('--only-integrated', 'Generate only thoose files that can be integrated to target', false)
        .option('--version')
        .option('--generator-target <all|arkoala|libace|none>', 'Copy peers to arkoala or libace (use with --dts2peer)', "all")
        .option('--arkoala-destination <path>', 'Location of arkoala repository')
        .option('--libace-destination <path>', 'Location of libace repository')
        .option('--copy-peers-components <name...>', 'List of components to copy (omit to copy all)')
        .option('--tracker-status <file>', 'Tracker status file)')
        .option('--plugin <file>', 'File with generator\'s plugin')
        .option('--default-idl-package <name>', 'Name of the default package for generated IDL')
        .option('--no-commented-code', 'Do not generate commented code in modifiers')
        .option('--enable-log', 'Enable logging')
        .option('--options-file <path...>', 'Paths to generator configuration options file (appends to defaults). Use --ignore-default-config to override default options.')
        .option('--ignore-default-config', 'Use with --options-file to override default generator configuration options.', false)
        .option('--arkts-extension <string> [.ts|.ets]', "Generated ArkTS language files extension.", ".ts")
        .option('--interop-bridges <string>', "Generate interop bridges macros")
        .option('--use-memo-m3', "Generate code with m3 @memo annotations and functions with @ComponentBuilder", false)
        .option('--use-component-optional', 'Make all component\'s properties nullable')
        .option('--reference-names <string>', 'Provides reference mapping', path.resolve(__dirname, '..', 'generation-config', 'references', 'dts-sdk.refs.json'))
        .option('--no-type-checker', "Use TypeChecker or generate ArkTS specific syntax")
        .option('--no-implicit-predefined', "Removes predefined from the generator input")
    const options = command
        .parse(argv, { from: 'user' })
        .opts()


    let didJob = false

    if (options.showConfigSchema) {
        console.log(D.printJSONSchema(PeerGeneratorConfigurationSchema))
        didJob = true
    }

    if (options.interopBridges) {
        console.log(makeInteropBridges(options.interopBridges))
        didJob = true
    }

    let apiVersion = options.apiVersion ?? 9999
    Language.ARKTS.extension = options.arktsExtension as string

    setDefaultConfiguration(loadPeerConfiguration([
        ...(options.ignoreDefaultConfig ? [] : arkgenDefaultConfigurationPaths()),
        ...(options.optionsFile ?? [])
    ]))
    loadKnownReferences(path.resolve(options.referenceNames))

    if (process.env.npm_package_version && !options.showConfigSchema) {
        console.log(`IDLize version ${findVersion()}`)
    }

    if (options.idl2peer) {
        const outDir = options.outputDir ?? "./out"
        const language = Language.fromString(options.language ?? "ts")
        const { inputFiles, inputDirs } = formatInputPaths(options)

        const idlLibrary = new ArkoalaPeerLibrary(language, NativeModule.Interop, options.useMemoM3 && language === Language.ARKTS)
        const allInputFiles = scanInputDirs(inputDirs)
            .concat(inputFiles)
            .concat(libohosPredefinedFiles())
            .concat(options.implicitPredefined ? readLibrary("arkuiExtra") : [])
        const idlInputFiles = allInputFiles.filter(it => it.endsWith('.idl'))
        idlInputFiles.forEach(idlFilename => {
            idlFilename = path.resolve(idlFilename)
            const file = parseIDLFile(idlFilename)
            linearizeNamespaceMembers(file.entries).forEach(transformMethodsAsync2ReturnPromise)
            idlLibrary.files.push(file)
        })
        if (options.verifyIdl) {
            idlLibrary.files.forEach(file => {
                verifyIDLLinter(file, idlLibrary, peerGeneratorConfiguration().linter)
            })
        }
        idlLibrary.files.forEach(inplaceTransformOnSerializeFromConfig)
        idlLibrary.files.forEach(inplaceNullsAsUndefined)
        inplaceArkoalaGenerics(idlLibrary)
        fillSyntheticDeclarations(idlLibrary)
        idlLibrary.enableCache()
        new IdlPeerProcessor(idlLibrary).process()

        generateTarget(idlLibrary, outDir, language)

        didJob = true
    }

    if (options.dts2peer) {
        console.log('dts2peer usage is deprecated')
    }

    if (!didJob) {
        command.help()
    }

    function generateTarget(idlLibrary: ArkoalaPeerLibrary, outDir: string, lang: Language) {
        if (options.generatorTarget == "arkoala" || options.generatorTarget == "all") {
            generateArkoalaFromIdl({
                outDir: outDir,
                arkoalaDestination: options.arkoalaDestination,
                nativeBridgeFile: options.nativeBridgePath,
                apiVersion: apiVersion,
                verbose: options.verbose ?? false,
                onlyIntegrated: options.onlyIntegrated ?? false,
                dumpSerialized: options.dumpSerialized ?? false,
                callLog: options.callLog ?? false,
                lang: lang,
                useTypeChecker: options.typeChecker ?? true,
            }, idlLibrary)
        }
        if (options.generatorTarget == "libace" ||
            options.generatorTarget == "all") {
            generateLibaceFromIdl({
                outDir: outDir,
                libaceDestination: options.libaceDestination,
                apiVersion: apiVersion,
                commentedCode: options.commentedCode,
            }, idlLibrary)
        }
        if (options.generatorTarget == "tracker") {
            generateTracker(outDir, idlLibrary, options.trackerStatus, options.verbose)
        }
        if (options.plugin) {
            loadPlugin(options.plugin)
                .then(plugin => plugin.process({outDir: outDir}, idlLibrary))
                .then(result => {
                    console.log(`Plugin ${options.plugin} process returned ${result}`)
                })
                .catch(error => console.error(`Plugin ${options.plugin} not found: ${error}`))
        }
    }
}

function inplaceArkoalaGenerics(library: PeerLibrary): void {
    library.files.forEach(file => inplaceGenerics(file, library, { ignore: [
        ignoreComponentRule,
    ]}))
}

function ignoreComponentRule(node: IDLNode): boolean {
    return hasExtAttribute(node, IDLExtendedAttributes.Component) || hasExtAttribute(node, IDLExtendedAttributes.ComponentInterface)
}
