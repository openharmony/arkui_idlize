import fs from "fs"
import path from "path"
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import { Package, IDLIZE_HOME } from "../../tools/utils.mjs";

const packages = [
    new Package(path.join(IDLIZE_HOME, "dtsgen")),
    new Package(path.join(IDLIZE_HOME, "arkgen")),
    new Package(path.join(IDLIZE_HOME, "ohosgen"))
]

const packagesPath = path.join(__dirname, '.packages')

if (fs.existsSync(packagesPath)) fs.rmSync(packagesPath, {recursive: true, force: true})
fs.mkdirSync(path.join(__dirname, '.packages'))

packages.map(module => module.pack(packagesPath))




