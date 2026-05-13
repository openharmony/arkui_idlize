#!/bin/bash

# Copyright (c) 2024-2025 Huawei Device Co., Ltd.
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

external_dir=../../../external
out_dir=build/kotlin

npm run build:framework -C ../../../external/arkoala-kotlin/framework

cinterop -def ./generated/native/cinterop.def \
    -pkg idlize \
    -compiler-option -Igenerated/native \
    -compiler-option -I$external_dir/interop/src/cpp/kotlin \
    -o $out_dir/idlize_cinterop

konanc ./generated/kotlin/*.kt \
    $external_dir/arkoala-kotlin/framework/kotlin/src/VMLoaderWrapper.kt \
    -l $out_dir/idlize_cinterop.klib \
    -l $external_dir/interop/build/kotlin-interop/interop.klib \
    -l $external_dir/interop/build/kotlin-interop/cinterop.interop_native_module.klib \
    -l $external_dir/arkoala-kotlin/framework/build/arkoala.klib \
    -linker-options "-L$out_dir -lOHOS_XMLNativeModule" \
    -linker-options "-L$external_dir/interop/build -lInteropNativeModule" \
    -p dynamic -o ./build/kotlin/kotlin_koala

npm run build:loader -C ../../../external/arkoala-kotlin/framework
