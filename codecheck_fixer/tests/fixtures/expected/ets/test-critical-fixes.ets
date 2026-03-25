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

// Test case 1: throw new Error with very long string
export class TestCase1 {
    deserialize() {
throw new Error('One of the branches for maxFontSizeTmpBuf_BufU has to be chosen through deserialisation. One of the
......')
    }
}

// Test case 2: Long union types
export class TestCase2 {
modifier?: AttributeModifier<LazyVGridLayoutAttribute> | AttributeModifier<LazyGridLayoutAttribute> |
AttributeModifier<CommonMethod> | undefined;
}

// Test case 3: Nested function calls
export function testCase3() {
return someVeryLongFunctionName(anotherLongFunctionName(yetAnotherLongFunctionName(parameter1, parameter2,
parameter3)));
}

// Test case 4: Long string with throw operator and indentation
export class TestCase4 {
    processBuffer() {
throw new Error( 'One of the branches for maxFontSizeTmpBuf_BufU has to be chosen through deserialisation. One of the
...' )
    }
}

