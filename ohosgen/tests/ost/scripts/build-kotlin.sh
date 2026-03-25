#!/bin/bash
#
# Copyright (c) 2026 Huawei Device Co., Ltd.
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

set -e
shopt -s globstar

external_dir=../../../external/koala_projects
out_dir=build/kotlin

atomic_version=`npm pkg get -C $external_dir/interop/ config.kotlin_atomic_version`
coroutines_version=`npm pkg get -C $external_dir/interop/ config.kotlin_coroutines_version`

cinterop -def ./generated/native/cinterop.def \
    -pkg unit_ost.INTERNAL \
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
    -linker-options "-L$out_dir -lUNIT_OSTNativeModule" \
    -linker-options "-L$external_dir/interop/build -lInteropNativeModule" \
    -p program -entry main -o ./build/kotlin/ost-demo
