
import { ClassWithPrimitivePropertyType } from "../../../generated/arkts"

export namespace initializers {

    export namespace test_const {
        export const CONST_TYPE_NUMBER = 123
    }

    export namespace test_constants {
        export namespace test_constants {
            export const att1 = 123
            export const att2 = "abc"
        }
    }

    export namespace test_class_props_initial_values {
        export namespace ClassWithPrimitivePropertyTypeNS {
            export const flag = true
            export const counter = 8
        }
        export namespace ClassWithComplexPropertyTypeNS {
            export const prop: ClassWithPrimitivePropertyType = { flag: true, counter: 9 }
        }
    }

    export namespace test_data_class {
        export namespace DataClassNS {
            export const propBoolean = true
            export const propNumber = 12.34
            export const propString = "prop"
            export const propObject: [boolean, number, string] = [false, 0, "value"]
        }
    }

    export namespace test_transform {
        export namespace TransformSrcCNS {
            export const flag = true
        }
        export namespace TransformDstCNS {
            export const state = 1
        }
        export namespace TransformSrcCallbackCNS {
            export const flag = true
        }
    }
}