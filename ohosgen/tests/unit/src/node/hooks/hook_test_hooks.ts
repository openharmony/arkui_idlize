import { DTSHookClass, DTSHookValue } from "#compat"
import { ImportedHookValue } from "#hooks_sample"

export function hook_DTSHookClass_methodArg(receiver: DTSHookClass, value: DTSHookValue) {
    console.log(`[managed] [1] call hook_DTSHookClass_methodArg(receiver = ${receiver}, value count = ${value.count})`)
}

export function hook_DTSHookClass_methodReturn(receiver: DTSHookClass): DTSHookValue {
    const value = { count: 902 }
    console.log(`[managed] [2] call hook_DTSHookClass_methodReturn(receiver = ${receiver}, value count = ${value.count})`)
    return value
}

export function hook_DTSHookClass_methodImportedArg(receiver: DTSHookClass, value: ImportedHookValue) {
    console.log(`[managed] [3] call hook_DTSHookClass_methodImportedArg(receiver = ${receiver}, value count = ${value.count})`)
}

export function hook_DTSHookClass_methodImportedReturn(receiver: DTSHookClass): ImportedHookValue {
    const value: ImportedHookValue = { count: 904 }
    console.log(`[managed] [4] call hook_DTSHookClass_methodReturn(receiver = ${receiver}, value count = ${value.count})`)
    return value
}
