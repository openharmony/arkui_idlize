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

import MagicString from 'magic-string'
import nodeResolve from "@rollup/plugin-node-resolve";
import commonJs from "@rollup/plugin-commonjs"
import os from 'os';
import replace from '@rollup/plugin-replace';
import typescript from "@rollup/plugin-typescript";
import * as path from "path";

const platform = os.platform()
const isWindows = (platform === 'win32')

function crossPathRelative(from, to) {
    if (isWindows) {
        return path.relative(from, to).replace(/\\/g, '\\\\')
    } else {
        return path.relative(from, to)
    }
}

function enforceOrder(order) {
    return {
        name: "enforce-module-order",
        renderChunk(code, chunk) {
            const moduleIds = [...chunk.moduleIds]
            for (let i = 0; i < moduleIds.length; i++) {
                for (let j = i + 1; j < moduleIds.length; j++) {
                    const idx1 = order.findIndex(it => moduleIds[i].includes(it))
                    const idx2 = order.findIndex(it => moduleIds[j].includes(it))
                    if (idx1 >= 0 && idx2 >= 0 && idx1 > idx2) {
                        const t = moduleIds[i]
                        moduleIds[i] = moduleIds[j]
                        moduleIds[j] = t
                    }
                }
            }
            let magicString = new MagicString(code)
            for (let i = 0; i < moduleIds.length; i++) {
                if (moduleIds[i] !== chunk.moduleIds[i]) {
                    const oldId = chunk.moduleIds[i]
                    const newId = moduleIds[i]
                    console.log(`Replace chunk ${oldId} to ${newId}`)
                    magicString.replace(chunk.modules[oldId].code, chunk.modules[newId].code)
                }
            }
            return { code: magicString.toString(), map: magicString.generateMap() }
        }
    }
}

const arch = process.env.arch

console.log(`rollup args: arch = ${arch}`)
const generatedDir = `generated`
const arkoalaArkuiSrcDir = `${generatedDir}/sig/arkoala/arkui/src`
const tsconfigFile = path.resolve(`tsconfig.json`)
const outDir = path.resolve('lib')

const enforcedOrder = ["src/generated/common.ts", "src/generated/gesture.ts", "src/generated/textInput.ts"]
const ENABLE_SOURCE_MAPS = true;  // Enable for debugging

/** @type {import("rollup").RollupOptions} */
export default {
    input: `${arkoalaArkuiSrcDir}/main.ts`,
    output: {
        file: "./lib/main.js",
        format: "commonjs",
        sourcemap: ENABLE_SOURCE_MAPS,
        sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
            // For some reason Rollup adds extra ../ to relativeSourcePath, remove it
            let absolute = path.join(sourcemapPath, relativeSourcePath);
            let relative = path.relative(path.dirname(sourcemapPath), absolute);
            return relative
        },
        plugins: [
            // terser()
        ],
        banner: [
            "#!/usr/bin/env node",
            APACHE_LICENSE_HEADER()
        ].join("\n"),
    },
    external: [],
    plugins: [
        enforceOrder(enforcedOrder),
        typescript({
            outputToFilesystem: false,
            module: "ESNext",
            sourceMap: ENABLE_SOURCE_MAPS,
            declarationMap: false,
            declaration: false,
            composite: false,
            tsconfig: tsconfigFile,
            filterRoot: '.'
        }),
        nodeResolve({
            extensions: [".js", ".mjs", ".cjs", ".ts", ".cts", ".mts"]
        }),
        commonJs(),
        replace({
            'NATIVE_LIBRARY_NAME': `"${crossPathRelative(outDir, '../../native/NativeBridgeNapi.node')}"`,
            preventAssignment: true
        })
    ],
}

function APACHE_LICENSE_HEADER() {
    return `
/**
* @license
* Copyright (c) ${new Date().getUTCFullYear()} Huawei Device Co., Ltd.
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

`
}
