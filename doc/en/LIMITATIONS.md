## Processing pipeline

The general route of execution in IDLize is typically like this:

```
                   generator 1 (TS code)
                 /
 .d.ts -> IDL IR -> generator 2 (ArkTS code)
 .idl -----^     \
                   generator 3 (C++ code)
```

Generators are aware about the style and runtime semantics of code to be generated, and usually
are developed and tuned by library maintainers.

## Limitations

This architecture has certain limitations in its ability to support all the syntactic constructions
of the original TypeScript language. This is partly due to the intentionally limited expressive
power of IDL, but primarily it is defined by the multi-language, multi-runtime nature of the target
application model. When input is already in IDL, its expressive power determines what can and
cannot be represented.

Everything that is specific to a particular programming language — its object model,
data structures, concurrency model, and so on — is best kept out of IDL IR, whose purpose is to
define interfaces only. The following TypeScript constructions are unlikely to have significant
representation in IDL:
   * Generics, as the exact mechanism of generic types differs across languages and cannot be
   expressed outside of a language's runtime. IDL provides generic-like predefined syntactic
   constructs such as `sequence<Foo>` or `record<string, Bar>` and can provide more if needed, but
   does not allow users to define custom generic constructs.
   * Intersection types, as this information is usually redundant when defining cross-language
   interfaces and only makes sense in certain languages.
   * Truly polymorphic objects, i.e. cases where instances of subclasses are passed as superclasses.
   Important cases such as Context or FrameNode are handled specially by generators.
   * TypeScript's specific types of following kinds:
      * Types like `any`, `unknown`.
      * Very language-specific types and type constructs, such as signature types, `typeof`, etc.
      * TypeScript stdlib types (with the possible exception of a few types such as `number` and `Date`).
        Instead, IDL provides a set of builtin types with predictable mapping to possible runtime
        implementations: `i8, i16, i32, i64, f32, f64, Object, string, buffer`.
   * Notions relevant for interfaces can still be represented in IDL, such as the `async` keyword
     or the `[Throws]` extended attribute.

For every case, a translation policy must be defined to handle such constructs until they are
removed from .d.ts file definitions or the project completely switches to IDL.


