# <p> <img align="bottom" src="artwork/logo.svg" alt="logo" width="100"/> Arktscgen <p/>

## Description

Arktscgen is a generation tool used to create Typescript API bindings for Panda compiler. The bindings consist
of three major parts: the compiler API itself in Typescript, native C++ wrappers around Panda's C interface
for use in Node.js environment and some handwritten code, both in TS and C++, to tie it all together.

### Usage

```
node . --panda-sdk-path <sdk-dir> --output-dir <path> --options-file <json-config-path>
```

- `sdk-dir` this is the directory relative to which the idl file is searched for
  by the given path, as well as the compiler executable file (used only for version detection, optional)
- `json-config-path` a path to a file that contains a filter of idl entities to generate and
  handwritten additions.

### Caveats

- Functions from the IDL file do not end up in the generated code as-is. Prefixes and suffixes like "Get"
and "Const" are discarded. After that, multiple function names may collide within the same scope,
and the one non-const variant is selected from them.
For example, getFoo() and getFooConst() would both have the same name foo() in generated code so
the only getFoo() will be selected for generation.
- "Peer" is a descendant of an AstNode and this name should probably be corrected.

### Architecture

> The initial design of a generator was significantly changed but was not finished. What follows
is a short description of the original design and its evolution.

#### Overview

At a high level, the generator consists of a bunch of smaller generators (they named printers in the code),
a set of transformers that modifies input and utility code. These generators are:
 - `peer generator` produces the API, one file for one class (this rule has an exception for namespaces)
 - `enum` and `index` generators create two files with enums and indicies of peers.
 - `factory generator` provides a stable api for creating and modifying nodes.
 - `bindings generator` creates a single file with stubs for all peer's member functions.
 - `bridges generator` creates a native wrappers that bindings are bound to.

The last two are the most tricky and will be discussed in detail later.

Transformers are the classes that implements a common interface that provides an ability
to modify an input idl file and thus affect the output.

The generation process may be split into 'phases' that differ in the output being produced
and tranformation has been applied before that but that is not a necessary (and barely correct)
division. That is just a necessity of applying different transformations for different
generations. The changes of the current design will aim to eliminate transformations
at all in respect to filters.

Filters work on generation stage and may produce some intermediate representation (now filters consume
and produce idlizer types) with necessary changes that can be made once and spread across generators.

#### Transformers

Transformers were introduced due to a very low quality of the input idl file and could correct
even syntax of it and that is a proper use of them but the bloating and widening of use cases
made the generators to work with very different input files.
Now there is only one left. Its removal requires a large redesign that outweighs profit. See
todo section.

#### Typechecker

A Typechecker is a class whose main purpose is resolving references. In addition, it includes
logic for categorizing types, the most important of which is whether a type is a "peer". Since
the generator originally processed only the "ir" namespace, this refers to an heir/subclass of AstNode.
This name should probably be reconsidered.

#### Generators
##### Peer, enum, and index generators
They are pretty straightforward and make up the TS API. The peer generator makes a class that holds
a reference to a C native type and makes calls to its methods through bindings. Context and
peer parameters from an origin are dropped in generated methods.

##### Bindings generator
The binding generators make up the "glue" code between TS and NAPI that allows to call C functions.
The methods in this file have a signature identical to one in idl file.

##### Bridges generator
This generator produces the C++ code with pure C interface that is registered in nodejs and allows
the bindings to work.

### Config
The config is used to specify generation settings. In some sections a reduced GLOB patterns may be
used - \* (star) for all, and ! (exclamation mark) for negation.

#### irHack
As idl backed by C API and the compiler is written in C++ there are name collisions from different
namespaces. So the namespace name were added to *conficting* C functions names in the API. As idl support
namespaces too there is an inconsistency between idl names and C api. This parameter adds "Ir" suffix
to C function names to be called.

#### ignore
This parameter determines which subset of the IDL file the code will be generated from. Methods
that use these types are ignored too. It has three subparamenters:
- peers: Names of classes that the code should not be generated for but may be used as type parameters.
- full: Names of classes that will be fully ignored.
- partial: Names of methods that will be ignored.
GLOB may be used.

#### globalAliases
Determines classes from namespaces for that aliases in global namespace should be made.

#### nonNullable
Determines for which methods the return type should not be nullable.

#### fragments
Allows to inject handwritten properties in generated code in form: `name = definition`.
Definition is almost always a function name. These definitions are imported through
reexport file.
