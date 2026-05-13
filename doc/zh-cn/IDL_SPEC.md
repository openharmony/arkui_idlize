- [package/namespace](#packagenamespace)
- [import/typedef](#importtypedef)
- [字面量类型](#字面量类型)
  - [基本类型](#基本类型)
  - [容器](#容器)
    - [optional](#optional)
    - [sequence](#sequence)
    - [union](#union)
    - [record](#record)
- [声明](#声明)
  - [枚举（使用字典语法）](#枚举使用字典语法)
  - [常量](#常量)
  - [函数](#函数)
  - [回调](#回调)
  - [接口](#接口)
- [扩展属性](#扩展属性)
- [版本](#版本)


# **package/namespace**

*package* 指令和 *namespace* 容器旨在通过命名作用域将一组声明进行语义结构化，允许通过局部化管理复杂性。*package* 指令指定当前模块的根作用域，而 namespace 容器允许创建嵌套作用域。

**示例：**

```
package ohos.bluetooth;
namespace gatt {
    interface Server {/*...*/}
    // ohos.bluetooth.gatt.Server
}
```

# import/typedef

*import* 指令用于将指定的作用域映射到当前作用域。

**示例：**

```
import ohos;
interface MySrv : bluetooth.Server {/*...*/}
//  ohos.bluetooth.Server 通过 'import ohos' 作为 bluetooth.Server 可见
```

*typedef* 声明用于在当前作用域内为现有类型分配一个新名称。

**示例：**

```
typedef ohos.bluetooth.Server MySrv;
// MySrv 是 ohos.bluetooth.Server 的别名
```

# 字面量类型

基本类型和最常见的泛型容器可以使用其字面量形式。

## 基本类型
**基本类型的组成：**

1. void
2. boolean
3. **整数：**
    1. i8 / u8
    2. i16 / u16
    3. i32 / u32
    4. i64 / u64
4. **实数：**
    1. f32
    2. f64
5. number / bigint
6. String
7. buffer

## 容器

### optional

这种语义不是为类型本身定义的，而是只为聚合元素定义，使用特殊语法。

**示例：**

```
// 函数/方法的可选参数
void someMethod(optional String someParameter);

interface I1 {
    // 可选接口属性
    [Optional] attribute String someAttribute;
}
```

如果需要使类型变为可选的，可以使用 `?` 后缀。

**示例：**

```
typedef number? OptNumber;
```

### sequence

给定类型元素的动态数组。

**示例：**

```
void someMethod(sequence<String> someParameter);
```

### union

包含多种类型中某一种值的容器。

**示例：**

```
void someMethod((sequence<String> or String or number) someParameter);
```

### record

具有指定键和值类型的关联容器。

**示例：**

```
void someMethod(record<String, boolean> someParameter);
```

# 声明

声明在当前作用域中引入新实体（类型、值、函数），使其可以通过名称访问。

## 枚举（使用字典语法）

声明一个具有整数或字符串值域的枚举类型。在字典中，整数和字符串项不能混合。

**示例：**

```
dictionary Origin {
    number local = 0;
    number remote = 1;
};
```

## 常量

声明指定类型的值。允许的类型集合有限：

-   boolean，
-   整数和实数，
-   字符串。

值只能以字面量形式指定（不支持表达式、生成器等）。

**示例：**
```
const String MIMETYPE_TEXT_PLAIN = "text/plain";
const number three = 3;
```

*（常量不是类型。）*

## 函数

声明一个函数。以下是不接受参数且不返回任何内容的函数示例：

```
void foo();
```

结果类型和参数类型可以是任何类型，没有限制。参数也可以声明为可选的。函数前面可以有 async 标记，表示它以延迟方式返回结果。

```
async number bar(String param1, optional boolean param2);
```

同名函数可以形成重载集合；根据参数签名进行区分。

```
number bar(String param1);
number bar(String param1, boolean param2);
number bar(String param1, i32 param2);
```

（函数不是类型。）

## 回调

声明一个命名的可调用类型，其值允许相应的回调在用户和服务实现之间传递，
允许在接收侧延迟激活以反转用户-服务模型中的活动流。

**示例：**

```
callback Foo = number (number param1, optional String param2);
```

回调值可以赋给接口属性或作为函数/方法参数传递。

**示例：**

```
interface I1 {
    attribute Foo foo;
}
void setReactor(Foo foo);
```

与函数和方法不同，回调签名不能用 async 标记。

## 接口

**以面向对象风格声明一个契约，由以下部分组成：**

 1.  可选地，用于继承的基接口。
 2.   **属性，可以标记为 *optional* 或 *static*：**
     1. 类型
     2. 名称
 3.   **方法，可以标记为 *static*：**
     1. 返回类型
     2. 名称
     3. 类型化/命名参数集合
 4.   **构造函数：**
     1. 类型化/命名参数集合
 5.   **常量：**
     1. 类型
     2. 名称
     3. 值

静态属性和方法不与接口的实例关联，而是与接口本身关联。

构造函数是具有以下隐式限制的特殊方法：

   1. 返回类型始终是接口的实例。
   2. 方法名称始终为 "constructor"。
   3. 构造函数始终是静态的，即使没有显式标记 static 属性。

接口是类型。接口实例（值）是一个小标识符，将实例链接到相应的实现对象。接口值可以存储在属性中、作为参数传递或从函数/方法返回。

**示例：**

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

*类* 的概念在 IDL 中没有显式实现，但可以通过各种机制在应用层面表示，
例如构造函数的存在。

# 扩展属性

许多声明及其组件可以使用扩展属性机制补充额外的元数据。大多数扩展属性是技术性的，
不面向应用层使用；只有少数可以在应用层显式使用：

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
-   Entity/Component/ComponentInterface，在特定环境中有意义的各种标签

# 版本

version 指令允许使用语义版本化类似的标签标记根或嵌套命名空间。

**示例：**

```
namespace ns {
    version 1.2.3-dev456;
};
```
