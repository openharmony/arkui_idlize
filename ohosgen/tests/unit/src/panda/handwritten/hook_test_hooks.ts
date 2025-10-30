import { DTSHookClass, DTSHookInterface, DTSHookValue } from "#compat"
import { ImportedHookValue } from "@external.lib"

export function customHookDTSHookClassMethodArg(receiver: DTSHookClass, value: DTSHookValue) {
    console.log(`[managed] [1] call hook_DTSHookClass_methodArg(receiver = ${receiver}, value count = ${value.count})`)
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

export function customHookDTSHookInterfaceMethodArg(receiver: DTSHookInterface, value: DTSHookValue) {
    console.log(`[managed] [1] call hook_DTSHookInterface_methodArg(receiver = ${receiver}, value count = ${value.count})`)
}

export function hookDTSHookInterfaceMethodReturn(receiver: DTSHookInterface): DTSHookValue {
    const value: DTSHookValue = { count: 902 }
    console.log(`[managed] [2] call hook_DTSHookInterface_methodReturn(receiver = ${receiver}, value count = ${value.count})`)
    return value
}

export function hookDTSHookInterfaceImportedArg(receiver: DTSHookInterface, value: ImportedHookValue) {
    console.log(`[managed] [3] call hook_DTSHookInterface_methodImportedArg(receiver = ${receiver}, value count = ${value.count})`)
}

export function customHookDTSHookInterfaceMethodImportedReturn(receiver: DTSHookInterface): ImportedHookValue {
    const value: ImportedHookValue = { count: 904 }
    console.log(`[managed] [4] call hook_DTSHookInterface_methodReturn(receiver = ${receiver}, value count = ${value.count})`)
    return value
}
