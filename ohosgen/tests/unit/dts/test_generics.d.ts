
export namespace generics {
    interface Y<A, B> {
        bar(y:B): A
    }
    interface X<A extends object, B extends number = number, C = void> extends Y<A, B> {
        foo(x:A, y:B): C
    }
}
