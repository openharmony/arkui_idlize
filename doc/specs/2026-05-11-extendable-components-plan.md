# Extendable Component Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ArkTS-only code generation for `ExtendableXXX` abstract classes (pilot: Button, Column) with commonStyle wrappers on attribute interface methods and native skip.

**Architecture:** Config-driven whitelist (`extendableComponents` FQN list) in `arkgen/generation-config/config.json`. The ArkoalaInterfacePrinter detects extendable components and generates: (1) commonStyle wrapper on attribute interface methods, (2) `ExtendableXXX` class with `_instantiateImpl`, `$_instantiate`, and `setXXXOptions`, (3) `ExtendableCommonMethod` base class. Native generation is skipped via effective `ignoreMaterialized`.

**Tech Stack:** TypeScript, idlize pipeline (core, arkgen, libohos)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `core/src/config.ts` | Config schema: add `extendableComponents` field |
| `arkgen/generation-config/schema.json` | JSON schema for config validation |
| `arkgen/generation-config/config.json` | Config data: pilot FQN entries |
| `arkgen/src/printers/ArkoalaInterfacePrinter.ts` | CommonStyle wrapper + ExtendableXXX class generation |
| `core/src/peer-generation/isMaterialized.ts` | Native skip for extendable classes |

---

### Task 1: Add `extendableComponents` to Config Infrastructure

**Files:**
- Modify: `core/src/config.ts:41-89`
- Modify: `arkgen/generation-config/schema.json`
- Modify: `arkgen/generation-config/config.json`

- [ ] **Step 1: Add field to CoreConfigurationSchema in `core/src/config.ts`**

After line 62 (`globalPackages: T.stringArray()`), add:

```typescript
    extendableComponents: T.stringArray(),
```

The schema section becomes:

```typescript
export const CoreConfigurationSchema = D.object({
    ApiKind: D.number(),
    TypePrefix: D.string(),
    LibraryPrefix: D.string(),
    OptionalPrefix: D.string(),

    rootComponents: T.stringArray(),
    standaloneComponents: T.stringArray(),
    parameterized: T.stringArray(),
    ignoreMaterialized: T.stringArray(),
    ignoreGenerics: T.stringArray(),
    builderClasses: T.stringArray(),
    forceMaterialized: T.stringArray(),
    forceCallback: D.map(D.string(), T.stringArray()).onMerge('replace'),
    forceResource: T.stringArray(),
    forceContext: T.stringArray(),
    hooks: D.map(D.string(), D.map(D.string(), HookMethodSchema)).onMerge('replace'),
    moduleName: D.string(),
    modules: D.map(D.string(), ModuleConfigurationSchema).onMerge('replace'),
    libraryNameMapping: D.maybe(D.map(D.string(), D.map(D.string(), D.string())).onMerge('replace')),

    globalPackages: T.stringArray(),

    extendableComponents: T.stringArray(),
})
```

- [ ] **Step 2: Add default value in `core/src/config.ts`**

In `defaultCoreConfiguration` (after `globalPackages: []` around line 88), add:

```typescript
    extendableComponents: [],
```

- [ ] **Step 3: Add to `arkgen/generation-config/schema.json`**

Find the `ignoreMaterialized` entry (around line 57-61) and add a new entry after the `globalPackages` entry at the end of the properties object:

```json
"extendableComponents": {
    "description": "FQNs of Extendable component classes (e.g. arkui.component.button.ExtendableButton). Enables commonStyle wrapper on the component's attribute interface, generates the ExtendableXXX abstract class (ArkTS-only, no native), and auto-adds to ignoreMaterialized.",
    "type": "array",
    "items": { "type": "string" }
}
```

- [ ] **Step 4: Add pilot entries to `arkgen/generation-config/config.json`**

After the `ignoreMaterialized` array (after line 29, before `ignoreGenerics`), add:

```json
    "extendableComponents": [
        "arkui.component.button.ExtendableButton",
        "arkui.component.column.ExtendableColumn"
    ],
```

- [ ] **Step 5: Build to verify config loads correctly**

