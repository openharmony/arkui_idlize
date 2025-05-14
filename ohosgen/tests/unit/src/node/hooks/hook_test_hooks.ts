import { DTSHookClass, DTSHookValue } from "#compat"
import { hook_ns } from "#hooks_sample"

export function hook_DTSHookClass_method2(receiver: DTSHookClass, value: DTSHookValue) {
    console.log(`[managed] call hook_DTSHookClass_method2(receiver = ${receiver}, value count = ${value.count})`)
}

export function hook_DTSHookClass_method3(receiver: DTSHookClass, value: hook_ns.ImportedHookValue) {
    console.log(`[managed] call hook_DTSHookClass_method3(receiver = ${receiver}, value count = ${value.count})`)
}
