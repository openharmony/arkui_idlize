import * as path from "node:path"
import { defineConfig } from "rollup"
import typescript from "@rollup/plugin-typescript"
import resolve from "@rollup/plugin-node-resolve"
import replace from "@rollup/plugin-replace"
import commonjs from "@rollup/plugin-commonjs"

const outDir = path.resolve("build/node")

export default defineConfig({
    input: "src/node/main.ts",
    output: {
        file: "build/node/index.js",
        format: "commonjs",
        sourcemap: true,
    },
    plugins: [
        typescript({
            moduleResolution: "nodenext",
            outDir: "build/node"
        }),
        resolve(),
        // TODO Runtime JS modules should be in ES6 format
        commonjs(),
        replace({
            "NATIVE_LIBRARY_NAME": `"${path.join(outDir, 'HUKS_NativeBridgeNapi.node')}"`,
            preventAssignment: true,
        }),
    ]
})
