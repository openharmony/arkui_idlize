# Usage

```
npm run generate:arkts
npm run compile:arkts  # ERROR message see below
```

# Current behavior

Error output:

```
Starting demo: test_modules
[TID 195570] E/runtime: Unhandled exception: std.core.ClassCastError
[TID 195570] E/runtime: ClassCastError: @test-modules-interface.src.panda.main.MyFoo cannot be cast to @koalaui.interop.MaterializedBase.MaterializedBase
[TID 195570] E/runtime:         at @test-modules-interface.generated.arkts.peers.Serializer.Serializer.writeIFooInt (.../idlize/ohosgen/demos/test_modules_interface/generated/arkts/peers/Serializer.ts:63)
[TID 195570] E/runtime:         at @test-modules-interface.generated.arkts.OHBarNamespace.bar.GlobalScope_bar_bar.getIntWithFoo_serialize (.../idlize/ohosgen/demos/test_modules_interface/generated/arkts/OHBarNamespace.ts:36)
[TID 195570] E/runtime:         at @test-modules-interface.generated.arkts.OHBarNamespace.bar.GlobalScope_bar_bar.getIntWithFoo (.../idlize/ohosgen/demos/test_modules_interface/generated/arkts/OHBarNamespace.ts:32)
[TID 195570] E/runtime:         at @test-modules-interface.generated.arkts.OHBarNamespace.bar.getIntWithFoo (.../idlize/ohosgen/demos/test_modules_interface/generated/arkts/OHBarNamespace.ts:45)
[TID 195570] E/runtime:         at @test-modules-interface.src.panda.main.ETSGLOBAL.mainBody (.../idlize/ohosgen/demos/test_modules_interface/src/panda/main.ts:15)
[TID 195570] E/runtime:         at @test-modules-interface.src.panda.main.ETSGLOBAL.main (.../idlize/ohosgen/demos/test_modules_interface/src/panda/main.ts:22)
```

# Notes

If we replace the commands in `generate:arkts` from `--input-dir ./demos/test_modules_interface/dts` to `--input-files ./demos/test_modules_interface/dts/bar.d.ts`
(i.e. excluding the interface), `compile:arkts` will fail with error message below:
```
Fatal error: Failed to compile from .../idlize/ohosgen/demos/test_modules_interface/src/panda/compat.ts to .../idlize/ohosgen/demos/test_modules_interface/build/panda/out/src/panda/compat.abc
TypeError: Cannot find type 'IFooInt'. [OHBarNamespace.ts:28:53]
```
with warning message during `generate:arkts`:
```
undeclared type [IDLType, name: 'IFooInt', kind: 'ReferenceType']
```
