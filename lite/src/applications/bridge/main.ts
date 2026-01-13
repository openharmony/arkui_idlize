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

import { createAlgotithmicReferenceResolver, createEmptyReferenceResolver, IndentedPrinter, Language, NativeModuleType, parseIDLFile, PeerLibrary, TSLanguageWriter, TSTypeNameConvertor } from "@idlizer/core"
import { basename, dirname, join, relative, resolve } from "node:path"
import * as idl from "@idlizer/core/idl"
import { LWDeclaration, LWKind, processNPrintArkTS, processNPrintCXX, processNPrintTS } from "@idlizer/ost"
import { lowLevelLike, moduleLike, topSortDeclarations, forkWith, getArgs, getEnv, getIO, CURRENT_LOG_LEVEL, logger, terminate, TerminateError, makeDeclaration, ContinueWithGenerationError } from "@idlizer/kit"
import * as toml from "toml"

import { Config, ConfigBundle, ConfigSchema, InputConfigType } from "./config"
import { EssentialsGenerators, NotRegisteredTypeError } from "./generator/generator"
import { createInteropGenerator } from "./generator/builder"
import { InputLibrary } from "./library"
import { colorLibrary } from "./color"
import { installTemplate } from "./commands/init"

import { handleInstanceMethodPlacement, createNativeInstanceTypeProducer } from "./presets/vanilla/vanillaClass"
import { createStructureProducer } from "./presets/vanilla/vanillaStruct"
import { createIntegralTypeProducer } from "./presets/vanilla/vanillaIntegral"
import { createCStyleStringProducer } from "./presets/vanilla/vanillaCStyleString"
import { createVanillaCallbackProducer } from "./presets/vanilla/vanillaCallback"
import { createOHStringProducer } from "./presets/ohos/ohosString"
import { koalaInteropBridge, produceKoalaTwinFunction } from "./presets/ohos/koalaBridgeShape"
import { createNothingProducer } from "./presets/empty"
import { createOhosMaterializedProducer, handleOHMethodPlacement } from "./presets/ohos/ohosMaterialized"
import { createOhosBufferProducer } from "./presets/ohos/ohosBuffer"
import { createOhosCallbackProducer } from "./presets/ohos/ohosCallback"
import { createOhosEnum } from "./presets/ohos/ohosEnum"
import { producesVanillaTwinFunctions, produceVanillaBridges } from "./presets/vanilla/vanillaBridgeShape"
import { createOhosStructureProducer } from "./presets/ohos/ohosStructure"
import { makeApiCall } from "./presets/vanilla/vanillaApiShape"
import * as names from "./generator/names"
import { NotTransferrableType } from "./generator/common"
import { createOhosIntegralTypeProducer } from "./presets/ohos/ohosIntegral"
import { getApiProducer, makeKoalaApiCall } from "./presets/ohos/koalaApiShape"

const io = getIO()

function prepare(files: idl.IDLFile[], options: Config): InputLibrary {

    // created index
    const index = new Map<string, idl.IDLEntry>()
    idl.linearizeNamespaceMembers(files.flatMap(file => file.entries)).forEach(entry => {
        if (idl.isImport(entry)) {
            return
        }
        if (idl.isInterface(entry)) {
            entry.methods.forEach(method => {
                index.set(idl.getFQName(method), method)
            })
        }
        index.set(idl.getFQName(entry), entry)
    })

    // made everything fq
    const resolver = createAlgotithmicReferenceResolver(files, true)
    files.forEach(file => {
        idl.forEachChild(file, (node) => {
            if (idl.isReferenceType(node)) {
                const decl = resolver.resolveTypeReference(node)
                if (decl) {
                    node.name = idl.getFQName(decl)
                }
            }
        })
    })

    return {
        files,
        index,
        noHeader: !options.originalConfig.library.header,
        noApiReceiver: options.originalConfig.library.no_api_receiver,
    }
}

interface GenerationFilesInfo {
    projectGeneratedRoot: string
    projectGeneratedSource: string
    projectGeneratedTarget: string
}

