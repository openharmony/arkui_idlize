import { pointer, KNativePointer } from "@koalaui/interop"
import { Finalizable } from "@koalaui/arkoala"
import { float32, int32 } from "@koalaui/common"
import { MyClass } from "./Classes"

export declare class Paint extends Finalizable {
    constructor(ptr: pointer);
    static getFinalizer(): KNativePointer;
    static make(): Paint;
    testMethod(param: float32, param_?: int32): MyClass
    testMethod1(param: float32 | int32 | string | MyClass): MyClass
    testMethod2(param: float32 | int32, param_: MyClass): MyClass
}

export declare class CustomPaint extends Paint {
    constructor(ptr: pointer)
    testCustomMethod(param: int32): float32
}