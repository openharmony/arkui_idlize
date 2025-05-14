import hook_ns from "#hooks_sample"

export interface DTSHookValue {
    count: number
}

// export class DTSHandwrittenValue {
//     method()
// }

export class DTSHookClass {
    method1(value: DTSHookValue)
    method2(value: DTSHookValue)
    // method3(value: hook_ns.ImportedHookValue)
}

