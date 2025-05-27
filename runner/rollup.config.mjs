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
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import * as path from "path";
import * as fs from "fs";

const ENABLE_SOURCE_MAPS = true;  // Enable for debugging

/** @type {import("rollup").RollupOptions} */
export default {
    input: "./src/main.ts",
    output: {
        file: "./lib/index.js",
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
    onwarn: (message) => {
        if (message.code === 'CIRCULAR_DEPENDENCY') {
          console.error(message)
          // TODO: stop build on circular dependencies.
          // process.exit(-1);
        }
    },
    external: [
        "commander",
        "typescript",
        "@idlizer/arkgen/app",
        "@idlizer/etsgen/app"
    ],
    plugins: [
        typescript({
            outputToFilesystem: false,
            module: "esnext",
            sourceMap: ENABLE_SOURCE_MAPS,
            declarationMap: false,
            declaration: false,
            composite: false,
        }),
        nodeResolve({
            extensions: [".js", ".mjs", ".cjs", ".ts", ".cts", ".mts"]
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
