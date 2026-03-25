/*
 * Copyright (c) 2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


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
            export const prop = { flag: true, counter: 9 }
        }
    }
    export namespace test_data_class {
        export namespace DataClassNS {
            export const propBoolean = true
            export const propNumber = 12.34
            export const propString = "prop"
            export const propObject = [false, 0, "value"]
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