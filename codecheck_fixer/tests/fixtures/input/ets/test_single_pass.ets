// Test single-pass formatting with very long line (more than 300 characters)
export class VeryLongClassName extends BaseClassWithLongName implements InterfaceOne, InterfaceTwo, InterfaceThree, InterfaceFour, InterfaceFive, InterfaceSix, InterfaceSeven {
    veryLongMethodName(parameterOne: string, parameterTwo: number, parameterThree: boolean, parameterFour: Date, parameterFive: object, parameterSix: string[], parameterSeven: Map<string, number>): Promise<VeryLongReturnType> {
        return Promise.resolve({ field1: 'value1', field2: 'value2', field3: 'value3', field4: 'value4', field5: 'value5', field6: 'value6' });
  }
}

