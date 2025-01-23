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
import { forceWriteFile } from "@idlize/core"
import { BridgesPrinter } from "./printers/BridgesPrinter"
import { NativeModulePrinter } from "./printers/NativeModulePrinter"
import { EnumsPrinter } from "./printers/EnumsPrinter"
import { IDLFile } from "./Es2PandaTransformer"
import { Config } from "./Config"

class FilePrinter {
    constructor(
        public printer: { print(): string },
        public path: string,
        public template: string,
        public enabled: boolean
    ) {}
}

export class LibarktsGenerator {
    constructor(
        private outDir: string,
        private idl: IDLFile,
        private config: Config,
        private files?: string[]
    ) {}

    private bridgesPrinter = new FilePrinter(
        new BridgesPrinter(this.idl, this.config),
        `libarkts/native/src/generated/bridges.cc`,
        `bridges.cc`,
        this.files?.includes(`bridges`) ?? true,
    )

    private nativeModulePrinter = new FilePrinter(
        new NativeModulePrinter(this.idl, this.config),
        `libarkts/src/Es2pandaNativeModule.ts`,
        `Es2pandaNativeModule.ts`,
        this.files?.includes(`nativeModule`) ?? true,
    )

    private enumsPrinter = new FilePrinter(
        new EnumsPrinter(this.idl, this.config),
        `libarkts/src/Es2pandaEnums.ts`,
        `Es2pandaEnums.ts`,
        this.files?.includes(`enums`) ?? true,
    )

    print(): void {
        this.printFile(this.bridgesPrinter)
        this.printFile(this.nativeModulePrinter)
        this.printFile(this.enumsPrinter)
    }

    private printFile(filePrinter: FilePrinter): void {
        if (filePrinter.enabled) {
            console.log(`emit to ${filePrinter.path}`)
            forceWriteFile(
                path.join(this.outDir, filePrinter.path),
                this.readTemplate(filePrinter.template)
                    .replaceAll(
                        `%GENERATED_PART%`,
                        filePrinter.printer.print()
                    )
            )
        }
    }

    private readTemplate(name: string): string {
        return fs.readFileSync(path.join(__dirname, `./../templates/${name}`), 'utf8')
    }
}