Run: `cd /home/leslie/repo/idlize && npm run build -w core && npm run build -w arkgen`

Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add core/src/config.ts arkgen/generation-config/schema.json arkgen/generation-config/config.json
git commit -m "feat(config): add extendableComponents config field for ExtendableXXX generation"
```

---

### Task 2: Add Helper Utilities

**Files:**
- Modify: `core/src/config.ts`

- [ ] **Step 1: Add `getExtendableComponentNames()` helper in `core/src/config.ts`**

Add after `generatorTypePrefix()` (after line 108):

```typescript
export function getExtendableComponentNames(): Set<string> {
    const config = generatorConfiguration()
    const names = new Set<string>()
    for (const fqn of config.extendableComponents) {
        const lastDot = fqn.lastIndexOf('.')
        const declName = lastDot >= 0 ? fqn.substring(lastDot + 1) : fqn
        if (declName.startsWith('Extendable')) {
            names.add(declName.substring('Extendable'.length))
        }
    }
    return names
}

export function getExtendableClassNames(): Set<string> {
    const config = generatorConfiguration()
    const names = new Set<string>()
    for (const fqn of config.extendableComponents) {
        const lastDot = fqn.lastIndexOf('.')
        const declName = lastDot >= 0 ? fqn.substring(lastDot + 1) : fqn
        if (declName.startsWith('Extendable')) {
            names.add(declName)
        }
    }
    return names
}

export function isExtendableComponent(componentName: string): boolean {
    return getExtendableComponentNames().has(componentName)
}
```

These helpers:
- `getExtendableComponentNames()` — extracts component names (e.g., "Button", "Column") from FQN config entries
- `getExtendableClassNames()` — extracts class names (e.g., "ExtendableButton", "ExtendableColumn") from FQN config entries
- `isExtendableComponent(name)` — checks if a component name is extendable

- [ ] **Step 2: Build to verify**

Run: `npm run build -w core`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add core/src/config.ts
git commit -m "feat(config): add helper functions for extendable component lookup"
```

---

### Task 3: Extend CommonStyle Wrapper to Extendable Component Attribute Interfaces

**Files:**
- Modify: `arkgen/src/printers/ArkoalaInterfacePrinter.ts:42-131`

- [ ] **Step 1: Add import of `isExtendableComponent` at top of `ArkoalaInterfacePrinter.ts`**

In the imports section, add `isExtendableComponent` to the core import. Modify line 16:

```typescript
import * as idl from "@idlizer/core/idl"
```

Add after it:

```typescript
import { isExtendableComponent } from "@idlizer/core/config"
```

- [ ] **Step 2: Extend `printComponent()` to apply commonStyle wrapper for extendable components**

In `ArkoalaInterfacePrinter.ts`, modify the `printComponent()` method. The key change is in the method body generation block (lines 71-105).

Replace the method generation loop (lines 71-105) with:

```typescript
        const isCommon = idlInterface.name === 'CommonMethod'
        const isExtendable = isExtendableComponent(component.name)

        collapsedMethods.forEach(method => {
            if (this.peerLibrary.language === Language.ARKTS && !parentMethods.has(method.method.name)) {
                const nonPublic = new Method(
                    method.uniqueOverloadName,
                    method.method.signature,
                    method.method.modifiers?.filter(it => it !== MethodModifier.PUBLIC)
                )
                if (isCommon || isExtendable) {
                    printer.writeMethodImplementation(nonPublic, w => {
                        w.print('const commonStyle: Array<(instance: CommonMethod) => void> | undefined = this.__get__commonStyles__Internal();');
                        w.print('if (commonStyle) {');
                        w.pushIndent();
                        const paramNames = method.sig.args.map(arg => arg.name).join(', ');
                        if (isCommon) {
                            w.print(`(commonStyle as Array<(instance: CommonMethod) => void>).push((instance: CommonMethod): void => instance.${nonPublic.name}(${paramNames}));`);
                        } else {
                            w.print(`(commonStyle as Array<(instance: CommonMethod) => void>).push((instance: CommonMethod): void => (instance as ${idlInterface.name}).${nonPublic.name}(${paramNames}));`);
                        }
                        w.print('return this;');
                        w.popIndent();
                        w.print('} else {');
                        w.pushIndent();
                        w.print('if (this.__is_CustomComponent__Internal()) {');
                        w.pushIndent();
                        if (isCommon) {
                            w.writeStatement(w.makeThrowError(`Common method ${nonPublic.name} can only be set when creating a custom component.`))
                        } else {
                            w.writeStatement(w.makeThrowError(`${component.name} attribute '${nonPublic.name}' can only be set when creating an extendable component.`))
                        }
                        w.popIndent();
                        w.print('}');
                        w.popIndent();
                        w.print('}');
                        w.writeStatement(w.makeThrowError(`Unimplemented method ${nonPublic.name}`))
                    })
                } else {
                    printer.writeMethodImplementation(nonPublic, w => w.writeStatement(w.makeThrowError(`Unimplemented method ${nonPublic.name}`)))
                }
            } else {
                printer.writeMethodDeclaration(method.method.name, method.method.signature)
            }
        })
```

