declare interface UtilityInterface {
    fieldString: string,
    fieldBoolean: boolean,
    fieldArrayNumber: number[]
}

declare namespace test_materialized_classes {

    class StaticMaterialized {
        static method(valNumber: number, valString: string): void
    }

    class MaterializedOverloadedMethods {
        method1(valBoolean: boolean, valString: string): void
        // method1(valBoolean: boolean, valString?: string): void
        method1(valBoolean?: boolean, valString?: string): void
        method1(): void
    }

    class MaterializedMoreOverloadedMethods extends MaterializedOverloadedMethods {
        method2(): void
        method2(valNumber: number): void
        method2(valNumber: number, valString: string): void
    }

    class MaterializedWithConstructorAndFields extends MaterializedMoreOverloadedMethods {
        valNumber: number
        valBoolean: boolean
        constructor(valNumber: number, valBoolean: boolean)
    }

    class MaterializedWithCreateMethod extends MaterializedWithConstructorAndFields {
        static create(valNumber: number, valBoolean: boolean): MaterializedWithCreateMethod
    }


    class MaterializedComplexArguments extends MaterializedWithCreateMethod {
        method3(interface: UtilityInterface): UtilityInterface
        method4(array: number[]): string[]
        method5(arrayInterfaces: UtilityInterface[]): UtilityInterface[]
    }

}