export async function prepareGenerationFiles(rootDir: string, target: ConfigBundle['target']): Promise<GenerationFilesInfo> {
    const projectGeneratedRoot = join(rootDir, '.connect.cache', 'generated', target)
    if (await io.exists(projectGeneratedRoot)) {
        await io.rm(projectGeneratedRoot, { recursive: true })
    }
    await io.mkdir(projectGeneratedRoot, { recursive: true })
    const projectGeneratedSource = join(projectGeneratedRoot, 'source')
    const projectGeneratedTarget = join(projectGeneratedRoot, 'target')
    await io.mkdir(projectGeneratedSource, { recursive: true })
    await io.mkdir(projectGeneratedTarget, { recursive: true })

    return {
        projectGeneratedRoot,
        projectGeneratedSource,
        projectGeneratedTarget,
    }
}

const KNOWN_CONFIG_NAMES = [
    'connect.toml',
    '.idlizer.lite.toml'
]

async function readProjectConfig(cwd: string): Promise<[string, InputConfigType]> {
    let tried: string[] = []
    for (const configName of KNOWN_CONFIG_NAMES) {
        const configPath = join(cwd, configName)
        if (await io.exists(configPath)) {
            tried.push(configPath)
            return [
                configPath,
                ConfigSchema.validate(toml.parse(await io.readFile(configPath))).unwrap()
            ]
        }
    }
    let message = 'CONFIG WAS NOT FOUND!\n'
    tried.forEach(triedPath => {
        message += '.. '
        message += triedPath
        message += '\n'
    })
    terminate(message)
}

async function loadProjectConfig(cwd: string): Promise<Config> {
    const [originalConfigPath, originalConfig] = await readProjectConfig(cwd)
    const originalConfigDirname = dirname(originalConfigPath)
    const projectRoot = cwd

    originalConfig.bundle.forEach(bundle => {
        if (bundle.runtime) {
            if (bundle.runtime.node) {
                bundle.runtime.node = resolve(originalConfigDirname, bundle.runtime.node)
            }
            if (bundle.runtime.panda) {
                bundle.runtime.panda.api = resolve(originalConfigDirname, bundle.runtime.panda.api)
                bundle.runtime.panda.binary = resolve(originalConfigDirname, bundle.runtime.panda.binary)
            }
            bundle.runtime.headers = resolve(originalConfigDirname, bundle.runtime.headers)
            bundle.runtime.native = resolve(originalConfigDirname, bundle.runtime.native)
        }
    })
    originalConfig.library.path = resolve(originalConfigDirname, originalConfig.library.path)
    if (originalConfig.library.include_directory) {
        for (let i = 0; i < originalConfig.library.include_directory.length; ++i) {
            originalConfig.library.include_directory[i] = resolve(originalConfigDirname, originalConfig.library.include_directory[i])
        }
    }

    return {
        originalConfig,
        paths: {
            originalConfigPath,
            projectRoot,
            projectDeclarationRoot: resolve(originalConfigDirname, originalConfig.declaration.root),
        }
    }
}

async function loadProject(config: Config) {
    const idlFiles = new Set<string>()
    const scanned = await io.scan(config.paths.projectDeclarationRoot)
    scanned.forEach(file => {
        idlFiles.add(file)
    })

    const files = Array.from(idlFiles).map(name => parseIDLFile(name))
    const library = prepare(files, config)
    const startEntires = files.flatMap(file => {
        return idl.linearizeNamespaceMembers(file.entries)
            .flatMap(entry => idl.isInterface(entry) ? [entry, ...entry.methods] : [entry])
            .filter(entry => idl.isMethod(entry))
            .map(entry => entry as idl.IDLMethod)
    })

    return {
        files,
        library,
        startEntires,
    }
}

