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

// Test file with long lines for functionality verification
export class TestClass {
  private veryLongMethodNameThatExceedsTheMaximumLineLengthAndShouldBeFormattedProperly(): string {
    return "This is a very long string that should be formatted properly when the line length exceeds the maximum allowed length";
  }

  public anotherMethodWithVeryLongParameters(
    parameter1: string,
    parameter2: number,
    parameter3: boolean,
    parameter4: object,
    parameter5: any
  ): void {
    console.log("This method has very long parameters that should be formatted properly");
  }

  public methodWithLongObjectLiteral(): object {
    return {
      property1: "This is a very long property value that should be formatted properly",
      property2: "Another very long property value that should be formatted properly",
      property3: "Yet another very long property value that should be formatted properly"
    };
  }

  public methodWithLongArray(): string[] {
    return [
      "This is a very long array element that should be formatted properly",
      "Another very long array element that should be formatted properly",
      "Yet another very long array element that should be formatted properly"
    ];
  }
}