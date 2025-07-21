import { InternalModuleDataInterface } from "@internal.lib"
import { RenamedModuleDataInterface } from "@renamed.lib"

export class DTSCheckInternalLib {
    checkInternalDataInterface(internalType: InternalModuleDataInterface): number
    checkRenamedModuleDataInterface(renamedModuleType: RenamedModuleDataInterface): number
}
