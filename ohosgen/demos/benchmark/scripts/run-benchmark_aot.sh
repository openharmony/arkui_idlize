#!/bin/bash

echo $(pwd)

external_dir=../../../external
interop_dir="${external_dir}/interop/src/cpp"
arkts_dir="${external_dir}/incremental/tools/panda/arkts"

cpp_dir="./src/cpp"
sts_dir="./src/ets"
out_dir="./build/ets"


arktsc_bin=${arkts_dir}/arktsc
arklink_bin=${arkts_dir}/arklink
arkdisasm_bin=${arkts_dir}/arkdisasm
es2panda_bin=${external_dir}/incremental/tools/panda/node_modules/@panda/sdk/linux_host_tools/bin/es2panda

aot_bin="${external_dir}/incremental/tools/panda/node_modules/@panda/sdk/linux_host_tools/bin/ark_aot"


rm -rf ./build

set -e
shopt -s globstar
mkdir -p ${out_dir}

echo clang++ -O2 -g -o ${out_dir}/libaniimpl.so -I$external_dir/interop/src/cpp/ani -fPIC --shared -std=c++17 $cpp_dir/ani_impl.cpp
clang++ -O2 -g -o ${out_dir}/libaniimpl.so -I$external_dir/interop/src/cpp/ani -fPIC --shared -std=c++17 $cpp_dir/ani_impl.cpp

echo $arktsc_bin --arktsconfig=./arktsconfig-ani.json --ets-module
$arktsc_bin --arktsconfig=./arktsconfig-ani.json --ets-module

echo $arklink_bin --output ${out_dir}/app.abc -- $out_dir/out/**/*.abc
$arklink_bin --output ${out_dir}/app.abc -- $out_dir/out/**/*.abc
echo $arkdisasm_bin $out_dir/app.abc
$arkdisasm_bin $out_dir/app.abc


bootfiles=$external_dir/incremental/runtime/build/incremental.abc:$external_dir/interop/build/interop.abc
echo $aot_bin --boot-panda-files=$bootfiles:${external_dir}/incremental/tools/panda/node_modules/@panda/sdk/ets/etsstdlib.abc --paoc-panda-files $out_dir/app.abc --paoc-output $out_dir/app.an --load-runtimes=ets --paoc-use-cha=true --compiler-emit-debug-info --paoc-generate-symbols
$aot_bin --boot-panda-files=${external_dir}/incremental/tools/panda/node_modules/@panda/sdk/ets/etsstdlib.abc:$bootfiles --paoc-panda-files $out_dir/app.abc --paoc-output $out_dir/app.an --load-runtimes=ets --paoc-use-cha=true --compiler-emit-debug-info --paoc-generate-symbols

echo LD_LIBRARY_PATH=$out_dir $arkts_dir/ark $out_dir/app.abc --ark-boot-files $bootfiles --ark-entry-point ffi_benchmark_ani.ani_main.ETSGLOBAL::main
LD_LIBRARY_PATH=$out_dir $arkts_dir/ark --enable-an --aot-files=$out_dir/app.an $out_dir/app.abc --ark-boot-files $bootfiles --ark-entry-point ffi_benchmark_ani.ani_main.ETSGLOBAL::main
