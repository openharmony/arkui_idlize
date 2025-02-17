📂 IDL-spec  
├── 📄 [package/namespace](#packagenamespace)  
├── 📄 [import/typedef](#importtypedef)  
├── 📂 [literal types](#literal-types)  
│   ├── 📄 [primitives](#primitives)  
│   ├── 📂 [containers](#containers)  
│   │   ├── 📄 [optional](#optional)  
│   │   ├── 📄 [sequence](#sequence)  
│   │   ├── 📄 [union](#union)  
│   │   ├── 📄 [record](#record)  
├── 📂 [declarations](#declarations)  
│   ├── 📄 [enumeration (using dictionary syntax)](#enumeration-using-dictionary-syntax)  
│   ├── 📄 [constant](#constant)  
│   ├── 📄 [function](#function)  
│   ├── 📄 [callback](#callback)  
│   ├── 📄 [interface](#interface)  
├── 📄 [extended attributes](#extended-attributes)  
└── 📄 [version](#version)  


#  **package/namespace** 

The *package* directive and the *namespace* container are designed to semantically structure a set of declarations into named scopes, allowing complexity to be managed through localization. The *package* directive specifies the root scope of the current module, while the namespace container enables the creation of nested scopes.

 **Examples:** 

```
package ohos.bluetooth;
namespace gatt {
    interface Server {/*...*/}
    // ohos.bluetooth.gatt.Server
}
```

# import/typedef

The *import* directive is intended to map the specified scope onto the current one.

 **Example:** 

```
import ohos;
interface MySrv : bluetooth.Server {/*...*/}
//  bluetooth.Server is visible as ohos.bluetooth.Server via 'import ohos'
```

A  *typedef*  declaration is used to assign a new name to an existing type within the current scope.

 **Example:** 

```
typedef ohos.bluetooth.Server MySrv;
// MySrv alias for ohos.bluetooth.Server
```

# literal types

Primitive types and the most common generic containers are available in their literal form.

## primitives
**Composition of primitives:**  
  
1. void  
2. boolean  
3. **Integers:**  
    1. i8 / u8  
    2. i16 / u16  
    3. i32 / u32  
    4. i64 / u64  
4. **Real numbers:**  
    1. f16  
    2. f32  
    3. f64  
5. number / bigint  
6. String  
7. buffer   

## containers

### optional

Such semantics are not defined for types themselves but only for aggregate elements, using a special syntax. 

 **Example:** 

```
// optional parameter of function/method
void someMethod(optional String someParameter); 

interface I1 {
    // optional interface attribute
    [Optional] attribute String someAttribute;
}
```

If it is necessary to make a type optional, you can use `?` suffix.

 **Example:**

```
typedef number? OptNumber;
```

### sequence

A dynamic array of elements of a given type. 

 **Example:** 

```
void someMethod(sequence<String> someParameter);
```

### union

A container that holds a value of one of multiple types.

**Example:** 

```
void someMethod((sequence<String> or String or number) someParameter);
```

### record

An associative container with specified key and value types. 

**Example:** 

```
void someMethod(record<String, boolean> someParameter);
```

# declarations

Declarations introduce new entities (types, values, functions) into the current scope, making them accessible by name.

## enumeration (using dictionary syntax)

Declares an enumerated type with a domain of integer or string values. 

**Example:** 

```
dictionary Origin {
    number local = 0;
    number remote = 1;
};
```

## constant

Declares a value of the specified type. The set of allowed types is limited:

-   boolean,
-   integers and real numbers,
-   strings.

The value can only be specified in literal form (expressions, generators, etc. are not supported). 

 **Example:** 
```
const String MIMETYPE_TEXT_PLAIN = "text/plain";
const number three = 3;
```

 _(A constant is not a type.)_ 

## function

Declares a function. Here is an example of a function that takes no arguments and returns nothing:

```
void foo();
```

The result type and argument types can be of any kind; there are no restrictions on them. A parameter can also be declared as optional. The function can be preceded by the async marker, indicating that it returns its result in a deferred manner.

```
async number bar(String param1, optional boolean param2);
```

Functions with the same name can form overloaded sets; distinctions are made based on the parameter signatures.

```
number bar(String param1);
number bar(String param1, boolean param2);
number bar(String param1, i32 param2);
```

(Function is not a type.)

## callback

Declares a named callable type whose values enable the corresponding callbacks to be passed between user and service implementations, allowing their deferred activation on the receiving side to reverse the flow of activity in the user-service model. 

 **Example:** 

```
callback Foo = number(number param1, optional String param2);
```

Callback values can be assigned to interface attributes or passed as function/method parameters. 

 **Examples:** 

```
interface I1 {
    attribute Foo foo;
}
void setReactor(Foo foo);
```

Unlike functions and methods, a callback signature cannot be marked with the async marker.

## interface

 **Declares a contract in an object-oriented style, which consists of:** 
  
 1.  Optionally, a base interface for inheritance.   
 2.   **Attributes, which can be marked as *optional* or *static*:**    
     1. Type  
     2. Name  
 3.   **Methods, which can be marked as *static*:**    
     1. Return type  
     2. Name  
     3. Set of typed/named parameters  
 4.   **Constructors:**    
     1. Set of typed/named parameters  
 5.   **Constants:**    
     1. Type  
     2. Name  
     3. Value  

Static attributes and methods are associated not with an instance of an interface but with the interface itself.

Constructors are special methods with the following implicit restrictions:

   1. The return type is always an instance of the interface.
   2. The method name is always "constructor".
   3. The constructor is always static, even though it is not explicitly marked with the static attribute.

Interfaces are types. An interface instance (value) is a small identifier that links the instance to the corresponding implementation object. An interface value can be stored in attributes, passed as a parameter, or returned from a function/method.

 **Examples:** 

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

interface TxtFile : File {
    attribute String encoding;
    constructor(String name);
}
```

The concept of a *class* is not explicitly implemented in IDL but can be represented at the application level through various mechanisms, such as the presence of a constructor.

# extended attributes

Many declarations and their components can be supplemented with additional metadata using the extended attributes mechanism. Most extended attributes are technical in nature and are not intended for application-level use; only a few can be explicitly utilized at the application level:

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

The version directive allows marking a root or nested namespace with a semantic versioning-like label. 

 **Example:** 

```
namespace ns {
    version 1.2.3-dev456;
};
```
