#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
UNIT_TESTS_ROOT="$SCRIPT_DIR/.."

external_dir=${UNIT_TESTS_ROOT}/../../../external
LD_LIBRARY_PATH=$UNIT_TESTS_ROOT/build/node:$external_dir/interop/build:$LD_LIBRARY_PATH \
    node $UNIT_TESTS_ROOT/build/node/index.js
