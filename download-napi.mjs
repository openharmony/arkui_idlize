import * as fs from "node:fs"
import { execSync } from "node:child_process"

const dir = "./node-addon-api"

if (fs.existsSync(dir)) {
    process.exit(0)
}

console.log("Downloading NAPI")
execSync("git clone https://github.com/nodejs/node-addon-api.git")
execSync("git clone https://github.com/nodejs/node-api-headers.git")
