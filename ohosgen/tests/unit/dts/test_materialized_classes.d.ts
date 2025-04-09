export interface UtilityInterface {
    fieldString: string,
    fieldBoolean: boolean,
    fieldArrayNumber: number[]
}

export namespace test_materialized_classes {

    export class StaticMaterialized {
        static method(valNumber: number, valString: string): void
    }

    export class MaterializedOverloadedMethods {
        method1(valBoolean: boolean, valString: string): void
        // method1(valBoolean: boolean, valString?: string): void
        method1(valBoolean?: boolean, valString?: string): void
        method1(): void
    }

    export class MaterializedMoreOverloadedMethods extends MaterializedOverloadedMethods {
        method2(): void
        method2(valNumber: number): void
        method2(valNumber: number, valString: string): void
    }

    export class MaterializedWithConstructorAndFields extends MaterializedMoreOverloadedMethods {
        valNumber: number
        valBoolean: boolean
        constructor(valNumber: number, valBoolean: boolean)
    }

    export class MaterializedWithCreateMethod extends MaterializedWithConstructorAndFields {
        static create(valNumber: number, valBoolean: boolean): MaterializedWithCreateMethod
    }


    export class MaterializedComplexArguments extends MaterializedWithCreateMethod {
        method3(interface: UtilityInterface): UtilityInterface
        method4(array: number[]): string[]
        method5(arrayInterfaces: UtilityInterface[]): UtilityInterface[]
    }

}