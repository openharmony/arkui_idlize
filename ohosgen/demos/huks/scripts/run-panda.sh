#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

external_dir=${SCRIPT_DIR}/../../../../external
arkts_dir=$external_dir/incremental/tools/panda/arkts
out_dir=build/panda

bootfiles=$external_dir/incremental/runtime/build/incremental.abc:$external_dir/interop/build/interop.abc:$out_dir/app.abc

echo "Start Panda with" ${bootfiles}
LD_LIBRARY_PATH=$PWD/$out_dir $arkts_dir/ark --ark-boot-files $bootfiles $out_dir/app.abc --ark-entry-point @huks.src.panda.main.ETSGLOBAL::main
