# Performance considerations

IDLize aim to be universal cross-language interop compiler, and as such must provide high performance of
the generated code.

There are two major approaches of passing data across interop boundaries, which differ significantly
depending on performance characteristics of the runtimes involved.

Serialization is symmetric approach where one runtime creates memory buffer from its own internal object representation
to the binary form understandable by another runtime, then memory passed to another side and that side restores its native
representation from that buffer.

Handle passing is an alternative approach, where runtime-specific handle is passed to another runtime, along with
runtime introspection API, which is used to extract related fields as needed.

Serialization could be better is case of high performance runtimes with relatively high runtime boundary crossing cost,
while handle passing is better for slow runtimes interoping with fast runtime/native, mostly in direction requesting
native to introspect on slow runtime.


So cost of operations is approximately like this:

Serialization:

[ Runtime 1 serialization ] [ invocation cost ] [  Runtime 2 deserialization ]


Handle passing:

[ Invocation cost ] [  Runtime 2 introspection cost into Runtime 1 ]

Generally speaking, scheme with serialization benefits from VM optimizations and better codegeneration,
while scheme with handle passing benefits from faster introspection APIs, which kind of contradicts to
optimizing VM behavior.

If Runtime 1 is very slow, for example interpreting JS VM, then scheme with handle passing is preferred,
while for highly optimizing VM serialization will provide more optimization opportunities.

Slow VM:

[         Serialization                                      ] [ call ] [ Deserialization]
[ call ] [                   VM introspections       ]


Fast VM:

[    Serialization     ] [ call ] [ Deserialization ]
[ call  ]  [                   VM introspections       ]

Fast VM with serialization and codegen optimizations:

[ Serialization ] [ call ] [ Deserialization ]
[ call  ]  [                   VM introspections        ]

