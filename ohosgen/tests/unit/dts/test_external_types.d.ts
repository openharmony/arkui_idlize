import { ExternalType, hookns, ExternalClass, ExternalModuleDataInterface} from "@external.lib"

export interface InternalType {
    index: number
    // TBD:
    // external: ExternalType
}
export class DTSCheckExternalLib {

    checkExternalDataInterface(externalType: ExternalModuleDataInterface): number

    checkExternalType(externalType: ExternalType)
    checkExternalClass(externalClass: ExternalClass)
    checkNSExternalType(externalType: hookns.NSExternalType)
    checkSubNSExternalType(externalType: hookns.subhookns.SubNSExternalType)
    // checkInternalTypeWithExternalType(internalType: InternalType)
}
