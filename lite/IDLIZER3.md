# IDLIZER3

The generation framework.

## Synopsis

```
idlizer3/
 |-- test/
 |-- engine/
 |    |-- lang/   <- @idlizer/lang
 |    |-- ost/    <- @idlizer/ost
 |    |-- kit/    <- @idlizer/kit
 |    `-- config/ <- @idlizer/config
 |-- tools/
 |    |-- formatter/   <- @idlizer/format
 |    |-- linter/      <- @idlizer/linter
 |    `-- lang-server/ <- @idlizer/lang-server
 |-- convertors/
 |    |-- etsgen/  <- @idlizer/etsgen
 |    |-- dtsgen/  <- @idlizer/dtsgen
 |    `-- hppgen/  <- who knows
 `-- generator/
         |-- cli/
         `-- flavours/
               |-- vanilla/         <- npx @idlizer/lite
               |-- arktsx-graphics/ <- npx @idlizer/sk-gen
               |-- panda/           <- npx @idlizer/arkts-gen
               |-- ohos/            <- npx @idlizer/ohos-gen
               `-- arkui/           <- npx @idlizer/ark-gen
```

## Table of content

+ [Engine packages](#idlizerlang)
    + [@idlizer/lang package](#idlizerlang)
    + [@idlizer/ost package](#idlizerost)
    + [@idlizer/kit package](#idlizerkit)
    + [@idlizer/config package](#idlizerconfig)
+ [Applications](#applications)
    + [@idlizer/lite](#idlizerlite)
    + [@idlizer/sk-gen](#idlizersk-gen)
    + [@idlizer/arkts-gen](#idlizerark-gen)
    + [@idlizer/ohos-gen](#idlizerohos-gen)
    + [@idlizer/ark-gen](#idlizerark-gen)
+ [Test](#test)

## Packages

### @idlizer/lang

Home for IDL language. Contains language representation, parser, printer. Tools to work with the language.

### @idlizer/ost

Home for OST language. This is special language that can not be interpreted immediately. Instead it is can be translated to one of the supported languages (ArkTS, TS, Kotlin, Canjie, Java) and then be executed.

Includes DSL (maybe two) to easily build a language tree from TypeScript code, translators, transformers (maybe optimizers and analyzers).

The main purpose of the library is to guarantee production of correct code into target language. Also can be augmented with optimizers and beautifiers to produce style-correct and language-specific-optimized code.

### @idlizer/kit

This is a toolkit to make general-purpose generator using @idlizer/code + @idlizer/ost. The library contains framework that enforces best practices in code generation using IDL.

### @idlizer/config

The utility library to create configuration for an application. Can be extended, to support CLI arguments in a general way, and to report better error to user.

---

### Applications

Generator package could be a single code base, that could be bundled different for different generators. Another option is to make common cli package and different projects for each generator.

All application use common cli module, which provide convenient and consistent interface to make CLI applications. It is ensures good quality of UX and provide a toolkit to free a developer from writing boilerplate.

### @idlizer/lite

The general purpose, based on common sense, bridge generator. Should be suitable for "just generate bridge to random C library". The main purpose is to prevent @idlizer/kit library from overspecialization on other, more ohos based generators.

### @idlizer/sk-gen

Generator with limited IDL types support. Used to generate bindings to arktsx.graphics.

### @idlizer/arkts-gen

Generator that produces TS bindings for @panda/sdk.

### @idlizer/ohos-gen

Generator to produces bridges and CAPI header/template files for ohos api. Should support interfaces, materialized classes, callbacks ets. This is almost end to end solution to create a managed-language library from SDK.

### @idlizer/ark-gen

Extension to ohos-gen. It should generate UI components/modifiers/peers for arkui library.

### Test

Library of common tools to test generators. Maybe some random data generator or smth + smth to test correctness in a general way.
