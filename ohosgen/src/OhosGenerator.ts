import * as fs from 'fs'
import * as path from 'path'
import * as idl from '@idlize/core/idl'

import { GeneratorConfiguration, setDefaultConfiguration, toIDL } from '@idlize/core'

class IDLFile {
    constructor(public entries: idl.IDLEntry[]) {}
}

class OHOSVisitor {
    idls: IDLFile[]
    constructor(private files: string[]) {
        this.idls = files.map(it => new IDLFile(toIDL(it)))
    }
    execute(outDir: string) {
        this.idls.forEach(idl => {
            console.log(`first ${idl.entries[0].name}`)
        })
    }
}

export function generateOhos(outDir: string, inputFiles: string[]): void {
    setDefaultConfiguration(new OhosConfiguration({
        "prefix": "XML"
    }))
    const generatedSubDir = path.join(outDir, 'generated')
    if (!fs.existsSync(generatedSubDir)) fs.mkdirSync(outDir, { recursive: true })
    const visitor = new OHOSVisitor(inputFiles)
    visitor.execute(generatedSubDir)
}

class OhosConfiguration implements GeneratorConfiguration {
    constructor(private params: Record<string, any>) {
    }

    param<T>(name: string): T {
        if (name in this.params) {
            return this.params[name] as T
        }
        throw new Error(`${name} is unknown`)
    }
    paramArray<T>(name: string): T[] {
        throw new Error(`array ${name} is unknown`)
    }
}