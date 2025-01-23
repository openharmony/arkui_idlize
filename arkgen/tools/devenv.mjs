import { execSync } from "node:child_process"
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IDLIZE_PATH = resolve(__dirname, '..')
const EXTERNAL_PATH = resolve(__dirname, '..', '..', 'external')
const INTEROP_PATH = join(EXTERNAL_PATH, 'interop')

const PACKAGES = [
    '@koalaui/interop'
]

function $(...input) {
    const command = input.join(' && ')
    console.log(`> ${command}`)
    execSync(command, { stdio: 'inherit' })
}

function enableDevEnv() {
    $(`cd ${INTEROP_PATH}`, `npm link`)
    $(`cd ${IDLIZE_PATH}`, `npm link ${PACKAGES.join(' ')}`)
}

function disableDevEnv() {
   $(`cd ${IDLIZE_PATH}`, 'npm i')
}

function main(argv) {
    const flag = argv[2]
    if (!flag || flag === 'on') {
        enableDevEnv()
        return
    }
    if (flag && flag === 'off') {
        disableDevEnv()
        return
    }
}
main(process.argv)
