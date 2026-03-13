---
name: idl-arkgen-config
description: Use when modifying arkgen generation-config/config.json, understanding configuration options, transformOnSerialize rules, or component generation settings
---

# Arkgen Configuration

## Overview

`arkgen/generation-config/config.json` controls peer code generation for ArkUI components. It defines type prefixes, component handling, serialization transforms, and generation rules.

**Core principle:** Configuration-driven code generation with type mapping and filtering

## Configuration Files

```
arkgen/generation-config/
├── config.json          # Main configuration
├── schema.json          # JSON schema for validation
├── idl-config.json      # IDL-specific settings
├── config-arkui.json    # ArkUI-specific settings
└── skoala-generator.json # Skoala settings
```

## Loading & Merging

Configurations are loaded and merged via `--options-file`:

```bash
npx arkgen --idl2peer --options-file config.json [--ignore-default-config]
```

```typescript
// From arkgen/src/config.ts
export function arkgenDefaultConfigurationPaths(): string[] {
    return [
        join(ARKGEN_ROOT, 'generation-config/config.json'),
        join(ARKGEN_ROOT, 'generation-config/idl-config.json'),
    ]
}
```

Multiple configs are merged (later files override earlier):

```typescript
// From core/src/config.ts
export function parseConfigFiles<T>(schema, configurationFiles: string[]): T
```

## Core Configuration Fields

### Prefixes & Naming

| Field | Type | Description |
|-------|------|-------------|
| `TypePrefix` | string | Prefix for generated types (e.g., `"Ark_"`) |
| `LibraryPrefix` | string | Library name prefix |
| `OptionalPrefix` | string | Prefix for optional types (e.g., `"Opt_"`) |
| `cppPrefix` | string | C++ specific prefix |

### API Versioning

| Field | Type | Description |
|-------|------|-------------|
| `ApiKind` | number | API kind identifier |
| `ApiVersion` | number | Target API version |
| `GenerateUnused` | boolean | Generate unused declarations |

### Component Configuration

```json
{
  "components": {
    "ignoreComponents": [],      // Skip these components
    "ignorePeerMethod": [],      // Skip these peer methods
    "invalidAttributes": [],     // Invalid attribute names
    "customNodeTypes": [],       // Custom node type names
    "ignoreEntry": [],           // Skip these entries
    "custom": [],                // Custom component names
    "handWritten": [],           // Hand-written implementations
    "replaceThrowErrorReturn": [] // Replace throw with error return
  }
}
```

## Transform on Serialize

Maps source types to target types during serialization:

```json
{
  "transformOnSerialize": [
    { "from": "ohos.base.BusinessError", "to": "arkui.component.idlize.BusinessErrorInterface" },
    { "from": "arkui.component.builder.PageMapBuilder", "to": "arkui.component.idlize.PageMapNodeBuilder" }
  ]
}
```

### How It Works

1. **Transformer** (`core/src/transformers/OnSerializeTransformer.ts`) adds `TransformOnSerialize` extended attribute
2. **Convertor** (`core/src/LanguageWriters/ArgConvertors.ts`) uses `TransformOnSerializeConvertor` for type conversion
3. **At runtime**, source type is serialized as target type

```typescript
// From arkgen/src/app.ts
files = transformOnSerializeTransformer(files, (node: IDLNode) => {
    const transformation = peerGeneratorConfiguration().transformOnSerialize.find(
        it => it.from === getFQName(node))
    return transformation?.to
})
```

## Materialized Classes

### ignoreMaterialized

Types to skip materialization:

```json
{
  "ignoreMaterialized": [
    "AnimatableArithmetic",
    "GestureHandler",
    "TouchTestInfo"
  ]
}
```

### forceMaterialized

Types to force materialization:

```json
{
  "forceMaterialized": ["SomeType"]
}
```

### materialized.ignoreReturnTypes

Ignore materialization for return types:

```json
{
  "materialized": {
    "ignoreReturnTypes": ["Callback", "EventListener"]
  }
}
```

## Generics Handling

```json
{
  "ignoreGenerics": [
    "arkui.component.common.AttributeModifier",
    "arkui.component.common.ContentModifier"
  ]
}
```

## Resource & Context Forcing

```json
{
  "forceResource": ["Image", "Resource"],  // Treat as opaque resource handles
  "forceContext": ["SomeContextClass"]      // Force VM context in methods
}
```

## Callbacks

```json
{
  "forceCallback": {
    "SomeInterface": ["onClick", "onHover"]
  }
}
```

## Hooks

Hook custom implementation into generated code:

```json
{
  "hooks": {
    "ClassName": {
      "methodName": {
        "hookName": "customHookFunction",
        "replaceImplementation": true
      }
    }
  }
}
```

## Modules

Define module structure:

```json
{
  "moduleName": "arkui",
  "modules": {
    "component": {
      "name": "arkui.component",
      "packages": ["arkui.component.*"],
      "external": false
    }
  }
}
```

## Dummy Generation

Skip dummy implementations:

```json
{
  "dummy": {
    "ignoreMethods": {
      "ClassName": ["*"],           // Skip all methods
      "OtherClass": ["methodA"]     // Skip specific method
    }
  }
}
```

## Serializer

```json
{
  "serializer": {
    "ignore": ["SomeTypeToSkip"]
  }
}
```

## Handwritten Deserializers

```json
{
  "handwrittenDeserializers": [
    "CustomType1",
    "CustomType2"
  ]
}
```

## Accessing Configuration

```typescript
import { peerGeneratorConfiguration } from "@idlizer/libohos"

const config = peerGeneratorConfiguration()

// Check if entry should be ignored
config.ignoreEntry("SomeType", Language.ARKTS)

// Check if component is hand-written
config.isHandWritten("Button")

// Check if type should be treated as resource
config.isResource("Image")

// Check if throwing should be replaced with error return
config.isShouldReplaceThrowingError("SomeClass.method")
```

## Common Patterns

### Adding New Transform

```json
{
  "transformOnSerialize": [
    { "from": "old.package.TypeName", "to": "new.package.TransformedType" }
  ]
}
```

### Ignoring a Component

```json
{
  "components": {
    "ignoreComponents": ["UnwantedComponent"]
  }
}
```

### Forcing Resource Type

```json
{
  "forceResource": ["MyCustomType"]
}
```

## Schema Validation

The configuration is validated against `schema.json`:

```typescript
// From libohos/src/DefaultConfiguration.ts
export const PeerGeneratorConfigurationSchema = D.combine(
    CoreConfigurationSchema,
    D.object({
        // Additional fields...
    })
)
```

## Related Skills

- `idl-arkgen` - Arkgen module skill (for CLI usage, printers, etc.)
- `idl-core` - Core IDL module skill
- `idl-etsgen` - EtsGen module skill
- `idl-runner` - Runner module skill
- `idl-libohos` - Libohos module skill
