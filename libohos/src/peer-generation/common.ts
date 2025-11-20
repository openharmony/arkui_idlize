import { LanguageWriter, PeerLibrary, LayoutManagerStrategy } from "@idlizer/core"
import * as fs from "fs"
import * as path from "path"

export function writeFile(filename: string, content: string, config?: {
    message?: string
}): boolean {
    if (config?.message)
        console.log(config.message, filename)
    fs.mkdirSync(path.dirname(filename), { recursive: true })
    fs.writeFileSync(filename, content)
    return true
}

///////

export function injectPatch(writer: LanguageWriter, key: string, patches: Map<string, Map<string, string>>) {
    if (patches.has(key)) {
        const record = patches.get(key)!
        if (record.has(writer.language.name)) {
            const text = record.get(writer.language.name)!
            text.split('\n').forEach(line => {
                writer.print(line)
            })
        }
    }
}

export function ScopeLibrarayLayout(library: PeerLibrary, layout: LayoutManagerStrategy, task: () => void): void {
    const temp = library.layout
    library.setFileLayout(layout)
    task()
    library.setFileLayout(temp)
}