Key differences from the original:
- Extracts `isCommon` and `isExtendable` flags
- For extendable components: uses `(instance as ${idlInterface.name})` cast (since `instance: CommonMethod` can't call component-specific methods without it)
- Error message for extendable components: `"${component.name} attribute '${name}' can only be set when creating an extendable component."`
- For CommonMethod: keeps existing behavior (no cast needed)

- [ ] **Step 3: Handle `attributeModifier` for extendable components**

The current code at lines 109-118 only generates `attributeModifier` with a throw for non-CommonMethod. For extendable components, `attributeModifier` should also get the commonStyle wrapper.

Replace lines 109-118:

```typescript
        const attributeModifierSignature = generateAttributeModifierSignature(this.peerLibrary, component)
        if (this.peerLibrary.language === Language.ARKTS && !parentMethods.has('attributeModifier')) {
            if (isCommon) {
                // CommonMethod: attributeModifier is handled in the main loop above
            } else if (isExtendable) {
                printer.writeMethodImplementation(new Method('attributeModifier', attributeModifierSignature), w => {
                    w.print('const commonStyle: Array<(instance: CommonMethod) => void> | undefined = this.__get__commonStyles__Internal();');
                    w.print('if (commonStyle) {');
                    w.pushIndent();
                    w.print('(commonStyle as Array<(instance: CommonMethod) => void>).push((instance: CommonMethod): void => (instance as ' + idlInterface.name + ').attributeModifier(value));');
                    w.print('return this;');
                    w.popIndent();
                    w.print('} else {');
                    w.pushIndent();
                    w.print('if (this.__is_CustomComponent__Internal()) {');
                    w.pushIndent();
                    w.writeStatement(w.makeThrowError(`${component.name} attribute 'attributeModifier' can only be set when creating an extendable component.`))
                    w.popIndent();
                    w.print('}');
                    w.popIndent();
                    w.print('}');
                    w.writeStatement(w.makeThrowError(`Unimplemented method attributeModifier`))
                })
            } else {
                printer.writeMethodImplementation(new Method('attributeModifier', attributeModifierSignature), w => {
                    w.writeStatement(w.makeThrowError(`Unimplemented method attributeModifier`))
                })
            }
        } else {
            printer.writeMethodDeclaration('attributeModifier', attributeModifierSignature)
        }
```

- [ ] **Step 4: Build to verify**

Run: `npm run build -w arkgen`

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add arkgen/src/printers/ArkoalaInterfacePrinter.ts
git commit -m "feat(arkgen): extend commonStyle wrapper to extendable component attributes"
```

---

### Task 4: Generate ExtendableCommonMethod Base Class

**Files:**
- Modify: `arkgen/src/printers/ArkoalaInterfacePrinter.ts`

- [ ] **Step 1: Add ExtendableCommonMethod generation after CommonMethod interface**

In `printComponent()`, after the CommonMethod-specific `applyAttributesFinish` handling (around line 121-127) and before `printer.popIndent()`, add generation of the `ExtendableCommonMethod` base class.

After the `applyAttributesFinish` block (line 127), and before `printer.popIndent()` (line 128), insert:

```typescript
        if (isCommon) {
            printer.popIndent()
            printer.print('}')
            printer.print('')
            printer.print('export abstract class ExtendableCommonMethod implements CommonMethod {')
            printer.pushIndent()
            const getCommonStyles = new Method(
                '__get__commonStyles__Internal',
                new NamedMethodSignature(
                    idl.IDLUnionType.create([
                        idl.createReferenceType('Array', [idl.createReferenceType('(instance: CommonMethod) => void')]),
                        idl.IDLUndefinedType
                    ]),
                    [], []
                ),
                []
            )
            printer.writeMethodImplementation(getCommonStyles, w => {
                w.print('return undefined;')
            })
            const setCommonStyles = new Method(
                '__set__commonStyles__Internal',
                new NamedMethodSignature(idl.IDLVoidType, [
                    { name: 'value', type: idl.createReferenceType('Array', [idl.createReferenceType('(instance: CommonMethod) => void')]) }
                ], []),
                []
            )
            printer.writeMethodImplementation(setCommonStyles, w => {
                w.print('')
            })
            const isCustomComponent = new Method(
                '__is_CustomComponent__Internal',
                new NamedMethodSignature(idl.IDLBooleanType, [], []),
                []
            )
            printer.writeMethodImplementation(isCustomComponent, w => {
                w.print('return true;')
            })
        }
```

This generates the ExtendableCommonMethod class in the same file as CommonMethod (common.ets).

Note: This changes the structure of `printComponent()` for CommonMethod — it closes the CommonMethod interface early and starts the ExtendableCommonMethod class. The final `printer.popIndent()` and `printer.print('}')` at lines 128-129 will close the ExtendableCommonMethod class instead.

- [ ] **Step 2: Build to verify**

Run: `npm run build -w arkgen`

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add arkgen/src/printers/ArkoalaInterfacePrinter.ts
git commit -m "feat(arkgen): generate ExtendableCommonMethod base class in common.ets"
```

---

### Task 5: Generate ExtendableXXX Abstract Classes

**Files:**
- Modify: `arkgen/src/printers/ArkoalaInterfacePrinter.ts`

This is the most complex task. The ExtendableXXX class is generated after the component's attribute interface.

- [ ] **Step 1: Add `printExtendableClass()` method to `ArkoalaTSDeclConvertor`**

Add this new method to the `ArkoalaTSDeclConvertor` class (after `printComponent()`):

```typescript
    private printExtendableClass(
        component: { name: string; attributeDeclaration: idl.IDLInterface; interfaceDeclaration?: idl.IDLInterface },
        peer: PeerClass
    ): stringOrNone[] {
        const printer = this.peerLibrary.createLanguageWriter()
        const nameConvertor = this.peerLibrary.createTypeNameConvertor(this.peerLibrary.language)
        const className = `Extendable${component.name}`
        const attrInterfaceName = component.attributeDeclaration.name

        printer.print(`export abstract class ${className} extends ExtendableCommonMethod implements ${attrInterfaceName} {`)
        printer.pushIndent()

        // 1. Generate _instantiateImpl
        this.printInstantiateImpl(printer, component, className)

        // 2. Generate $_instantiate overloads from interface callables
        if (component.interfaceDeclaration) {
            this.printInstantiateOverloads(printer, component, className)
        }

        // 3. Generate setXXXOptions methods with commonStyle wrapper
        this.printSetOptionsMethods(printer, component, attrInterfaceName)

        printer.popIndent()
        printer.print('}')
        return printer.getOutput()
    }
```

- [ ] **Step 2: Add `printInstantiateImpl()` helper method**

Add to `ArkoalaTSDeclConvertor`:

```typescript
    private printInstantiateImpl(
        printer: LanguageWriter,
        component: { name: string },
        className: string
    ): void {
        const implName = `${component.name}Impl`

        printer.print('')
        printer.print('    @memo')
        printer.print(`    static _instantiateImpl<T extends ${className}>(`)
        printer.print('        @memo @memo_skip')
        printer.print('        styles: (instance: T) => void,')
        printer.print('        factory: () => T,')
        printer.print('        @memo @memo_skip')
        printer.print('        _content: CustomBuilder): void')
        printer.print('    {')
        printer.print('        const instanceExtendable = remember(factory);')
        printer.print('        @memo @memo_skip')
        printer.print(`        const cb = (instance: ${component.name}Attribute): void => {`)
        printer.print('            styles(instanceExtendable);')
        printer.print('            let commonStyles = instanceExtendable.__get__commonStyles__Internal()')
        printer.print('            if (commonStyles) {')
        printer.print('                commonStyles.forEach((func) => {')
        printer.print('                    func(instance);')
        printer.print('                })')
        printer.print('            }')
        printer.print('            instanceExtendable.__set__commonStyles__Internal(new Array<(instance: CommonMethod) => void>);')
        printer.print('        }')
        printer.print(`        ${implName}(`)
        printer.print('            cb,')
        printer.print('            _content')
        printer.print('        );')
        printer.print('    }')
    }
```

Note: This uses raw `printer.print()` for the method body because it contains decorators (`@memo`, `@memo_skip`) and complex code that doesn't map cleanly to the `LanguageWriter` API.

- [ ] **Step 3: Add `printInstantiateOverloads()` helper method**

Add to `ArkoalaTSDeclConvertor`:

```typescript
    private printInstantiateOverloads(
        printer: LanguageWriter,
        component: { name: string; interfaceDeclaration: idl.IDLInterface },
        className: string
    ): void {
        const callables = idl.collectCallableMembers(component.interfaceDeclaration)
        for (const callable of callables) {
            printer.print('')
            printer.print('    @ComponentBuilder')
            const params = callable.parameters
                .map(p => `${p.name}: ${this.convertType(p.type)}`)
                .join(', ')
            printer.print(`    static $_instantiate<T extends ${className}>(factory: () => T, ${params}): T {`)
            printer.print('        throw Error("Illegal call of $_instantiate")')
            printer.print('    }')
        }
    }
```

The `$_instantiate` overloads are derived from the component's interface callables (e.g., `ButtonInterface` has two call signatures for `Button(label, options?, content_?)` and `Button(options?, content_?)`), but with `factory: () => T` prepended as the first parameter.

- [ ] **Step 4: Add `printSetOptionsMethods()` helper method**

Add to `ArkoalaTSDeclConvertor`:

```typescript
    private printSetOptionsMethods(
        printer: LanguageWriter,
        component: { name: string; attributeDeclaration: idl.IDLInterface },
        attrInterfaceName: string
    ): void {
        const setOptionsName = `set${component.name}Options`

        // Find setXXXOptions methods in the attribute declaration
        const setOptionsMethods = component.attributeDeclaration.methods
            .filter(m => m.name === setOptionsName)

        for (const method of setOptionsMethods) {
            printer.print('')
            const params = method.parameters
                .map(p => {
                    const optional = p.isOptional ? '?' : ''
                    return `${p.name}${optional}: ${this.convertType(p.type)}`
                })
                .join(', ')
            printer.print(`    ${setOptionsName}(${params}): this {`)
            printer.print('        const commonStyle: Array<(instance: CommonMethod) => void> | undefined = this.__get__commonStyles__Internal();')
            printer.print('        if (commonStyle) {')
            printer.print('            (commonStyle as Array<(instance: CommonMethod) => void>).push(')
            const argNames = method.parameters.map(p => p.name).join(', ')
            printer.print(`                (instance: CommonMethod): void => (instance as ${attrInterfaceName}).${setOptionsName}(${argNames})`)
            printer.print('            );')
            printer.print('            return this;')
            printer.print('        } else {')
            printer.print('            if (this.__is_CustomComponent__Internal()) {')
            printer.print(`                throw new Error("${component.name} attribute '${setOptionsName}' can only be set when creating an extendable component.")`)
            printer.print('            }')
            printer.print('        }')
            printer.print(`        throw new Error('Unimplemented method ${setOptionsName}')`)
            printer.print('    }')
        }
    }
```

Note: If `setXXXOptions` is NOT present in the attribute interface (e.g., some components may not declare it), the method simply won't generate anything. This is fine — the setXXXOptions methods are component-specific and optional.

- [ ] **Step 5: Wire ExtendableXXX class generation into `printComponent()`**

In `printComponent()`, at the end of the method (before the final `return printer.getOutput()`), add the ExtendableXXX class generation after the attribute interface:

After the `printer.popIndent()` / `printer.print('}')` that closes the attribute interface (lines 128-129), add:

```typescript
        // Generate ExtendableXXX class if this is an extendable component
        if (isExtendableComponent(component.name)) {
            const extendableOutput = this.printExtendableClass(component, peer)
            printer.print('')
            printer.writeLines(extendableOutput.join('\n'))
        }
```

- [ ] **Step 6: Use `CallSignature` extended attribute to find callables**

The `$_instantiate` overloads are derived from the component interface's call signatures (methods marked with `[CallSignature]` extended attribute). The `printInstantiateOverloads()` method in Step 3 already handles this correctly by using `component.interfaceDeclaration.methods.filter(m => idl.hasExtAttribute(m, idl.IDLExtendedAttributes.CallSignature))`.

No additional import needed — `idl.hasExtAttribute` and `idl.IDLExtendedAttributes` are already available from the existing `import * as idl from "@idlizer/core/idl"` import.

- [ ] **Step 7: Build to verify**

Run: `npm run build -w arkgen`

Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add arkgen/src/printers/ArkoalaInterfacePrinter.ts
git commit -m "feat(arkgen): generate ExtendableXXX abstract classes for extendable components"
```

---

### Task 6: Native Skip for Extendable Classes

**Files:**
- Modify: `core/src/peer-generation/isMaterialized.ts:48-50`

- [ ] **Step 1: Import helper function**

In `isMaterialized.ts`, add import after line 17:

```typescript
import { getExtendableClassNames } from '../config'
```

- [ ] **Step 2: Add extendable check in `isMaterialized()`**

After the existing `ignoreMaterialized` check (line 48-50), add:

```typescript
    if (getExtendableClassNames().has(declaration.name)) {
        return false
    }
```

The full check block becomes:

```typescript
    if (generatorConfiguration().ignoreMaterialized.includes(declaration.name)) {
        return false
    }

    if (getExtendableClassNames().has(declaration.name)) {
        return false
    }
```

This ensures `ExtendableButton`, `ExtendableColumn`, and `ExtendableCommonMethod` are not materialized (no C++ code generated).

- [ ] **Step 3: Add `ExtendableCommonMethod` to `ignoreMaterialized` in config**

In `arkgen/generation-config/config.json`, add `"ExtendableCommonMethod"` to the `ignoreMaterialized` array:

```json
    "ignoreMaterialized": [
        "AnimatableArithmetic",
        ...existing entries...,
        "CustomSpan",
        "ExtendableCommonMethod"
    ],
```

- [ ] **Step 4: Build to verify**

Run: `npm run build -w core && npm run build -w arkgen`

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add core/src/peer-generation/isMaterialized.ts arkgen/generation-config/config.json
git commit -m "feat(core): skip native generation for extendable component classes"
```

---

### Task 7: Verify Generation Output

This task verifies the generated output matches the expected pattern from the ace engine PR.

**Prerequisites:** The `.d.ets` SDK files must contain the ExtendableXXX declarations (from interface_sdk-js PR #32681). If not yet available, patch the files in `sdk-patched-arkts/`.

- [ ] **Step 1: Ensure SDK has ExtendableXXX declarations**

Check if `sdk-patched-arkts/api/arkui/component/button.static.d.ets` contains `ExtendableButton`. If not, apply the patch from the interface SDK PR.

- [ ] **Step 2: Run the full pipeline**

```bash
cd /home/leslie/repo/idlize/runner
bash generate.sh
```

Expected: Pipeline completes without errors.

- [ ] **Step 3: Verify generated button.ets output**

Check `runner/out/peers/sig/framework/button.ets` (or the equivalent output path) for:

1. `ButtonAttribute` interface methods have commonStyle wrapper pattern
2. `ExtendableButton` class is generated with:
   - `extends ExtendableCommonMethod implements ButtonAttribute`
   - `_instantiateImpl` static method with `@memo` decorator
   - `$_instantiate` overloads with `@ComponentBuilder` decorator
   - `setButtonOptions` methods with commonStyle wrapper
3. `ExtendableCommonMethod` base class is in `common.ets`

- [ ] **Step 4: Verify no native code generated**

Check that no C++ modifier/peer files are generated for `ExtendableButton`, `ExtendableColumn`, or `ExtendableCommonMethod`.

- [ ] **Step 5: Compare with ace engine PR output**

Compare the generated `button.ets` with the expected output from `openharmony/arkui_ace_engine#84380`. Key differences to check:
- Method wrapper pattern matches
- `_instantiateImpl` body structure matches
- `$_instantiate` signatures match
- `setButtonOptions` wrapper matches

- [ ] **Step 6: Fix any discrepancies**

If generated output doesn't match, adjust the printer code accordingly.

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat(arkgen): complete Extendable component generation with verified output"
```
