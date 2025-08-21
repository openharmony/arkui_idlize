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

import { Language, NativeModuleType, PeerLibrary, throwException } from "@idlizer/core";
import { createFile, createNamespace, forEachChild, getFileFor, getFQName, IDLEntry, IDLFile, isImport, isNamespace, isReferenceType, linearizeNamespaceMembers, toIDLString } from "@idlizer/core/idl";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { ADDITIONAL_CONFIG_DIR, AppConfig, BASIC_CONFIG_PATH, BASIC_MODULES_CONFIG_PATH, OUT_DIR, SUMMARY_PATH } from "./shared";
import { dirname, join, relative, basename, resolve, extname, sep } from "node:path";
import { scan } from "./utils";

interface SummaryResultRecord {
    fileName: string
    packageName: string
}

interface SummaryResult {
    module: SummaryResultRecord[]
    external: SummaryResultRecord[]
    others: SummaryResultRecord[]
    externalNames: string[]
}

export function solve(root: string, library: IDLFile[], targets: string[], options:AppConfig) {
    if (targets.length === 0) {
        console.log('No targets was provided')
        process.exitCode = -1
        return
    }

    const resolver = new PeerLibrary(Language.ARKTS, new NativeModuleType("___"), false)
    resolver.files.push(...library)

    const roots = findRootFiles(library, targets, options)
    const marked = new Set<string>()
    const fileNames = new Set<string>()

    const queue: IDLEntry[] = [...roots.flatMap(file => file.entries)]
    while (queue.length) {
        const entry = queue.shift()!
        const entryFQ = getFQName(entry)
        if (marked.has(entryFQ)) {
            continue
        }
        marked.add(entryFQ)
        if (isNamespace(entry)) {
            queue.push(...entry.members)
            continue
        }
        fileNames.add(getFileFor(entry)?.fileName ?? '<...>')
        forEachChild(entry, (node) => {
            if (isReferenceType(node)) {
                const resolved = resolver.resolveTypeReference(node, true)
                if (resolved) {
                    queue.push(resolved)
                } else {
                    console.error('DEAD REFERENCE', getFQName(node))
                }
            }
        })
    }

    const index = new Map<string, IDLFile>()
    library.forEach(file => {
        index.set(file.fileName ?? '<WHAT?>', file)
    })

    const result: SummaryResult = {
        module: [],
        external: [],
        others: [],
        externalNames: [],
    }

    const sortedNames = Array.from(fileNames).sort()
    for (const fileName of sortedNames) {
        const packageName = index.get(fileName)?.packageClause.join('.') ?? ''
        const strippedFileName = relative(root, fileName)
        const record: SummaryResultRecord = {
            fileName: strippedFileName,
            packageName,
        }
        if (options.banned.some(t => packageName.startsWith(t))) {
            result.others.push(record)
        } else if (targets.some(t => packageName?.startsWith(t))) {
            result.module.push(record)
        } else {
            result.externalNames.push(record.fileName)
            result.external.push(record)
        }
    }

    library.forEach(file => {
        if (!fileNames.has(file.fileName ?? '<<<<')) {
            result.others.push({
                fileName: file.fileName ?? '',
                packageName: file.packageClause.join('.') ?? '',
            })
        }
    })

    writeFileSync(SUMMARY_PATH, JSON.stringify(result, null, 4), 'utf-8')

    ///////

    const generatorConfig: any = {}
    generatorConfig.moduleName = "arkui"
    generatorConfig.modules = {}

    generatorConfig.modules['arkui'] = {
        name: 'arkui',
        packages: result.module.map(r => r.packageName)
    }
    if (options.main) {
        generatorConfig.modules['arkui'].packages.push(...options.main.additionalPackages)
    }
    result.external.forEach(record => {
        if (record.packageName === '') {
            return
        }
        generatorConfig.modules[record.packageName] = {
            name: record.packageName,
            external: true,
            packages: [record.packageName],
            tsLikePackage: findTsLikePackage(record, options)
        }
    })
    if (result.others.length) {
        generatorConfig.modules["$other"] = {
            name: "$other",
            external: true,
            packages: result.others.map(r => r.packageName)
        }
    }
    for (let [moduleName, tsLikePackage] of options.tsLikePackages) {
        if (!(moduleName in generatorConfig.modules))
            throw new Error(`Can not find module ${moduleName} to assign tsLikePackage`)
        generatorConfig.modules[moduleName].tsLikePackage = tsLikePackage
    }

    writeFileSync(BASIC_CONFIG_PATH, JSON.stringify(generatorConfig, null, 2), 'utf-8')

    const modulesGeneratorConfig = JSON.parse(JSON.stringify(generatorConfig))
    for (let [moduleName, module] of Object.entries(modulesGeneratorConfig["modules"])) {
        (module as any)["external"] = false
    }
    writeFileSync(BASIC_MODULES_CONFIG_PATH, JSON.stringify(modulesGeneratorConfig, null, 2), 'utf-8')

    result.external.forEach(record => {
        if (record.packageName === '') {
            return
        }
        const configName = join(ADDITIONAL_CONFIG_DIR, record.packageName + '-config.json')
        writeFileSync(
            configName,
            JSON.stringify({
                TypePrefix: "OH_",
                moduleName: record.packageName,
                currentModuleExportedPackages: [
                    record.packageName
                ]
            }, null, 2),
            'utf-8'
        )
    })

    ///////

    const newLibrary: IDLFile[] = []
    library.forEach(file => {
        if (!fileNames.has(file.fileName ?? throwException("Why?"))) {
            return
        }

        function selectEntries(oldEntries: IDLEntry[]) {
            const newEntries: IDLEntry[] = []
            oldEntries.forEach(entry => {
                if (isImport(entry)) {
                    newEntries.push(entry)
                    return
                }
                if (isNamespace(entry)) {
                    const inner = selectEntries(entry.members)
                    if (inner.length) {
                        newEntries.push(createNamespace(
                            entry.name,
                            inner,
                            {
                                documentation: entry.documentation,
                                extendedAttributes: entry.extendedAttributes?.slice(),
                                fileName: entry.fileName,
                                nameLocation: entry.nameLocation,
                                nodeLocation: entry.nodeLocation,
                                valueLocation: entry.valueLocation
                            }
                        ))
                    }
                    return
                }

                const entryFQ = getFQName(entry)
                if (marked.has(entryFQ)) {
                    newEntries.push(entry)
                }
            })
            return newEntries
        }
        const newEntries = selectEntries(file.entries)
        newLibrary.push(
            createFile(
                newEntries,
                file.fileName,
                file.packageClause,
                {
                    documentation: file.documentation,
                    extendedAttributes: file.extendedAttributes?.slice(),
                    fileName: file.fileName,
                }
            )
        )
    })

    newLibrary.forEach(file => {
        const relativePath = relative(root, file.fileName ?? throwException('why???'))
        const absolutePath = join(OUT_DIR, 'idl', relativePath)
        const absoluteDirName = dirname(absolutePath)
        if (!existsSync(absoluteDirName)) {
            mkdirSync(absoluteDirName, { recursive: true })
        }
        writeFileSync(absolutePath, toIDLString(file, {}), 'utf-8')
    })

    ///////

    let startScript = ''
    startScript += 'cd "$(dirname "$0")"\n\n'
    startScript += 'node ../../arkgen \\\n'
    startScript += '  --idl2peer \\\n'
    startScript += '  --arkts-extension .ets \\\n'
    startScript += '  --use-memo-m3 \\\n'
    startScript += '  --language arkts \\\n'
    startScript += '  --no-type-checker \\\n'
    startScript += '  --reference-names ../../arkgen/generation-config/references/ets-sdk.refs.json \\\n'
    startScript += '  --options-file main-config.json \\\n'
    startScript += `  --output-dir ${join(OUT_DIR, 'generated')} \\\n`
    startScript += `  --input-files $(find ${join(OUT_DIR, 'idl')} -type f | tr '\\n' ' ')\n`

    writeFileSync(join(OUT_DIR, 'go-main.sh'), startScript, 'utf-8')

    let additionalStartScript = `
rule ohosgen
    command = node ../../ohosgen --idl2peer --language arkts --input-files $$(find ${join(OUT_DIR, 'idl')} -type f | tr '\\n' ' ') --output-dir $out --options-file ../../arkgen/generation-config/config.json,${BASIC_MODULES_CONFIG_PATH},$in
    description = "Generate $in"

`
    result.external.forEach(record => {
        if (record.packageName === '') {
            return
        }
        additionalStartScript += `build ${join(OUT_DIR, 'modules', record.packageName)}: ohosgen ./configs/${record.packageName}-config.json\n`
        additionalStartScript += `build ${record.packageName}: phony ${join(OUT_DIR, 'modules', record.packageName)}\n`
        additionalStartScript += `\n`
    })

    writeFileSync(join(OUT_DIR, 'go-additional.build.ninja'), additionalStartScript, 'utf-8')

    ///////

    // arkui
    const arkuiGeneratedDir = join(OUT_DIR, 'generated')
    const arkuiGeneratedPath = (...chunks:string[]) => join(arkuiGeneratedDir, 'sig', 'arkoala-arkts', 'arkui', 'generated', ...chunks)
    const externalDir = resolve(process.cwd(), '..', 'external')
    const externalPath = (...chunks:string[]) => join(externalDir, ...chunks)
    const arkuiConfig: any = {
        compilerOptions: {
            package: "idlize.test",
            baseUrl: arkuiGeneratedPath(),
            outDir:  join(arkuiGeneratedDir, 'abc'),
            paths: {
                "#components": ["./framework/arkts"],
                "#handwritten": ["./handwritten"],
                "@arkoala/arkui": ["./framework"],
                "@koalaui/builderLambda": ["./annotations"],
                "@koalaui/interop": [externalPath("interop", "src", "arkts")],
                "@koalaui/common": [externalPath("incremental", "common", "src")],
                "@koalaui/compat": [externalPath("incremental", "compat", "src", "arkts")],
                "@koalaui/runtime": [externalPath("incremental", "runtime", "src")],
                "@koalaui/runtime/annotations": [externalPath("incremental", "runtime", "annotations")],
            }
        },
        include: [
            relative(OUT_DIR, arkuiGeneratedPath('**', '*.ets'))
        ],
    }
    // const SDK_DIR = resolve('..', 'sdk-patched-arkts', 'api')
    // result.external.forEach(record => {
    //     if (record.packageName === '') {
    //         return
    //     }
    //     const idlFileName = record.fileName
    //     const pureFilePath = join(dirname(idlFileName), basename(idlFileName, extname(idlFileName)))
    //     const frontendFilePath = join(SDK_DIR, pureFilePath)
    //     arkuiConfig.compilerOptions.paths[findTsLikePackage(record, options)] = [frontendFilePath + '.d.ets']
    // })
    scanAbsolutePathDir().forEach(([packageName, fileName]) => {
        let value = [fileName]
        if (options.rewriteArkConfigPath.has(packageName)) {
            value = options.rewriteArkConfigPath.get(packageName)!
        }
        arkuiConfig.compilerOptions.paths[packageName] = value
    })

    writeFileSync(
        join(OUT_DIR, 'ui2abcconfig.json'),
        JSON.stringify(arkuiConfig, null, 2),
        'utf-8'
    )

    // modules
    const arktsconfigBase: any = {
        "compilerOptions": {
            "baseUrl": "./generated/arkts",
            "outDir": "build/panda/out",
            "paths": {
                "@koalaui/interop": ["../../../../../../external/interop/src/arkts"],
                "@koalaui/common": ["../../../../../../external/incremental/common/src"],
                "@koalaui/compat": ["../../../../../../external/incremental/compat/src/arkts"],
                "@koalaui/runtime": ["../../../../../../external/incremental/runtime/src"]
            }
        },
        "include": ["generated/arkts/**/*.ts"]
    }
    for (const record of result.external) {
        if (record.packageName === "") {
            continue
        }
        const tsLikePackage = findTsLikePackage(record, options)
        arktsconfigBase["compilerOptions"]["paths"][tsLikePackage] = [join(OUT_DIR, 'modules', record.packageName, "generated", "arkts")]
    }
    result.external.forEach(record => {
        const arktsconfig = JSON.parse(JSON.stringify(arktsconfigBase))
        arktsconfig["compilerOptions"]["package"] = findTsLikePackage(record, options).split(".").slice(0, -1).join(".")
        const configPath = join(OUT_DIR, 'modules', record.packageName, 'arktsconfig.json')
        const configPathDir = dirname(configPath)
        if (!existsSync(configPathDir)) {
            mkdirSync(configPathDir, { recursive: true })
        }
        writeFileSync(
            configPath,
            JSON.stringify(arktsconfig, undefined, 4),
            'utf-8'
        )
    })
}

function findTsLikePackage(record: SummaryResultRecord, options: AppConfig): string {
    if (options.tsLikePackages.has(record.packageName)) {
        return options.tsLikePackages.get(record.packageName)!
    }
    let tsLikePackage = record.packageName
    if (basename(record.fileName).startsWith("@")) {
        tsLikePackage = "@" + tsLikePackage
    }
    return tsLikePackage
}

function findRootFiles(library: IDLFile[], targets: string[], options:AppConfig) {
    return library.filter(file => {
        const clause = file.packageClause.join('.')
        return targets.some(target => clause.startsWith(target))
            && !options.exclude.some(exclude => clause.startsWith(exclude))
    })
}

const ABSOLUTE_PATH_DIR = resolve('..', 'absolute-sdk-patched-arkts', 'api')
function scanAbsolutePathDir() {
    const fileNames = scan(ABSOLUTE_PATH_DIR)
    return fileNames.map((fileName): [string, string] => {
        const packageName = relative(ABSOLUTE_PATH_DIR, fileName)
            .replaceAll('.d.ets', '')
            .split(sep)
            .filter(p => p)
            .join('.')

        const fixedFileName = fileName.replaceAll('.d.ets', '')

        return [packageName, fixedFileName]
    })
}