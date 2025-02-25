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
Starting demo: test_modules
FooInt_constructImpl(initialValue)
GlobalScope_bar_bar_getIntWithFooImpl(foo)
foo->value = 42 (int32)
getNumberWithFoo(foo) = 42
FooInt_getIntImpl(thisPtr, offset)
  thisPtr->value = 42 (int32)
  offset = 1 (int32)
getNumber(1) = 43
FooInt_getIntImpl(thisPtr, offset)
  thisPtr->value = 42 (int32)
  offset = 2.25 (float32)
getNumber(2.25) = 44.25
```
