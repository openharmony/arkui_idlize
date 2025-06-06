# Current Issues

**(2025.2.28 Update)**
Failure during `npm run compile:arkts` with error message below:
```
Fatal error: Failed to compile from .../idlize/ohosgen/system-tests/huks/src/panda/main.ts to .../idlize/ohosgen/system-tests/huks/build/panda/out/main.abc
TypeError: Property 'fooVoidVoid' does not exist on type 'huks' [main.ts:6:10]
TypeError: Property 'fooVoidNumber' does not exist on type 'huks' [main.ts:7:10]
TypeError: Property 'fooNumberVoid' does not exist on type 'huks' [main.ts:8:48]
TypeError: Property 'fooNumberNumber' does not exist on type 'huks' [main.ts:9:53]
TypeError: Property 'fooResultNumber' does not exist on type 'huks' [main.ts:12:10]
TypeError: Property 'fooNumberOptions' does not exist on type 'huks' [main.ts:14:10]
TypeError: Property 'generateKeyItemSync' does not exist on type 'huks' [main.ts:16:10]
```
`export interface huks {}` generated in `generates/arkts/OHHuksMaterialized.ts` is empty.

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
