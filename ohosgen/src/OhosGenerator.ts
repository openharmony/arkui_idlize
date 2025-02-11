import * as fs from 'fs'
import * as path from 'path'
import {
    setDefaultConfiguration,
    toIDLFile,
    lib,
    IDLLibrary,
    QueryType,
    GeneratorConfiguration,
    DefaultConfiguration
} from '@idlizer/core'

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
                .pipe(lib.select.nodes({ expandNamespaces: true }))
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

export function generateOhos(outDir: string, inputFiles: string[], defaultIdlPackage?: string): void {
    setDefaultConfiguration(new OhosConfiguration({ prefix: "XML" }))
    const generatedSubDir = path.join(outDir, 'generated')
    if (!fs.existsSync(generatedSubDir)) fs.mkdirSync(outDir, { recursive: true })
    const visitor = new OHOSVisitor(inputFiles /**, defaultIdlPackage */)
    visitor.execute(generatedSubDir)
}

class OhosConfiguration extends DefaultConfiguration {
    prefix: string
    constructor(data?: Partial<OhosConfiguration>) {
        super(data)
        Object.assign(this, data)
    }
}
