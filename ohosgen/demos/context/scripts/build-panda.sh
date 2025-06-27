#!/bin/bash
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
