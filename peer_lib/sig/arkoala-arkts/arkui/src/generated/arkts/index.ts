import { TypeChecker as TypeChecker1 } from "./type_check"
import { NativeModule as NativeModule1, nativeModule as nativeModule1 } from "./NativeModule"

// TODO hack: arkts has problems with reexporting, ideally should be like
// export * from "./type_check"
// export * from "./NativeModule"
export type TypeChecker = TypeChecker1
export type NativeModule = NativeModule1
export const nativeModule = nativeModule1
