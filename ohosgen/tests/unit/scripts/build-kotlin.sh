#!/bin/bash
set -e
shopt -s globstar

external_dir=../../../external
out_dir=build/kotlin

atomic_version=`npm pkg get -C $external_dir/interop/ config.kotlin_atomic_version`
coroutines_version=`npm pkg get -C $external_dir/interop/ config.kotlin_coroutines_version`

cinterop -def ./generated/native/cinterop.def \
    -pkg unit.INTERNAL \
    -compiler-option -Igenerated/native \
    -compiler-option -I$external_dir/interop/src/cpp/kotlin \
    -o $out_dir/idlize_cinterop

konanc ./generated/kotlin/*.kt \
    ./src/kotlin/**/*.kt \
    -l $out_dir/idlize_cinterop.klib \
    -l $external_dir/interop/build/kotlin-interop/interop.klib \
    -l $external_dir/interop/build/kotlin-interop/cinterop.interop_native_module.klib \
    -l $external_dir/interop/build/kotlin-interop/kotlinx-coroutines-core-linuxx64-"${coroutines_version//\"}".klib \
    -l $external_dir/interop/build/kotlin-interop/atomicfu-linuxx64-"${atomic_version//\"}".klib \
    -linker-options "-L$out_dir -lUNITNativeModule" \
    -linker-options "-L$external_dir/interop/build -lInteropNativeModule" \
    -Xnested-type-aliases \
    -p program -entry main -o ./build/kotlin/unit
