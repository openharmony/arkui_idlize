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
Starting demo: test_modules
======== Foo ========
FooInt_constructImpl(initialValue)
GlobalScope_qux_qux_getIntWithFooImpl(foo)
foo->value = 42 (int32)
getIntWithFoo(foo) = 42
FooInt_getIntImpl(thisPtr, offset)
  thisPtr->value = 42 (int32)
  offset = 2.25 (float32)
foo.getInt(2.25) = 44.25
======== Bar ========
BarInt_constructImpl(vx, vy)
  vx = 1000 (int32)
  vy = 1500 (int32)GlobalScope_qux_qux_getIntWithBarImpl(bar, offset)
  offset = 17 (int32)
getIntWithBar(bar) = 2517
BarInt_getIntImpl(thisPtr, offset)
  offset = 2.25 (float32)
bar.getInt(2.25) = 2502.25
======== Baz ========
BazInt_constructImpl(f, bx, by)
  f = 2000 (int32)
  bx = 2300 (int32)
  by = 2600 (int32)
GlobalScope_qux_qux_getIntWithBazImpl(baz, offset, message)
  offset = 34 (int32)
  message = hello C++ from TS
getIntWithBaz(baz) = 6934
BazInt_getIntImpl(thisPtr, offset)
  offset = 2.25 (float32)
baz.getInt(2.25) = 6902.25
======== Extra: get property ========
FooInt_constructImpl(initialValue)
BarInt_setXImpl(thisPtr, value)
Set property bar.x done.
BarInt_getIntImpl(thisPtr, offset)
  offset = 2.25 (float32)
bar.getInt(2.25) after setting bar.x = 11502.25
[TID 0b7448] E/runtime: Unhandled exception: escompat.Error
[TID 0b7448] E/runtime: Error: Not implemented
[TID 0b7448] E/runtime:         at escompat.Error.<ctor> (<unknown>:44)
[TID 0b7448] E/runtime:         at @test-modules-multilevel.generated.arkts.OHBarIntMaterialized.BarInt.<get>x (...idlize/ohosgen/demos/test_modules_multilevel/generated/arkts/OHBarIntMaterialized.ts:40)
[TID 0b7448] E/runtime:         at @test-modules-multilevel.src.panda.main.ETSGLOBAL.mainBody (...idlize/ohosgen/demos/test_modules_multilevel/src/panda/main.ts:40)
[TID 0b7448] E/runtime:         at @test-modules-multilevel.src.panda.main.ETSGLOBAL.main (...idlize/ohosgen/demos/test_modules_multilevel/src/panda/main.ts:64)
```

# Current Issue

Get property operation (e.g. `bar.x`) is not implemented when `x` is a user-defined type in d.ts.
