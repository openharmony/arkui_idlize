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

## CLI Commands

### m3 - Main Generation Pipeline

```bash
npx runner m3 <sdk-path> <idl-files...> \
  --output <path> \
  --sdk-stage <original|prepared|idl> \
  --arkgen-options-file <file> \
  --arkgen-interop-types <file> \
  --scraper-options-file <file> \
  --target <sig|libace|all> \
  --language <ts|arkts>
```

### complete - Full SDK Generation

```bash
npx runner complete <sdk-path> \
  --ohosgen-config <config> \
  --sdk-stage <stage> \
  --target <sig|libace|all>
```

### tracker - Coverage Tracking

```bash
npx runner tracker <sdk-path> <idl-files...> \
  --sdk-status <file> \
  --tracker-status <file> \
  --output <path>
```

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

## Working Directories

```typescript
// From shared.ts
WORKING_DIR = "working"
SCRAPER_CWD = "working/scraper"
GENERATED_IDL_DIR = "working/generated-idl"
GENERATED_PEER_DIR = "working/generated-peer"
```

## SDK Stages

| Stage | Description |
|-------|-------------|
| `original` | Raw SDK from source |
| `prepared` | Preprocessed SDK |
| `idl` | Already converted to IDL |

## Common Patterns

### Full M3 Generation

```bash
npx runner m3 ./sdk ./extra.idl \
  --output ./output \
  --sdk-stage original \
  --arkgen-options-file ./arkgen-config.json \
  --arkgen-interop-types ./interop-types.h \
  --scraper-options-file ./scraper-config.json \
  --target all \
  --language arkts
```

### SDK Preparation Only

```bash
npx runner sdk ./original-sdk ./prepared-12 ./prepared-11
```

## Dependencies

- `@idlizer/core` - Core IDL utilities
- `@idlizer/interfaces` - Interface definitions
- `commander` - CLI framework