async function main() {
    const args = getArgs()
    const cwd = resolve(process.cwd())

    if (args[2] === 'init') {
        const installPath = join(cwd, '.idlizer.lite.toml')
        if (await io.exists(installPath)) {
            logger.info("Already initialized")
            return
        }
        const directoryName = basename(cwd)
        installTemplate(
            'init-config.template.toml',
            installPath,
            new Map([
                ['PROJECT_NAME', directoryName]
            ])
        )
        return
    }

    logger.info("Staring")

    const projectConfig = await loadProjectConfig(cwd)

    const { files, library: inputLibrary, startEntires } = await loadProject(projectConfig)
    const library = colorLibrary(inputLibrary)

    for (const bundleInfo of projectConfig.originalConfig.bundle) {

        logger.info(`Found bundle "${bundleInfo.target}"`)
        logger.group(l => {
            l.debug('Bundle name:', bundleInfo.name ?? projectConfig.originalConfig.name ?? '')
            l.debug('Bundle target:', bundleInfo.target)
        })

        ////////////////////////////////////

        const vanillaCodeGenerators: EssentialsGenerators = {
            twinProducer: producesVanillaTwinFunctions,
            bridgeProducer: produceVanillaBridges(bundleInfo.target),
            apiCallProducer: bundleInfo.flavours.includes('VanillaCXXClasses')
                ? makeApiCall('classesInstances')
                : makeApiCall('freeFunctions')
        }
        const ohosCodeGenerators: EssentialsGenerators = {
            twinProducer: produceKoalaTwinFunction,
            bridgeProducer: koalaInteropBridge,
            apiCallProducer: makeKoalaApiCall()
        }

        const coreGenerators: EssentialsGenerators =
            bundleInfo.flavours.includes("KoalaInteropBridge")
                ? ohosCodeGenerators
                : vanillaCodeGenerators

        const generator = createInteropGenerator(
            startEntires,
            coreGenerators,
            {
                library, projectConfig,
                flavours: bundleInfo.flavours
            }
        )

        if (bundleInfo.flavours.includes("KoalaInteropBridge")) {
            generator.addDeclarationProducer(getApiProducer)
        }
        generator.either(() => createIntegralTypeProducer(library), [
            ['OHIntegrals', () => createOhosIntegralTypeProducer(library)],
        ])
        generator.either(() => createStructureProducer(library), [
            ['OHStructure', () => createOhosStructureProducer(library)]
        ])

        generator.either(() => createCStyleStringProducer(library), [
            ['OHString', () => createOHStringProducer(library)]
        ])
        generator.either(() => createNothingProducer<idl.IDLInterface>(library), [
            ['VanillaInstances', () => createNativeInstanceTypeProducer(library, bundleInfo.flavours.includes('VanillaCXXClasses'))],
            ['OHMaterialized', () => createOhosMaterializedProducer(library)],
        ])
        generator.either(() => createNothingProducer<idl.IDLCallback>(library), [
            ['VanillaCallbacks', () => createVanillaCallbackProducer(library)],
            ['OHCallback', () => createOhosCallbackProducer(library)],
        ])
        generator.when('OHBuffer', () => createOhosBufferProducer(library))
        generator.when('OHEnum', () => createOhosEnum(library))

        if (bundleInfo.flavours.includes("VanillaInstances")) {
            generator.overridePeerProducer(handleInstanceMethodPlacement)
        }
        if (bundleInfo.flavours.includes("OHMaterialized")) {
            generator.overridePeerProducer(handleOHMethodPlacement)
        }

        logger.info("Generating")
        const { wrapper, host, nativeModuleName } = generator.build().generate(bundleInfo.target, bundleInfo.name ?? projectConfig.originalConfig.name)

        ////////////////////////////////////

        const generationFolder = await prepareGenerationFiles(projectConfig.paths.projectRoot, bundleInfo.target)

        ////////////////////////////////////

        /* MANAGED */
        const managedDeclarations = moduleLike.postprocess(wrapper)
        const managedModules = moduleLike.formFiles(
            new Set(files.map(file => file.packageClause.join('.')).concat(['framework.nativeModule', 'framework.engine'])),
            managedDeclarations,
            {
                knownReference: new Map([
                    [names.IDLIZER_RAW_MEMORY, 'idlizer.runtime.native'],
                    [names.IDLIZER_SERIALIZER_BASE, 'idlizer.runtime.native'],
                    [names.IDLIZER_DESERIALIZER_BASE, 'idlizer.runtime.native'],
                    [names.IDLIZER_RESOURCE_MANAGER, 'idlizer.runtime'],

                    [names.KOALAUI_SERIALIZER_BASE, 'koalaui.interop'],
                    [names.KOALAUI_DESERIALIZER_BASE, 'koalaui.interop'],
                    [names.KOALAUI_MATERIALIZED_BASE, 'koalaui.interop'],
                    [names.KOALAUI_RESOURCE_HOLDER, 'koalaui.interop'],
                    [names.KOALAUI_FINALIZABLE, 'koalaui.interop'],
                    [names.KOALAUI_TO_PEER_PTR, 'koalaui.interop'],

                    [names.KOALAUI_KBOOLEAN, 'koalaui.interop'],
                    [names.KOALAUI_KUINT8, 'koalaui.interop'],
                    [names.KOALAUI_KINT32, 'koalaui.interop'],
                    [names.KOALAUI_KUINT64, 'koalaui.interop'],
                    [names.KOALAUI_KPOINTER, 'koalaui.interop'],
                    [names.KOALAUI_KRETURN_BUFFER, 'koalaui.interop'],
                ]),
                knownImports: bundleInfo.target === 'node'
                    ? new Map([
                        ['idlizer.runtime', '@idlizer/runtime'],
                        ['idlizer.runtime.native', '@idlizer/runtime'],
                        ['koalaui.interop', '@koalaui/interop']
                    ])
                    : new Map([
                        ['idlizer.runtime', '^idlizer.runtime'],
                        ['idlizer.runtime.native', '^idlizer.runtime.native'],
                        ['koalaui.runtime', '@koalaui/interop'],
                    ])
            }
        )
        const printedFiles: string[] = []
        const awaitWriteFiles: Promise<unknown>[] = []
        await io.mkdir(join(generationFolder.projectGeneratedSource, 'api'), { recursive: true })
        managedModules.forEach((module, moduleName) => {
            let ext = ''
            if (bundleInfo.target === 'node') {
                ext = moduleName === 'framework.nativeModule' ? '.d.ts' : '.ts'
            }
            if (bundleInfo.target === 'panda') {
                ext = '.ets'
            }
            const fileName = moduleName + ext
            const importPrinter = new TSLanguageWriter(new IndentedPrinter(), createEmptyReferenceResolver(), new TSTypeNameConvertor(new PeerLibrary(Language.TS, new NativeModuleType('__'))))
            module.moduleLikeImports.print(importPrinter, moduleName);
            let text = importPrinter.getOutput().join('\n')
            text += '\n'
            module.body.forEach(declaration => {
                if (bundleInfo.target === 'node') {
                    text += processNPrintTS(declaration, moduleName, new Set()) + '\n'
                }
                if (bundleInfo.target === 'panda') {
                    text += processNPrintArkTS(declaration, moduleName, new Set()) + '\n'
                }
            })
            awaitWriteFiles.push(io.writeFile(join(generationFolder.projectGeneratedSource, fileName), text))
            if (bundleInfo.target === 'panda' && moduleName !== 'framework.nativeModule') {
                const foundNames = new Set<string>()
                let declarationText = ''
                declarationText += '\n'
                module.body.forEach(declaration => {
                    declarationText += processNPrintArkTS(makeDeclaration(declaration, foundNames), moduleName, new Set()) + '\n'
                })
                const censoredImportPrinter = new TSLanguageWriter(new IndentedPrinter(), createEmptyReferenceResolver(), new TSTypeNameConvertor(new PeerLibrary(Language.TS, new NativeModuleType('__'))))
                const censoredImports = module.moduleLikeImports.censor(record => !foundNames.has(record.name))
                censoredImports.print(censoredImportPrinter, moduleName);
                declarationText = censoredImportPrinter.getOutput().join('\n') + '\n' + declarationText

                awaitWriteFiles.push(io.writeFile(join(generationFolder.projectGeneratedSource, 'api', moduleName + '.d.ets'), declarationText))
            }
            if (moduleName !== 'framework.nativeModule') {
                printedFiles.push(moduleName)
            }
        })
        await Promise.all(awaitWriteFiles)
        let indexName = ''
        if (bundleInfo.target === 'node') {
            indexName = 'index.ts'
        }
        if (bundleInfo.target === 'panda') {
            indexName = 'index.ets'
        }
        await io.writeFile(join(generationFolder.projectGeneratedSource, indexName), printedFiles.map(f => `export * from './${f}'`).join('\n'))

        /* NATIVE */
        const nativeDeclarations = lowLevelLike.postprocess(host)

        let capi: LWDeclaration[] = []
        let other: LWDeclaration[] = []

        nativeDeclarations.forEach((file, fileName) => {
            if (fileName === 'capi') {
                capi.push(...file)
            } else {
                other.push(...file)
            }
        })

        const capiForward: LWDeclaration[] = []
        const capiOther: LWDeclaration[] = []
        capi.forEach(decl => {
            if (decl.kind === LWKind.TypedefDeclaration) {
                capiForward.push(decl)
            } else {
                capiOther.push(decl)
            }
        })

        capi = capiForward.concat(topSortDeclarations(capiOther))
        other = topSortDeclarations(other)

        if (bundleInfo.flavours.includes("KoalaInteropBridge")) {
            other.forEach(decl => {
                if (decl.kind !== LWKind.TopLevelExpression) {
                    return
                }
                if (decl.expression.kind !== LWKind.CallExpression) {
                    return
                }
                const fstArg = decl.expression.args[0]
                if (fstArg.kind !== LWKind.VariableExpression) {
                    return
                }
                fstArg.name = fstArg.name.substring(5)
            })
        }

        let bridgeText = ''
        if (bundleInfo.flavours.includes('KoalaInteropBridge')) {
            bridgeText += '#include "api.h"\n'
            bridgeText += '#include <koala-types.h>\n'
            bridgeText += '#include <SerializerBase.h>\n'
            bridgeText += '#include <DeserializerBase.h>\n'
            bridgeText += `#define KOALA_INTEROP_MODULE ${nativeModuleName.split('.').at(-1)!}\n`
            bridgeText += '#include <common-interop.h>\n'
        } else {
            bridgeText += '#include <types.h>\n'
            bridgeText += '#include "api.h"\n'
            if (projectConfig.originalConfig.library.header) {
                bridgeText += `#include <${projectConfig.originalConfig.library.header}>\n`
            }
            if (bundleInfo.runtime?.headers) {
                bridgeText += '#include <idlizer/runtime.h>\n'
            }
            bridgeText += '#include <platform.h>\n'
        }
        bridgeText += processNPrintCXX(other)

        let cApiText = ''
        cApiText += '#pragma once\n'
        if (bundleInfo.flavours.includes('KoalaInteropBridge')) {
            cApiText += '#include <interop-types.h>\n'
        } else {
            cApiText += '#include <types.h>\n'
        }
        cApiText += processNPrintCXX(capi)

        await io.writeFile(join(generationFolder.projectGeneratedTarget, 'api.h'), cApiText)
        await io.writeFile(join(generationFolder.projectGeneratedTarget, 'bridge.cc'), bridgeText)


        ////////////////////////////////////

        if (bundleInfo.target === 'node') {
            await buildNode(generationFolder, bundleInfo, projectConfig)
        }
        if (bundleInfo.target === 'panda') {
            await buildAni(nativeModuleName, generationFolder, bundleInfo, projectConfig)
        }
    }
}

