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
import { forceWriteFile, IDLFile, toIDLString } from "@idlizer/core"
import { Result } from "../visitors/MultiFilePrinter"
import { Config } from "../Config"
import { BridgesPrinter } from "../visitors/interop/bridges/BridgesPrinter"
import { EnumsPrinter } from "../visitors/enums/EnumsPrinter"
import { IndexPrinter } from "../visitors/library/IndexPrinter"
import { NodeMapPrinter } from "../visitors/library/NodeMapPrinter"
import { BindingsPrinter } from "../visitors/interop/bindings/BindingsPrinter"
import { AllPeersPrinter } from "../visitors/library/AllPeersPrinter"
import { FactoryPrinter } from "../visitors/library/factory/FactoryPrinter"
import { OptionsFilterTransformer } from "../transformers/common/filter/OptionsFilterTransformer"
import { AddContextDeclarationTransformer } from "../transformers/common/AddContextDeclarationTransformer"
import { MultipleDeclarationFilterTransformer } from "../transformers/common/filter/MultipleDeclarationFilterTransformer"
import { ParameterTransformer } from "../transformers/common/ParameterTransformer"
import { TwinMergeTransformer } from "../transformers/common/TwinMergeTransformer"
import { AstNodeFilterTransformer } from "../transformers/common/filter/AstNodeFilterTransformer"
import { NullabilityTransformer } from "../transformers/peers/NullabilityTransformer"
import { AttributeTransformer } from "../transformers/peers/factory/AttributeTransformer"
import { InteropTransformer } from "../transformers/interop/InteropTransformer"
import { ConstMergeTransformer } from "../transformers/peers/ConstMergeTransformer"
import { Transformer } from "../transformers/Transformer"

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

export class DynamicEmitter {
    constructor(
        private outDir: string,
        private file: IDLFile,
        private config: Config,
        private shouldLog: boolean
    ) {}

    private logDir = `./out/log-idl`

    private logCount = 0

    private bridgesPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new BridgesPrinter(idl).print(),
        `libarkts/native/src/generated/bridges.cc`,
        `bridges.cc`,
        true
    )

    private bindingsPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new BindingsPrinter(idl).print(),
        `libarkts/src/generated/Es2pandaNativeModule.ts`,
        `Es2pandaNativeModule.ts`,
        true
    )

    private enumsPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new EnumsPrinter(idl).print(),
        `libarkts/src/Es2pandaEnums.ts`,
        `Es2pandaEnums.ts`,
        false
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

    private factoryPrinter = new SingleFileEmitter(
        (idl: IDLFile) => new FactoryPrinter(idl).print(),
        `libarkts/src/generated/factory.ts`,
        `factory.ts`,
        true
    )

    emit(): void {
        this.cleanLogDir()
        let idl = this.file
        this.printFile(this.enumsPrinter, idl)
        idl = this.withLog(new OptionsFilterTransformer(this.config, idl))
        idl = this.withLog(new AddContextDeclarationTransformer(idl))
        idl = this.withLog(new TwinMergeTransformer(idl))
        idl = this.withLog(new MultipleDeclarationFilterTransformer(idl))
        idl = this.withLog(new AstNodeFilterTransformer(idl))
        idl = this.withLog(new ParameterTransformer(idl))
        this.printPeers(idl)
        this.printInterop(idl)
    }

    private printPeers(idl: IDLFile): void {
        idl = this.withLog(new ConstMergeTransformer(idl))
        idl = this.withLog(new NullabilityTransformer(idl))
        this.printFile(this.indexPrinter, idl)
        this.printFiles(this.peersPrinter, idl)
        this.printFactory(idl)
    }

    private printFactory(idl: IDLFile): void {
        idl = this.withLog(new AttributeTransformer(idl))
        this.printFile(this.factoryPrinter, idl)
    }

    private printInterop(idl: IDLFile): void {
        idl = this.withLog(new InteropTransformer(idl))
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
        return fs.readFileSync(path.join(__dirname, `./../templates/${name}`), `utf8`)
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
