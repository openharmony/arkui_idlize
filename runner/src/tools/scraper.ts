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

import { ConfigTypeInfer, D, Language, NativeModuleType, PeerLibrary, throwException, parseIDLFile, createAlgotithmicReferenceResolver } from "@idlizer/core";
import { createFile, createNamespace, DebugUtils, forEachChild, getFileFor, getFQName, IDLEntry, IDLFile, isImport, isNamespace, isReferenceType, toIDLString } from "@idlizer/core/idl";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, basename, resolve, sep } from "node:path";
import { scan } from "../utils";

export const ScraperConfigSchema = D.object({
    target: D.default(D.array(D.string()), []),
    exclude: D.default(D.array(D.string()), []),
    banned: D.default(D.array(D.string()), []),
    main: D.maybe(D.object({
        additionalPackages: D.default(D.array(D.string()), [])
    })),
    tsLikePackages: D.default(D.map(D.string(), D.string()), new Map<string, string>),
})
export type AppConfig =  ConfigTypeInfer<typeof ScraperConfigSchema>

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

export interface ScraperResult {
    scrapedIDLs: string,
    arkuiConfig: string,
}

function parseIDLDirectory(path: string): IDLFile[] {
    const input = scan(resolve(path))
    return input.flatMap(source => {
        try {
            return [parseIDLFile(source)]
        } catch (e) {
            console.error('skipped', source)
            return []
        }
    })
}

export function runScraper(root: string, extraPaths: string[], configPath:string):ScraperResult {

    /////////////////////////////////////////////////////////////
    // constants

    const OUT_DIR = resolve(process.cwd(), 'out')
    const SUMMARY_PATH = join(OUT_DIR, 'summary.json')
    const ADDITIONAL_CONFIG_DIR = join(OUT_DIR, 'configs')
    const BASIC_CONFIG_PATH = join(OUT_DIR, 'main-config.json')
    const BASIC_MODULES_CONFIG_PATH = join(OUT_DIR, 'main-modules-config.json')

    /////////////////////////////////////////////////////////////
    // prepare

    if (!existsSync(OUT_DIR)) {
        mkdirSync(OUT_DIR, { recursive: true })
    }
    if (!existsSync(ADDITIONAL_CONFIG_DIR)) {
        mkdirSync(ADDITIONAL_CONFIG_DIR, { recursive: true })
    }

    const text = readFileSync(configPath, 'utf-8')
    const content = JSON.parse(text)
    const options = ScraperConfigSchema.validate(content).unwrap()

    if (options.target.length === 0) {
        options.target.push('arkui.component')
    }

    /////////////////////////////////////////////////////////////
    // scan and startup

    const interfacesLibrary = extraPaths.flatMap(parseIDLDirectory)

    const library = parseIDLDirectory(root)

    /////////////////////////////////////////////////////////////
    // the algorithm

    const files = [...library, ...interfacesLibrary]
    const resolver = createAlgotithmicReferenceResolver(files)

    const roots = findRootFiles(library, options.target, options.exclude).concat(interfacesLibrary)
    const marked = new Set<string>()
    const fileNames = new Set<string>()

    const queue: IDLEntry[] = [...roots.flatMap(file => file.entries)]
    while (queue.length) {
        const entry = queue.shift()!
        if (isImport(entry)) {
            continue
        }
        const entryFQ = getFQName(entry)
        if (marked.has(entryFQ)) {
            continue
        }
        marked.add(entryFQ)
        if (isNamespace(entry)) {
            queue.push(...entry.members)
            continue
        }
        if (library.includes(getFileFor(entry)!))
            fileNames.add(getFileFor(entry)?.fileName ?? '<...>')
        forEachChild(entry, (node) => {
            if (isReferenceType(node)) {
                const resolved = resolver.resolveTypeReference(node, { terminalImports: true })
                if (resolved) {
                    queue.push(resolved)
                } else {
                    console.error('DEAD REFERENCE', DebugUtils.debugPrintType(node))
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
        } else if (options.target.some(t => RegExp(t).test(packageName))) {
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
    for (const [_, module] of Object.entries(modulesGeneratorConfig["modules"])) {
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
    startScript += '  --reference-names ../../arkgen/generation-config/references/ets-sdk.refs.json \\\n'
    startScript += '  --options-file main-config.json \\\n'
    startScript += `  --output-dir ${join(OUT_DIR, 'generated')} \\\n`
    startScript += `  --input-files $(find ${join(OUT_DIR, 'idl')} -type f | tr '\\n' ' ')\n`

    writeFileSync(join(OUT_DIR, 'go-main.sh'), startScript, 'utf-8')

    let additionalStartScript = `
rule ohosgen
    command = node ../../../../ohosgen --idl2peer --language arkts --input-files $$(find ${join(OUT_DIR, 'idl')} ../../../../interfaces/interfaces/arkui-extra -type f | tr '\\n' ' ') --output-dir $out --options-file ../../../../arkgen/generation-config/config.json ${BASIC_MODULES_CONFIG_PATH} $in
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

    // modules
    const arktsconfigBase: any = {
        "compilerOptions": {
            "baseUrl": "./generated/arkts",
            "outDir": "build/panda/out",
            "paths": {
                "@koalaui/interop": ["../../../../../../../../external/interop/src/arkts"],
                "@koalaui/common": ["../../../../../../../../external/common/src"],
                "@koalaui/compat": ["../../../../../../../../external/compat/src/arkts"],
                "@koalaui/runtime": ["../../../../../../../../external/incremental/runtime/src"]
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

    return {
        scrapedIDLs: join(OUT_DIR, 'idl'),
        arkuiConfig: BASIC_CONFIG_PATH,
    }
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

function findRootFiles(library: IDLFile[], targets: string[], excludes: string[]) {
    const patterns = targets.map(target => RegExp(target))
    const excludePatterns = excludes.map(target => RegExp(target))
    return library.filter(file => {
        const clause = file.packageClause.join('.')
        return patterns.some(pattern => pattern.test(clause))
            && !excludePatterns.some(pattern => pattern.test(clause))
    })
}
