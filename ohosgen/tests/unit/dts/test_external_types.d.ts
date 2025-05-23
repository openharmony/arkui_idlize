import { ExternalType } from "#external_lib"
import { SDKExternalType } from "@external.lib.sdk"

export interface InternalType {
    index: number
    external: ExternalType
}
export class DTSCheckExternalLib {
    checkExternalType(externalType: ExternalType)
    checkInternalTypeWithExternalType(internalType: InternalType)

    checkSDKExternalType(externalType: SDKExternalType)
}
