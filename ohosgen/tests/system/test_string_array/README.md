# Current Output

Runtime error with message below:
```
Starting demo: test_string_array
Foo_constructImpl()
FooObject() with index = 1
Foo_getStringImpl(thisPtr)
foo.getString() = 'FooObject{.index = 1}' (call counter = 1)
Foo_getResultImpl(thisPtr)
[TID 2944bb] E/runtime: Unhandled exception: std.core.RangeError
[TID 2944bb] E/runtime: RangeError: Out of bounds
[TID 2944bb] E/runtime:         at std.core.RangeError.<ctor> (<unknown>:81)
[TID 2944bb] E/runtime:         at escompat.Array.$_set (<unknown>:103)
[TID 2944bb] E/runtime:         at @test-string-array.generated.arkts.peers.Deserializer.Deserializer.readFooResult (.../idlize/ohosgen/demos/test_string_array/generated/arkts/peers/Deserializer.ts:39)
[TID 2944bb] E/runtime:         at @test-string-array.generated.arkts.OHFooMaterialized.Foo.getResult_serialize (.../idlize/ohosgen/demos/test_string_array/generated/arkts/OHFooMaterialized.ts:69)
[TID 2944bb] E/runtime:         at @test-string-array.generated.arkts.OHFooMaterialized.Foo.getResult (.../idlize/ohosgen/demos/test_string_array/generated/arkts/OHFooMaterialized.ts:57)
[TID 2944bb] E/runtime:         at @test-string-array.src.panda.main.ETSGLOBAL.mainBody (.../idlize/ohosgen/demos/test_string_array/src/panda/main.ts:8)
[TID 2944bb] E/runtime:         at @test-string-array.src.panda.main.ETSGLOBAL.main (.../idlize/ohosgen/demos/test_string_array/src/panda/main.ts:26)
```

# Current Issues:

`std.core.RangeError` is raised with string sequence as return value.
