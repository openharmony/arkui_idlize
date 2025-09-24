import fs from "fs"
import path from "path"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = dirname(fileURLToPath(import.meta.url))

export const External = path.join(__dirname, "../../external")
export const ExternalStubs = path.join(External, "subset")
export const Subset = path.join(__dirname, "../external-subset")
export const SubsetJson = path.join(ExternalStubs, "subset.json")

const data = JSON.parse(fs.readFileSync(SubsetJson).toString())
if (!data) throw new Error(`Cannot parse ${SubsetJson}`)

export function copySubset() {
    if (fs.existsSync(Subset))
        fs.rmSync(Subset, {recursive: true, force: true});

    fs.mkdirSync(Subset)

    const filters = data.subset.map(it => path.join(External, it))
    copyDir(External, Subset, filters)
    copyDir(ExternalStubs, Subset)
}

function copyDir(from, to, filters) {
    fs.readdirSync(from, { recursive: true, withFileTypes: true }).forEach(it => {
        if (!it.isFile()) {
            return
        }
        const relativePath = path.relative(from, path.join(it.parentPath, it.name))
        const sourcePath = path.join(from, relativePath)
        const targetPath = path.join(to, relativePath)
        if (!filters || filters.includes(sourcePath)) {
            fs.mkdirSync(path.dirname(targetPath), {recursive: true})
            fs.copyFileSync(sourcePath, targetPath)
        }
    })
}

copySubset()