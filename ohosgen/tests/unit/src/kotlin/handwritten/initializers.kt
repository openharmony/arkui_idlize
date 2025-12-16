/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
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

package handwritten

import test_class_props_initial_values.ClassWithPrimitivePropertyType
import synthetic_types.Tuple_Boolean_Number_String

public class initializers {
    public class test_const { companion object {
        public val CONST_TYPE_NUMBER = 123
    } }

    public class test_constants {
        public class test_constants { companion object {
            public val att1 = 123
            public val att2 = "abc"
        } }
    }

    public class test_class_props_initial_values {
        public class ClassWithPrimitivePropertyTypeNS { companion object {
            public val flag = true
            public val counter = 8.0
        } }
        public class ClassWithComplexPropertyTypeNS { companion object {
            public val prop = object: ClassWithPrimitivePropertyType() {
                public override var flag = true
                public override var counter = 9.0
            }
        } }
    }

    public class test_data_class {
        public class DataClassNS { companion object {
            public val propBoolean = true
            public val propNumber = 12.34
            public val propString = "prop"
            public val propObject = Tuple_Boolean_Number_String(false, 0.0, "value")
        } }
    }

    public class test_transform {
        public class TransformSrcCNS { companion object {
            public val flag = true
        } }
        public class TransformDstCNS { companion object {
            public val state = 1.0
        } }
        public class TransformSrcCallbackCNS { companion object {
            public val flag = true
        } }
    }
}
