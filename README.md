# IDLizer

## Description

This folder contains collection of tools for analyzing and transformation of
.d.ts files, with aim of exposing ArkUI interfaces to more languages and runtimes.

## Tools available

### .d.ts linter

 Tool checking that given folder (ArkUI interface declarations downloaded by Arkoala build by default) only contains reasonable set of TypeScript features allowed for usage in public interfaces.

To run

```bash
cd idlize
npm i
npm run compile
node . --linter --input-dir ../arkui-common/ohos-sdk-ets/openharmony/10/ets/component
```

Results are in `./<outputDir>/linter.txt` if  `--output-dir` parameter specified, otherwise printed to stdout.
If there are no unsuppressed errors - exit code is 1, otherwise it is 0.


### IDL generator

 Tool producing set of WebIDL-compatible interface definitions from .d.ts interface definitions.
 Still in progress, may produce incorrect IDL.

```bash
cd idlize
npm i
npm run compile
node . --dts2idl --input-dir ../arkui-common/ohos-sdk-ets/openharmony/10/ets/component
```

Results are in `./idl/` folder.

### C headers generator

 Tool producing set of C interface definitions from .d.ts interface definitions.
 Still in progress, will produce incorrect C now.

```bash
cd idlize
npm i
npm run compile
node . --idl2h --input-dir ../arkui-common/ohos-sdk-ets/openharmony/10/ets/component
```
Results are in `./headers/arkoala_api.h`.

### Typescript declaration files generator

Tool producing set of typescript declaration files from .idl interface definitions.

```bash
cd idlize
npm i
npm run compile
node . --idl2dts --input-dir ./test/from-idl/idl
```
By default, results are in `./dts`.
