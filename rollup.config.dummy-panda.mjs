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

import nodeResolve from "@rollup/plugin-node-resolve";
import os from 'os';
import replace from '@rollup/plugin-replace';
import terser from "@rollup/plugin-terser";
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

const mode = process.env.mode

console.log(`rollup args: mode = ${mode}`)
const generatedDir = `generated`
const arkoalaArkuiSrcDir = `${generatedDir}/${mode}/sig/arkoala/arkui/src`
const tsconfigFile = path.resolve(`tsconfig-${mode == 'subset' ? mode : 'generated'}.json`)
const outDir = path.resolve('lib')

const ENABLE_SOURCE_MAPS = true;  // Enable for debugging

/** @type {import("rollup").RollupOptions} */
export default {
    input: `${arkoalaArkuiSrcDir}/loader.ts`,
    output: {
        file: "./lib/loader.js",
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
        replace({
            'LOAD_NATIVE': `require('${crossPathRelative(outDir, 'native/NativeBridgeNapi.node')}')`,
            preventAssignment: true
        })
    ]
}

function APACHE_LICENSE_HEADER() {
    return `
/**
* @license
* Copyright (c) ${new Date().getUTCFullYear()} Huawei Device Co., Ltd.
* Licensed under the Apache License, Version 2.0 (the "License");ind
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
