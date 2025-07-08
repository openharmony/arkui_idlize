#!/bin/bash
set -e
shopt -s globstar

external_dir=../../../external
out_dir=build/kotlin

mkdir -p $out_dir/out
mkdir -p $out_dir/out/bin
konanc ./generated/kotlin/*.kt -l $external_dir/interop/build/kotlin-interop/interop.klib -l $external_dir/interop/build/kotlin-interop/cinterop.interop_native_module.klib -p program -entry idlize.main -o ./build/kotlin/out/bin
