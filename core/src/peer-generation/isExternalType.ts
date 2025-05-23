import * as idl from '../idl'
import { ReferenceResolver } from './ReferenceResolver'
import { generatorConfiguration } from '../config'

export function isExternalType(declaration: idl.IDLInterface, resolver: ReferenceResolver): boolean {
    // declarations outside of the generator input dirs
    if (generatorConfiguration().externalTypes.get(declaration.name) != undefined) return true
    // treat as external types only declarations with methods
    if (declaration.methods.length == 0) return false
    const pack = idl.getPackageName(declaration)
    if (generatorConfiguration().externalPackages.includes(pack)) return true
    return false
}
