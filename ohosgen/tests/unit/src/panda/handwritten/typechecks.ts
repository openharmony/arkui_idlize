import { SingleGenericType, DoubleGenericType } from "../../../generated/arkts"

export namespace typechecks {
    export function isGeneric_Test_unionSingleGenericType_Number<T>(genericType: SingleGenericType<T>) {
        return genericType.value instanceof number
    }
    export function isGeneric_Test_unionSingleGenericType_String<T>(genericType: SingleGenericType<T>) {
        return genericType.value instanceof string
    }
    export function isGeneric_Test_unionDoubleGenericType_Boolean_Number<T, S>(genericType: DoubleGenericType<T, S>) {
        return genericType.valueT instanceof boolean && genericType.valueS instanceof number
    }
    export function isGeneric_Test_unionDoubleGenericType_Number_String<T, S>(genericType: DoubleGenericType<T, S>) {
        return genericType.valueT instanceof number && genericType.valueS instanceof string
    }
}
