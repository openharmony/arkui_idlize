# Types Serialization

## Materialized classes/interfaces

Interfaces or classes which have methods need a corresponding realization on the native level.
A special implementation is generated on the managed level which holds a pointer to the native structure.
These are called **materialized classes/interfaces** to distinguish them from builders or user-implemented interfaces.

Each materialized class/interface provides:

- `getFinalizer(): KPointer` — static method returning a function pointer to the native destroy method.
- `getPeer(): Finalizable | undefined` — returns the peer holding the native pointer (used by serializers).
- `fromPtr(ptr: KPointer): ClassName` — static factory constructing an instance from a native pointer.

### Materialized interfaces

Example IDL:
```
interface TextBaseController {
  setSelection(selectionStart: number, selectionEnd: number, options?: SelectionOptions): void;
  closeSelectionMenu(): void;
}
```

The implementation class is named with an `Internal` suffix and wraps a native pointer:

```typescript
class TextBaseControllerInternal implements TextBaseController {
    peer?: Finalizable

    getPeer(): Finalizable | undefined {
        return this.peer
    }

    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._TextBaseController_getFinalizer()
    }

    static fromPtr(ptr: KPointer): TextBaseControllerInternal {
        return new TextBaseControllerInternal(undefined, ptr)
    }

    constructor(tag?: MaterializedBaseTag, peerPtr?: KPointer) {
        this.peer = new Finalizable(peerPtr, TextBaseControllerInternal.getFinalizer())
    }

    // ...method implementations proxying to native
}
```

### Materialized classes

Materialized classes follow the same pattern but may have original constructors
that create the native structure:

```typescript
class CanvasRenderingContext2D extends CanvasRenderer {
    peer?: Finalizable

    static getFinalizer(): KPointer {
        return ArkUIGeneratedNativeModule._CanvasRenderingContext2D_getFinalizer()
    }

    static fromPtr(ptr: KPointer): CanvasRenderingContext2D {
        return new CanvasRenderingContext2D(undefined, ptr)
    }

    constructor(tag?: MaterializedBaseTag, peerPtr?: KPointer) {
        super(tag, peerPtr)
        this.peer = new Finalizable(peerPtr, CanvasRenderingContext2D.getFinalizer())
    }

    // ...method implementations proxying to native
}
```

For languages that support constructor overloading (TypeScript, ArkTS), each
original constructor is emitted alongside the base constructor that accepts a
pointer. For languages without overloads (CangJie, Kotlin), constructors are
collapsed into a single constructor with optional parameters.

### Naming conventions

| Concept | Convention | Example |
|---------|-----------|---------|
| Materialized interface impl | `ClassNameInternal` | `TextBaseControllerInternal` |
| Materialized class | Same as original name | `CanvasRenderingContext2D` |
| Native module calls | `ArkUIGeneratedNativeModule._method` | `ArkUIGeneratedNativeModule._CanvasPath_getFinalizer` |
| Factory method | `static fromPtr(ptr)` | `TextBaseControllerInternal.fromPtr(ptr)` |

## User-implemented interfaces

Some interfaces have methods implemented by the user rather than the framework:

```typescript
interface ICurve {
    interpolate(fraction: number): number;
}

class SwiperAttribute {
    curve(value: Curve | string | ICurve): SwiperAttribute;
}
```

Usage:
```typescript
swiper.curve({ interpolate: (fraction) => 0.8 * fraction })
```

Such interfaces cannot be represented as materialized classes and are treated as callbacks.
