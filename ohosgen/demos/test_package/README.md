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
Starting demo: test_package
FooObject_constructImpl()
FooObject_echoImpl(thisPtr, str)
  str = Hello C++ from foo
FooObject_toInt32Impl(thisPtr)
foo.toInt32() = 1
BarObject_constructImpl()
testBar(prompt="Initial")
BarObject_echoImpl(thisPtr, str)
  str = Hello C++ from bar
BarObject_toInt32Impl(thisPtr)
bar.toInt32() = 2
[TID 18527c] E/runtime: Unhandled exception: escompat.Error
[TID 18527c] E/runtime: Error: Not implemented
...
```

# Current Issues

Get property operation (e.g. `bar.fooObj`) is not implemented when `barObj` is a user-defined type in IDL.
