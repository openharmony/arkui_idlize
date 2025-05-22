import { DTSHookClass, DTSHookValue } from "#compat"
import { ImportedHookValue } from "#external_lib"

export function customHookDTSHookClassMethodArg(receiver: DTSHookClass, value: DTSHookValue) {
    console.log(`[managed] [1] call customHookDTSHookClassMethodArg(receiver = ${receiver}, value count = ${value.count})`)
}

export function hookDTSHookClassMethodReturn(receiver: DTSHookClass): DTSHookValue {
    const value: DTSHookValue = { count: 902 }
    console.log(`[managed] [2] call hook_DTSHookClass_methodReturn(receiver = ${receiver}, value count = ${value.count})`)
    return value
}

export function hookDTSHookClassImportedArg(receiver: DTSHookClass, value: ImportedHookValue) {
    console.log(`[managed] [3] call hook_DTSHookClass_methodImportedArg(receiver = ${receiver}, value count = ${value.count})`)
}

export function customHookDTSHookClassMethodImportedReturn(receiver: DTSHookClass): ImportedHookValue {
    const value: ImportedHookValue = { count: 904 }
    console.log(`[managed] [4] call hook_DTSHookClass_methodReturn(receiver = ${receiver}, value count = ${value.count})`)
    return value
}