///

async function buildAni(nativeModuleName: string, generationFolder: GenerationFilesInfo, bundleInfo: ConfigBundle, projectConfig: Config) {

    logger.info(`Compiling`)

    const env = getEnv()
    if (!env.PANDA_SDK_PATH) {
        terminate("PANDA_SDK_PATH was not defined! Can not find arkts compiler!")
    }

    const arktsConfigPath = join(generationFolder.projectGeneratedRoot, 'arktsconfig.json')
    const files = await io.scan(generationFolder.projectGeneratedSource)
    const paths: any = {}
    if (bundleInfo.runtime?.panda) {
        paths["idlizer.runtime.native"] = [bundleInfo.runtime.panda.api]
    }
    await io.writeFile(arktsConfigPath, JSON.stringify({
        compilerOptions: {
            outDir: 'build/abc',
            baseUrl: 'source',
            paths,
        },
        include: files,
        exclude: [join(generationFolder.projectGeneratedSource, 'api', '**', '*.d.ets')]
    }))

    const compilerPath = resolve(env.PANDA_SDK_PATH, 'linux_host_tools', 'bin', 'es2panda')
    const stdlibPath = resolve(env.PANDA_SDK_PATH, 'ets', 'stdlib')
    const linkerPath = resolve(env.PANDA_SDK_PATH, 'linux_host_tools', 'bin', 'ark_link')
    const compilerCommand: string[] = []
    compilerCommand.push(compilerPath)
    compilerCommand.push('--stdlib ' + stdlibPath)
    compilerCommand.push('--extension ets')
    compilerCommand.push('--arktsconfig ' + arktsConfigPath)
    await io.exec(compilerCommand.join(' '), { cwd: generationFolder.projectGeneratedRoot })

    const buildDir = join(generationFolder.projectGeneratedRoot, 'build', 'abc', 'source')
    const buildFiles = await io.scan(buildDir)
    const libraryName = bundleInfo.name ?? projectConfig.originalConfig.name

    const buildResult = join(generationFolder.projectGeneratedRoot, 'dist')
    if (!await io.exists(buildResult)) {
        await io.mkdir(buildResult, { recursive: true })
    }
    const buildResultAbc = join(buildResult, libraryName + '.abc')

    await io.exec(`${linkerPath} --output ${buildResultAbc} -- ${buildFiles.join(' ')}`, { cwd: buildDir })

    logger.info(`Produce native library`)

    const includeDirs: (string | undefined)[] = [
        resolve(__dirname, '..', '..', 'essentials', 'third_party', 'panda'),
        resolve(__dirname, '..', '..', 'essentials'),
        bundleInfo.runtime?.headers,
    ]
    projectConfig.originalConfig.library.include_directory?.forEach(dir => {
        includeDirs.push(dir)
    })
    const libraryDirs: (string | undefined)[] = [
        projectConfig.originalConfig.library.path,
        bundleInfo.runtime?.native
    ]

    const gccCommand: string[] = []
    gccCommand.push('gcc')
    gccCommand.push('-DANI_INTEROP')
    gccCommand.push('-fPIC -fno-rtti -fno-exceptions -std=gnu++17')
    // gccCommand.push('-O3')
    includeDirs.forEach(dir => {
        if (dir) {
            gccCommand.push('-I' + dir)
        }
    })
    gccCommand.push(join(generationFolder.projectGeneratedTarget, 'bridge.cc'))
    gccCommand.push('-c')
    gccCommand.push(`-o bridge.o`)
    logger.debug('COMPILER COMMAND: ' + gccCommand.join(' '))
    await io.exec(gccCommand.join(' '), { cwd: generationFolder.projectGeneratedTarget })

    const ldCommand: string[] = []
    ldCommand.push('gcc')
    ldCommand.push('-rdynamic')
    libraryDirs.forEach(dir => {
        if (dir) {
            ldCommand.push('-L' + dir)
        }
    })
    ldCommand.push('-ldl')
    ldCommand.push('bridge.o')
    ldCommand.push(`-l${projectConfig.originalConfig.library.name}`)
    logger.debug(`Native? "${bundleInfo.runtime?.native}"`)
    if (bundleInfo.runtime?.native) {
        ldCommand.push('-lruntime')
    }
    ldCommand.push('-shared')
    const baseName = nativeModuleName.split('.').at(-1)!
    const buildNativeName = `lib${baseName}.so`
    ldCommand.push(`-o ${buildNativeName}`)
    logger.debug('LINKER COMMAND: ' + ldCommand.join(' '))
    await io.exec(ldCommand.join(' '), { cwd: generationFolder.projectGeneratedTarget })

    await io.cp(join(generationFolder.projectGeneratedTarget, buildNativeName), join(buildResult, buildNativeName))

    logger.info("Installing")
    const distFiles = await io.scan(buildResult)
    const apiDirectory = join(generationFolder.projectGeneratedSource, 'api')
    const apiFiles = await io.scan(apiDirectory)
    const resultBundleDir = bundleInfo.output_directory
    await io.mkdir(resultBundleDir, { recursive: true })
    const copyTasks: Promise<true>[] = []
    distFiles.forEach(file => {
        const rel = relative(buildResult, file)
        copyTasks.push(io.cp(file, resolve(resultBundleDir, rel)))
    })
    const resultApiDir = join(resultBundleDir, 'api')
    await io.mkdir(resultApiDir, { recursive: true })
    apiFiles.forEach(file => {
        const rel = relative(apiDirectory, file)
        copyTasks.push(io.cp(file, resolve(resultApiDir, rel)))
    })
    await Promise.all(copyTasks)
    await io.rm(buildResult, { recursive: true })
}

