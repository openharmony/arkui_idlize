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

import * as path from "node:path"
import * as fs from "node:fs"
import * as ps from "node:child_process"
import JSON5 from "json5"
import { forceWriteFile, IDLFile, toIDLString } from "@idlizer/core"
import { MultiFileOutput } from "../printers/MultiFilePrinter.js"
import { Config } from "../general/Config.js"
import { BridgesPrinter } from "../printers/interop/BridgesPrinter.js"
import { EnumsPrinter } from "../printers/enums/EnumsPrinter.js"
import { IndexPrinter } from "../printers/library/IndexPrinter.js"
import { BindingsPrinter } from "../printers/interop/BindingsPrinter.js"
import { AllPeersPrinter } from "../printers/library/AllPeersPrinter.js"
import { FactoryPrinter } from "../printers/library/FactoryPrinter.js"
import { OptionsFilterTransformer } from "../transformers/common/filter/OptionsFilterTransformer.js"
import { Transformer } from "../transformers/Transformer.js"
import { DIR_NAME } from "../utils/utils.js"

class SingleFileEmitter {
    constructor(
        public print: (idl: IDLFile) => string,
        public path: string,
        public template: string,
        public enabled: boolean
    ) {}
}

class MultiFileEmitter {
    constructor(
        public print: (idl: IDLFile) => MultiFileOutput[],
        public dir: string,
        public template: string,
        public enabled: boolean
    ) {}
}

export class DynamicEmitter {
    constructor(
        private outDir: string,
        private sdkDir: string,
        private file: IDLFile,
        private config: Config,
        private shouldLog: boolean
    )
    {
        const myJson = path.resolve(DIR_NAME, '..', 'package.json')
        if (fs.existsSync(myJson)) {
            this.generatorVersion = JSON5.parse(
                fs.readFileSync(myJson).toString())?.version ?? `Unknown`
        }

        const pandaJson = path.join(sdkDir, 'package.json')
        if (fs.existsSync(pandaJson)) {
            this.pandaSdkVersion = JSON5.parse(
                fs.readFileSync(pandaJson).toString())?.version ?? `Unknown`
        }

        const host = process.platform
        const pandaBinary = path.join(sdkDir, `${host}_host_tools/bin/es2panda`)
        if (fs.existsSync(pandaBinary)) {
            const result = ps.spawnSync(pandaBinary, ['--version'], { encoding: 'utf-8' })
            // Get 2 last non-empty lines from combined stderr and stdout output
            const [date, hash] = result.output.slice(1).join('\n').split('\n')
                .filter(str => str.length).slice(-2)
                .map(str => str.split(': ')?.at(1) ?? '')
            this.pandaSdkVersion = `${hash}(${date?.split('_')[0]}) sdk v${this.pandaSdkVersion}`
        }
    }

    private readonly pandaSdkVersion: string = `Unknown`
    private readonly generatorVersion: string = `Unknown`

    private logDir = `./out/log-idl`

    private logCount = 0

    private bridgesPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new BridgesPrinter(this.config, idl).print(),
        `libarkts/generated/native/bridges.cpp`,
        `bridges.cpp`,
        true
    )

    private bindingsPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new BindingsPrinter(idl).print(),
        `libarkts/generated/Es2pandaNativeModule.ts`,
        `Es2pandaNativeModule.ts`,
        true
    )

    private enumsPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new EnumsPrinter(idl).print(),
        `libarkts/generated/Es2pandaEnums.ts`,
        `Es2pandaEnums.ts`,
        true
    )

    private indexPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new IndexPrinter(this.config, idl).print(), // overriden below
        `libarkts/generated/index.ts`,
        `index.ts`,
        true
    )

    private peersPrinter = new MultiFileEmitter(
        (idl: IDLFile) => new AllPeersPrinter(this.config, idl).print(),
        `libarkts/generated/peers`,
        `peer.ts`,
        true
    )

    private factoryPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new FactoryPrinter(this.config, idl).print(),
        `libarkts/generated/factory.ts`,
        `factory.ts`,
        true
    )

    emit(): void {
        this.cleanLogDir()
        let idl = this.file
        this.printFile(this.enumsPrinter, idl)
        idl = this.withLog(new OptionsFilterTransformer(this.config, idl))

        this.printPeers(idl)
        this.printInterop(idl)
    }

    private printPeers(idl: IDLFile): void {
        const out = this.printFiles(this.peersPrinter, idl)
        // override index printer
        this.indexPrinter.print = AllPeersPrinter.printIndexFile.bind(undefined,  out, this.config)
        this.printFile(this.indexPrinter, idl)
        this.printFile(this.factoryPrinter, idl)
    }

    private printInterop(idl: IDLFile): void {
        // InteropTransformer is removed, ParameterTransformer is used for peers only.
        // See BridgesPrinter.makeFunctionDeclaration
        this.printFile(this.bindingsPrinter, idl)
        this.printFile(this.bridgesPrinter, idl)
    }

    private printFile(filePrinter: SingleFileEmitter, idl: IDLFile): void {
        if (!filePrinter.enabled) {
            return
        }
        console.log(`emit to ${filePrinter.path}`)
        forceWriteFile(
            path.join(this.outDir, filePrinter.path),
            this.readTemplate(filePrinter.template)
                .replaceAll(
                    `%GEN_VERSION%`,
                    this.generatorVersion
                )
                .replaceAll(
                    `%SDK_VERSION%`,
                    this.pandaSdkVersion
                )
                .replaceAll(
                    `%GENERATED_PART%`,
                    filePrinter.print(idl)
                )
        )
    }

    private printFiles(multiFilePrinter: MultiFileEmitter, idl: IDLFile): MultiFileOutput[] {
        if (!multiFilePrinter.enabled) {
            return []
        }

        console.log(`emit to ${multiFilePrinter.dir}`)
        const output = multiFilePrinter.print(idl)

        output.forEach(({fileName, output}) => {
            forceWriteFile(
                path.join(this.outDir, multiFilePrinter.dir, fileName),
                this.readTemplate(multiFilePrinter.template)
                    .replaceAll(
                        `%GENERATED_PART%`,
                        output
                    )
            )
        })

        return output
    }

    private readTemplate(name: string): string {
        return fs.readFileSync(path.join(DIR_NAME, `./../templates/${name}`), `utf8`)
    }

    private withLog(transformer: Transformer): IDLFile {
        const idl = transformer.transformed()
        if (this.shouldLog) {
            const name = Reflect.get(transformer, `constructor`).name
            forceWriteFile(
                path.join(this.logDir, `${this.logCount}-after-${name}.idl`),
                toIDLString(idl, {})
            )
            this.logCount += 1
        }
        return idl
    }

    private cleanLogDir(): void {
        if (this.shouldLog) {
            if (fs.existsSync(this.logDir)) {
                fs.rmSync(this.logDir, { recursive: true })
            }
        }
    }
}
