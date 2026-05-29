# IDLize Developer Guide

This guide is for tool developers who are new to maintaining IDLize. After
reading it, you should know:

- What problem IDLize solves.
- Which stages an end-to-end generation run goes through.
- Which workspace to start from for common changes.
- What the core source files are responsible for.
- How to compile, generate, and verify after changing code.

For a deeper architecture reference, see [Architecture](ARCHITECTURE.md).
If you only need to use IDLize to generate code, start with the
[Tool User Guide](../../doc/en/USER_GUIDE.md).

## 1. Project In One Paragraph

IDLize is an interface code generation toolchain for the OpenHarmony /
ArkUI ecosystem. It reads `.d.ts`, `.d.ets`, or `.idl` interface
declarations, passes them through the IDL intermediate representation and
AST, and generates:

- ArkTS / TypeScript peer classes.
- C++ libace modifiers.
- Bindings, type conversion code, and serialization glue consumed by the
  Arkoala runtime.

The main pipeline is:

```text
SDK declarations / handwritten IDL
  -> etsgen converts declarations to .idl
  -> core parses .idl to IDL AST
  -> arkgen and libohos print target code
  -> runner installs generated output
```

## 2. First-Time Setup

Run this from the repository root:

```bash
git submodule update --init
npm i
cd external && npm i && cd ..
```

Prepare `libarkts` and the panda SDK:

```bash
cd external/libarkts
PANDA_SDK_VERSION=1.5.0-dev.58082 npm run panda:sdk:reinstall
npm run compile
cd ../..
```

Compile the main generation pipeline and prepare the SDK:

```bash
cd runner && npm run compile && cd ..
npm run download:sdk
```

Run the standard generation flow:

```bash
bash generate.sh
```

The installed output is written to `./out`; intermediate artifacts are
written under `runner/out`.

## 3. Directories To Know First

| Directory | When you usually change it |
|---|---|
| `core/` | IDL AST, IDL parser, type nodes, `LanguageWriter`, shared peer model. |
| `etsgen/` | `.d.ts` / `.d.ets` to `.idl` conversion logic. |
| `arkgen/` | ArkUI component peer, C++ modifier, and Arkoala binding generation. |
| `arkgen/generation-config/` | Component materialization, hooks, type conversion, and generation options. |
| `libohos/` | Shared printers, serializers, peer infrastructure, and language utilities. |
| `runner/` | `runner m3` pipeline, SDK preparation, output installation, CLI options. |
| `sdk-patched/` / `sdk-patched-arkts/` | Patches for upstream SDK declarations. Do not edit `interface_sdk-js/` directly. |
| `interfaces/` | Additional handwritten IDL definitions. |
| `linter/` / `idlinter/` | `.d.ts` / `.idl` lint rules. |
| `dtsgen/` | Reverse generation from IDL to `.d.ts`. |
| `scraper/` | External SDK fetching, caching, and normalization. |

Do not hand-edit generated artifacts: `out/`, `runner/out/`, `build/`,
`bundled/`, or `lib/` when it sits next to `src/`.

## 4. Core Concepts

**IDL**

IDLize's intermediate interface language. `etsgen` converts SDK declarations
to `.idl`, and `core` parses `.idl` into AST. Downstream generators should
depend on the AST instead of reinterpreting TypeScript.

**AST**

The tree-shaped data model defined in `core/src/idl/node.ts`. Common nodes
include `IDLFile`, `IDLInterface`, `IDLMethod`, `IDLProperty`,
`IDLCallback`, `IDLTypedef`, and the `IDLType` variants.

**peer**

A generated component wrapper class that mirrors an ArkUI component API.
The peer connects application-side calls to native framenodes and native
module calls.

**modifier**

A generated C++ object that applies property changes to an ArkUI native
framenode.

**serializer**

Generated encode/decode logic that lets ArkTS/TypeScript and C++ exchange
arguments. When adding a type or changing a cross-language parameter shape,
check that serializers and type conversion stay aligned.

**materialized**

A component or interface with a fully generated peer. Materialization is
mainly controlled by `arkgen/generation-config/config.json`.

**hook**

A configuration mechanism for injecting custom logic into generation
phases. Hooks are useful when one component or attribute needs special
generated code without a broad printer rewrite.

## 5. How One Generation Run Works

`generate.sh` is the standard entry point. It calls:

