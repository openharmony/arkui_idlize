import * as path from "node:path"
import * as fs from "fs"
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
        sourcemapPathTransform: (relativeSourcePath, sourcemapPath) => {
            const sourcemapDir = path.dirname(sourcemapPath)
            let absolute = path.join(sourcemapDir, relativeSourcePath);
            if (fs.existsSync(absolute))
                return path.relative(sourcemapDir, absolute)
            console.log(`  does not exist`)
            // For some reason Rollup adds extra ../.. to relativeSourcePath, compensate it
            absolute = path.join(sourcemapDir, "ohosgen/unit", relativeSourcePath);
            if (fs.existsSync(absolute))
                return path.relative(sourcemapDir, absolute)
            console.warn("unable to map source path:", relativeSourcePath, " -> ", sourcemapPath);
            return relativeSourcePath
        },
    },
    plugins: [
        typescript({
            moduleResolution: "nodenext",
            outDir: "build/node"
        }),
        resolve(),
        // TODO Runtime JS modules should be in ES6 format
        commonjs(),
    ]
})
