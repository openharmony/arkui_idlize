---
name: idl-runner
description: Use when working with runner module - orchestrating IDL pipeline commands, SDK processing, or end-to-end generation workflows
---

# Runner Module

## Overview

`runner` is the CLI orchestration layer that coordinates the entire IDL generation pipeline:
1. SDK preparation
2. ETS → IDL conversion
3. IDL scraping/filtering
4. IDL → Peer generation
5. Installation to target

**Core principle:** Orchestrate end-to-end generation workflows

## Key Files

```
runner/src/
├── main.ts           # CLI entry point with commands
├── shared.ts         # Shared constants (WORKING_DIR, etc.)
├── utils.ts          # Utility functions (run, scan, flat)
├── commands/
│   ├── index.ts      # Export all commands
│   ├── ets2idl.ts    # ETS to IDL conversion
│   ├── idl2peer.ts   # IDL to peer generation
│   ├── scrape.ts     # IDL scraping/filtering
│   ├── sdk.ts        # SDK preparation
│   ├── install.ts    # Installation
│   └── absoluteSdk.ts # Absolute SDK creation
└── tools/
    ├── scraper.ts           # Scraping implementation
    ├── formatArkts.ts       # ArkTS formatting
    └── builderFuncsTransformer.ts # Builder function transforms
```

## Regeneration

To regenerate after editing runner (or any pipeline workspace), run:

```bash
bash generate.sh
```

(see `INSTRUCTION.md`). This is the only supported entry point — do
not invoke `runner` subcommands directly. Output lands under `./out`.

## CLI Commands (reference)

The descriptions below explain what each runner subcommand does so you
can read and modify the pipeline. Do not paste these as user-facing
recipes — `bash generate.sh` is the entry point.

### m3 — main generation pipeline

Drives the full flow: SDK preparation → ETS-to-IDL → scraping →
IDL-to-peer → install. Authoritative flag list lives in
`runner/src/main.ts` (look for the `m3` command). Key flags:
`--sdk-stage <original|prepared|idl>`, `--target <sig|libace|all>`,
`--arkgen-options-file`, `--etsgen-options-file`,
`--scraper-options-file`, `--arkgen-interop-types`, `--output`.

### complete — full SDK generation

Wraps `m3` for whole-SDK runs, parameterised by an `ohosgen-config`.

### tracker — coverage tracking

Generates API-coverage reports for SDK + IDL inputs.

## Command Pipeline

```typescript
// m3 pipeline flow
1. setup()                    // Create working directories
2. sdk2idl()                  // SDK → IDL conversion
3. scrape()                   // Filter/scrape IDL
4. idl2peer()                 // IDL → Peer generation
5. formatArkts()              // Format generated code
6. install()                  // Copy to destination
```

## Commands API

```typescript
const commands = {
    prepareSdk,    // Prepare SDK for processing
    ets2idl,       // Convert ETS to IDL
    idl2peer,      // Generate peers from IDL
    idl2ohos,      // Generate OHOS code
    install,       // Install to target
    absoluteSdk,   // Create absolute SDK
    scrape         // Scrape IDL files
}
```

## Configuration Types

```typescript
interface ArkgenOptions {
    output: string
    arkgen: string
    target: string       // sig | libace | all
    language: string     // ts | arkts
    sdkStage: string     // original | prepared | idl
    scraperConfig?: string
    arkgenOptionsFile: string
    arkgenInteropTypes: string
    scraperOptionsFile: string
}

interface PrepareSdkOptions {
    etsgen: string
    sdkStage: string
    etsgenOptionsFile: string
}
```

## Intermediate artifacts (debug breadcrumbs)

After `bash generate.sh`, runner populates `runner/out/` with the
intermediate artifacts of each pipeline stage. Inspect these to find
where a generated file went wrong — work backwards from the final
peers to the source `.idl`, then to the patched SDK input.

| Path | Content | Stage that wrote it |
|---|---|---|
| `runner/out/idl/` | Converted `.idl` files | `etsgen` (ETS → IDL) |
| `runner/out/peers/sig/` | Peer signatures (TS / ArkTS) | `arkgen` (printers) |
| `runner/out/peers/libace/` | C++ libace modifiers / accessors | `arkgen` (printers) |
| `runner/out/patched-sdk-arkts/` | Prepared `.d.ets` SDK input | `runner sdk` |
| `runner/out/patched-sdk-ts/` | Prepared `.d.ts` SDK input | `runner sdk` |
| `runner/out/original-sdk/` | Cloned upstream SDK | `runner sdk` |
| `runner/out/scraper/` | Scraper working dir | `scrape` |
| `runner/out/response-files/` | Compiler response files | `runner` |
| `runner/out/configs/` | Resolved config snapshots | `runner` |

Authoritative path constants live in `runner/src/shared.ts`
(`WORKING_DIR`, `GENERATED_IDL_DIR`, `GENERATED_PEER_DIR`,
`GENERATED_PEER_SIG`, `GENERATED_PEER_LIBACE`, etc.). `runner/out/` is
wiped and recreated on every `bash generate.sh` run, so do not edit
files there — fix the source workspace and regenerate.

## SDK Stages

| Stage | Description |
|-------|-------------|
| `original` | Raw SDK from source |
| `prepared` | Preprocessed SDK |
| `idl` | Already converted to IDL |

## Dependencies

- `@idlizer/core` - Core IDL utilities
- `@idlizer/interfaces` - Interface definitions
- `commander` - CLI framework
