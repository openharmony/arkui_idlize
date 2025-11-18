export interface OptionalInterface {
    propBoolean: boolean
    propNumber: number
    propString: string

    propBooleanOptional?: boolean
    propNumberOptional?: number
    propStringOptional?: string

    method(paramBoolean: boolean, paramNumber: number, paramString: string): void
    methodOptional(paramBoolean?: boolean, paramNumber?: number, paramString?: string): void
}