import { ImportedHookValue } from "#external_lib"
// import { hook_ns } from "#external_lib"

export interface DTSHookValue {
    count: number
}

export class DTSHookClass {
    method(value: DTSHookValue)
    methodArg(value: DTSHookValue)
    methodReturn(): DTSHookValue
    methodImportedArg(hookedValue: ImportedHookValue)
    methodImportedReturn(): ImportedHookValue
}
