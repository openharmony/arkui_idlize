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

import {
    convertType,
    createEmptyReferenceResolver,
    createReferenceType,
    IDLInterface,
    IDLType,
    IndentedPrinter,
    isInterface,
    TSLanguageWriter
} from "@idlizer/core"
import { SingleFilePrinter } from "../../SingleFilePrinter"
import { makeSignature } from "../../../utils/idl"
import { mangleIfKeyword } from "../../../general/common"
import { PeersConstructions } from "../PeersConstructions"
import { composedConvertType, ImporterTypeConvertor } from "../../../type-convertors/top-level/ImporterTypeConvertor"
import { PeerImporter } from "../PeerImporter"
import { LibraryTypeConvertor } from "../../../type-convertors/top-level/LibraryTypeConvertor"

export class FactoryPrinter extends SingleFilePrinter {
    protected importer = new PeerImporter(this.typechecker, `peers`)

    protected writer = new TSLanguageWriter(
        new IndentedPrinter(),
        createEmptyReferenceResolver(),
        { convert: (node: IDLType) => composedConvertType(
            new LibraryTypeConvertor(this.typechecker),
            new ImporterTypeConvertor(
                this.importer,
                this.typechecker
            ),
            node
            )
        }
    )

    visit(): void {
        this.idl.entries
            .filter(isInterface)
            .filter(it => this.typechecker.isPeer(it.name))
            .forEach(this.printInterface, this)
    }

    private printInterface(node: IDLInterface): void {
        if (node.properties.length === 0) {
            return
        }
        this.printCreate(node)
    }

    private printCreate(node: IDLInterface): void {
        this.writer.writeFunctionImplementation(
            PeersConstructions.universalCreate(node.name),
            makeSignature(
                node.properties,
                createReferenceType(node.name)
            ),
            () => this.writer.writeStatement(
                this.writer.makeReturn(
                    this.writer.makeFunctionCall(
                        PeersConstructions.callUniversalCreate(node.name),
                        node.properties
                            .map(it => it.name)
                            .map(mangleIfKeyword)
                            .map(it => this.writer.makeString(it))
                    )
                )
            )
        )
    }
}
