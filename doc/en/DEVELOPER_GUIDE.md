# IDLize Developer Workflow Guide

This guide walks ArkUI developers through using the IDLize toolchain to
define component interfaces in IDL format and generate native bindings for
the OpenHarmony / ArkUI ecosystem.

For the full IDL language specification, see [IDL_SPEC.md](IDL_SPEC.md).

---

## Prerequisites

Before generating code, set up the build environment:

```bash
# Clone and install dependencies
git submodule update --init
npm install
cd external && npm install && cd ..

# Prepare libarkts
cd external/libarkts
PANDA_SDK_VERSION=1.5.0-dev.58082 npm run panda:sdk:reinstall
npm run compile
cd ../../

# Compile all workspaces
cd runner && npm run compile && cd ..

# Download the SDK
npm run download:sdk
```

---

## Scenario 1: Creating a New Component from Scratch

This scenario walks through defining a brand-new ArkUI component called
`MyButton`, running the pipeline, and integrating the generated output.

### 1.1 Define the IDL Interface

Create a new `.idl` file. The file must start with a `package` declaration
and may import types from other IDL packages.

```idl
package arkui.component.mybutton;

import arkui.component.units;
import arkui.component.common;

// A callback for click events
callback MyButtonClickCallback = void (i32 clickCount);

// The component interface with [Component] extended attribute
[Component]
interface MyButton {
    constructor();

    // Attributes (properties)
    attribute String label;
    attribute ResourceColor backgroundColor;
    attribute Length width;
    attribute Length height;
    attribute boolean enabled;

    // Methods (attribute setters return the component type for chaining)
    MyButton onClick(MyButtonClickCallback callback);
    MyButton fontSize(Length size);
    MyButton borderRadius(Length radius);
};

// The attribute interface (peer for modifier pattern)
[ComponentInterface]
interface MyButtonAttribute {
    MyButtonAttribute label(String value);
    MyButtonAttribute backgroundColor(ResourceColor color);
    MyButtonAttribute onClick(MyButtonClickCallback callback);
    MyButtonAttribute fontSize(Length size);
    MyButtonAttribute borderRadius(Length radius);
    MyButtonAttribute enabled(boolean value);
};
```

Key points:

- `package` places the interface in a namespace hierarchy.
- `import` brings types from other IDL packages into scope.
- `[Component]` marks the interface as an ArkUI component so the pipeline
  recognizes it and generates the full peer/modifier/serializer stack.
- `[ComponentInterface]` marks the attribute setter interface used by the
  modifier pattern.
- Attribute setters typically return the component or attribute type to
  support method chaining.
- Use standard IDL types (`String`, `boolean`, `i32`, `number`, `Length`,
  `ResourceColor`, etc.) or reference types defined in imported packages.

### 1.2 Place the IDL File

IDL files can be placed in one of two locations:

**Option A: The `interfaces/` directory** (recommended for handwritten IDL).

```
interfaces/interfaces/arkui-extra/mybutton.idl
```

Files under `interfaces/interfaces/arkui-extra/` are picked up
automatically when `generate.sh` passes the directory as extra IDL input.

**Option B: A custom directory**, passed via the `<idl-files>` positional
argument to `runner m3`.

### 1.3 Configure Generation

Edit `arkgen/generation-config/config.json` to register the component.

By default, components are **not** materialized (they produce stubs only).
To generate full peers and modifiers, the component must not appear in the
`ignoreMaterialized` list. In most cases a new component will be
materialized by default, but if you need to force materialization, add the
fully qualified name to `forceMaterialized`:

```json
{
    "forceMaterialized": [
        "arkui.component.mybutton.MyButton",
        "arkui.component.mybutton.MyButtonAttribute"
    ]
}
```

The fully qualified name is the package path plus the interface name:
`<package>.<InterfaceName>`.

### 1.4 Run the Pipeline

Use `generate.sh` for a standard run, or invoke `runner m3` directly:

```bash
# Using the provided script
bash generate.sh
```

Or with explicit arguments:

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
    --output "./out"
