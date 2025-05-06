#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

external_dir=../../../external
arkts_dir=$external_dir/incremental/tools/panda/arkts
out_dir=build/panda

bootfiles=$external_dir/incremental/runtime/build/incremental.abc:$external_dir/interop/build/interop.abc:$out_dir/app.abc

LD_LIBRARY_PATH=$PWD/$out_dir:$external_dir/interop/build:$LD_LIBRARY_PATH \
    $arkts_dir/ark $out_dir/app.abc --ark-boot-files $bootfiles --ark-entry-point @dummy.src.panda.main.ETSGLOBAL::main
