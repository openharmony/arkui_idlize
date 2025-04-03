#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

external_dir=../../../external
arkts_dir=$external_dir/incremental/tools/panda/arkts
out_dir=build/panda

bootfiles=$external_dir/incremental/runtime/build/incremental.abc:$external_dir/interop/build/interop.abc

if [-v USE_PERF]; then
    PERF_PARAMS="perf record -g --call-graph dwarf,8192 --event cycles:Pu --aio --sample-cpu"
    echo "PERF_PARAMS=$PERF_PARAMS"
else
    echo "USE_PERF is not set."
    echo "Set the USE_PERF env variable to use perf 'export USE_PERF=true'."
fi

LD_LIBRARY_PATH=$PWD/$out_dir:$external_dir/interop/build:$LD_LIBRARY_PATH \
    $PERF_PARAMS $arkts_dir/ark $out_dir/app.abc --ark-boot-files $bootfiles --ark-entry-point @mediaquery.src.panda.main.ETSGLOBAL::main
