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
import * as fs from "fs"

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
const arch = process.env.arch

console.log(`rollup args: mode = ${mode}, arch = ${arch}`)
const generatedDir = `generated`
const arkoalaArkuiSrcDir = `${generatedDir}/${mode}/sig/arkoala/arkui/src`
const tsconfigFile = `tsconfig-${mode == 'subset' ? mode : 'generated'}.json`
const outDir = path.resolve('lib')

const ENABLE_SOURCE_MAPS = true;  // Enable for debugging

/** @type {import("rollup").RollupOptions} */
export default {
    input: `${arkoalaArkuiSrcDir}/index.ts`,
    output: {
        file: "./lib/idlizeComponents.js",
        format: "commonjs",
        sourcemap: ENABLE_SOURCE_MAPS,
        sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
            const sourcemapDir = path.dirname(sourcemapPath)
            let absolute = path.join(sourcemapDir, relativeSourcePath);
            if(fs.existsSync(absolute))
                return path.relative(sourcemapDir, absolute)
            // For some reason Rollup adds extra ../ to relativeSourcePath, compensate it
            absolute = path.join(sourcemapDir, "extra", relativeSourcePath);
            if(fs.existsSync(absolute))
                return path.relative(sourcemapDir, absolute)
            console.warn("unable to map source path:", relativeSourcePath, " -> ", sourcemapPath);
            return relativeSourcePath
        },
        plugins: [
            // terser()
        ],
        banner: [
            "#!/usr/bin/env node",
            APACHE_LICENSE_HEADER()
        ].join("\n"),
    },
    external: ["commander", "typescript", "webidl2"],
    plugins: [
        typescript({
            outputToFilesystem: false,
            module: "ESNext",
            sourceMap: ENABLE_SOURCE_MAPS,
            declarationMap: false,
            declaration: false,
            composite: false,
            tsconfig: tsconfigFile
        }),
        nodeResolve({
            extensions: [".js", ".mjs", ".cjs", ".ts", ".cts", ".mts"]
        }),
        replace({
            'LOAD_NATIVE': `globalThis.requireNapi("libNativeBridge_ohos_${arch}.so")`,
        })
    ]
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
