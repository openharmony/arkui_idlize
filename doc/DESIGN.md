# IDLize API compiler toolchain

## Purpose and goals

Large APIs needs special treatment to provide multiple languages APIs and execution environment bindings.
We believe that universal tool to support such mapping is needed, and not yet exists in the industry.
Thus we've created toolchain and accompanying runtime interop mechanisms to solve cross-language API
mapping problem both in compile and execution phases of application lifecycle.

## Approach

  To provide approach to support multiple target languages and interop scenarios we follow the road similar to what LLVM
does to the general compiler development. We implement the general purpose compiler toolchain with IDL-like IR and flexible
backend system build around notions of LanguageWriter and TypeConvertor.

 LanguageWriter implements language agnostic emitter interface, which can be implemented for a particular target language to
emit that programming language constructions when needed.

TypeConvertor defines the policy of conversion for an abstract IDL-based type system for the particular target programming language.

Toolchain provides basic utility functions to support important primitives, such as callbacks, FFI bridging and
serialization/deserialization.

 Per-project generator is expected to be provided by a framework developer to produce specific integration code
emitting library-bridging code.
Additionally, build system integration code is emitted.

 Initially interfaces can be either described in the IDL language, or be converted by a language-specific frontend from
some other interface definition language, for example .d.ts TypeScript interface definitions or .h C header file.
Then IDLize compiler analyses whole API surface as consistent system of interfaces, their typing information and on demand emits
project and language-specific glue code to allow invocation of APIs across languages and runtimes.

 Important part of interop problem is mapping of data types between languages and runtimes. To solve that universal
type system based serialization/deserialization mechanism is designed. It works by analyzing types aggregation and inheritance
and created automated serializers and deserializers for data transfer. This way every API call and callback can be


## Challenges

  * Different languages and execution environments frequently use quite different notions and concepts, and IDL language
  must balance to expose enough expressive features to represent practically usable APIs, while have sensible and performant
  mapping to all relevant target languages and their execution environment.
  * Some notions, like asynchronous operations and callbacks may not have standardized mapping in target languages,
  so implementor may be required to provide somewhat biased mapping approach.
  * IR to keep language-specific information inevitably have to have some annotation-like mechanism, i.e. extended attributes,
  which are not formally validated or processed by the toolchain

## Implementation

 Current implementation is written in TypeScript and uses universal IDL IR as input for language-specific emitters and type mappers.
We design system by providing the following components:
   * IDL IR
   * IDL library abstraction
   * TS frontend
   * Language emitters: TS, C++, Java, CangJie, ArkTS NEXT
   * Native interop library
   * Generated code templates
   * Library-specific generators

## Language

We base on WebIDL language and extend it with features relevant for modern interfaces, with both syntax extensions and extended
attributes. See [IDL.md](../IDL.md) for full list of language extensions.

### Language extensions

  * standard WebIDL `Promise<Foo> foo(Bar bar)` syntax is replaced with `async` keyword to denote asynchronous operation, so that it reads as `async Foo foo(Bar bar)`
  * Added `package` keyword to mark interfaces as belonging to a package
  * Added `import` keyword to mark mutual dependencies between IDL files
  * Allowed `foo.Bar` identifiers to allow FQ names

### Extended attributes

  We use extended attributes to provide language-specific information to the toolchain, such as type mapping, TypeScript and other
languages specific extensions etc. See IDL.md for full list of extended attributes.

