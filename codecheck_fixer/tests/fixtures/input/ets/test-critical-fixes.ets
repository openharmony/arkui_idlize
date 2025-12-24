// Тест-кейс 1: throw new Error с очень длинной строкой
export class TestCase1 {
    deserialize() {
        throw new Error("One of the branches for maxFontSizeTmpBuf_BufU has to be chosen through deserialisation. One of the ......")
    }
}

// Тест-кейс 2: Длинные union types
export class TestCase2 {
    modifier?: AttributeModifier<LazyVGridLayoutAttribute> | AttributeModifier<LazyGridLayoutAttribute> | AttributeModifier<CommonMethod> | undefined;
}

// Тест-кейс 3: Вложенные вызовы функций
export function testCase3() {
    return someVeryLongFunctionName(anotherLongFunctionName(yetAnotherLongFunctionName(parameter1, parameter2, parameter3)));
}

// Тест-кейс 4: Длинная строка с оператором throw и отступами
export class TestCase4 {
    processBuffer() {
        throw new Error( "One of the branches for maxFontSizeTmpBuf_BufU has to be chosen through deserialisation. One of the ..." )
    }
}

