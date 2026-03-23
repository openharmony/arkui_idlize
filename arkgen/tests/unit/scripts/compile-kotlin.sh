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

build_type=$1
external_dir=../../../external/koala_projects
generated_dir=generated

cinterop \
    -def $generated_dir/sig/arkoala-arkts/framework/native/src/generated/interop.def \
    -pkg koalaui.arkoala \
    -compiler-option -I$generated_dir/sig/arkoala-arkts/framework/native/src/generated \
    -compiler-option -I$external_dir/interop/src/cpp \
    -o $generated_dir/bin/idlize_cinterop

konanc \
    $generated_dir/sig/arkoala-kotlin/framework/src/**/*.kt \
    $generated_dir/modules/external/generated/kotlin/**/*.kt \
    -l $generated_dir/bin/idlize_cinterop.klib \
    -l $external_dir/interop/build/kotlin-interop/interop.klib \
    -l $external_dir/interop/build/kotlin-interop/cinterop.interop_native_module.klib \
    -linker-options "-L./../../native -lNativeBridgeKotlin" \
    -p program -entry main -o $generated_dir/bin/idlize_test
