declare namespace MyNamespace {
    export interface MyInterface {
        property: number
    }

    export enum MyEnum1 {
        red,
        green,
    }

    export enum MyEnum2 {
        yellow,
        blue
    }
}

declare function MyFunc1(a: MyNamespace.MyEnum1 | MyNamespace.MyEnum2): boolean
declare function MyFunc2(a: Record<string, MyNamespace.MyInterface>): boolean


export namespace hello {
    export namespace MyNamespace {
        export interface FooXXX {
            getX(): number
        }
    }
    export interface FooXXX {
        getY(): number
    }
    export function MyFunc(a: MyNamespace.FooXXX): boolean
}
