# IDL Syntax

This document describes the IDL (Interface Definition Language) syntax used in the arkui idl files, in EBNF form. The in-memory representation (IR) is defined in `core/src/idl/node.ts`.

---

## 1. Lexical structure and terminal symbols

Whitespace (spaces, tabs, newlines) and comments are ignored between tokens.

**Character classes:**
- `character` — any source character (for comments: in `//` comments up to newline; in `/* */` any character including newline).
- `letter` — `"A"` … `"Z"` | `"a"` … `"z"`.
- `digit` — `"0"` … `"9"`.
- `hex_digit` — `"0"` … `"9"` | `"A"` … `"F"` | `"a"` … `"f"`.

**Identifiers:**
- `id` — a single identifier segment: `( letter | "_" | "$" ) { letter | digit | "_" | "$" }`, and not one of the reserved words listed below. No dots. Cannot start with digit or `-`.
- `full_id` — qualified name: `id { "." id }` (e.g. `arkui.component.units`).

**Comments:**
- `comment` — `"//" { character }` (to end of line) | `"/*" { character } "*/"`.

**Literals:**
- `string_literal` — `"\"" { char_escape | character } "\""` (character excludes `"` and `\` unless escaped).
- `decimal` — decimal number, e.g. `-3.14`, `1e-2` (see full grammar in detailed section).
- `integer` — integer (decimal, hex `0x…`, binary `0b…`, octal `0…`), optionally prefixed with `-`.
- `literal` — `string_literal` | `decimal` | `integer` | `"true"` | `"false"` | `"Infinity"` | `"-Infinity"`.  
  (* `NaN` and `null` are not in the language. `undefined` is a primitive type, not a literal. *)

**Symbols:**
- `symbol` — `"..."` | `"("` | `")"` | `"["` | `"]"` | `"{"` | `"}"` | `","` | `":"` | `";"` | `"<"` | `"="` | `">"` | `"?"`.

**Reserved words (declarations):** `attribute`, `callback`, `const`, `constructor`, `dictionary`, `enum`, `import`, `interface`, `namespace`, `package`, `typedef`, `version`.

**Modifiers (only where allowed, see §3):** `static`, `readonly`, `async`, `optional`.

**Type-related keyword:** `or` (inside union type only).

**Literal keywords:** `true`, `false`, `Infinity`, `-Infinity`.

**Primitive type names (built-in):** `pointer`, `void`, `boolean`, `i8`, `u8`, `i16`, `u16`, `i32`, `u32`, `i64`, `u64`, `f16`, `f32`, `f64`, `bigint`, `number`, `String`, `any`, `undefined`, `unknown`, `Object`, `this`, `date`, `buffer`, `SerializerBuffer`, `Function`, `CustomObject`, `InteropReturnBuffer`.

**Container type names (require type arguments):** `sequence`, `record`, `Promise`.

---

## 2. Compact EBNF

File structure is strict: one required **package** clause, then zero or more **import**s, then zero or more other declarations. No extended attributes or modifiers on package or import.

```
idl_file             = package_clause { import_decl } { other_declaration } .

package_clause       = "package" full_id ";" .
import_decl          = "import" full_id [ "as" id ] ";" .

other_declaration    = [ extended_attributes ] ( interface_decl | namespace_decl | typedef_decl | callback_decl | enum_or_dictionary_decl | version_decl | function_decl ) .
                      (* Only attribute_decl and function_decl have modifiers; see modifier applicability below. *)

interface_decl       = "interface" [ "<" id { "," id } ">" ] id [ ":" type_list ] "{" { interface_member } "}" ";" .
interface_member     = [ extended_attributes ] ( constructor_decl | attribute_decl | function_decl ) .
                      (* attribute_decl allows attribute_modifier; function_decl allows function_modifier; constructor_decl allows none. *)
attribute_modifier   = "readonly" | "static" | "optional" .   (* only for attribute_decl *)
function_modifier    = "static" | "async" .   (* only for function_decl *)

namespace_decl       = "namespace" id "{" { other_declaration } "}" ";" .
                      (* Import is not allowed inside namespace. Only other_declaration. *)
typedef_decl         = "typedef" [ "<" id { "," id } ">" ] ( id "=" type | type id ) ";" .
callback_decl        = "callback" [ "<" id { "," id } ">" ] id "=" type "(" argument_list ")" ";" .
enum_or_dictionary_decl = ( "enum" | "dictionary" ) id "{" enum_or_dictionary_member { ( "," | ";" ) enum_or_dictionary_member } "}" [ ";" ] .
                      (* Same construct; "dictionary" deprecated. Both: members with or without assigned values, extended attributes. *)
enum_or_dictionary_member = [ extended_attributes ] ( ( id | literal ) | ( ( "i8" | "u8" | "i16" | "u16" | "i32" | "u32" | "i64" | "u64" | "f16" | "f32" | "f64" | "number" | "String" ) id [ "=" literal ] ) ) .
                      (* Enum-style: id or literal, comma-separated. Dictionary-style: (numeric type or "String") id [ "=" literal ], semicolon-separated. *)
version_decl         = "version" literal ";" .

attribute_decl       = [ attribute_modifier { attribute_modifier } ] "attribute" type id ";" .
constructor_decl     = "constructor" "(" argument_list ")" ";" .
function_decl        = [ function_modifier { function_modifier } ] type id "(" argument_list ")" ";" .

argument_list       = "(" [ argument { "," argument } ] ")" .
argument             = [ extended_attributes ] [ "optional" ] type [ "..." ] id .

type                 = ( union_type | single_type ) [ "or" "undefined" ] .
union_type           = "(" single_type { "or" single_type } ")" .   (* one or more members; flat only. Single-member union used to attach extended attributes to return type. *)
single_type          = [ extended_attributes ] full_id [ "<" type { "," type } ">" ] .   (* single_type may have extended attributes; only one of type/single_type adds ext_attrs in an expansion *)
type_list            = type { "," type } .

extended_attributes  = "[" extended_attribute { "," extended_attribute } "]" .
extended_attribute   = id [ "=" ( full_id | literal | quoted_type_list ) ] .
quoted_type_list    = ( "\"" | "'" ) type_list ( "\"" | "'" ) .   (* for special attributes *)

full_id              = id { "." id } .
```

---

## 3. File structure (detailed)

An IDL file has a **strict order**:

1. **Exactly one package clause** (required).
2. **Zero or more import declarations**.
3. **Zero or more other declarations**.

**Import is allowed only** after the package clause and before any other declaration. Import is not allowed inside namespaces or elsewhere. Package and import have **no** extended attributes and **no** modifiers.

**Example:**

```idl
package arkui.component.units;

import arkui.foo.Bar;
import arkui.baz as Qux;

interface MyInterface {
  attribute i32 count;
  void doSomething();
};

enum Direction {
  i32 Up;
  i32 Down;
  i32 Left;
  i32 Right;
};
```

---

## 4. Fully qualified names

Each declaration in the set of IDL files that are being processed together must have a unique fully qualified name (except for global functions).

**FQN** (fully qualified name) is constructed as `package_name + namespaces_name + declaration_name`. For example:

```
package example;

interface Boo {};
typedef Too = i32;

namespace ns {
  interface Foo {};
};
```

There `interface Boo` will have `FQN=example.Boo`, `typedef Too` will have `FQN=example.Too`, `interface Foo` will have `FQN=example.ns.Foo`.

---

## 5. Extended attributes

Extended attributes appear in square brackets before a declaration; each is an identifier optionally followed by `= full_id`, `= literal`.

**Examples:**

```idl
[Entity=Class] interface Widget {
  [name="onClick"] attribute callback void clickHandler;
};

[attr1, attr2="value"] void maybeDo(i32 x);
```

### Assigning Extended Attributes to the Return Type: Use Union Syntax

IDL attributes before a function declaration always apply to the function entry, **not the return type**:

```idl
// incorrect: [name=a] is set on the function itself
[name=a] void foo();
```

**If you need to apply extended attributes to the return type** (not the function), use *parentheses*, which in IDL is simply the normal `union_type` syntax. This lets you attach attributes to the type instead of the declaration:

```idl
// correct: [name=a] is set on the return type `void`
([name=a] void) foo();
```

This works because `( ... )` triggers the union_type production, which always allows per-type attributes. Even if there is only one type in the union, this is valid and has the needed effect.

---

## 6. Interfaces

An interface is a structure that aggregates a set of attributes, constructors and methods. IDL does not by itself describe how to recognize an interface—whether it is a class, interface, record or something else; IDL just describes the intention of having a structure.

```idl
interface FooParent {
  attribute i32 parentField;
};

interface Foo : FooParent {
  attribute i32 field;

  readonly attribute i32 readonlyField;
  optional attribute i32 optionalField;
  readonly optional attribute i32 readonlyOptionalField;

  [name=a]
  attribute i32 fieldWithAttributes;

  constructor();
  constructor(i32 value);
  [name=a]
  constructor(i64 value);

  void foo();

  void overriddenFoo();
  void overriddenFoo(i32 value);

  [name=a]
  void fooWithAttributes();

  async void asyncFoo();

  static void staticFoo();
  static async void staticAsyncFoo();
};
```

**Interface generics**:

```
interface <T> Boo {
  attribute T booField;
};

interface <T> Foo {
  attribute T field;
  attribute Boo<T> boo;
};
```

Try to **avoid** having generics in methods, for example:

```
interface <T> Foo {
  T foo();
  // or
  void foo(T value);
};
```

---

## 7. Typedef

Typedef is a way for a developer to create an alias for a type. For example, if you have long union type and want to create shorter version because it is used in many places, you can create typedef on that union to decrease amount of code.

```idl
typedef IntList = sequence<i32>;
typedef StringMap = record<String, i32>;
typedef <T> Optional = (T or undefined);
typedef <T> SequenceOf = sequence<T>;
```

---

## 8. Callback

Callbacks are the current way to define a functional type. Unfortunately, IDL has no dedicated functional type, so you must create a callback declaration that describes a function signature and then use it where needed:

```
callback Cb = void (i32 argument);
void foo(Cb value);
```

Callbacks also may have generic arguments:

```
callback <T> Cb = void (T argument);
void foo(Cb<i32> value);
```

---

## 9. Enum and dictionary

Enum (or dictionary, deprecated) describes a set of named constants. Enum values can be either numeric or String; it is prohibited to mix different element types. For numeric values you can either have no initializers or initialize all members; for String values you must explicitly initialize every member.

```idl
enum Status {
  i32 Idle;
  i32 Running;
  i32 Done;
};
enum Code {
  i32 Ok = 0;
  i32 Error = -1;
};
enum Align {
  String start = "start";
  String center = "center";
  String end = "end";
};
```

---