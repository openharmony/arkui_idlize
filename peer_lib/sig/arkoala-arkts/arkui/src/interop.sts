export type NodePointer = pointer // todo: move to NativeModule

export type KStringPtr = int | string | null
export type KStringPtrArray = int | byte[] | null
export type KUint8ArrayPtr = int | byte[] | null
export type KInt32ArrayPtr = int | byte[] | null
export type KFloat32ArrayPtr = int | Float32Array | null
export type KInt = int
export type KUInt = KInt
export type KBoolean = int
export type KFloat = float
export type KPointer = long // look once again
export type pointer = KPointer
export type KNativePointer = KPointer


export const nullptr: pointer = 0

//TODO: needs to be implemented correctly
export type CallbackType = (args: Uint8Array, length: int) => int
export function wrapCallback(callback: CallbackType, autoDisposable: boolean = true): int {
    return 0
}
