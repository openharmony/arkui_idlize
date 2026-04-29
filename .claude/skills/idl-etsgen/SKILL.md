---
name: idl-etsgen
description: Use when working with etsgen module - converting .d.ts/.d.ets declarations to IDL format, or ETS-to-IDL transformation
---

# EtsGen Module

## Overview

`etsgen` converts TypeScript/ArkTS declaration files (`.d.ts`, `.d.ets`) to IDL format. It parses ArkTS AST and generates IDL definitions.

**Core principle:** `.d.ts`/`.d.ets` → AST → IDL

## Key Files

```
etsgen/src/
├── main.ts        # CLI entry point
├── app.ts         # etsgen() CLI command handler
├── generate.ts    # Core generation logic (STS → IDL)
├── config.ts      # Configuration loading (ETSConfigScheme)
├── utils.ts       # Utility functions
└── cli.ts         # Additional CLI utilities
```

## Regeneration

`etsgen` is invoked by the pipeline (`generate.sh` → `runner` →
`etsgen`). Do not invoke it directly. To pick up changes, run:

```bash
bash generate.sh
```

The `--ets2idl` step accepts these options when the runner forwards
them; this list is reference for understanding pipeline flags, not an
invocation guide:

| Option | Description |
|--------|-------------|
| `--ets2idl` | Convert .d.ts to IDL |
| `--input-dir` | Input directory with .d.ts files |
| `--output-dir` | Output directory for IDL files |
| `--base-dir` | Base directory for package names |
| `--ets-config` | ETS-specific configuration |
| `--options-file` | Generator options file |
| `--trace-status` | Generate trace information |

## Configuration (ETSConfigScheme)

```typescript
const ETSConfigScheme = {
    DeletedPackages: string[],      // Packages to skip
    DeletedDeclarations: string[],  // Declarations to remove
    DeletedMembers: Map<string, string[]>, // Members to remove per type
    Components: string[],           // UI components
    Throws: string[],              // Methods that throw
    ForceCallback: Map<string, string>, // Force callback types
    StubbedDeclarations: string[], // Generate stubs
    ForceDefaultExport: Map<string, string>, // Default exports
}
```

## Generation Process

```typescript
generateFromSts({
    inputFiles: string[],    // .d.ts files to process
    baseDir: string,         // Base directory for packages
    outDir: string,          // Output directory
    etsConfigPath: string,   // Config file path
    config: ETSVisitorConfig // Loaded configuration
})
```

## Key Types

### StatusRecord

Tracks generation status for each declaration:

```typescript
class StatusRecord {
    fullPackage: string  // Full package path
    pkg: string          // Package name
    parent: string       // Parent type
    name: string         // Declaration name
    override: number     // Override count
    type: string         // Declaration type
    status: string       // Generation status
    src: string          // Source file
}
```

## Dependencies

- `@idlizer/core` - IDL types and utilities
- `@koalaui/libarkts` - ArkTS AST parsing

## Integration with Runner

`etsgen` is typically called via `runner` commands:

```typescript
// From runner/src/commands/ets2idl.ts
commands.ets2idl({
    etsgen: 'npx etsgen',
    sdkPath: '/path/to/sdk',
    optionsFile: './options.json'
})
```
