# Usage

```
npm run generate:arkts
npm run compile:arkts
npm run compile:native:arkts
npm run start:arkts
```

# Expected behavior

Program output:

```
---- Starting demo: test_promise_idl (execIndex = 0, execLimit = 2) ----
FooWork_constructImpl()
FooWork_CreateImpl(thisPtr)
Inner Promise r created.
FooWork_ExecuteImpl(thisPtr, index, name)
  index = 42 (int32)
  name = Hello world
Outer Promise p created.
main() done.
r.then(): e =  undefined
FooWork_CompleteImpl(OH_NativePointer thisPtr)
  callCounter = 1
resolve() called in r.then()
Outer promise p.then() returns  43
---- Starting demo: test_promise_idl (execIndex = 1, execLimit = 2) ----
FooWork_constructImpl()
FooWork_CreateImpl(thisPtr)
Inner Promise r created.
Outer Promise p created.
FooWork_ExecuteImpl(thisPtr, index, name)
  index = 42 (int32)
  name = Hello world
r.then(): e =  undefined
FooWork_CompleteImpl(OH_NativePointer thisPtr)
  callCounter = 2
reject() called in r.then()
Output promise p.catch() returns  0
```

Notice the order of output: this demo uses a `taskpool` (see `main.ts` for details) for asynchronous execution.

# Current Issues

**(2025.2.25 Update)** 

Failure during `npm run compile:arkts` with error message below:
```
Fatal error: Failed to compile from .../idlize/ohosgen/demos/test_manually_decomposed_promise/src/panda/main.ts to .../idlize/ohosgen/demos/test_manually_decomposed_promise/build/panda/out/main.abc
TypeError: Instance method is used as value [main.ts:10:41]
```

If we change `main.ts:10` to:
```
const r = taskpool.execute(() => work.Execute(42, "Hello world"));
```
then the error message becomes:
```
TypeError: No matching call signature for execute(() => void) [main.ts:11:19]
```