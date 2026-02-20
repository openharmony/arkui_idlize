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

import * as core from "@idlizer/core"
import { nodeNamespace } from "../utils/idl.js"

type Coverage = {
    interfaceNumberTotal: number,
    interfaceNumberIgnored: number,
    functionNumberTotal: number,
    functionNumberIgnored: number,
}

export class CoverageStat {
    public total(iface: core.IDLInterface) {
        const ns = this.makeEntry(iface)
        this.stats.get(ns)!.interfaceNumberTotal += 1
    }

    public ignored(iface: core.IDLInterface) {
        const ns = this.makeEntry(iface)
        this.stats.get(ns)!.interfaceNumberIgnored += 1
    }

    public funcTotal(iface: core.IDLInterface, num: number = 1) {
        const ns = this.makeEntry(iface)
        this.stats.get(ns)!.functionNumberTotal += num
    }

    public funcIgnored(iface: core.IDLInterface, num: number = 1) {
        const ns = this.makeEntry(iface)
        this.stats.get(ns)!.functionNumberIgnored += num
    }

    public dump() {
        const overall = {
            interfaceNumberTotal: 0,
            interfaceNumberIgnored: 0,
            functionNumberTotal: 0,
            functionNumberIgnored: 0
        }

        console.log(`\n   === API Coverage ===`)
        this.stats.forEach((value, key) => {
            const ifaceNum = value.interfaceNumberTotal - value.interfaceNumberIgnored
            const funcNum = value.functionNumberTotal - value.functionNumberIgnored

            const ident = ' '.repeat(12 - key.length + 2)
            console.log(`${key}:${ident}${ifaceNum}/${value.interfaceNumberTotal} ${funcNum}/${value.functionNumberTotal}`)

            overall.interfaceNumberTotal += value.interfaceNumberTotal
            overall.interfaceNumberIgnored += value.interfaceNumberIgnored
            overall.functionNumberTotal += value.functionNumberTotal
            overall.functionNumberIgnored += value.functionNumberIgnored
        })

        const ifaceNum = overall.interfaceNumberTotal - overall.interfaceNumberIgnored
        const funcNum = overall.functionNumberTotal - overall.functionNumberIgnored
        const ifacePercentage = ifaceNum/overall.interfaceNumberTotal * 100
        const funcPercentage = funcNum/overall.functionNumberTotal * 100

        console.log(`\nOverall:\n  interfaces: ${ifaceNum} of ${overall.interfaceNumberTotal}(${ifacePercentage.toPrecision(3)}%)`)
        console.log(`  functions: ${funcNum} of ${overall.functionNumberTotal}(${funcPercentage.toPrecision(3)}%)`)
    }

    private makeEntry(node: core.IDLNode): string {
        const ns = nodeNamespace(node) ?? 'global'
        if (!this.stats.has(ns)) {
            this.stats.set(ns, {
                interfaceNumberTotal: 0,
                interfaceNumberIgnored: 0,
                functionNumberTotal: 0,
                functionNumberIgnored: 0
            } as Coverage)
        }
        return ns
    }

    private stats = new Map<string, Coverage>()
}

export var gCoverage = new CoverageStat()

