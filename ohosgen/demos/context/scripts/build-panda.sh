#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

out_dir=build/panda

function build_lib {
    mkdir -p $1/$out_dir/out
    npx smart-arkts compile --link-name $out_dir/out/$1.abc --config $1/arktsconfig.json --simultaneous
}

build_lib application
build_lib bundleManager
build_lib launcher

mkdir -p $out_dir/out
npx smart-arkts link --output $out_dir/app.abc -- \
    $out_dir/out/application.abc           \
    $out_dir/out/bundleManager.abc         \
    $out_dir/out/launcher.abc
