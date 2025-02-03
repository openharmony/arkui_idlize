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
import { forceWriteFile } from "@idlizer/core"
import { BridgesPrinter } from "./visitors/interop/bridges/BridgesPrinter"
import { NativeModulePrinter } from "./visitors/interop/native-module/NativeModulePrinter"
import { EnumsPrinter } from "./visitors/EnumsPrinter"
import { IDLFile } from "./idl-utils"
import { Config } from "./Config"
import { InteropTransformer } from "./transformers/InteropTransformer"
import { AstNodeFilterTransformer } from "./transformers/filter/AstNodeFilterTransformer"
import { OptionsFilterTransformer } from "./transformers/filter/OptionsFilterTransformer"
import { MultipleDeclarationFilterTransformer } from "./transformers/filter/MultipleDeclarationFilterTransformer"

class FilePrinter {
    constructor(
        public print: (idl: IDLFile) => string,
        public path: string,
        public template: string,
        public enabled: boolean
    ) {}
}

export class FileEmitter {
    constructor(
        private outDir: string,
        private file: IDLFile,
        private config: Config,
    ) {}

    private bridgesPrinter = new FilePrinter(
        (idl: IDLFile) => new BridgesPrinter(idl).print(),
        `libarkts/native/src/generated/bridges.cc`,
        `bridges.cc`,
        this.config.shouldEmitFile(`bridges`),
    )

    private nativeModulePrinter = new FilePrinter(
        (idl: IDLFile) => new NativeModulePrinter(idl).print(),
        `libarkts/src/generated/Es2pandaNativeModule.ts`,
        `Es2pandaNativeModule.ts`,
        this.config.shouldEmitFile(`nativeModule`),
    )

    private enumsPrinter = new FilePrinter(
        (idl: IDLFile) => new EnumsPrinter(idl).print(),
        `libarkts/src/Es2pandaEnums.ts`,
        `Es2pandaEnums.ts`,
        this.config?.shouldEmitFile(`enums`),
    )

    print(): void {
        let idl = this.file

        idl = new OptionsFilterTransformer(this.config, idl).transformed()
        idl = new MultipleDeclarationFilterTransformer(idl).transformed()
        this.printFile(this.enumsPrinter, idl)

        idl = new AstNodeFilterTransformer(idl).transformed()
        idl = new InteropTransformer(idl).transformed()
        this.printFile(this.nativeModulePrinter, idl)
        this.printFile(this.bridgesPrinter, idl)
    }

    private printFile(filePrinter: FilePrinter, idl: IDLFile): void {
        if (filePrinter.enabled) {
            console.log(`emit to ${filePrinter.path}`)
            forceWriteFile(
                path.join(this.outDir, filePrinter.path),
                this.readTemplate(filePrinter.template)
                    .replaceAll(
                        `%GENERATED_PART%`,
                        filePrinter.print(idl)
                    )
            )
        }
    }

    private readTemplate(name: string): string {
        return fs.readFileSync(path.join(__dirname, `./../templates/${name}`), 'utf8')
    }
}
