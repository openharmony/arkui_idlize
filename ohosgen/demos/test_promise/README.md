# Usage

```
npm run generate:arkts
npm run compile:arkts
npm run compile:native:arkts
npm run start:arkts
```

# Current behavior

Program output:

```
Starting demo: test_promise
Foo_constructImpl(value)
Foo_getNumberDelayedImpl(thisPtr, seconds, outputArgumentForReturningPromise)
  seconds = 3 (int32)
Promise created.
Foo_getNumberDelayedImpl(thisPtr, seconds, outputArgumentForReturningPromise)
  seconds = 3 (int32)
Promise created.
Returned value = 42
Returned value = 42
```

# Current Issues

The generated glue code makes a "fake Promise":
`main.ts` waits for `Foo_getNumberDelayedImpl` in a **synchronous** manner and the program gets **blocked**
until the Promise execution finishes.