```bash
node runner m3 sdk-patched-arkts ./interfaces/interfaces/arkui-extra/ \
    --sdk-stage prepared \
    --arkgen-options-file ./arkgen/generation-config/config.json \
    --etsgen-options-file ./etsgen/generator-config.json \
    --arkgen-interop-types ./runner/interop-types/src/cpp/interop-types.h \
    --scraper-options-file ./runner/configs/scraper-config.json \
    --arkgen "node arkgen" --etsgen "node etsgen" \
    --target all \
    --no-arkgen-dummy-impl \
    --output "./out"
```

Main stages:

1. The `m3` command in `runner/src/main.ts` cleans and creates `runner/out`.
2. With `sdkStage` set to `prepared`, `etsgen` converts `sdk-patched-arkts/`
   to `.idl`.
3. `scraper` processes input IDL according to
   `runner/configs/scraper-config.json`.
4. `arkgen` reads IDL, builds `ArkoalaPeerLibrary`, and runs printers.
5. `runner` installs generated output into `./out`.

When debugging generated output, trace backwards:

| Question | Where to look |
|---|---|
| Is the installed final output correct? | `out/` |
| What did the printers actually emit? | `runner/out/peers/sig/`, `runner/out/peers/libace/` |
| What IDL did the parser receive? | `runner/out/idl/` |
| Was the SDK input prepared correctly? | `runner/out/patched-sdk-arkts/`, `runner/out/patched-sdk-ts/` |

## 6. Core Code Entry Points

### 6.1 `runner/`: How The Pipeline Is Wired

| File | Purpose |
|---|---|
| `runner/src/main.ts` | Defines `m3`, `sdk`, `m3-sdk`, and related commands; `m3` is the main generation flow. |
| `runner/src/shared.ts` | Defines the stage output directories under `runner/out`. |
| `runner/src/commands/ets2idl.ts` | Invokes `etsgen` to generate IDL. |
| `runner/src/commands/idl2peer.ts` | Invokes `arkgen` to generate peers and modifiers. |
| `runner/src/commands/sdk.ts` | Prepares the patched SDK. |
| `runner/src/commands/install.ts` | Installs generated output into the target directory. |

If you need to add a pipeline option, reorder stages, or change output
paths, start with `runner/src/main.ts` and `runner/src/shared.ts`.

### 6.2 `etsgen/`: How Declarations Become IDL

| File | Purpose |
|---|---|
| `etsgen/src/app.ts` | CLI entry point for `--ets2idl`, input directories, and config files. |
| `etsgen/src/generate.ts` | Core conversion logic. |
| `etsgen/src/config.ts` | etsgen configuration loading. |
| `etsgen/generator-config.json` | Conversion config used by the standard pipeline. |

If the IDL in `runner/out/idl/` is already wrong, check `etsgen` or the SDK
patches first.

### 6.3 `core/`: IDL AST And Language Abstractions

| File | Purpose |
|---|---|
| `core/src/from-idl/parser.ts` | Parses `.idl` text into AST. |
| `core/src/idl/node.ts` | Defines AST nodes and extended attributes. |
| `core/src/idl/builders.ts` | Factory functions for AST nodes. |
| `core/src/idl/discriminators.ts` | AST type guards. |
| `core/src/idl/utils.ts` | AST query and helper functions. |
| `core/src/LanguageWriters/LanguageWriter.ts` | Target-language-neutral code writing abstraction. |
| `core/src/LanguageWriters/writers/` | TS, ArkTS, C++, CangJie, and Kotlin writers. |
| `core/src/LanguageWriters/convertors/` | Converters from IDL types to target-language types. |
| `core/src/peer-generation/` | Shared peer model, reference resolution, and layout infrastructure. |

If you add IDL syntax or an AST node, usually start with `node.ts`, the
parser, builders, visitors, and discriminators, then check which generators
must understand the new node.

### 6.4 `arkgen/`: How ArkUI Code Is Generated

| File | Purpose |
|---|---|
| `arkgen/src/app.ts` | CLI entry point; parses `--idl2peer`, loads config and IDL. |
| `arkgen/src/arkoala.ts` | Orchestrates Arkoala and libace outputs. |
| `arkgen/src/ArkoalaPeerLibrary.ts` | Peer library used by ArkUI generation. |
| `arkgen/src/printers/ComponentsPrinter.ts` | Generates component classes and attribute setters. |
| `arkgen/src/printers/PeersPrinter.ts` | Generates peer classes. |
| `arkgen/src/printers/ModifierPrinter.ts` | Generates C++ modifiers. |
| `arkgen/src/printers/ArkoalaInterfacePrinter.ts` | Generates Arkoala interface declarations. |
| `arkgen/generation-config/config.json` | Standard generation config. |
| `arkgen/generation-config/schema.json` | Generation config schema. |