```

Key flags:

| Flag | Purpose |
|---|---|
| `--sdk-stage prepared` | Use the pre-patched SDK. Use `idl` when feeding `.idl` files directly. |
| `--arkgen-options-file` | Path to the generation config (`config.json`). |
| `--etsgen-options-file` | Path to the etsgen conversion config. Required for `original` and `prepared` SDK stages. |
| `--arkgen-interop-types` | Path to the shared C++ interop types header. |
| `--scraper-options-file` | Scraper configuration controlling which packages are processed. |
| `--target` | `sig` (ArkTS peers only), `libace` (C++ modifiers only), or `all`. |

### 1.5 Locate the Output

After a successful run, intermediate files remain under `runner/out/`, and
the selected peer output is installed into the `--output` path:

```
out/
  sig/                            # Arkoala peers (ArkTS / TypeScript)
    arkoala-arkts/
      ...
  libace/                         # C++ libace modifiers
    generated/
      ...
```

Naming conventions for generated files:

| Generated artifact | Naming pattern |
|---|---|
| Peer class | `Ark<Component>Peer` (e.g. `ArkMyButtonPeer`) |
| Component class | `Ark<Component>Component` (e.g. `ArkMyButtonComponent`) |
| C++ modifier | `<Component>Modifier` (e.g. `MyButtonModifier`) |
| Materialized interface impl | `<Name>Internal` (e.g. `MyButtonInternal`) |
| Native module call | `ArkUIGeneratedNativeModule._<method>` |

### 1.6 Integrate the Generated Peers

The generated ArkTS peer can be imported and used in application code:

```typescript
import { ArkMyButtonComponent } from "./generated/ArkMyButtonComponent"

const button = new ArkMyButtonComponent()
button.label("Submit")
    .backgroundColor(Color.Blue)
    .fontSize(16)
    .borderRadius(8)
    .onClick((clickCount) => {
        console.log(`Clicked ${clickCount} times`)
    })
```

On the native side, the C++ modifier applies property changes to the
framenode when the peer's setter methods are invoked through the
serialization bridge.

### 1.7 Verify the Output

After generation, inspect the output files to confirm correctness:

```bash
# Check that peer files were generated
find out/sig -name "*MyButton*"

# Check that C++ modifier files were generated
find out/libace -name "*MyButton*"
```

If a file is missing or has incorrect content, trace backwards through the
pipeline stages:

1. Check the installed output in `out/sig/` or `out/libace/`.
2. Check the intermediate generated output in `runner/out/peers/sig/` or
   `runner/out/peers/libace/`.
3. Check the converted IDL in `runner/out/idl/` to verify what the parser received.
4. Check the generation config (`arkgen/generation-config/config.json`) to
   confirm the component is not in `ignoreMaterialized`.

---

## Scenario 2: Adding a New Interface to an Existing Component

This scenario covers extending an existing component with new attributes
or methods.

### 2.1 Locate the IDL File

Generated IDL files from the pipeline are placed in `runner/out/idl/`.
Handwritten or supplementary IDL files live under `interfaces/interfaces/`.

```bash
# Find the IDL file for a specific component
find interfaces/interfaces/ -name "*.idl" | xargs grep -l "ExistingComponent"
```

If the component was derived from a `.d.ts` / `.d.ets` declaration, the
IDL was produced by the `etsgen` stage and lives in `runner/out/idl/`. That 
is generated folder and it will be overwritten every time generation is launched. 
Never modify files in out folder, instead correct input `.d.ets` declarations.

If it was handwritten, check `interfaces/interfaces/arkui-extra/` - that files can 
be modified to update.

### 2.2 Edit the handwritten IDL

Open the IDL file and add new attributes or methods to the interface:

```idl
package arkui.component.existing;

import arkui.component.common;
import arkui.component.units;

[Component]
interface ExistingComponent {
    // ... existing attributes and methods ...

    // NEW: Add a new property
    attribute String tooltip;

    // NEW: Add a new method with parameters
    ExistingComponent shadow(number radius, number offsetX, number offsetY, ResourceColor color);

    // NEW: Add a method with an optional parameter
    ExistingComponent animation(optional Duration duration);
};
```

When adding methods to the attribute interface:

```idl
[ComponentInterface]
interface ExistingComponentAttribute {
    // ... existing setters ...

    // NEW: Setter for the tooltip property
    ExistingComponentAttribute tooltip(String value);

