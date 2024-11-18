# Types Serialization

## Materialized classes/interfaces

Interfaces or classes which have methods needs to have a corresponding realization on the native level.
The special implementation for such class or interface is generated on the managed level which holds a pointer to the native structure.
An implementation for these classes/interfaces is named as materialized classes/interfaces
to distinguish them from builders or interfaces implemented by a user.

Additional methods need to be implemented by Materialized classes/interfaces:

- `private getFinalizer(): pointer` - Get the pointer to the native structure destroy method.
- `public getPeer(): Finalizable` - Get a peer which holds the pointer to the corresponding native structure.
It is used by the Serializer in the `write(...)` method.
- `public static make(ptr: poiner)` - Create a materialized class/interface from the given pointer.
Materialized classes/interfaces can be used as a method return type and it needs to have a way to construct them from the native pointer.
- `private ctor(): pointer` - Create a corresponding structure on the native level and get a pointer to it.
  It seems that it should be added only to the materialized classes. Materialized interfaces are created only
  they are returned from other methods.

Implementation for methods from the original classes/interfaces are just proxy to the native methods.

### Materialized interfaces

Example:
```
declare interface TextBaseController {

  setSelection(selectionStart: number, selectionEnd: number, options?: SelectionOptions): void;
  closeSelectionMenu(): void;
  getLayoutManager(): LayoutManager;
}
```

Name for a materialized interface can be just an original name with `Impl` suffix
to separate interfaces and their implementations in Java.
The materialized interface implements the original interface and its methods.

One additional private empty constructor needs to be added.

```
export class TextBaseControllerImpl implements TextBaseController {
    peer?: Finalizable
    getPeer(): Finalizable | undefined {
        return this.peer
    }
    static getFinalizer(): KPointer {
        return nativeModule()._TextBaseController_getFinalizer()
    }
    static make(ptr: pointer): TextBaseControllerImpl {
        const objTextBaseController: TextBaseControllerImpl = new TextBaseControllerIml()
        objTextBaseController.peer = new Finalizable(ptr, TextBaseControllerImpl.getFinalizer())
        return objTextBaseController
    }
    private constructor() {
      // just an empty constructor
      // there is no user code which creates this object by the constructor
      // the new object is alway created by the make(ptr) call
    }
    ...
}
```

### Materializied classes

For example :
```
declare class CanvasRenderingContext2D extends CanvasRenderer {

  readonly height: number;
  readonly width: number;

  constructor(settings?: RenderingContextSettings);
  constructor(settings?: RenderingContextSettings, unit?: LengthMetricsUnit);

  toDataURL(type?: string, quality?: any): string;
  ...
}
```

The main problem with materialized classes that they need to be implemented as is
with the given constructors and extends/implements declarations.
Additional public methods added to the materialized class are leaked to the public API
and it is under the question how to handle them properly.

The name for the materialized class needs to be exact name of the original class.
Fields for a materialized class are generated as getters and setters.

The materialized class needs to have a constructor which takes a pointer to the native side.
It is used by the static `make(ptr: pointer)` method to create a materialized object.
It can be implemented in Java which allows to have multiple constructors
but for TypeScript it means that the first constructor parameter type
needs to be union of the original parameter type with the pointer.

The current approach is to add a constructor with all optional parameters
in the typescript.
The `make(ptr: pointer)` method then uses the constructor with no parameters
to create the materialized object and assigns the given pointer to the object.
It has a lack that if the original class allows a constructor with all optional parameters
the native structure will be created twice, by the constructor and by the method that calls `make(pointer)`.
It is under the question which way it is better to construct a materialized object which have a constructor
with all optional params.

Original `d.ts` declaration:
```
declare class CanvasPath {
    moveTo(x: number, y: number): void;
}

declare class CanvasRenderer extends CanvasPath {
    ...
}

declare class CanvasRenderingContext2D extends CanvasRenderer {

  readonly height: number;
  readonly width: number;

  constructor(settings?: RenderingContextSettings);
  constructor(settings?: RenderingContextSettings, unit?: LengthMetricsUnit);

  toDataURL(type?: string, quality?: any): string;
  ...
}
```

Implementation:
```
export class CanvasPath {

    peer?: Finalizable

    getPeer(): Finalizable | undefined {
        return this.peer
    }

    static ctor(): KPointer {
        return nativeModule()._CanvasPath_ctor()
    }

    static make(ptr: pointer): CanvasPath {
        const objCanvasPath: CanvasPath = new CanvasPath()
        objCanvasPath.peer = new Finalizable(ptr, CanvasPath.getFinalizer())
        return objCanvasPath
    }

    constructor() {
      ...
    }
    static getFinalizer(): KPointer {
        return nativeModule()._CanvasPath_getFinalizer()
    }
}

export class CanvasRenderer extends CanvasPath {
    ...
}

export class CanvasRenderingContext2D extends CanvasRenderer {
    get height(): number {
        ...
    }
    get width(): number {
        ...
    }
    static getFinalizer(): pointer {
        return nativeModule()._CanvasRenderingContext2D_getFinalizer()
    }
    static ctor(settings?: RenderingContextSettings): KPointer {
        // construct the native struct and return the pointer
    }
    constructor(settings?: RenderingContextSettings) {
        const ctorPtr: pointer = CanvasRenderingContext2D.ctor(settings)
        this.peer = new Finalizable(ctorPtr, CanvasRenderingContext2D.getFinalizer())
    }
    static make(ptr: poiner): CanvasRenderingContext2D {
        const objCanvasRenderingContext2D: CanvasRenderingContext2D = new CanvasRenderingContext2D()
        // note that the pointer to the native stucture is generated twice
        // first from the method which calls the make(ptr) method
        // second in the CanvasRenderingContext2D constructor
        objCanvasRenderingContext2D.peer = new Finalizable(ptr, CanvasRenderingContext2D.getFinalizer())
        return objCanvasRenderingContext2D
    }
    ...
}
```

It seems that it is possible to implement materialized classes and interfaces in Java
in the same way as in the Typescript with the following differencies:

- a constructor with pointer parameter is added
- getters and setters are generated in java way with get/set prefixes

```
class CanvasPath {

    protected Finalizable peer; 

    public Finalizable getPeer() {
        return this.peer
    }

    public static long ctor() {
        return NativeModule._CanvasPath_ctor();
    }
    ...
}

class CanvasRenderer extends CanvasPath {
    ...
}

class CanvasRenderingContext2D extends CanvasRenderer {

    float getGeight() {
        ...
    }

    float getWidth() {
        ...
    }

    static long ctor(RenderingContextSettings settings) {
        // create a native struct and return the pointer to it
    }

    CanvasRenderingContext2D(long pointer) {
        super(pointer);
    }

    CanvasRenderingContext2D(RenderingContextSettings settings) {
        this(ctor(settings));
    }

    static long getFinalizer() {
        return NativeModule._CanvasRenderingContext2D_getFinalizer();
    }

    static CanvasRenderingContext2D make(ptr: long) {
        return new CanvasRenderingContext2D(long);
    }
```

## User implemented interfaces

There are interfaces with methods which are implemented by a user.

For example :
```
interface ICurve {
  interpolate(fraction: number): number;
}

declare class SwiperAttribute extends CommonMethod<SwiperAttribute> {
  ...
  curve(value: Curve | string | ICurve): SwiperAttribute;
}
```
Usage:

```
    swiper.curve({ interpolate: (fraction) => 0.8 * fraction })
```

Such interfaces can't be represented as materialized classes and are treated as a callbacks
to be processed in the corresponding way.

It is under a question how to distinguish user implemented interfaces from the materialized classes.