If the generated ArkTS/C++ file shape is correct but a component method is
wrong, start with the related printer and `generation-config/config.json`.

### 6.5 `libohos/`: Shared Generation Infrastructure

| File or directory | Purpose |
|---|---|
| `libohos/src/peer-generation/printers/` | Shared printers for interfaces, declarations, peers, native modules, serializers, and more. |
| `libohos/src/peer-generation/ComponentsCollector.ts` | Collects component declarations. |
| `libohos/src/peer-generation/PeersCollector.ts` | Collects and organizes peer classes. |
| `libohos/src/peer-generation/ImportsCollector.ts` | Manages imports in generated files. |
| `libohos/src/peer-generation/LayoutManager.ts` | Decides where generated files are placed. |
| `libohos/src/peer-generation/NativeModule.ts` | Describes native module bindings. |
| `libohos/src/ost/`, `libohos/src/ostgen/` | Object serialization template and generation helpers. |

If several generation targets have a similar problem, do not patch only
`arkgen`; first decide whether the fix belongs in a shared `libohos`
printer or collector.

## 7. Where To Start For Common Tasks

| Task | Starting point | Verification |
|---|---|---|
| Change peer generation for an ArkUI component | `arkgen/src/printers/ComponentsPrinter.ts`, `PeersPrinter.ts` | `npm run -C arkgen test`, then `bash generate.sh` and compare `runner/out/peers/`. |
| Change C++ modifier generation | `arkgen/src/printers/ModifierPrinter.ts` or `libohos/src/peer-generation/printers/ModifierPrinter.ts` | Generate `--target libace` or run standard `generate.sh`. |
| Change `.d.ets` to IDL conversion | `etsgen/src/generate.ts` | `npm run -C etsgen test`, then inspect `runner/out/idl/`. |
| Add IDL syntax or a type node | `core/src/idl/node.ts`, `core/src/from-idl/parser.ts` | `npm run -C core test`, then run downstream generation. |
| Change a generation config field | `arkgen/generation-config/schema.json`, `arkgen/src/config.ts` | `npm run -C arkgen generate-schema`, then run standard generation. |
| Change main pipeline options or directories | `runner/src/main.ts`, `runner/src/shared.ts` | `npm run -C runner compile`, then `bash generate.sh`. |
| Patch upstream SDK declarations | `sdk-patched/` or `sdk-patched-arkts/` | `npm run download:sdk` or `bash generate.sh`, then inspect IDL differences. |

## 8. Compile And Verify

Common compile commands:

```bash
npm run -C core compile
npm run -C etsgen compile
npm run -C arkgen compile
npm run -C libohos compile
npm run -C runner compile
```

Common tests and checks:

```bash
npm run -C core test
npm run -C etsgen test
npm run -C arkgen test
npm run sanity
```

Standard end-to-end generation:

```bash
bash generate.sh
```

Bundle artifacts:

```bash
npm run bundle
```

## 9. Debugging Order

When generated output is wrong, trace the pipeline backwards:

1. Final output is missing or wrong: inspect `out/`.
2. Installation may have moved the wrong files: inspect `runner/out/peers/`
   and `runner/src/commands/install.ts`.
3. A printer may have emitted wrong code: inspect `arkgen/src/printers/`
   and `libohos/src/peer-generation/printers/`.
4. The AST may not match expectations: compare `runner/out/idl/` with
   `core` parser and transformers.
5. IDL may already be wrong from SDK conversion: inspect `etsgen` and
   `sdk-patched-arkts/`.
6. Upstream SDK content may have changed: do not edit `interface_sdk-js/`;
   patch in the patch directories.

This order helps avoid fixing input problems inside generators.

## 10. Pre-Submit Checklist

- Code generation logic changed: rerun `bash generate.sh`.
- IDL parsing or AST changed: run `npm run -C core test` and check downstream
  generation.
- `etsgen` changed: inspect `runner/out/idl/`.
- `arkgen` or `libohos` changed: inspect `runner/out/peers/`.
- README or user-facing docs changed: keep Chinese and English entries in sync.
- Do not hand-submit generated directories, bundles, tgz files, or direct
  changes inside the vendored SDK submodule.
