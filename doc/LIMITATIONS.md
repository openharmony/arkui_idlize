## Processing pipeline

 General route of execution in IDLize is typically like this:

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

Such architecture has certain limitations in ability to support all the syntactic constructions
of original TypeScript language. Partially it is coming from intentionally limited representantive
language power of IDL, but overall, it is defined by multi-language multi-runtime nature of target
application model. Sure, if input is already in IDL, its expressive power defines things that could
and could not be expressed.
I.e. everything that assumes things specific to the programming language, its object model,
data structures, concurrency model etc. is better be kept out of IDL IR, whose purpose is to define
interfaces only. It means that following constructions in TypeScript will unlikely have much of
representation in IDL:
   * Generics, as exact mechanism of generic types differs in different languages and cannot be
   expressed outside of language's runtime. We still provide generic-like predefined syntactic
   constructs like `sequence<Foo>` or `record<string, Bar>` and can provide more, if needed, but give no
   way to the user to define own custom generic constructs
   * Intersection types, as this kind of information is usually excessive when defining cross-language
   interface and only makes sense in certain languages
   * Truly polymorphic objects, i.e. cases where instances of subclasses are passed as superclasses,
   important cases such as Context or FrameNode to be handled specially by generators
   * TypeScript's specific types of following kinds:
      * types like `any`, `unknown`
      * very language-specific types and type constructs, such as signature types, `typeof`, etc.
      * TypeScript stdlib types (maybe module few types we allow, such as `number`, `Date`), instead we shall have
        set of builtin IDL types with predictable mapping to possible runtime implementations, i.e. for now
        it is at least `i8, i16, i32, i64, f32, f64, Object, string, buffer`
   * Still notions relevant for interface can be represented in IDL, such as `async` keyword, or `[Throws]` extended
     attribute

For every case there shall be defined translation policy to handle such constructs until we get rid of
them in .d.ts file definitions or completely switch to IDL.


