import * as path from "node:path"
import { defineConfig } from "rollup"
import typescript from "@rollup/plugin-typescript"
import resolve from "@rollup/plugin-node-resolve"
import inject from "@rollup/plugin-inject"
import commonjs from "@rollup/plugin-commonjs"

export default defineConfig({
    input: "src/node/main.ts",
    output: {
        file: "build/node/index.js",
        format: "commonjs",
        sourcemap: true,
    },
    plugins: [
        inject({
            LOAD_NATIVE: path.resolve("./src/node/load_native.mjs")
        }),
        typescript({
            moduleResolution: "nodenext",
            outDir: "build/node"
        }),
        resolve(),
        // TODO Runtime JS modules should be in ES6 format
        commonjs(),
    ]
})
