# Extendable Component Generation Design

## Summary

Add code generation support for `ExtendableXXX` abstract classes (e.g., `ExtendableButton`, `ExtendableColumn`) that allow ArkUI components to be extended via class inheritance. Generation is ArkTS-only — no native (C++) code is produced for these classes.

Pilot scope: `ExtendableButton` and `ExtendableColumn`. Additional components follow the same pattern.

## Motivation

Upstream interface SDK PR (openharmony/interface_sdk-js#32681) adds `ExtendableXXX` abstract class declarations to `.d.ets` files. The corresponding generated code PR (openharmony/arkui_ace_engine#84380) shows the expected ArkTS output. The idlize pipeline must produce this output automatically.

## Approach: Config Whitelist

A new `extendableComponents` list in `arkgen/generation-config/config.json` uses FQNs matching IDL package structure to control which components get extendable generation:

```json
{
  "extendableComponents": [
    "arkui.component.button.ExtendableButton",
    "arkui.component.column.ExtendableColumn"
  ]
}
```

Each FQN follows the pattern `package.DeclarationName` from the IDL file (e.g., `package arkui.component.button` → `arkui.component.button.ExtendableButton`).

## 1. etsgen Changes — None Required

etsgen already handles all constructs needed:
- `abstract class` declarations → IDL with `[Abstract]` attribute
- `type ConstructorT<T> = (() => T)` → IDL callback node
- `implements ButtonAttribute` → added to inheritance
- `@ComponentBuilder` on static methods → component interface with callable
- `@Builder` on static methods → `TypeAnnotations=Builder`
- `CustomBuilderT<T>` → `[TypeAnnotations=Builder] callback <T> CustomBuilderT`

Once the `.d.ets` SDK files are updated with ExtendableXXX declarations, etsgen produces the corresponding IDL automatically.

## 2. ArkTS Generation Changes

### 2a. CommonStyle Wrapper for Attribute Interface Methods

**File:** `arkgen/src/printers/ArkoalaInterfacePrinter.ts`

Currently only `CommonMethod` gets the commonStyle push/check wrapper (lines 78-98). For extendable components, the same wrapper is applied to their attribute interface methods.

When the printer generates methods for an attribute interface whose component is listed in `extendableComponents`, each method body uses this pattern:

```typescript
const commonStyle: Array<(instance: CommonMethod) => void> | undefined =
    this.__get__commonStyles__Internal();
if (commonStyle) {
    (commonStyle as Array<(instance: CommonMethod) => void>).push(
        (instance: CommonMethod): void => (instance as ButtonAttribute).type(value)
    );
    return this;
} else {
    if (this.__is_CustomComponent__Internal()) {
        throw new Error("Button attribute 'type' can only be set when creating an extendable component.")
    }
}
throw new Error('Unimplemented method type')
```

The error message includes the component name and method name.

### 2b. ExtendableXXX Abstract Class Generation

A new generation step produces each `ExtendableXXX` class. The class is synthesized from the component's existing data (attribute interface methods, interface call signatures), not a simple pass-through of the IDL declaration.

Generated class structure for `ExtendableButton`:

```typescript
export abstract class ExtendableButton extends ExtendableCommonMethod implements ButtonAttribute {

    @memo
    static _instantiateImpl<T extends ExtendableButton>(
        @memo @memo_skip
        styles: (instance: T) => void,
        factory: () => T,
        @memo @memo_skip
        _content: CustomBuilder
    ): void {
        const instanceExtendable = remember(factory);
        @memo @memo_skip
        const cb = (instance: ButtonAttribute): void => {
            styles(instanceExtendable);
            let commonStyles = instanceExtendable.__get__commonStyles__Internal()
            if (commonStyles) {
                commonStyles.forEach((func) => { func(instance); })
            }
            instanceExtendable.__set__commonStyles__Internal(new Array<(instance: CommonMethod) => void>);
        }
        ButtonImpl(cb, _content);
    }

    @ComponentBuilder
    static $_instantiate<T extends ExtendableButton>(
        factory: () => T, label: ResourceStr, options?: ButtonOptions, content?: CustomBuilder
    ): T {
        throw Error("Illegal call of $_instantiate")
    }

    @ComponentBuilder
    static $_instantiate<T extends ExtendableButton>(
        factory: () => T, options?: ButtonOptions, content?: CustomBuilder
    ): T {
        throw Error("Illegal call of $_instantiate")
    }

    setButtonOptions(label: ResourceStr, options?: ButtonOptions): this {
        // commonStyle wrapper pattern (same as 2a)
    }

    setButtonOptions(options?: ButtonOptions): this {
        // commonStyle wrapper pattern (same as 2a)
    }
}
```

Key observations:
- `_instantiateImpl` uses unwrapped types: `CustomBuilderT<T>` → `(instance: T) => void`, `ConstructorT<T>` → `() => T`
- `_instantiateImpl` body calls `XXXImpl(cb, _content)` where `XXX` is the component name
- `$_instantiate` overloads match the component's interface call signatures (from `ButtonInterface` callables)
- `$_instantiate` bodies throw `"Illegal call of $_instantiate"`
- `setXXXOptions` methods get the commonStyle wrapper

### 2c. ExtendableCommonMethod Base Class

Generated once in `common.ets`:

```typescript
export abstract class ExtendableCommonMethod implements CommonMethod {
    __get__commonStyles__Internal(): Array<(instance: CommonMethod) => void> | undefined {
        return undefined;
    }
    __set__commonStyles__Internal(value: Array<(instance: CommonMethod) => void>): void {
    }
    __is_CustomComponent__Internal(): boolean {
        return true;
    }
}
```

Note: The actual storage and mechanism may be provided by the runtime (`@koalaui/runtime`). The generated class serves as the type-level base with these internal methods.

## 3. Native (C++) Skip Mechanism

The `extendableComponents` FQNs auto-drive native skip:
- FQN resolved to simple name (e.g., `arkui.component.button.ExtendableButton` → `ExtendableButton`)
- Added to effective `ignoreMaterialized` list at generation time
- `ExtendableCommonMethod` also added to `ignoreMaterialized`
- No manual duplication in config

Existing component C++ generation is unaffected.

## 4. Configuration Schema Change

**File:** `arkgen/generation-config/config.json` and `schema.json`

New top-level property:

```json
{
  "extendableComponents": {
    "description": "List of FQNs for Extendable component classes. Enables commonStyle wrapper on the component's attribute interface and generates the ExtendableXXX class. Native (C++) generation is skipped for these classes.",
    "type": "array",
    "items": { "type": "string" },
    "default": []
  }
}
```

## 5. Implementation Steps (Summary)

1. Add `extendableComponents` to config schema and config file
2. Extend `ArkoalaInterfacePrinter.ts` to apply commonStyle wrapper for extendable component attribute interfaces
3. Create ExtendableXXX class generation logic (new printer or extend existing)
4. Add `ExtendableCommonMethod` base class generation to `common.ets`
5. Wire native skip via effective `ignoreMaterialized`
6. Test with Button and Column as pilot components
7. Verify generated output matches the ace engine PR pattern

## 6. Files to Modify

- `arkgen/generation-config/config.json` — add `extendableComponents`
- `arkgen/generation-config/schema.json` — add schema for new property
- `arkgen/src/printers/ArkoalaInterfacePrinter.ts` — extend commonStyle wrapper
- New or extended printer for ExtendableXXX class generation
- Native skip wiring in materialization logic
