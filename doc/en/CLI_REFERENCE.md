# CLI Parameter Reference

This document provides a comprehensive reference for all command-line parameters
accepted by the IDLize **runner** tool.

---

## Table of Contents

- [1. runner](#1-runner)
  - [m3](#command-m3)
  - [complete](#command-complete)
  - [sdk](#command-sdk)
  - [m3-sdk](#command-m3-sdk)
  - [sdk-new-shape](#command-sdk-new-shape)
  - [transform-builder-functions](#command-transform-builder-functions)
- [2. Common Usage Patterns](#2-common-usage-patterns)

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
| `--etsgen-options-file <file>` | string | required for `original` / `prepared` | Path to etsgen configuration file. Not used when `--sdk-stage=idl` |
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
  --etsgen-options-file ./etsgen/generator-config.json \
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

## 2. Common Usage Patterns

### Full pipeline: SDK to peers

```bash
# Step 1: Prepare the SDK
node runner -- sdk ./interface_sdk-js ./out/patched-sdk-arkts ./out/patched-sdk-ts

# Step 2: Run the m3 pipeline
node runner -- m3 ./out/patched-sdk-arkts ./custom.idl \
  --output ./out \
  --sdk-stage prepared \
  --arkgen-options-file ./arkgen/generation-config/config.json \
  --etsgen-options-file ./etsgen/generator-config.json \
  --arkgen-interop-types ./interop-types.h \
  --scraper-options-file ./scraper-config.json \
  --target all \
  --language arkts

# Installed output is placed in ./out/sig/ and ./out/libace/.
# Intermediate pipeline output remains under runner/out/peers/.
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
