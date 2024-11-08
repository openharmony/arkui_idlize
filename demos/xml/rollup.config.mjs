import * as path from "node:path"
import { defineConfig } from "rollup"
import typescript from "@rollup/plugin-typescript"
import resolve from "@rollup/plugin-node-resolve"
import inject from "@rollup/plugin-inject"

export default defineConfig({
    input: "src/index.ts",
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
        resolve()
    ]
})