    // NEW: Setter for shadow
    ExistingComponentAttribute shadow(number radius, number offsetX, number offsetY, ResourceColor color);
};
```

### 2.3 Regenerate

Re-run the pipeline:

```bash
bash generate.sh
```

The generator detects changes in the IDL files and regenerates only the
affected output files.

### 2.4 Update Integration Code

After regeneration, any new methods appear on the generated peer and
modifier classes. Update application code to use the new APIs:

```typescript
// New methods are available on the generated component
component.tooltip("Click to submit")
    .shadow(4, 2, 2, Color.Gray)
    .animation(Duration.seconds(300))
```

### 2.5 Naming Conventions for Generated Methods

Generated method and property names follow these rules:

| IDL declaration | Generated peer method | Generated C++ modifier method |
|---|---|---|
| `attribute String label` | `getLabel()`, `setLabel(value)` | `setLabel(value)` |
| `void onClick(Callback cb)` | `onClick(cb)` | `onClick(cb)` |
| `ExistingComponent shadow(...)` | `shadow(...)` returning `this` | `shadow(...)` |
| `static void foo()` | `static foo()` on the peer | `foo()` in native module |

Method names in generated code match the IDL method names directly. The
first letter is unchanged (no case transformation).

---

## Scenario 3: Modifying Existing Interface Parameters

This scenario covers changing parameters of existing methods or
attributes, including type changes, optional parameters, and overloads.

### 3.1 Edit the IDL

Open the IDL file and modify the target method or attribute. Several
common parameter changes are shown below.

**Adding an optional parameter:**

```idl
interface ExistingComponent {
    // Before:
    // ExistingComponent borderWidth(Length width);

    // After: add optional color parameter
    ExistingComponent borderWidth(Length width, optional ResourceColor color);
};
```

**Changing a parameter type:**

```idl
interface ExistingComponent {
    // Before:
    // void setData(String data);

    // After: change to a sequence type
    void setData(sequence<String> data);
};
```

**Adding an overload using optional parameters:**

```idl
interface ExistingComponent {
    // Original method
    ExistingComponent padding(Length value);

    // Overload with different signature (using a container type)
    ExistingComponent padding(record<String, Length> edges);
};
```

IDL supports overloaded methods -- functions with the same name but
different parameter signatures:

```idl
interface ExistingComponent {
    void resize(number width, number height);
    void resize(SizeOptions size);
};
```

### 3.2 Handle Backward Compatibility

Changing existing interfaces can break consumers of the generated code.
Consider these guidelines:

- **Adding optional parameters** is backward compatible. Existing call sites
  continue to work without modification.
- **Changing parameter types** is a breaking change. Consumers must update
  their code to match the new signature.
- **Adding new overloads** is backward compatible. Existing call sites
  remain valid.
- **Removing parameters or methods** is a breaking change. Deprecate first
  using the `[Deprecated]` extended attribute:

```idl
interface ExistingComponent {
    // Mark old method as deprecated
    [Deprecated]
    ExistingComponent oldMethod(String param);

    // Provide replacement
    ExistingComponent newMethod(String param, optional i32 flags);
};
```

### 3.3 Regenerate and Verify

Re-run the pipeline and inspect the output:

```bash
bash generate.sh

# Verify the generated methods reflect the changes
rg -n "borderWidth" out/sig runner/out/peers/sig
rg -n "setData" out/libace runner/out/peers/libace
```

Check that:

- The generated peer methods have the updated signatures.
- The C++ modifier methods accept the new parameter types.
- Serializers correctly encode the new parameter types.

---

## IDL Syntax Quick Reference

### Package and Import

```idl
package arkui.component.mycomponent;

import arkui.component.common;
import arkui.component.units.Length as Length;
```

### Interface with Attributes and Methods

```idl
interface MyService {
    // Constructor
    constructor(String name, optional i32 timeout);

    // Attributes
    attribute String name;
    readonly attribute i32 id;
    [Optional] attribute String description;

    // Methods
    void start();
    boolean isRunning();
    String getStatus(optional boolean verbose);

    // Static method
    static MyService createDefault();
};
```

If interface with **`Entity=Class` attribute** is declared and this interface is supposed 
to be a peer or have any method, attrubtes must be avioded or used only with `Getter/Setter` combination.

```idl
[Entity=Class]
interface MyService {
    // Attributes
    [Accessor=Getter]
    attribute String name;
    [Accessor=Getter]
    readonly attribute i32 id;
    [Accessor=Getter]
    [Optional] attribute String description;
    [Accessor=Setter]
    [Optional] attribute String description;

