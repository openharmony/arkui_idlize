import { ExternalType } from "#external_lib"
import { hookns, hooksns.subhookns } from "#external_lib"
import { SDKExternalType } from "@external.lib.sdk"

export interface InternalType {
    index: number
    external: ExternalType
}
export class DTSCheckExternalLib {
    checkExternalType(externalType: ExternalType)
    checkNSExternalType(externalType: hookns.NSExternalType)
    checkSubNSExternalType(externalType: hookns.subhookns.SubNSExternalType)
    checkInternalTypeWithExternalType(internalType: InternalType)

    checkSDKExternalType(externalType: SDKExternalType)
}