async function buildNode(generationFolder: GenerationFilesInfo, bundleInfo: ConfigBundle, projectConfig: Config) {
    const packageJsonConfig: any = {
        name: bundleInfo.name ?? projectConfig.originalConfig.name,
        version: bundleInfo.version ?? projectConfig.originalConfig.version,
        private: true,
        main: "dist/index.js",
        types: "dist/index.d.ts",
        devDependencies: {
            "@types/node": "24.9.1",
            "typescript": "5.9.3"
        }
    }
    if (bundleInfo.runtime) {
        packageJsonConfig['dependencies'] = {}
        packageJsonConfig['dependencies']['@idlizer/runtime'] = 'file:' + bundleInfo.runtime.node
    }
    await io.writeFile(
        join(generationFolder.projectGeneratedRoot, 'package.json'),
        JSON.stringify(packageJsonConfig, null, 4)
    )
    await io.writeFile(
        join(generationFolder.projectGeneratedRoot, 'tsconfig.json'),
        JSON.stringify({
            compilerOptions: {
                rootDir: "./source",
                outDir: "./dist",
                module: "commonjs",
                target: "es2020",
                lib: ["esnext"],
                types: ["node"],
                strict: true,
                declaration: true,
                isolatedModules: true,
                noUncheckedSideEffectImports: true,
                moduleDetection: "force",
                skipLibCheck: true,
            },
            include: ["./source/**/*.ts"],
        }, null, 4)
    )
    logger.info(`Install dependencies`)
    await io.exec('npm i', { cwd: generationFolder.projectGeneratedRoot })
    logger.info(`Compiling`)
    await io.exec('npx tsc', { cwd: generationFolder.projectGeneratedRoot })

    ///

    logger.info(`Produce native library`)
    const nativeSource = ['bridge.cc']
    const libraries: string[] = []
    if (bundleInfo.runtime?.native) {
        libraries.push("-lruntime")
    }
    libraries.push(`-l${projectConfig.originalConfig.library.name}`)
    await io.writeFile(
        join(generationFolder.projectGeneratedTarget, 'binding.gyp'),
        JSON.stringify({
            targets: [
                {
                    defines: ['NAPI_INTEROP', 'KOALA_USE_NODE_VM', 'KOALA_NAPI'],
                    target_name: "framework.nativeModule",
                    include_dirs: [
                        resolve(__dirname, '..', '..', 'essentials'),
                        ...(projectConfig.originalConfig.library.include_directory ?? []),
                        bundleInfo.runtime?.headers
                    ].filter(x => !!x),
                    sources: nativeSource,
                    library_dirs: [
                        projectConfig.originalConfig.library.path,
                        bundleInfo.runtime?.native
                    ].filter(x => !!x),
                    libraries,
                }
            ]
        })
    )
    await io.exec('node-gyp configure', { cwd: generationFolder.projectGeneratedTarget })
    await io.exec('node-gyp build', { cwd: generationFolder.projectGeneratedTarget, env: process.env })
    await io.cp(join(generationFolder.projectGeneratedTarget, 'build', 'Release', 'framework.nativeModule.node'), join(generationFolder.projectGeneratedRoot, 'dist', 'framework.nativeModule.node'))

    logger.info(`Install result`)
    const resultBundleDir = bundleInfo.output_directory
    await io.mkdir(resultBundleDir, { recursive: true })

    const distRoot = join(generationFolder.projectGeneratedRoot, 'dist')
    const scannedResults = await io.scan(join(generationFolder.projectGeneratedRoot, 'dist'))
    const scannedPromises = scannedResults.map(async file => {
        const rel = relative(distRoot, file)
        return io.cp(file, resolve(resultBundleDir, 'dist', rel))
    })
    await Promise.all(scannedPromises)
    await io.cp(join(generationFolder.projectGeneratedRoot, 'package.json'), join(resultBundleDir, 'package.json'))
    await io.rm(distRoot, { recursive: true })
}

