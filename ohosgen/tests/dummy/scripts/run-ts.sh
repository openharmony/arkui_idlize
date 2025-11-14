#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
external_dir=${SCRIPT_DIR}/../../../../external
LD_LIBRARY_PATH=${SCRIPT_DIR}/../build/node:$external_dir/interop/build:$LD_LIBRARY_PATH \
    node ${SCRIPT_DIR}/../build/node/index.js
