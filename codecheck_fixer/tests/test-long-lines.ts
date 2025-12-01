// Тестовый файл с длинными строками для проверки функциональности
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