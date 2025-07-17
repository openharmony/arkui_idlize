#!/bin/bash
set -e
shopt -s globstar

external_dir=../../../external
out_dir=build/kotlin

cinterop -def ./generated/native/cinterop.def \
    -pkg idlize \
    -compiler-option -Igenerated/native \
    -compiler-option -I$external_dir/interop/src/cpp/kotlin \
    -o $out_dir/idlize_cinterop

mkdir -p $out_dir/out
mkdir -p $out_dir/out/bin
konanc ./generated/kotlin/*.kt \
    -l $out_dir/idlize_cinterop.klib \
    -l $external_dir/interop/build/kotlin-interop/interop.klib \
    -l $external_dir/interop/build/kotlin-interop/cinterop.interop_native_module.klib \
    -linker-options "-L$out_dir -lOHOS_XMLNativeModule" \
    -linker-options "-L/usr/lib/x86_64-linux-gnu/ -lexpat -lpthread -lstdc++" \
    -linker-options "-L$external_dir/interop/build -lInteropNativeModule" \
    -p program -entry idlize.main -o ./build/kotlin/out/bin
