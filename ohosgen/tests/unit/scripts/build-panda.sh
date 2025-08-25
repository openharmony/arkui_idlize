#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

external_dir=../../../external
arkts_dir=$external_dir/incremental/tools/panda/arkts
out_dir=build/panda

mkdir -p $out_dir/out
npx fast-arktsc --compiler $arkts_dir/ui2abc --link-name $out_dir/app.abc --config arktsconfig.json --simultaneous
ninja -C $out_dir/out