///

const TERMINATE_USER_MESSAGE = `
Oh no!
Looks like the generator was terminated unexpectedly.
`

function reportError(error: unknown) {
    // order is important!
    if (error instanceof NotTransferrableType) {
        const direction = error.direction === 'fromManagedToNative'
            ? 'from managed to native'
            : 'from native to managed'
        logger.error(`Can not transfer ${direction} type "${idl.DebugUtils.debugPrintType(error.type)}"`)
        return
    }
    if (error instanceof NotRegisteredTypeError) {
        logger.error(`No type producer was registered for type "${idl.DebugUtils.debugPrintType(error.type)}"`)
        return
    }
    if (error instanceof ContinueWithGenerationError) {
        logger.error('----------------------------------------------')
        reportError(error.causedBy)
        logger.error('')
        logger.error('GENERATION CONTEXT:')
        logger.error(error.message)
        logger.error('----------------------------------------------')
        return
    }
    if (error instanceof TerminateError) {
        logger.error(error.message)
        return
    }
    // fallback, must be last option
    if (error instanceof Error) {
        logger.error(error.message)
        return
    }
}

function handleError(error: unknown) {
    logger.error(TERMINATE_USER_MESSAGE)
    process.exitCode = -1
    reportError(error)
    if (CURRENT_LOG_LEVEL === 'debug') {
        throw error
    }
}

forkWith(() => main().catch(handleError))
