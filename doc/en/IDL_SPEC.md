# IDL Language Specification

This document describes the IDL intermediate language used by IDLize. IDL
connects SDK declarations and generators: `etsgen` converts `.d.ts` / `.d.ets`
to `.idl`, `core` parses `.idl` into AST, and `arkgen` plus `libohos` generate
ArkTS, C++, and Arkoala-related code from that AST.

## 1. package and namespace

The `package` directive defines the root namespace of the current file. The
`namespace` container creates nested namespaces inside a file.

```idl
package ohos.bluetooth;

namespace gatt {
    interface Server {
    }
    // Fully qualified name: ohos.bluetooth.gatt.Server
}
```

## 2. import and typedef

`import` maps a namespace into the current scope:

```idl
import ohos;

interface MySrv : bluetooth.Server {
}
// ohos.bluetooth.Server is available as bluetooth.Server
```

`typedef` defines an alias for an existing type:

```idl
typedef MySrv = ohos.bluetooth.Server;
```

## 3. Types

### 3.1 Primitive Types

| Type | Description |
|---|---|
| `void` | No return value. |
| `boolean` | Boolean value. |
| `i8` / `u8` | 8-bit signed / unsigned integer. |
| `i16` / `u16` | 16-bit signed / unsigned integer. |
| `i32` / `u32` | 32-bit signed / unsigned integer. |
| `i64` / `u64` | 64-bit signed / unsigned integer. |
| `f32` / `f64` | 32-bit / 64-bit floating-point number. |
| `number` | Numeric type. |
| `bigint` | Big integer type. |
| `String` | String. |
| `buffer` | Binary buffer. |

### 3.2 optional

Parameters can be marked optional with `optional`:

```idl
void someMethod(optional String someParameter);
```

Interface attributes can be marked optional with `[Optional]`:

```idl
interface I1 {
    [Optional]
    attribute String someAttribute;
}
```

When a type itself needs optional semantics, use the `?` suffix or a union that
contains `undefined`:

```idl
typedef OptNumber = number?;
typedef OptNumber2 = (number or undefined);
```

### 3.3 sequence

`sequence<T>` represents a dynamic array of the specified element type:

```idl
void someMethod(sequence<String> values);
```

### 3.4 union

A union type means the value can be one of several types:

```idl
void someMethod((sequence<String> or String or number) value);
```

### 3.5 record

`record<K, V>` represents a key-value map:

```idl
void someMethod(record<String, boolean> flags);
```

## 4. Declarations

### 4.1 Enumeration

IDL uses `dictionary` syntax for integer or string enumerations. Do not mix
integer entries and string entries in the same enumeration.

```idl
dictionary Origin {
    number local = 0;
    number remote = 1;
};
```

### 4.2 Constants

Constants support boolean, numeric, and string literals. Constants are not
types.

```idl
const String MIMETYPE_TEXT_PLAIN = "text/plain";
const number three = 3;
```

### 4.3 Functions

A function declaration contains a return type, a function name, and a parameter
list:

```idl
void foo();
async number bar(String param1, optional boolean param2);
```

Functions with the same name can form an overload set distinguished by
parameter signature:

```idl
number bar(String param1);
number bar(String param1, boolean param2);
number bar(String param1, i32 param2);
```

### 4.4 Callbacks

`callback` declares a named callable type. Callbacks can be used as attribute
types, method parameters, or function parameters.

```idl
callback Foo = number (number param1, optional String param2);

interface I1 {
    attribute Foo foo;
}

void setReactor(Foo foo);
```

Callback signatures cannot use `async`.

### 4.5 Interfaces

Interfaces can contain inheritance, attributes, methods, constructors, and
constants.

```idl
interface File {
    attribute String name;
    attribute u32 size;
    [Optional]
    attribute String lastError;

    void seek(u32 offset);
    u32 pos();
    buffer read(u32 size);
    void write(buffer data);

    static u64 deviceIdMounted();
}

interface TxtFile : File {
    attribute String encoding;
    constructor(String name);
}
```

An interface is a type. An interface value is an identifier connected to a
concrete implementation object. It can be stored in attributes, passed as a
parameter, or returned from a function or method.

Constructors have these implicit rules:

- The return type is always an instance of the current interface.
- The name is always `constructor`.
- A constructor always has static semantics, even when `static` is not written.

## 5. Extended Attributes

Extended attributes add generator metadata to declarations. Common extended
attributes include:

| Extended attribute | Description |
|---|---|
| `[Component]` | Marks an ArkUI component interface. |
| `[ComponentInterface]` | Marks a component attribute setter interface. |
| `[Entity=Class]` | Generates the interface as a class shape. |
| `[Entity=Interface]` | Generates the interface as an interface shape. |
| `[Optional]` | Marks an attribute as omittable. |
| `[Deprecated]` | Marks a declaration as deprecated. |
| `[Throws]` | Marks a method as possibly throwing. |
| `[Accessor=Getter]` / `[Accessor=Setter]` | Marks an attribute accessor direction. |
| `[Documentation="..."]` | Carries original comments or inline documentation. |

Example:

```idl
[Documentation="/** Input method subtype */"]
interface InputMethodSubtype {
}
```

## 6. version

The `version` directive marks a root namespace or nested namespace with a
version:

```idl
namespace ns {
    version 1.2.3-dev456;
};
```
