import { __memo_context_type, __memo_id_type } from "./context.test";
/*
 * Copyright (c) 2022-2023 Huawei Device Co., Ltd.
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
/** @memo */
function foo(__memo_context, __memo_id) {
    var __memo_scope = __memo_context.scope(__memo_id + "0___key_id_DIRNAME/no_memo_entry.input.ts");
    if (__memo_scope.unchanged)
        return __memo_scope.cached;
    return __memo_scope.recache();
}
function bar() {
    foo(__memo_context, __memo_id + "1___key_id_DIRNAME/no_memo_entry.input.ts");
}
