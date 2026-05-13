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

external_dir=$(pwd)/../../../external
arkts_dir=$external_dir/incremental/tools/panda/arkts
out_dir=build/panda

function build_lib {
    mkdir -p $1/$out_dir/out
    $arkts_dir/arktsc --arktsconfig $1/arktsconfig.json --ets-module
}

build_lib application
build_lib bundleManager
build_lib launcher

mkdir -p $out_dir/out
$arkts_dir/arklink --output $out_dir/app.abc -- \
    application/$out_dir/out/**/*.abc           \
    bundleManager/$out_dir/out/**/*.abc         \
    launcher/$out_dir/out/**/*.abc
