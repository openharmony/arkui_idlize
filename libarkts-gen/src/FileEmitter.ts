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
import { forceWriteFile, printIDL } from "@idlizer/core"
import { BridgesPrinter } from "./visitors/interop/bridges/BridgesPrinter"
import { BindingsPrinter } from "./visitors/interop/bindings/BindingsPrinter"
import { EnumsPrinter } from "./visitors/enums/EnumsPrinter"
import { IDLFile } from "@idlizer/core"
import { Config } from "./Config"
import { InteropTransformer } from "./transformers/InteropTransformer"
import { AstNodeFilterTransformer } from "./transformers/filter/AstNodeFilterTransformer"
import { OptionsFilterTransformer } from "./transformers/filter/OptionsFilterTransformer"
import { MultipleDeclarationFilterTransformer } from "./transformers/filter/MultipleDeclarationFilterTransformer"
import { Result } from "./visitors/MultiFilePrinter"
import { AllPeersPrinter } from "./visitors/peers/AllPeersPrinter"
import { NodeMapPrinter } from "./visitors/peers/NodeMapPrinter"
import { IndexPrinter } from "./visitors/peers/IndexPrinter"

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
        public print: (idl: IDLFile) => Result[],
        public dir: string,
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

    private bridgesPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new BridgesPrinter(idl).print(),
        `libarkts/native/src/generated/bridges.cc`,
        `bridges.cc`,
        this.config.shouldEmitFile(`bridges`),
    )

    private bindingsPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new BindingsPrinter(idl).print(),
        `libarkts/src/generated/Es2pandaNativeModule.ts`,
        `Es2pandaNativeModule.ts`,
        this.config.shouldEmitFile(`nativeModule`),
    )

    private enumsPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new EnumsPrinter(idl).print(),
        `libarkts/src/Es2pandaEnums.ts`,
        `Es2pandaEnums.ts`,
        this.config?.shouldEmitFile(`enums`),
    )

    private nodeMapPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new NodeMapPrinter(idl).print(),
        `libarkts/src/generated/node-map.ts`,
        `node-map.ts`,
        true
    )

    private indexPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new IndexPrinter(idl).print(),
        `libarkts/src/generated/index.ts`,
        `index.ts`,
        true
    )

    private peersPrinter = new MultiFileEmitter(
        (idl: IDLFile) => new AllPeersPrinter(idl).print(),
        `libarkts/src/generated/peers`,
        `peer.ts`,
        true
    )

    print(): void {
        let idl = this.file

        idl = new OptionsFilterTransformer(this.config, idl).transformed()
        idl = new MultipleDeclarationFilterTransformer(idl).transformed()
        console.log(idl.entries.forEach(it => printIDL(it)))
        this.printFile(this.enumsPrinter, idl)

        idl = new AstNodeFilterTransformer(idl).transformed()
        this.printFiles(this.peersPrinter, idl)
        this.printFile(this.nodeMapPrinter, idl)
        this.printFile(this.indexPrinter, idl)

        idl = new InteropTransformer(idl).transformed()
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
                    `%GENERATED_PART%`,
                    filePrinter.print(idl)
                )
        )
    }

    private printFiles(multiFilePrinter: MultiFileEmitter, idl: IDLFile): void {
        if (!multiFilePrinter.enabled) {
            return
        }
        console.log(`emit to ${multiFilePrinter.dir}`)
        multiFilePrinter
            .print(idl)
            .forEach(({fileName, output}) => {
                forceWriteFile(
                    path.join(this.outDir, multiFilePrinter.dir, fileName),
                    this.readTemplate(multiFilePrinter.template)
                        .replaceAll(
                            `%GENERATED_PART%`,
                            output
                        )
                )
            })
    }

    private readTemplate(name: string): string {
        return fs.readFileSync(path.join(__dirname, `./../templates/${name}`), 'utf8')
    }
}
