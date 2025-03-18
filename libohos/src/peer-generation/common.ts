import { LanguageWriter } from "@idlizer/core"
import * as fs from "fs"
import * as path from "path"

export function writeFile(filename: string, content: string, config: { // TODO make content a string or a writer only
        onlyIntegrated: boolean,
        integrated?: boolean,
        message?: string
    }): boolean {
    if (config.integrated || !config.onlyIntegrated) {
        if (config.message)
            console.log(config.message, filename)
        fs.mkdirSync(path.dirname(filename), { recursive: true })
        fs.writeFileSync(filename, content)
        return true
    }
    return false
}

export function writeIntegratedFile(filename: string, content: string, message?: string) {
    writeFile(filename, content, {
        onlyIntegrated: false,
        integrated: true,
        message
    })
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
