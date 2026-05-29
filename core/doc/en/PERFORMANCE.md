# Performance considerations

IDLize aims to be a universal cross-language interop compiler, and as such must generate
code with high performance.

There are two major approaches of passing data across interop boundaries, which differ significantly
depending on performance characteristics of the runtimes involved.

Serialization is a symmetric approach where one runtime creates a memory buffer from its own
internal object representation to a binary form understandable by another runtime. The memory
is then passed to the other side, which restores its native representation from that buffer.

Handle passing is an alternative approach, where a runtime-specific handle is passed to another
runtime along with a runtime introspection API, which is used to extract fields as needed.

Serialization is preferable for high-performance runtimes with relatively high runtime boundary
crossing cost, while handle passing is better for slow runtimes interoperating with a fast
runtime or native code — primarily in the direction where the native side introspects the slow runtime.


The cost of operations is approximately as follows:

```
Serialization:

[ Runtime 1 serialization ] [ invocation cost ] [  Runtime 2 deserialization ]

Handle passing:

[ Invocation cost ] [  Runtime 2 introspection cost into Runtime 1 ]
```

Generally speaking, serialization benefits from VM optimizations and better code generation,
while handle passing benefits from faster introspection APIs — which somewhat contradicts
optimizing VM behavior.

If Runtime 1 is very slow (for example, an interpreting JS VM), handle passing is preferred,
while for a highly optimizing VM, serialization provides more optimization opportunities.

```
Slow VM:

[         Serialization                                      ] [ call ] [ Deserialization]
[ call ] [                   VM introspections       ]


Fast VM:

[    Serialization     ] [ call ] [ Deserialization ]
[ call  ]  [                   VM introspections       ]

Fast VM with serialization and codegen optimizations:

[ Serialization ] [ call ] [ Deserialization ]
[ call  ]  [                   VM introspections        ]
```