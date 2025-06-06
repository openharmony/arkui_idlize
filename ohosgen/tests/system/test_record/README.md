# Current Issues

Runtime failure: `escompat.Error`. Message are below:
```
Foo_constructImpl()
FooObject() with index = 1
Foo_getPropsImpl(thisPtr)
[TID 18644e] E/runtime: Unhandled exception: escompat.Error
[TID 18644e] E/runtime: Error: Object deserialization is not implemented.
[TID 18644e] E/runtime:         at escompat.Error.<ctor> (<unknown>:44)
[TID 18644e] E/runtime:         at @test-record.generated.arkts.OHFooMaterialized.Foo.getProps_serialize (.../idlize/ohosgen/system-tests/test_record/generated/arkts/OHFooMaterialized.ts:58)
[TID 18644e] E/runtime:         at @test-record.generated.arkts.OHFooMaterialized.Foo.getProps (.../idlize/ohosgen/system-tests/test_record/generated/arkts/OHFooMaterialized.ts:51)
[TID 18644e] E/runtime:         at @test-record.src.panda.main.ETSGLOBAL.mainBody (.../idlize/ohosgen/system-tests/test_record/src/panda/main.ts:6)
[TID 18644e] E/runtime:         at @test-record.src.panda.main.ETSGLOBAL.main (.../idlize/ohosgen/system-tests/test_record/src/panda/main.ts:21)
```
