export type pointer = bigint
export type int32 = number
export type float32 = number
export type KPointer = pointer
export type Finalizable = { ptr: pointer }

export const nullptr: pointer = BigInt(0)
