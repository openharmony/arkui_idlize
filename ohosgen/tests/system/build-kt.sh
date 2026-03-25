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

cur_test_case=$1
CUR_TEST_CASE=${cur_test_case^^} # uppercase
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$SCRIPT_DIR/$cur_test_case"
EXTERNAL_DIR="../../../external/koala_projects"
OUT_DIR="$TARGET_DIR/build/kt"

atomic_version=`npm pkg get -C $EXTERNAL_DIR/interop/ config.kotlin_atomic_version`
coroutines_version=`npm pkg get -C $EXTERNAL_DIR/interop/ config.kotlin_coroutines_version`

cinterop -def $TARGET_DIR/generated/native/cinterop.def \
    -pkg $cur_test_case.INTERNAL \
    -compiler-option -I$TARGET_DIR/generated/native \
    -compiler-option -I$EXTERNAL_DIR/interop/src/cpp/kotlin \
    -o $OUT_DIR/cinterop

konanc $TARGET_DIR/generated/kotlin/*.kt \
    $TARGET_DIR/src/kt/*.kt \
    -l $OUT_DIR/cinterop.klib \
    -l $EXTERNAL_DIR/interop/build/kotlin-interop/interop.klib \
    -l $EXTERNAL_DIR/interop/build/kotlin-interop/cinterop.interop_native_module.klib \
    -l $EXTERNAL_DIR/interop/build/kotlin-interop/kotlinx-coroutines-core-linuxx64-"${coroutines_version//\"}".klib \
    -l $EXTERNAL_DIR/interop/build/kotlin-interop/atomicfu-linuxx64-"${atomic_version//\"}".klib \
    -linker-options "-L$OUT_DIR -l${CUR_TEST_CASE}NativeModule" \
    -linker-options "-L$EXTERNAL_DIR/interop/build -lInteropNativeModule" \
    -Xnested-type-aliases \
    -g -p program -entry main -o $OUT_DIR/app
