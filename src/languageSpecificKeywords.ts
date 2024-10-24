// See https://en.cppreference.com/w/cpp/keyword.
export const cppKeywords = new Set([
    `alignas`, `alignof`, `and`,
    `and_eq`, `asm`, `atomic_cancel`, `atomic_commit`,
    `atomic_noexcept`, `auto`, `bitand`, `bitor`, `bool`,
    `break`, `case`, `catch`, `char`, `char8_t`, `char16_t`,
    `char32_t`, `class`, `compl`, `concept`, `const`, `consteval`,
    `constexpr`, `constinit`, `const_cast`, `continue`, `co_await`,
    `co_return`, `co_yield`, `decltype`, `default`, `delete`, `do`,
    `double`, `dynamic_cast`, `else`, `enum`, `explicit`, `export`,
    `extern`, `false`, `float`, `for`, `friend`, `goto`, `if`,
    `inline`, `int`, `long`, `mutable`, `namespace`, `new`, `noexcept`,
    `not`, `not_eq`, `nullptr`, `operator`, `or`, `or_eq`, `private`,
    `protected`, `public`, `reflexpr`, `register`, `reinterpret_cast`,
    `requires`, `return`, `short`, `signed`,
    `sizeof`, `static`, `static_assert`, `static_cast`,
    `struct`, `switch`, `synchronized`, `template`,
    `this`, `thread_local`, `throw`, `true`, `try`,
    `typedef`, `typeid`, `typename`, `union`,
    `unsigned`, `using`, `virtual`, `void`,
    `volatile`, `wchar_t`, `while`, `xor`,
    `xor_eq`
])

export const CJKeywords = new Set([
    'Int8', 'Int16', 'Int32', 'Int64', 'IntNative',
    'UInt8', 'UInt16', 'UInt32', 'UInt64', 'UIntNative',
    'Float16', 'Float32', 'Float64', 'Rune',
    'Bool', 'Unit', 'Nothing', 'struct',
    'enum', 'This', 'package', 'import',
    'class', 'interface', 'func', 'main',
    'let', 'var', 'const', 'type', 'init',
    'this', 'super', 'if', 'else', 'case',
    'try', 'catch', 'finally', 'for', 'do',
    'while', 'throw', 'return', 'continue',
    'break', 'is', 'as', 'in', 'match',
    'from', 'where', 'extend', 'spawn',
    'synchronized', 'macro', 'quote', 'true',
    'false', 'static', 'public', 'private',
    'protected', 'override', 'redef', 'abstract',
    'open', 'operator', 'foreign', 'inout',
    'prop', 'mut', 'unsafe', 'get', 'set'
])

export const IDLKeywords = new Set([
    'sequence', 'record', 'or', 'toString', 'Int8Array', 'interface', 'number', 'undefined'
])