    // Methods
    void start();
};
```


### Optional Parameters

```idl
void drawRect(number x, number y, number width, number height, optional ResourceColor fill);

// Optional interface attribute
[Optional] attribute String tooltip;
```

### Callbacks

```idl
// Define a callback type
callback OnChangeCallback = void (String newValue, i32 changeId);
callback OnErrorCallback = void (String message);

// Use callbacks as method parameters or attributes
interface MyComponent {
    attribute OnChangeCallback onChange;
    void setOnError(OnErrorCallback callback);
};
```

### Enums (Dictionary Syntax)

```idl
dictionary Direction {
    number UP = 0;
    number DOWN = 1;
    number LEFT = 2;
    number RIGHT = 3;
};
```

### Union Types

```idl
// A parameter that accepts multiple types
void setSize((number or String or Length) value);

// Optional union
void setColor(optional (ResourceColor or undefined) color);
```

### Sequences and Records

```idl
void setItems(sequence<String> items);
void setMetadata(record<String, boolean> meta);
```

### Extended Attributes

| Extended Attribute | Usage | Description |
|---|---|---|
| `[Component]` | On interfaces | Marks an ArkUI component |
| `[ComponentInterface]` | On interfaces | Marks the attribute setter interface |
| `[Entity=Class]` | On interfaces | Generate as a class with pointer backing |
| `[Entity=Interface]` | On interfaces | Generate as a pure interface |
| `[Optional]` | On attributes | Attribute may be omitted |
| `[Deprecated]` | On any declaration | Marks the API as deprecated |
| `[Throws]` | On methods | Method may throw an exception |
| `[Accessor=Getter]` / `[Accessor=Setter]` | On properties | Property is an accessor |
| `[ComponentModifier]` | On interfaces | Marks a modifier stub |
| `[Static]` | On methods/attributes | Belongs to the interface, not instances |
| `[Documentation="..."]` | On any declaration | Inline documentation |
| `[TypeParameters="T"]` | On interfaces | Generic type parameter declaration |
| `[TypeArguments="Foo"]` | On methods/properties | Concrete generic argument |
| `[VerbatimDts="..."]` | On any declaration | Verbatim TypeScript output |
| `[DtsName="original"]` | On any declaration | Preserve original declaration name |

### Constants

```idl
const String DEFAULT_LABEL = "OK";
const i32 MAX_RETRIES = 3;
```

### Type Aliases

```idl
typedef ResourceColor = (number or String);
typedef OptionalNumber = number?;
```

---

## File Locations Reference

### Input Files

| What | Location |
|---|---|
| Handwritten IDL files | `interfaces/interfaces/arkui-extra/` |
| Generated IDL (from etsgen) | `runner/out/idl/` |
| Upstream SDK submodule | `interface_sdk-js/` |
| Patched SDK (ArkTS) | `sdk-patched-arkts/` |
| Patched SDK (TypeScript) | `sdk-patched/` |

### Generated Output

| What | Location |
|---|---|
| Installed ArkTS peers (`--target sig`) | `<--output>/` |
| Installed C++ libace modifiers (`--target libace`) | `<--output>/` |
| Installed output (`--target all`) | `<--output>/sig/` and `<--output>/libace/` |
| Intermediate peer output | `runner/out/peers/` |
| Scraped IDL | `runner/out/scraper/` |
| Prepared SDK (ArkTS) | `runner/out/patched-sdk-arkts/` |
| Prepared SDK (TypeScript) | `runner/out/patched-sdk-ts/` |
| Response files | `runner/out/response-files/` |

### Configuration

| What | Location |
|---|---|
| Generation config | `arkgen/generation-config/config.json` |
| Generation config schema | `arkgen/generation-config/schema.json` |
| Scraper config | `runner/configs/scraper-config.json` |
| Etsgen config | `etsgen/generator-config.json` |
| Output directory constants | `runner/src/shared.ts` |

### Generation Script

The standard generation command is in `generate.sh` at the repository root.
Run it after any IDL or configuration change to regenerate all output.
