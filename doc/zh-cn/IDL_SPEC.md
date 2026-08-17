# IDL 语言规范

本文档描述 IDLize 使用的 IDL 中间语言。IDL 用于连接 SDK 声明和生成器：
`etsgen` 将 `.d.ts` / `.d.ets` 转换为 `.idl`，`core` 将 `.idl` 解析为 AST，
`arkgen` 和 `libohos` 再基于 AST 生成 ArkTS、C++ 和 Arkoala 相关代码。

## 1. package 和 namespace

`package` 指令指定当前文件的根命名空间。`namespace` 容器用于在文件中创建嵌套命名
空间。

```idl
package ohos.bluetooth;

namespace gatt {
    interface Server {
    }
    // 完全限定名：ohos.bluetooth.gatt.Server
}
```

## 2. import 和 typedef

`import` 将指定命名空间映射到当前作用域：

```idl
import ohos;

interface MySrv : bluetooth.Server {
}
// ohos.bluetooth.Server 可通过 bluetooth.Server 访问
```

`typedef` 为现有类型定义别名：

```idl
typedef MySrv = ohos.bluetooth.Server;
```

## 3. 类型

### 3.1 基本类型

| 类型 | 说明 |
|---|---|
| `void` | 无返回值。 |
| `boolean` | 布尔值。 |
| `i8` / `u8` | 8 位有符号 / 无符号整数。 |
| `i16` / `u16` | 16 位有符号 / 无符号整数。 |
| `i32` / `u32` | 32 位有符号 / 无符号整数。 |
| `i64` / `u64` | 64 位有符号 / 无符号整数。 |
| `f32` / `f64` | 32 位 / 64 位浮点数。 |
| `number` | 数值类型。 |
| `bigint` | 大整数类型。 |
| `String` | 字符串。 |
| `buffer` | 二进制缓冲区。 |

### 3.2 optional

参数可以通过 `optional` 标记为可选：

```idl
void someMethod(optional String someParameter);
```

接口属性可以通过 `[Optional]` 标记为可选：

```idl
interface I1 {
    [Optional]
    attribute String someAttribute;
}
```

类型本身需要可选语义时，可以使用 `?` 后缀或包含 `undefined` 的联合类型：

```idl
typedef OptNumber = number?;
typedef OptNumber2 = (number or undefined);
```

### 3.3 sequence

`sequence<T>` 表示指定元素类型的动态数组：

```idl
void someMethod(sequence<String> values);
```

### 3.4 union

联合类型表示值可以是多种类型之一：

```idl
void someMethod((sequence<String> or String or number) value);
```

### 3.5 record

`record<K, V>` 表示键值映射：

```idl
void someMethod(record<String, boolean> flags);
```

## 4. 声明

### 4.1 枚举

IDL 使用 `dictionary` 语法声明整数或字符串枚举。同一个枚举中不要混用整数项和字符串项。

```idl
dictionary Origin {
    number local = 0;
    number remote = 1;
};
```

### 4.2 常量

常量声明支持布尔、数值和字符串字面量。常量不是类型。

```idl
const String MIMETYPE_TEXT_PLAIN = "text/plain";
const number three = 3;
```

### 4.3 函数

函数声明包含返回类型、函数名和参数列表：

```idl
void foo();
async number bar(String param1, optional boolean param2);
```

同名函数可以形成重载集合，按参数签名区分：

```idl
number bar(String param1);
number bar(String param1, boolean param2);
number bar(String param1, i32 param2);
```

### 4.4 回调

`callback` 声明命名的可调用类型。回调可以作为属性类型、方法参数或函数参数使用。

```idl
callback Foo = number (number param1, optional String param2);

interface I1 {
    attribute Foo foo;
}

void setReactor(Foo foo);
```

回调签名不能使用 `async`。

### 4.5 接口

接口可以包含继承、属性、方法、构造函数和常量。

```idl
interface File {
    attribute String name;
    attribute u32 size;
    [Optional]
    attribute String lastError;

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

接口是类型。接口值是连接到具体实现对象的标识符，可以作为属性保存、作为参数传递，
或从函数 / 方法返回。

构造函数有以下隐式规则：

- 返回类型始终是当前接口实例。
- 名称始终为 `constructor`。
- 构造函数始终是静态语义，即使没有显式写出 `static`。

## 5. 扩展属性

扩展属性为声明补充生成器元数据。常见扩展属性如下：

| 扩展属性 | 说明 |
|---|---|
| `[Component]` | 标记 ArkUI 组件接口。 |
| `[ComponentInterface]` | 标记组件属性 setter 接口。 |
| `[Entity=Class]` | 指定接口按类形态生成。 |
| `[Entity=Interface]` | 指定接口按接口形态生成。 |
| `[Optional]` | 标记属性可省略。 |
| `[Deprecated]` | 标记声明已弃用。 |
| `[Throws]` | 标记方法可能抛出异常。 |
| `[Accessor=Getter]` / `[Accessor=Setter]` | 标记属性访问器方向。 |
| `[Documentation="..."]` | 携带原始文档注释或内联文档。 |

示例：

```idl
[Documentation="/** Input method subtype */"]
interface InputMethodSubtype {
}
```

## 6. version

`version` 指令用于给根命名空间或嵌套命名空间标记版本：

```idl
namespace ns {
    version 1.2.3-dev456;
};
```
