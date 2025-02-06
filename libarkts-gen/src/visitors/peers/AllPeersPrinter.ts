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

import { MultiFilePrinter, Result } from "../MultiFilePrinter"
import { IDLInterface, isDefined, isInterface } from "@idlizer/core"
import { PeersConstructions } from "./PeersConstructions"
import { Config } from "../../Config"
import { PeerPrinter } from "./PeerPrinter"

export class AllPeersPrinter extends MultiFilePrinter {
    print(): Result[] {
        return this.idl.entries
            .filter(isInterface)
            .filter(it => this.typechecker.isHeir(it.name, Config.astNodeCommonAncestor))
            .map(it => this.printInterface(it))
            .filter(isDefined)
    }

    private printInterface(node: IDLInterface): Result | undefined {
        const output = new PeerPrinter(this.idl, node).print()
        if (output === undefined) {
            return undefined
        }
        return {
            fileName: PeersConstructions.fileName(node.name),
            output: output
        }
    }
}
