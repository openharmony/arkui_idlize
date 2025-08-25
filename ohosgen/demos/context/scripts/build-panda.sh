#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

external_dir=$(pwd)/../../../external
arkts_dir=$external_dir/incremental/tools/panda/arkts
out_dir=build/panda

function build_lib {
    mkdir -p $1/$out_dir/out
    npx fast-arktsc --compiler $arkts_dir/ui2abc --link-name $out_dir/out/$1.abc --config $1/arktsconfig.json --simultaneous
    ninja -C $1/$out_dir/out
}

build_lib application
build_lib bundleManager
build_lib launcher

mkdir -p $out_dir/out
$arkts_dir/arklink --output $out_dir/app.abc -- \
    $out_dir/out/application.abc           \
    $out_dir/out/bundleManager.abc         \
    $out_dir/out/launcher.abc
