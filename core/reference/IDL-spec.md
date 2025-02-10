IDL spec

- [package/namespace](#packagenamespace)
- [import/typedef](#importtypedef)
- [literal types](#literal-types)
  - [primitives](#primitives)
  - [containers](#containers)
    - [optional](#optional)
    - [sequence](#sequence)
    - [union](#union)
    - [record](#record)
- [declarations](#declarations)
  - [enum](#enum)
  - [constant](#constant)
  - [function](#function)
  - [callback](#callback)
  - [interface](#interface)
- [extended attributes](#extended-attributes)
- [version](#version)

# package/namespace

The *package* directive and *namespace* container are designed to semantically structure a mass of declarations into named scopes, which allows complexity to be controlled by localizing it. The *package* directive specifies the root scope of the current module. The *namespace* container allows nested scopes to be formed. Examples:

```
package ohos.bluetooth;
namespace gatt {
    interface Server {/*...*/}
    // ohos.bluetooth.gatt.Server
}
```

# import/typedef

The *import* directive is intended to project the specified scope onto the current one. Example:

```
import ohos;
interface MySrv : bluetooth.Server {/*...*/}
//  bluetooth.Server is visible as ohos.bluetooth.Server via 'import ohos'
```

A *typedef* declaration is intended to assign a new name in the current scope to another type specified by name. Example:

```
typedef ohos.bluetooth.Server MySrv;
// MySrv alias for ohos.bluetooth.Server
```

# literal types

Primitive types and the most general generic containers are available in literal form.

## primitives

Composition of primitives:

-   void
-   boolean
-   integers: i8/u8, i16/u16, i32/u32, i64/u64
-   real numbers: f16/f32/f64
-   number/bigint
-   String
-   buffer
-   date

## containers

### optional

For types such semantics are not presented, only for aggregate elements, through a special syntax, some examples:

```
// optional parameter of function/method
void someMethod(optional String someParameter); 

interface I1 {
    // optional interface attribute
    [Optional] attribute String someAttribute;
}
```

If it is necessary to provide optionality specifically for a type, you can use its union with void, example:

```
typedef (number or void) OptNumber;
```

### sequence

Dynamic array of elements of a given type, example:

```
void someMethod(sequence<String> someParameter);
```

### union

A container for holding a value of one of many types, example:

```
void someMethod((sequence<String> or String or number) someParameter);
```

### record

Associative container with key and value types specified, example:

```
void someMethod(record<String, boolean> someParameter);
```

# declarations

Declarations introduce new entities (types, values, functions) into the current scope, accessible for reference by names.

## enum

Declares an enumerated type with a domain of integer or string values. Example

```
dictionary Origin {
    number local = 0;
    number remote = 1;
};
```

## constant

Declares a value of the specified type. The set of permitted types is limited:

-   boolean,
-   integers and real numbers,
-   strings.

The value can only be specified in literal form (expressions/generators/etc are not supported). Example

```
const String MIMETYPE_TEXT_PLAIN = "text/plain";
const number three = 3;
```

(Constant is not a type.)

## function

Declares a function. An example of a function that takes nothing and returns nothing:

```
void foo();
```

The result type and argument types can be any, there are no restrictions on them. The parameter can be additionally declared optional. The function can be preceded by the async marker, indicating that this function returns its result in some deferred form.

```
async number bar(String param1, optional boolean param2);
```

Functions with the same name can form overloaded sets; distinctions are made based on the nomenclature of parameters.

```
number bar(String param1);
number bar(String param1, boolean param2);
number bar(String param1, i32 param2);
```

(Function is not a type.)

## callback

Declares a named callable type whose values allow the corresponding reactors to be passed between user/service implementations and their deferred activation on the other side in order to reverse the flow of activity (in the user-service model). Example:

```
callback Foo = number(number param1, optional String param2);
```

Callback values can be placed in interface attributes, passed through function/method parameters. Examples:

```
interface I1 {
    attribute Foo foo;
}
void setReactor(Foo foo);
```

Unlike functions/methods, callback signature cannot be marked with async marker.

## interface

Declares a contract in an object-oriented style that is a collection of

1. optionally, base interface to inheritance
2. attributes, can be provided with optional and static markers
    1. type
    2. name
3. methods, can be provided with a static marker
    1. result type
    2. name
    3. set of typed/named parameters
4. constructors
    1. set of typed/named parameters
5. constants
    1. type
    2. name
    3. value

Static attributes/methods are associated not with an instance of an interface but with the interface itself.

Constructors are special methods with the following implicit restrictions:

1. the result type is always an instance of the interface
2. the method name is always "constructor"
3. the constructor is always static, although it is not assigned the static attribute

An interface is a type. An interface instance (value) is a small identifier that associates the instance with the corresponding implementation object. An interface value can be placed in attributes, parameters, and the return of a function/method. Examples:

```
interface File {
    attribute String name;
    attribute u32 size;
    optional attribute String lastError;

    void seek(u32 offset);
    u32 pos();
    buffer read(u32 size);
    void write(buffer data);

    static u64 deviceIdMounted();
}

[Entity=Class]
interface TxtFile : File {
    attribute String encoding;
    constructor(String name);
}
```

The semantic of *class* is not explicitly implemented in IDL, but can be represented at the application level through various tools, such as

- presence of the constructor
- presence of the extended attribute Entity=Class
-   ...

# extended attributes

Many declarations and their parts can be supplied with additional meta-information via the mechanism of extended attributes. Most of the extended attributes are technical in nature and are not intended for application use, only a few of them can be used explicitly at the application level:

-   TypeParameters/TypeArguments, extend the IDL syntax to support generic types and their instances. Example:
```
[TypeParameters="K,V"]
interface KeyValuePair {
    attribute K key;
    attribute V value;
};

void foo([TypeArguments="K,V"] KeyValuePair kvp);
```
-   Deprecated, label for deprecated entities. Example:
```
[Deprecated]
typedef String AudioState;
```

-   Documentation
```
[Documentation="/**
* @file
* @kit IMEKit
**/
/**
* Input method subtype
* @interface InputMethodSubtype
* @syscap SystemCapability.MiscServices.InputMethodFramework
* @since 9
*/"] interface InputMethodSubtype {}
```
-   Entity/Component/ComponentInterface, various labels that make sense in certain environments

# version

The *version* directive allows you to mark a root or nested namespace with a semantic-versioning-like label. Example:

```
namespace ns {
    version 1.2.3-dev456;
};
```
