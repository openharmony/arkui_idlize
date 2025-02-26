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
Starting demo: test_generic_callback
Foo_constructImpl()
Foo_getXImpl(thisPtr)
foo.getX() = 1
Foo_callCBImpl(thisPtr, y, cb)
  y = 42 (int32)
Callback invoked From TS: x = 43
```

# Current Issues

**(2025.2.25 Update)** Failure during `npm run compile:arkts` with error message below:
```
Fatal error: Failed to compile from .../idlize/ohosgen/demos/test_generic_callback_named/src/panda/main.ts to .../idlize/ohosgen/demos/test_generic_callback_named/build/panda/out/main.abc
TypeError: Cannot infer type for cb because class composite needs an explicit target type [main.ts:6:11]
```

If we change `main.ts` as the following:
```
import { Callback } from "../../dts/interfaces/callback";
const cb: Callback<string> = {
    onSuccess: (result: string) => { /* ... */ },
    onFailure: (errorCode: number) => { /* ... */ },
};
```
Then error message becomes:
```
Fatal error: Failed to compile from .../idlize/ohosgen/demos/test_generic_callback_named/src/panda/main.ts to .../idlize/ohosgen/demos/test_generic_callback_named/build/panda/out/main.abc
TypeError: Method 'onSuccess' cannot be used as a key of object literal. [main.ts:7:9]
TypeError: No matching call signature for call(Callback<String>) [main.ts:16:5]
TypeError: Type 'Callback<String>' is not compatible with type '(parameter: String) => void' at index 1 [main.ts:16:14]
```
