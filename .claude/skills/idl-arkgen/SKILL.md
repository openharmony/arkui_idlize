---
name: idl-arkgen
description: Use when working with arkgen module - generating ArkUI component peers, Arkoala bindings, C++ modifiers, or libace/libsig targets
---

# Arkgen Module

## Overview

`arkgen` generates ArkUI component peer code for multiple targets:
- **sig** - TypeScript/ArkTS peer signatures
- **libace** - C++ native implementation (modifiers, accessors, bridges)
- **all** - Both targets together

**Core principle:** IDL → Language-specific peer code (ArkTS, C++, CangJie)

## Key Files

```
arkgen/src/
├── main.ts              # CLI entry point
├── app.ts               # arkgen() CLI command handler
├── arkoala.ts           # Main generation logic
├── ArkoalaPeerLibrary.ts # Custom PeerLibrary for Arkoala
├── ArkoalaInstall.ts    # Installation targets (libace, sig)
├── ArkoalaLayout.ts     # File layout configuration
├── ArkPrimitiveType.ts  # Ark primitive types
├── config.ts            # Configuration (ARKGEN_ROOT)
├── printers/
│   ├── ArkoalaInterfacePrinter.ts
│   ├── ComponentsPrinter.ts
│   ├── ModifierPrinter.ts
│   └── PeersPrinter.ts
```

## CLI Usage

```bash
npx arkgen --idl2peer \
  --input-files <idl-files> \
  --output-dir <output> \
  --generator-target <arkoala|libace|all|tracker> \
  --language <ts|arkts|cpp|cj> \
  --options-file <config.json>
```

## ArkoalaPeerLibrary

Extends `PeerLibrary` with Arkoala-specific type conversion:

```typescript
class ArkoalaPeerLibrary extends PeerLibrary {
    // Custom language writers for TS, ArkTS, C++, CangJie
    override createLanguageWriter(language?: Language): LanguageWriter

    // Custom type name convertors
    override createTypeNameConvertor(language: Language): IdlNameConvertor

    // Arkoala-specific type conversion (AnimationRange, etc.)
    override declarationConvertor(param, type, declaration): ArgConvertor
}
```

## Generation Targets

### arkoala (sig)
Generates TypeScript/ArkTS peer signatures:
- Interface declarations
- Peer method signatures
- Component builders

### libace
Generates C++ native implementation:
- Modifiers (attribute setters)
- Accessors (attribute getters)
- Bridge code (managed ↔ native)
- Serialization code

### tracker
Generates API coverage tracking reports.

## Printers

| Printer | Purpose |
|---------|---------|
| `ArkoalaInterfacePrinter` | Interface declarations |
| `ComponentsPrinter` | UI component generation |
| `ModifierPrinter` | C++ modifier classes |
| `PeersPrinter` | Peer class generation |

## Key Functions

```typescript
// Main generation entry points
generateLibaceFromIdl(config, peerLibrary)  // C++ libace
generateArkoalaFromIdl(config, peerLibrary) // TS/ArkTS sig

// Installation
createArkoalaInstall(outputDir)  // sig target
new LibaceInstall(outputDir)     // libace target
```

## File Layout

```typescript
// From ArkoalaLayout.ts
arkoalaLayout: {
    peers: "peers/",
    generated: "generated/",
    modifiers: "modifiers/",
    accessors: "accessors/"
}
```

## Common Patterns

### Adding New Component

1. Define IDL interface for component
2. Run arkgen with `--generator-target arkoala`
3. Generated peers appear in output directory

### Custom Type Conversion

Extend `ArkoalaPeerLibrary.declarationConvertor()`:

```typescript
override declarationConvertor(param, type, declaration) {
    switch (type.name) {
        case 'MyCustomType':
            return new MyCustomConvertor(param, ...)
    }
    return super.declarationConvertor(param, type, declaration)
}
```

## Dependencies

- `@idlizer/core` - IDL parsing and base classes
- `@idlizer/libohos` - Peer generation infrastructure
- `@koalaui/libarkts` - ArkTS AST utilities

- `idl-arkgen-config` - Arkgen configuration skill

- `idl-etsgen` - EtsGen module skill
- `idl-runner` - Runner module skill
- `idl-libohos` - Libohos module skill
