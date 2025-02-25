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

In `main.ts`:
```
// import { Callback } from "../../dts/interfaces/callback";
const cb /* : Callback<number> */ = (x: number) => {
    console.log(`Callback invoked From TS: x = ${x}`);
};
```
The interface `Callback` can not be imported explicitly. Error message see below:
```
Fatal error: Failed to compile from .../idlize/ohosgen/demos/test_generic_callback/src/panda/main.ts to .../idlize/ohosgen/demos/test_generic_callback/build/panda/out/main.abc
SyntaxError: Unexpected token, expected 'private' or identifier [callback.d.ts:2:5]
SyntaxError: Unexpected token, expected ','. [callback.d.ts:2:10]
SyntaxError: Unexpected token, expected 'private' or identifier [callback.d.ts:2:10]
SyntaxError: Identifier expected [callback.d.ts:2:11]
SyntaxError: Unexpected token, expected ','. [callback.d.ts:2:11]
SyntaxError: Unexpected token, expected 'private' or identifier [callback.d.ts:2:11]
SyntaxError: Interface fields must have type annotation. [callback.d.ts:2:17]
SyntaxError: Invalid Type [callback.d.ts:3:1]
TypeError: Type '(x: double) => void' cannot be assigned to type 'Callback<Double>' [main.ts:6:34]
TypeError: No matching call signature for callCB(int, Callback<Double>) [main.ts:11:5]
TypeError: Type 'Callback<Double>' is not compatible with type '(p1: Double) => void' at index 2 [main.ts:11:20]
```
