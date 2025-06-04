export interface Iface {
    foo(value: 'my_literal'): void
    boo(value1: 'my_literal_1', value2: 'my_literal_2'): void
    goo(value1: 'my_literal', value3: string): void
    zoo(value0: string, value1: 'my_literal', value3: string): void
}

export function foo(value: 'my_literal'): void {}
export function boo(value1: 'my_literal_1', value2: 'my_literal_2'): void {}
export function goo(value1: 'my_literal', value3: string): void {}
export function zoo(value1: string, value2: 'my_literal', value3: string): void {}