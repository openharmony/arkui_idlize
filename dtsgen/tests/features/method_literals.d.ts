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

export interface Iface {
    foo(value: 'my_literal'): void
    boo(value1: 'my_literal_1', value2: 'my_literal_2'): void
    goo(value1: 'my_literal', value3: string): void
    zoo(value0: string, value1: 'my_literal', value3: string): void
}

export function foo(value: 'my_literal'): void
export function boo(value1: 'my_literal_1', value2: 'my_literal_2'): void
export function goo(value1: 'my_literal', value3: string): void
export function zoo(value1: string, value2: 'my_literal', value3: string): void