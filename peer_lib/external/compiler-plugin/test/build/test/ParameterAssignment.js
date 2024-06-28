import { __memo_context_type, __memo_id_type } from "./context.test";
/** @memo */
function foo(__memo_context, __memo_id, x) {
    var __memo_scope = __memo_context.scope(__memo_id + "0___key_id_DIRNAME/ParameterAssignment.ts", 1);
    var __memo_parameter_x = __memo_scope.param(0, x);
    if (__memo_scope.unchanged)
        return __memo_scope.cached;
    __memo_parameter_x.value = 10;
    return __memo_scope.recache();
}
