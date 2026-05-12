# CLI Parameter Reference

This document provides a comprehensive reference for all command-line parameters
accepted by the three main IDLize tools: **runner**, **arkgen**, and **etsgen**.

---

## Table of Contents

- [1. runner](#1-runner)
  - [m3](#command-m3)
  - [complete](#command-complete)
  - [sdk](#command-sdk)
  - [m3-sdk](#command-m3-sdk)
  - [sdk-new-shape](#command-sdk-new-shape)
  - [transform-builder-functions](#command-transform-builder-functions)
- [2. arkgen](#2-arkgen)
- [3. etsgen](#3-etsgen)
- [4. Common Usage Patterns](#4-common-usage-patterns)

---

## 1. runner

The runner is the top-level pipeline orchestrator. It uses the `commander` library
and is invoked as:

```bash
node runner -- <command> [options]
```

### Command: `m3`

```
node runner -- m3 <sdk-path> <idl-files...>
```

Generate peers using the m3 pipeline: SDK preparation, ETS to IDL conversion,
scraping, and IDL to peer generation.

#### Positional Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<sdk-path>` | string | Yes | Path to the SDK directory |
| `<idl-files...>` | string[] | Yes | One or more paths to additional IDL files |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--output <path>` | string | (required) | Path to output generated files |
| `--sdk-stage <stage>` | `original \| prepared \| idl` | (required) | SDK processing stage. `original`: start from raw SDK; `prepared`: start from prepared SDK; `idl`: start from IDL files directly |
| `--arkgen-options-file <file>` | string | (required) | Path to arkgen configuration file |
| `--arkgen-interop-types <file>` | string | (required) | Path to interop-types.h file |
| `--scraper-options-file <file>` | string | (required) | Path to scraper configuration file |
| `--etsgen-options-file <file>` | string | - | Path to etsgen configuration file |
| `--etsgen <executable>` | string | `npx etsgen` | Path to the etsgen executable. Ignored when `--sdk-stage=idl` |
| `--arkgen <executable>` | string | `npx arkgen` | Path to the arkgen executable |
| `--target <target>` | `sig \| libace \| all` | `sig` | Generation target |
| `--language <language>` | `ts \| arkts` | `arkts` | Output language |
| `--no-arkgen-dummy-impl` | flag | - | Do not generate `dummy_impl.cc` and `real_impl.cc` test files |

#### Example

```bash
# Full pipeline from original SDK
node runner -- m3 ./sdk ./custom.idl \
  --output ./out \
  --sdk-stage original \
  --arkgen-options-file ./arkgen/generation-config/config.json \
  --arkgen-interop-types ./interop-types.h \
  --scraper-options-file ./scraper.json

# From IDL files only (skip SDK preparation and ets2idl)
node runner -- m3 ./sdk ./my-component.idl \
  --output ./out \
  --sdk-stage idl \
  --arkgen-options-file ./arkgen/generation-config/config.json \
  --arkgen-interop-types ./interop-types.h \
  --scraper-options-file ./scraper.json \
  --target all
```

---

### Command: `complete`

```
node runner -- complete <sdk-path>
```

Generate peers from a complete SDK using the ohosgen pipeline (alternative to
`m3`).

#### Positional Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<sdk-path>` | string | Yes | Path to the SDK directory |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--ohosgen-config <file>` | string | (required) | Path to the configuration file for ohosgen |
| `--sdk-stage <stage>` | `original \| prepared \| idl` | (required) | SDK processing stage |
| `--etsgen <executable>` | string | `npx etsgen` | Path to the etsgen executable. Ignored when `--sdk-stage=idl` |
| `--ohosgen <executable>` | string | `npx ohosgen` | Path to the ohosgen executable |
| `--target <target>` | `sig \| libace \| all` | `sig` | Generation target |
| `--language <language>` | `ts \| arkts` | `arkts` | Output language |

#### Example

```bash
node runner -- complete ./sdk \
  --ohosgen-config ./ohosgen-config.json \
  --sdk-stage prepared \
  --target all
```

---

### Command: `sdk`

```
node runner -- sdk <sdk-path> <prepared-sdk-12> <prepared-sdk-11>
```

Prepare the SDK by cloning, patching, and processing API files. Produces
prepared SDK outputs for both API version 12 and API version 11.

#### Positional Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<sdk-path>` | string | Yes | Path to the original SDK directory |
| `<prepared-sdk-12>` | string | Yes | Output path for the prepared SDK (API 12) |
| `<prepared-sdk-11>` | string | Yes | Output path for the prepared SDK (API 11) |

#### Example

```bash
node runner -- sdk ./interface_sdk-js ./out/patched-sdk-arkts ./out/patched-sdk-ts
```

---

### Command: `m3-sdk`

```
node runner -- m3-sdk <prepared-sdk-12> <absolute-prepared-sdk-12>
```

Prepare an SDK suitable for linking peers against. Produces an "absolute" SDK
with rewritten imports that use absolute paths.

#### Positional Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<prepared-sdk-12>` | string | Yes | Path to the prepared SDK (API 12) |
| `<absolute-prepared-sdk-12>` | string | Yes | Output path for the absolute SDK |

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--original-sdk` | flag | - | Treat the first argument as an original SDK that needs preparation first |

#### Example

```bash
node runner -- m3-sdk ./out/patched-sdk-arkts ./out/absolute-sdk
```

---

### Command: `sdk-new-shape`

```
node runner -- sdk-new-shape <path>
```

Create a new SDK shape by transforming builder functions.

#### Positional Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<path>` | string | Yes | Path to the SDK directory to transform |

---

### Command: `transform-builder-functions`

```
node runner -- transform-builder-functions <api-path>
```

Transform component builder functions in a pre-processed SDK API directory.

#### Positional Arguments

| Argument | Type | Required | Description |
|----------|------|----------|-------------|
| `<api-path>` | string | Yes | Path to the SDK API directory |

---

## 2. arkgen

The ArkUI component generator. Produces ArkTS peers, C++ libace modifiers,
and Arkoala bindings from IDL definitions. Invoked as:

```bash
arkgen [options]
# or
node /path/to/arkgen [options]
```

### Input / Output

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--input-dir <path>` | string | - | Path to input directory or directories (comma-separated) |
| `--aux-input-dir <path>` | string | - | Path to auxiliary input directory or directories (comma-separated) |
| `--base-dir <path>` | string | `--input-dir` | Base directories for packetization of IDL modules (comma-separated). Defaults to `--input-dir` when omitted |
| `--output-dir <path>` | string | `./out` | Output directory |
| `--input-files <files...>` | string[] | - | Specific files to process (comma-separated). Supports `@response-file.txt` syntax for large file lists |
| `--aux-input-files <files...>` | string[] | - | Specific auxiliary files to process (comma-separated) |

### Operation Mode

| Option | Description |
|--------|-------------|
| `--dts2peer` | Convert `.d.ts` to peer drafts. **Deprecated** -- use `dtsgen --dts2idl` followed by `--idl2peer` instead |
| `--ets2ts` | Convert `.ets` to `.ts` |
| `--idl2peer` | Convert IDL to peer drafts |
| `--show-config-schema` | Print the JSON schema for the generator configuration and exit |

### Language and Format

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--language <lang>` | `ts \| arkts \| cangjie \| kotlin` | `ts` | Output language |
| `--arkts-extension <ext>` | string | `.ts` | File extension for generated ArkTS files |

### Code Generation

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--generator-target <target>` | `all \| arkoala \| libace \| none` | `all` | Target framework for generated output |
| `--arkoala-destination <path>` | string | - | Location of the Arkoala repository (used for copying peers) |
| `--libace-destination <path>` | string | - | Location of the libace repository (used for copying peers) |
| `--copy-peers-components <names...>` | string[] | - | List of specific components to copy. Omit to copy all |
| `--only-integrated` | flag | `false` | Generate only files that can be integrated into the target |
| `--no-commented-code` | flag | `false` | Do not generate commented-out code in modifiers |
| `--api-prefix <string>` | string | - | C++ prefix for compatibility with manual Arkoala implementations |
| `--api-version <version>` | number | `9999` | API version for generated peers |
| `--default-idl-package <name>` | string | - | Name of the default package for generated IDL |
| `--library-packages <packages>` | string | - | Comma-separated list of packages to include in the library |

### Native Bridge and Interop

| Option | Type | Description |
|--------|------|-------------|
| `--native-bridge-path <path>` | string | Path to the native bridge file |
| `--interop-bridges <string>` | string | Generate interop bridges macros |
| `--interop-types <path>` | string | Path to the `interop-types.h` file |

### Component and Attribute Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--attribute-modifier-hooks` | flag | `false` | Generate hooks for component attribute modifier methods |
| `--use-memo-m3` | flag | `false` | Generate code with `@memo` annotations and `@ComponentBuilder` functions |
| `--use-component-optional` | flag | `false` | Make all component properties nullable |
| `--no-component-named-overloads` | flag | `false` | Disable named overloads for components |

### Testing and Validation

| Option | Type | Description |
|--------|------|-------------|
| `--verify-idl` | flag | Verify produced IDL using the linter |
| `--test-interface <name>` | string | Interfaces to test (comma-separated) |
| `--test-method <name>` | string | Methods to test (comma-separated) |
| `--test-property <name>` | string | Properties to test (comma-separated) |

### Documentation and Debug

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--docs <mode>` | `all \| opt \| none` | - | How to handle documentation: include all, optimize, or skip |
| `--disable-enum-initializers` | flag | - | Do not include enum member initializers in generated interfaces |
| `--verbose` | flag | - | Enable verbose processing output |
| `--dump-serialized` | flag | - | Dump serialized data for debugging |
| `--call-log` | flag | - | Enable call logging |
| `--enable-log` | flag | - | Enable general logging |
| `--version` | flag | - | Print version and exit |

### Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--reference-names <string>` | string | `dts` | Reference mapping mode: `ets` for ArkTS references, `dts` for TypeScript references, or a path to a custom configuration file |
| `--plugin <file>` | string | - | Path to a generator plugin file |
| `--options-file <path...>` | string[] | - | Path(s) to configuration options file. Appends to defaults unless `--ignore-default-config` is set |
| `--ignore-default-config` | flag | `false` | When used with `--options-file`, override default configuration instead of appending |

### Subset and Predefined

| Option | Description |
|--------|-------------|
| `--no-subset` | Do not copy subset files from the external repository or `external-subset` directory |
| `--no-implicit-predefined` | Remove predefined files from the generator input |
| `--no-arkgen-dummy-impl` | Do not generate `dummy_impl.cc` and `real_impl.cc` test files |

### Legacy

| Option | Description |
|--------|-------------|
| `--common-to-attributes` | Transform common attributes as IDL attributes |

#### Example

```bash
# Generate Arkoala peers from IDL
arkgen --idl2peer \
  --input-dir ./idl \
  --output-dir ./out \
  --generator-target arkoala \
  --language arkts \
  --api-version 12

# Generate libace C++ modifiers
arkgen --idl2peer \
  --input-dir ./idl \
  --output-dir ./out \
  --generator-target libace \
  --interop-types ./interop-types.h

# Show config schema
arkgen --show-config-schema

# Generate with custom configuration
arkgen --idl2peer \
  --input-dir ./idl \
  --output-dir ./out \
  --options-file ./custom-config.json \
  --ignore-default-config \
  --verbose
```

---

## 3. etsgen

The `.d.ts` / `.d.ets` to IDL transformer. Converts TypeScript and ArkTS
declaration files into IDL definitions. Invoked as:

```bash
etsgen [options]
# or
node /path/to/etsgen [options]
```

### Core Options

| Option | Type | Description |
|--------|------|-------------|
| `--ets2idl` | flag | Convert `.d.ts` / `.d.ets` files to IDL definitions |

### Input / Output

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--input-dir <path>` | string | - | Path to input directory or directories (comma-separated) |
| `--exclude <patterns>` | string | - | Paths to exclude from the input directory scan |
| `--base-dir <path>` | string | `--input-dir` | Base directories for packetization of IDL modules (comma-separated). Defaults to `--input-dir` when omitted |
| `--output-dir <path>` | string | - | Output directory |
| `--input-files <files...>` | string[] | - | Specific files to process (comma-separated). Supports `@response-file.txt` syntax for large file lists |

### Processing

| Option | Type | Description |
|--------|------|-------------|
| `--verify-idl` | flag | Verify produced IDL |
| `--docs <mode>` | `all \| opt \| none` | How to handle documentation: include all, optimize, or skip |

### Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--options-file <path...>` | string[] | - | Path(s) to generator configuration options file. Appends to defaults unless `--ignore-default-config` is set |
| `--ignore-default-config` | flag | `false` | When used with `--options-file`, override default configuration instead of appending |
| `--ets-config <path>` | string | `<etsgen-root>/config.json` | Path to the ETS configuration file |

### Debug

| Option | Type | Description |
|--------|------|-------------|
| `--trace-status <filename>` | string | Add trace information to generated IDL and save status to the specified file |
| `--version` | flag | Print version and exit |

#### Example

```bash
# Convert .d.ts to IDL
etsgen --ets2idl \
  --input-dir ./sdk/api \
  --output-dir ./idl

# Convert with verification and custom config
etsgen --ets2idl \
  --input-dir ./sdk \
  --output-dir ./out/idl \
  --verify-idl \
  --options-file ./etsgen-config.json

# Convert specific files using a response file
etsgen --ets2idl \
  --input-files @response-file.txt \
  --output-dir ./idl
```

---

## 4. Common Usage Patterns

### Full pipeline: SDK to peers

```bash
# Step 1: Prepare the SDK
node runner -- sdk ./interface_sdk-js ./out/patched-sdk-arkts ./out/patched-sdk-ts

# Step 2: Run the m3 pipeline
node runner -- m3 ./out/patched-sdk-arkts ./custom.idl \
  --output ./out \
  --sdk-stage prepared \
  --arkgen-options-file ./arkgen/generation-config/config.json \
  --arkgen-interop-types ./interop-types.h \
  --scraper-options-file ./scraper-config.json \
  --target all \
  --language arkts

# Generated output is placed in ./out/peers/sig/ and ./out/peers/libace/
```

### Quick generation from IDL only

Skip SDK preparation and ETS-to-IDL conversion when you already have IDL files:

```bash
node runner -- m3 ./sdk ./my-component.idl \
  --output ./out \
  --sdk-stage idl \
  --arkgen-options-file ./config.json \
  --arkgen-interop-types ./interop-types.h \
  --scraper-options-file ./scraper.json
```

### Standalone arkgen

Run arkgen directly without the runner orchestrator:

```bash
cd arkgen && npm run compile
node . --idl2peer \
  --input-dir ../interfaces \
  --output-dir ../out/peers \
  --generator-target arkoala \
  --language arkts \
  --api-version 12
```

### Standalone etsgen

Run etsgen directly to convert declarations to IDL:

```bash
cd etsgen && npm run compile
node . --ets2idl \
  --input-dir ../sdk/api \
  --output-dir ../out/idl \
  --verify-idl
```

### Using response files for large inputs

Both arkgen and etsgen support response files for passing large file lists:

```bash
# Create a response file listing IDL files
find ./idl -name "*.idl" > files.txt

# Use the response file with the @ prefix
arkgen --idl2peer \
  --input-files @files.txt \
  --output-dir ./out
```

### Inspecting and customizing configuration

```bash
# Print the JSON schema for arkgen configuration
arkgen --show-config-schema

# Use a custom config while overriding defaults
arkgen --idl2peer \
  --input-dir ./idl \
  --output-dir ./out \
  --options-file ./my-config.json \
  --ignore-default-config
```
