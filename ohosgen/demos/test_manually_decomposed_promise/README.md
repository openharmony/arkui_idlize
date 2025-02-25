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
