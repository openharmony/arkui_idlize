#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
external_dir=$SCRIPT_DIR/../../../external
arkts_dir=$external_dir/incremental/tools/panda/arkts
out_dir=$SCRIPT_DIR/$1/build/panda

mkdir -p $out_dir/out
npx fast-arktsc --compiler $arkts_dir/ui2abc --link-name $out_dir/app.abc --config $SCRIPT_DIR/$1/arktsconfig.json --simultaneous
ninja -C $out_dir/out
