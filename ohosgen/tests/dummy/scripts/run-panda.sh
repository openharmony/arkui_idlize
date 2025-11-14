#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

external_dir="$SCRIPT_DIR/../../../../external"
arkts_dir=$external_dir/incremental/tools/panda/arkts
out_dir="$SCRIPT_DIR/../build/panda"

bootfiles=$external_dir/incremental/runtime/build/incremental.abc:$external_dir/interop/build/interop.abc:$out_dir/app.abc

LD_LIBRARY_PATH=$out_dir:$external_dir/interop/build:$LD_LIBRARY_PATH \
    $arkts_dir/ark $out_dir/app.abc --ark-boot-files $bootfiles --ark-entry-point @dummy.src.panda.main.ETSGLOBAL::main
