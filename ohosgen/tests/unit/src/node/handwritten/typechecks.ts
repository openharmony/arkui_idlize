import { SingleGenericType, DoubleGenericType } from "../../../generated/ts"

export namespace typechecks {
    export function isGeneric_Test_unionSingleGenericType_Number<T>(genericType: SingleGenericType<T>) {
        return typeof genericType.value === 'number'
    }
    export function isGeneric_Test_unionSingleGenericType_String<T>(genericType: SingleGenericType<T>) {
        return typeof genericType.value === 'string'
    }
    export function isGeneric_Test_unionDoubleGenericType_Boolean_Number<T, S>(genericType: DoubleGenericType<T, S>) {
        return typeof genericType.valueT === 'boolean' && typeof genericType.valueS === 'number'
    }
    export function isGeneric_Test_unionDoubleGenericType_Number_String<T, S>(genericType: DoubleGenericType<T, S>) {
        return typeof genericType.valueT === 'number' && typeof genericType.valueS === 'string'
    }
}
