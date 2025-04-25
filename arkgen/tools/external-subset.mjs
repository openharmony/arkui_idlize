import fs from "fs"
import path from "path"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export const PeerLib = path.join(__dirname, '../peer_lib')
export const ExternalJson = path.join(PeerLib, 'external.json')

const data = JSON.parse(fs.readFileSync(ExternalJson).toString())
if (!data) throw new Error(`Cannot parse ${ExternalJson}`)

export const External = path.join(PeerLib, data.path)
export const ExternalSubset = path.join(PeerLib, data.subsetPath)

export function copySubset() {
    if (fs.existsSync(ExternalSubset))
        fs.rmSync(ExternalSubset, {recursive: true, force: true});

    fs.mkdirSync(ExternalSubset)

    const filters = data.subset.map(it => path.join(External, it))
    copyDir(External, ExternalSubset, filters)
}

function copyDir(from, to, filters) {
    fs.readdirSync(from).forEach(it => {
        const sourcePath = path.join(from, it)
        const targetPath = path.join(to, it)
        const statInfo = fs.statSync(sourcePath)
        if (statInfo.isFile()) {
            if (filters.includes(sourcePath)) {
                fs.mkdirSync(path.dirname(targetPath), {recursive: true})
                fs.copyFileSync(sourcePath, targetPath)
            }
        }
        else if (statInfo.isDirectory()) {
            copyDir(sourcePath, targetPath, filters)
        }
    })
}

copySubset()