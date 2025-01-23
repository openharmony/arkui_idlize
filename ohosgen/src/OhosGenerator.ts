import * as fs from 'fs'
import * as path from 'path'
import { GeneratorConfiguration, setDefaultConfiguration, toIDLFile, IDLFile, lib, IDLLibrary, QueryType } from '@idlize/core'

class OHOSVisitor {

    library: IDLLibrary
    constructor(files: string[]) {
       this.library = lib.createLibrary(files.map(toIDLFile))
    }
    query<T>(q:QueryType<T>): T {
        return lib.query(this.library, q)
    }
    execute(outDir: string) {
        const forEachInterface =
            lib.lens(lib.select.files())
                .pipe(lib.select.entities(true))
                .pipe(lib.select.interfaces())

        const firstInterface = this.query(forEachInterface.pipe(lib.utils.fst()))
        const lastInterface = this.query(forEachInterface.pipe(lib.utils.lst()))

        if (firstInterface) {
            console.log(firstInterface.name)
        }
        if (lastInterface) {
            console.log(lastInterface.name)
        }
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