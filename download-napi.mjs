import * as fs from "node:fs"
import { execSync } from "node:child_process"

const dir = "./node-api-headers"

if (fs.existsSync(dir)) {
    process.exit(0)
}

console.log("Downloading Node headers")
execSync("git clone https://github.com/nodejs/node-api-headers.git")
