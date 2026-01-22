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

import { ConfigSchema, createAlgotithmicReferenceResolver, DiagnosticMessageGroup, DiagnosticResults, forEachChild, getFQName, IDLEntry, IDLFile, IDLReferenceType, IDLType, isImport, isReferenceType, isTypedef, linearizeNamespaceMembers, outputDiagnosticResultsFormatted, parseIDLFile, setFormatterLogger } from "@idlizer/core"
import { terminate, TerminateError } from "./cli/error"
import { forkWith, getIO, RealWorld } from "./cli/application"
import { CURRENT_LOG_LEVEL, logger } from "./cli/logger"
import { text } from "./text"
import { EOL } from "node:os"
import { dirname } from "node:path"

export interface LoadedConfig<T> {
    data: T
    path: string
}

export interface IdlizerAppDescription {
    name: string
    version: string
    commit?: string
    reportError?: (error: unknown) => boolean
    dryRun?: boolean
}

export interface IdlizerAppInstallFile {
    content: string
    filePath: string
}

export class IDLFileLibrary {
    private index: Map<string, IDLEntry>

    private initIndex(files: IDLFile[]): Map<string, IDLEntry> {
        const index = new Map<string, IDLEntry>()
        linearizeNamespaceMembers(files.flatMap(file => file.entries)).forEach(entry => {
            if (isImport(entry)) {
                return
            }
            index.set(getFQName(entry), entry)
        })

        const resolver = createAlgotithmicReferenceResolver(files, true)
        files.forEach(file => {
            forEachChild(file, (node) => {
                if (isReferenceType(node)) {
                    const decl = resolver.resolveTypeReference(node)
                    if (decl) {
                        node.name = getFQName(decl)
                    }
                }
            })
        })

        return index
    }

    constructor(
        public files: IDLFile[],
        index?: Map<string, IDLEntry>
    ) {
        this.index = index ?? this.initIndex(files)
    }

    toDeclarationSafe(reference: IDLReferenceType): IDLEntry | undefined {
        return this.index.get(reference.name)
    }

    toDeclaration(reference: IDLReferenceType): IDLEntry {
        return this.toDeclarationSafe(reference) ?? terminate(`Reference was not found! "${reference.name}" `)
    }

    followTypedefs(type: IDLType): IDLType {
        if (isReferenceType(type)) {
            const found = this.toDeclarationSafe(type)
            if (found && isTypedef(found)) {
                return this.followTypedefs(found.type)
            }
        }
        return type
    }

    allPackages(more?: string[]): Set<string> {
        return new Set(this.files.map(file => file.packageClause.join('.')).concat(more ?? []))
    }
}

export class FailedDiagnosticsError extends Error {
    constructor(
        public isPrinted: boolean = false
    ) { super() }
}

export class IdlizerAppBuilder {

    constructor(
        private desc: IdlizerAppDescription,
        public io: RealWorld,
    ) { }

    private flushDiagnostics() {
        const diagnosticResult = DiagnosticMessageGroup.collectedResults
        if (diagnosticResult.entries.length) {
            outputDiagnosticResultsFormatted(diagnosticResult)
            DiagnosticMessageGroup.collectedResults = new DiagnosticResults()
            if (diagnosticResult.hasErrors) {
                throw new FailedDiagnosticsError(true)
            }
        }
    }

    async readFiles(paths: string[]): Promise<IDLFile[]> {
        const files: string[] = []
        for (const path of paths) {
            files.push(... await this.io.scan(path))
        }
        return files.map(file => parseIDLFile(file))
    }

    async readConfig<T>(schema: ConfigSchema<T>, locations: string[]): Promise<LoadedConfig<T>> {
        const triedPaths: string[] = []
        for (const possiblePath of locations) {
            if (await this.io.exists(possiblePath)) {
                const text = await this.io.readFile(possiblePath)
                const json = JSON.parse(text)
                const maybeConfig = schema.validate(json)
                if (!maybeConfig.success()) {
                    terminate(`Config was found at "${possiblePath}", but was not parsed!\n ` + maybeConfig.error())
                }
                return {
                    data: maybeConfig.unwrap(),
                    path: possiblePath
                }
            }
            triedPaths.push(possiblePath)
        }
        terminate(
            'Config was not found!\n'
            + 'Searched at: \n'
            + triedPaths.map(p => ' '.repeat(2) + p).join('\n')
        )
    }

    diagnostics(op: () => void): void {
        op()
        this.flushDiagnostics()
    }

    async install(gen: () => IdlizerAppInstallFile[]): Promise<unknown> {
        const header = text.getClaim(this.desc.name, this.desc.version, this.desc.commit ?? 'N/A')
        const files = gen()
        if (!this.desc.dryRun) {
            const directories = new Set<string>()
            files.forEach(file => directories.add(dirname(file.filePath)))
            const mkdirHandles = Array.from(directories).map(dir => this.io.mkdir(dir, { recursive: true }))
            await Promise.all(mkdirHandles)
            const handles = files.map(file => this.io.writeFile(file.filePath, [header, file.content].join(EOL)))
            return Promise.all(handles)
        } else {
            files.forEach(file => {
                logger.debug('------------------------------------------------')
                logger.debug('>>>>>> ' + file.filePath)
                logger.debug('---')
                logger.debug(file.content)
                logger.debug('------------------------------------------------')
            })
        }
    }
}

const TERMINATE_USER_MESSAGE = `
Oh no!
Looks like the generator was terminated unexpectedly.
`

export function idlizer(desc: IdlizerAppDescription, app: (builder: IdlizerAppBuilder) => void | Promise<void>): void {
    forkWith(async () => {
        setFormatterLogger((sev, ...msg) => {
            switch (sev) {
                case 'error': return logger.error(...msg)
                case 'warning': return logger.error(...msg)
                case 'fatal': return logger.error(...msg)
                case 'information': return logger.info(...msg)
                case 'hint': return logger.info(...msg)
            }
            logger.debug(...msg)
        })
        try {
            const r = app(new IdlizerAppBuilder(desc, getIO()))
            if (r) {
                await r
            }
        } catch (ex) {
            logger.error(TERMINATE_USER_MESSAGE)
            process.exitCode = -1
            let alreadyReported = false
            if (desc.reportError) {
                alreadyReported = desc.reportError(ex)
            }
            if (!alreadyReported) {
                reportError(ex)
            }
            if (CURRENT_LOG_LEVEL === 'debug') {
                throw ex
            }
        }
    })
}

function reportError(error: unknown) {
    // order is important!
    if (error instanceof FailedDiagnosticsError) {
        if (!error.isPrinted) {
            outputDiagnosticResultsFormatted(DiagnosticMessageGroup.collectedResults)
        }
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
