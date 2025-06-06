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