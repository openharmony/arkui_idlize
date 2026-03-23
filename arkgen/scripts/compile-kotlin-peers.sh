#!/bin/bash

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

build_type=peers
external_dir=../external/koala_projects
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
    -Xnested-type-aliases \
    -p program -entry main -o $out_dir/bin/idlize_test > /home/mihan/work/errors.txt 2>&1
