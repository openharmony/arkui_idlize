---
name: idl-libohos
description: Use when working with libohos module - peer generation infrastructure, printers, serializers, or language-specific code generation utilities
---

# Libohos Module

## Overview

`libohos` is the core infrastructure library for OpenHarmony peer generation. It provides:
- Peer generation framework
- Language-specific printers
- Serialization infrastructure
- C++/ArkTS/CangJie code generation utilities

**Core principle:** Reusable peer generation infrastructure for multiple targets

## Key Directories

```
libohos/src/
├── index.ts              # Main exports
├── launch.ts             # Predefined files loader
├── DefaultConfiguration.ts # Default config
├── ost/                  # OpenHarmony Standard Types
│   ├── builder.ts        # AST builders
│   ├── builders.ts       # Type builders
│   ├── stdlib.ts         # Standard library types
│   ├── lws.ts            # Low-level wrappers
│   └── printers/
│       └── translators/  # Language translators
├── ostgen/               # OST Generation
│   ├── engine/           # Generation engine
│   ├── producers/        # Code producers
│   │   ├── managed/      # Managed code (ArkTS, etc.)
│   │   ├── native/       # Native code (C++)
│   │   └── components/   # Component generation
│   └── postprocess/      # Post-processing
└── peer-generation/      # Peer generation framework
    ├── plugin-api.ts     # Plugin interface
    ├── LayoutManager.ts  # File layout management
    ├── NativeModule.ts   # Native module support
    ├── ImportsCollector.ts
    ├── PeersCollector.ts
    ├── ComponentsCollector.ts
    └── printers/         # Code printers
```

## Peer Generation Printers

| Printer | Purpose |
|---------|---------|
| `InterfacePrinter` | Interface declarations |
| `PeersPrinter` | Peer classes |
| `StructPrinter` | C++ structs |
| `HeaderPrinter` | C++ headers |
| `SerializerPrinter` | Serialization code |
| `ConvertorsPrinter` | Type convertors |
| `CallbackPrinter` | Callback types |
| `MaterializedPrinter` | Materialized classes |
| `ModifierPrinter` | Attribute modifiers |
| `NativeModulePrinter` | Native modules |
| `GlobalScopePrinter` | Global declarations |
| `MesonPrinter` | Meson build files |
| `GniPrinter` | GN build files |

## Plugin System

```typescript
interface Plugin {
    process(options: PluginOptions, idl: PeerLibrary): void
}

async function loadPlugin(path: string): Promise<Plugin>
```

## Engine Context

```typescript
// ostgen/engine/context.ts
class GenerationContext {
    // Manages generation state, dependencies, etc.
}
```

## Producers

### Managed Code Producers (ostgen/producers/managed/)

- `serializer.ts` - Serialization logic
- `structure.ts` - Structure types
- `union.ts` - Union types
- `containers.ts` - Container types
- `enum.ts` - Enumerations
- `callback.ts` - Callbacks
- `function.ts` - Functions
- `typedef.ts` - Type aliases
- `primitives.ts` - Primitive types

### Native Code Producers (ostgen/producers/native/)

- `bridge.ts` - Bridge code
- `serializer.ts` - Native serialization
- `structure.ts` - C++ structures
- `union.ts` - C++ unions
- `enum.ts` - C++ enums
- `function.ts` - C++ functions

## Key Exports

```typescript
// From index.ts
export * from "./peer-generation/Tracker"
export * from "./peer-generation/ImportsCollector"
export * from "./peer-generation/ComponentsCollector"
export * from "./peer-generation/PeersCollector"
export * from "./peer-generation/LayoutManager"
export * from "./peer-generation/NativeModule"
export * from "./peer-generation/FileGenerators"

// Printers
export * from "./peer-generation/printers/PeersPrinter"
export * from "./peer-generation/printers/InterfacePrinter"
export * from "./peer-generation/printers/StructPrinter"
// ... many more printers
```

## Language Translators

```typescript
// ost/printers/translators/
processNPrintCJ()     // CangJie
processNPrintTS()     // TypeScript
processNPrintCXX()    // C++
processNPrintJava()   // Java
processNPrintArkTS()  // ArkTS
```

## Common Patterns

### Creating a Printer

Extend base printer classes:

```typescript
import { IndentedPrinter } from "@idlizer/core"

class MyPrinter {
    constructor(private printer: IndentedPrinter) {}

    print(data: MyData): void {
        this.printer.print("generated code")
    }
}
```

### Using Layout Manager

```typescript
import { LayoutManager, LayoutManagerStrategy } from "@idlizer/libohos"

const layout = new LayoutManager(strategy)
const filePath = layout.pathFor("MyClass", "ts")
```

### Loading Predefined Files

```typescript
import { libohosPredefinedFiles } from "@idlizer/libohos"

const files = libohosPredefinedFiles()
// Returns predefined IDL files from libohos/predefined/
```

## Templates

Located in `libohos/templates/`:
- `arkts/` - ArkTS templates (materialized class, component builder)
- `NativeModuleEmpty_template.ts` - Empty native module template

## Dependencies

- `@idlizer/core` - Core IDL types and utilities
