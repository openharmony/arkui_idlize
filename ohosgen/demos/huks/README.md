# Usage

```
npm run check:arkts
```
or by the following steps:
```
npm run generate:arkts
npm run compile:arkts
npm run compile:native:arkts
npm run start:arkts
```

# Expected behavior

Program output:

```
Starting demo: huks
huks_fooVoidVoidImpl()
huks_fooVoidNumberImpl(arg)
  arg = 100 (int32)
huks_fooNumberVoidImpl()
huks.fooNumberVoid() = 1
huks_fooNumberNumberImpl(arg)
  arg = 200 (int32)
huks.fooNumberNumber(200) = 201
---- Begin: huks.fooResultNumber(300) ----
huks_fooResultNumberImpl(arg)
        arg = 300 (int32)
---- Begin: huks.fooNumberOptions({}) ----
huks_fooNumberOptionsImpl(options)
---- Begin: huks.generateKeyItemSync("ASDF", {}) ----
huks_generateKeyItemSyncImpl(keyAlias, options)
  keyAlias = ASDF
All cases done.
```

# Current Issues

Generated ArkTS code fails to work.

You need to add the missing import
```
import { NativeBuffer } from "@koalaui/interop"
```
to `generated/arkts/OHHuksMaterialized.ts`. Otherwise an error will occur during `npm run compile:arkts`
with error message below:
```
TypeError: Cannot find type 'NativeBuffer'. [OHHuksInterfaces.ts:27:31]
```
