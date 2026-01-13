# State of sk-gen

There are some different category of supported types

## Category A

This types can be transferred to native and from native. Can be used as a function parameter type and return type.

+ `i32`, `u32`
+ `f32`
+ `boolean`
+ `String`
+ `pointer`
+ `Object` (translated as KVMObject)
+ Enum types.
+ `PeerClass`. `PeerClass` is an object with implementation in native. Such objects represented in managed part as wrapper for pointer to native instance.
+ `sequence<i32>`, `sequence<f32>`, `sequence<String>` (FIXME: need to be tested properly)

## Category B

`DataClass`'es. These are special types, that can be transferred to native and from native. It can be easily misused, in a way that can lead to performance penalties. So use them carefully.

Every `DataClass` is `Int32Array` or `Float32Array` based.

Interface can be `DataClass` if it follows the rules:
+ The interface fields must be either
    + `i32`, `f32`, `boolean`, enums, `PeerClass` and `Int32Array` based `DataClass`es
    + `f32`, `i32`, `boolean`, enums, `PeerClass` and `Float32Array` based `DataClass`es
+ Mixed (`Int32Array` and `Float32Array` at the same time) based `DataClass`es are not allowed as properties types
+ `DataClass`es should be finite size. Arrays, Strings and recursive type is not supported

Examples
```
[`DataClass`]
interface Point {
    constructor(`i32` x, `i32` y);
}; // ✅ GOOD. This is `Int32Array` based data class.

[`DataClass`]
interface Rect {
    constructor(`f32` x, `f32` y, `f32` w, `f32` h);
}; // ✅ GOOD. This is `Float32Array` based data class.

[`DataClass`]
interface TwoRect {
    constructor(Rect a, Rect b, `boolean` useLeft);
}; // ✅ GOOD: Both Rect is `Float32Array` based. `boolean` is allowed scalar value.

[`DataClass`]
interface RectAndPoint {
    constructor(Rect r, Point p);
}; // ❌ BAD: Rect is `Float32Array` based, Point is `Int32Array` based.

[`DataClass`]
interface StringPair {
    constructor(String a, String b);
}; // ❌ BAD: String is not supported.

```

## Other

+ `optional` has limited support. It works with `PeerClass` or `DataClass`. Other types, such as `union`, `Record`, `Promise` ets. is not supported.
+ `number` is not supported.
+ `getFinalizer` method is generated and will collide if one explicitly defined.
+ for `attribute type smth;` will be generated `setSmth` and `getSmth` method. So it will collide if `setSmth` already declares explicitly.
