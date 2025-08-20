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
import { ADDITIONAL_CONFIG_DIR, AppOptions, BASIC_CONFIG_PATH, OUT_DIR, SUMMARY_PATH } from "./shared";
import { dirname, join, relative } from "node:path";

interface SummaryResultRecord {
    fileName: string
    packageName: string
}

interface SummaryResult {
    module: SummaryResultRecord[]
    external: SummaryResultRecord[]
    externalNames: string[]
}

export function solve(root: string, library: IDLFile[], targets: string[], options:AppOptions) {
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
        if (targets.some(t => packageName?.startsWith(t))) {
            result.module.push(record)
        } else {
            result.externalNames.push(record.fileName)
            result.external.push(record)
        }
    }

    writeFileSync(SUMMARY_PATH, JSON.stringify(result, null, 4), 'utf-8')

    ///////

    const generatorConfig: any = {}
    generatorConfig.moduleName = "arkui"
    generatorConfig.modules = {}

    generatorConfig.modules['arkui'] = {
        name: 'arkui',
        packages: result.module.map(r => r.packageName)
    }
    result.external.forEach(record => {
        if (record.packageName === '') {
            return
        }
        generatorConfig.modules[record.packageName] = {
            name: record.packageName,
            external: true,
            packages: [record.packageName]
        }
    })

    writeFileSync(BASIC_CONFIG_PATH, JSON.stringify(generatorConfig, null, 2), 'utf-8')

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

    let additionalStartScript = ''
    result.external.forEach(record => {
        if (record.packageName === '') {
            return
        }
        additionalStartScript += 'node ../../ohosgen \\\n'
        additionalStartScript += '  --idl2peer \\\n'
        additionalStartScript += '  --language arkts \\\n'
        additionalStartScript += `  --options-file ../../arkgen/generation-config/config.json,./main-config.json,./configs/${record.packageName}-config.json \\\n`
        additionalStartScript += `  --output-dir ${join(OUT_DIR, 'modules', record.packageName)} \\\n`
        additionalStartScript += `  --input-dir ${join(OUT_DIR, 'idl')}\n`
        additionalStartScript += '\n'
    })

    writeFileSync(join(OUT_DIR, 'go-additional.sh'), additionalStartScript, 'utf-8')
}

function findRootFiles(library: IDLFile[], targets: string[], options:AppOptions) {
    return library.filter(file => {
        const clause = file.packageClause.join('.')
        return targets.some(target => clause.startsWith(target))
            && !options.exclude.some(exclude => clause.startsWith(exclude))
    })
}