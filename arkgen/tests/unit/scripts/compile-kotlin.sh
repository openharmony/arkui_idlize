#!/bin/bash
set -e
shopt -s globstar

build_type=$1
external_dir=../../../external
generated_dir=generated

cinterop \
    -def $generated_dir/sig/arkoala-arkts/framework/native/src/generated/interop.def \
    -pkg koalaui.arkoala \
    -compiler-option -I$generated_dir/sig/arkoala-arkts/framework/native/src/generated \
    -compiler-option -I$external_dir/interop/src/cpp \
    -o $generated_dir/bin/idlize_cinterop

konanc \
    $generated_dir/sig/arkoala-kotlin/framework/src/*.kt \
    $generated_dir/modules/global/generated/kotlin/*.kt \
    -l $generated_dir/bin/idlize_cinterop.klib \
    -l $external_dir/interop/build/kotlin-interop/interop.klib \
    -l $external_dir/interop/build/kotlin-interop/cinterop.interop_native_module.klib \
    -linker-options "-L./../../native -lNativeBridgeKotlin" \
    -p program -entry main -o $generated_dir/bin/idlize_test
