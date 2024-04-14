import * as fs from "node:fs"
import { execSync } from "node:child_process"

const dir = "./interface_sdk-js"

if (fs.existsSync(dir)) {
    //execSync(`cd ${dir} && git pull`)
    process.exit(0)
}

console.log("Downloading sdk")
execSync("git clone --depth=1 https://gitee.com/openharmony/interface_sdk-js.git")
