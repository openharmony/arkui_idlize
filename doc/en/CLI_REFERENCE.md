# IDLize CLI Reference

This document is for IDLize tool users and generator developers who need to call
`runner` directly. Prefer the standard `bash generate.sh` command at the
repository root for normal generation. Call `runner` directly when you need to
customize the SDK stage, input IDL, or output target.

## 1. Invocation Form

Run commands from the repository root:

```bash
node runner <command> [options]
```

`runner` uses `commander` to define commands. Command implementations live in
`runner/src/main.ts`.

## 2. `m3`

```bash
node runner m3 <sdk-path> <idl-files...> [options]
```

`m3` is the main generation pipeline. It handles SDK preparation, declaration to
IDL conversion, scraping, IDL to peer generation, formatting, and output
installation.

### Positional Arguments

| Argument | Required | Description |
|---|---|---|
| `<sdk-path>` | Yes | SDK directory path. With `--sdk-stage=prepared`, pass a prepared SDK. With `idl`, this can be a placeholder SDK path. |
| `<idl-files...>` | Yes | One or more extra IDL files or directories. |

### Options

| Option | Default | Description |
|---|---|---|
| `--output <path>` | Required | Output directory for installed generated files. |
| `--sdk-stage <stage>` | Required | `original`, `prepared`, or `idl`. |
| `--arkgen-options-file <file>` | Required | Path to `arkgen` generation configuration. |
| `--arkgen-interop-types <file>` | Required | Path to `interop-types.h`. |
| `--scraper-options-file <file>` | Required | Path to scraper configuration. |
| `--etsgen-options-file <file>` | Required for `original` / `prepared` | Path to `etsgen` conversion configuration; not used by the `idl` stage. |
| `--etsgen <executable>` | `npx etsgen` | `etsgen` executable command; ignored by the `idl` stage. |
| `--arkgen <executable>` | `npx arkgen` | `arkgen` executable command. |
| `--target <target>` | `sig` | Generation target: `sig`, `libace`, or `all`. |
| `--language <language>` | `arkts` | Output language: `ts` or `arkts`. |
| `--no-arkgen-dummy-impl` | Test implementations are generated when omitted | Do not generate `dummy_impl.cc` and `real_impl.cc` test files. |

### Standard Example

```bash
node runner m3 sdk-patched-arkts ./interfaces/interfaces/arkui-extra/ \
    --sdk-stage prepared \
    --arkgen-options-file ./arkgen/generation-config/config.json \
    --etsgen-options-file ./etsgen/generator-config.json \
    --arkgen-interop-types ./runner/interop-types/src/cpp/interop-types.h \
    --scraper-options-file ./runner/configs/scraper-config.json \
    --arkgen "node arkgen" \
    --etsgen "node etsgen" \
    --target all \
    --no-arkgen-dummy-impl \
    --output "./out"
```

### Generate from IDL Only

```bash
node runner m3 ./sdk ./my-component.idl \
  --output ./out \
  --sdk-stage idl \
  --arkgen-options-file ./arkgen/generation-config/config.json \
  --arkgen-interop-types ./runner/interop-types/src/cpp/interop-types.h \
  --scraper-options-file ./runner/configs/scraper-config.json \
  --target all
```

## 3. `complete`

```bash
node runner complete <sdk-path> [options]
```

Uses the `ohosgen` pipeline to generate peers from a complete SDK. This is a
generation path outside `m3`.

| Option | Default | Description |
|---|---|---|
| `--ohosgen-config <file>` | Required | Path to `ohosgen` configuration. |
| `--sdk-stage <stage>` | Required | `original`, `prepared`, or `idl`. |
| `--etsgen <executable>` | `npx etsgen` | `etsgen` executable command; ignored by the `idl` stage. |
| `--ohosgen <executable>` | `npx ohosgen` | `ohosgen` executable command. |
| `--target <target>` | `sig` | Generation target: `sig`, `libace`, or `all`. |
| `--language <language>` | `arkts` | Output language: `ts` or `arkts`. |

Example:

```bash
node runner complete ./sdk \
  --ohosgen-config ./ohosgen-config.json \
  --sdk-stage prepared \
  --target all
```

## 4. `sdk`

```bash
node runner sdk <sdk-path> <prepared-sdk-12> <prepared-sdk-11>
```

Prepares the SDK without running code generation.

| Argument | Description |
|---|---|
| `<sdk-path>` | Original SDK directory path. |
| `<prepared-sdk-12>` | API 12 prepared SDK output path. |
| `<prepared-sdk-11>` | API 11 prepared SDK output path. |

Example:

```bash
node runner sdk ./interface_sdk-js ./out/patched-sdk-arkts ./out/patched-sdk-ts
```

## 5. `m3-sdk`

```bash
node runner m3-sdk <prepared-sdk-12> <absolute-prepared-sdk-12> [options]
```

Generates an SDK whose paths do not depend on the current working directory,
suitable for linking peers.

| Option | Description |
|---|---|
| `--original-sdk` | Treat the first argument as an original SDK and prepare it first. |

Example:

```bash
node runner m3-sdk ./out/patched-sdk-arkts ./out/absolute-sdk
```

## 6. SDK Shape Commands

### `sdk-new-shape`

```bash
node runner sdk-new-shape <path>
```

Creates a new SDK shape by transforming builder functions.

### `transform-builder-functions`

```bash
node runner transform-builder-functions <api-path>
```

Transforms component builder functions in a preprocessed SDK API directory.

## 7. Output Locations

| Scenario | Output |
|---|---|
| `m3 --target sig` | Installs `runner/out/peers/sig/` into `--output`. |
| `m3 --target libace` | Installs `runner/out/peers/libace/` into `--output`. |
| `m3 --target all` | Installs all of `runner/out/peers/` into `--output`, usually producing `sig/` and `libace/`. |
| Intermediate IDL | `runner/out/idl/`. |
| Intermediate peer output | `runner/out/peers/`. |

## 8. Common Patterns

### SDK to Full Generated Output

```bash
node runner sdk ./interface_sdk-js ./out/patched-sdk-arkts ./out/patched-sdk-ts

node runner m3 ./out/patched-sdk-arkts ./custom.idl \
  --output ./out \
  --sdk-stage prepared \
  --arkgen-options-file ./arkgen/generation-config/config.json \
  --etsgen-options-file ./etsgen/generator-config.json \
  --arkgen-interop-types ./runner/interop-types/src/cpp/interop-types.h \
  --scraper-options-file ./runner/configs/scraper-config.json \
  --target all \
  --language arkts
```

### Locate Parameter Definitions Quickly

The command parameter definitions are in `runner/src/main.ts`. If this document
and the source disagree, treat the source as the source of truth.
