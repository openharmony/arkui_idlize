import { ImportedHookValue } from "#hooks_sample"
// import { hook_ns } from "#hooks_sample"

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
