#!/bin/bash
set -e
shopt -s globstar

build_type=peers
external_dir=../external
out_dir=out/kotlin-$build_type

mkdir -p $out_dir/generated/modules

cinterop -def $out_dir/generated/sig/arkoala-arkts/framework/native/src/generated/interop.def \
    -pkg koalaui.arkoala \
    -compiler-option -I$out_dir/generated/sig/arkoala-arkts/framework/native/src/generated \
    -compiler-option -I$external_dir/interop/src/cpp \
    -o $out_dir/bin/idlize_cinterop

konanc \
    tests/kotlin-$build_type/app/*.kt \
    $out_dir/generated/sig/arkoala-kotlin/external/src/*.kt \
    $out_dir/generated/sig/arkoala-kotlin/framework/src/*.kt \
    $out_dir/generated/sig/arkoala-kotlin/framework/src/handwritten/*.kt \
    $out_dir/generated/modules/global/generated/kotlin/*.kt \
    -l $out_dir/bin/idlize_cinterop.klib \
    -l $external_dir/interop/build/kotlin-interop/interop.klib \
    -l $external_dir/interop/build/kotlin-interop/cinterop.interop_native_module.klib \
    -linker-options "-L./native -lNativeBridgeKotlin" \
    -opt-in=kotlin.time.ExperimentalTime \
    -p program -entry main -o $out_dir/bin/idlize_test > /home/mihan/work/errors.txt 2>&1
