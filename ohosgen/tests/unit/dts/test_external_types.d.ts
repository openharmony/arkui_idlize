import { ExternalType } from "#external_lib"

export interface InternalType {
    index: number
    external: ExternalType
}
export class DTSCheckExternalLib {
    checkExternalType(externalType: ExternalType)
    checkInternalTypeWithExternalType(internalType: InternalType)
}