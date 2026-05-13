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
shopt -s globstar # to make **/*.abc recursive
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

external_dir=${SCRIPT_DIR}/../../../../external
arkts_dir=$external_dir/incremental/tools/panda/arkts
out_dir=build/panda

bootfiles=$external_dir/incremental/runtime/build/incremental.abc:$external_dir/interop/build/interop.abc:$out_dir/app.abc

echo "Start Panda with" ${bootfiles}
LD_LIBRARY_PATH=$PWD/$out_dir $arkts_dir/ark --ark-boot-files $bootfiles $out_dir/app.abc --ark-entry-point @huks.src.panda.main.ETSGLOBAL::main
