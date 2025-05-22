import * as idl from '../idl'
import { ReferenceResolver } from './ReferenceResolver'
import { generatorConfiguration } from '../config'

export function isExternalType(declaration: idl.IDLInterface, resolver: ReferenceResolver): boolean {
    return generatorConfiguration().externalTypes.get(declaration.name) != undefined
}