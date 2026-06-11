#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

node_modules_dir=../../../../node_modules

if [-v USE_PERF]; then
    PERF_PARAMS="perf record -g --call-graph dwarf,8192 --event cycles:Pu --aio --sample-cpu"
    echo "PERF_PARAMS=$PERF_PARAMS"
else
    echo "USE_PERF is not set."
    echo "Set the USE_PERF env variable to use perf 'export USE_PERF=true'."
fi

LD_LIBRARY_PATH=build/panda:$node_modules_dir/@koalaui/interop/build:$LD_LIBRARY_PATH \
    $PERF_PARAMS npx smart-arkts run
