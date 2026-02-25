#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

node_modules_dir="$SCRIPT_DIR/../../../../node_modules"

cd $SCRIPT_DIR/..
LD_LIBRARY_PATH=$SCRIPT_DIR/../build/node:$node_modules_dir/@koalaui/interop/build:$LD_LIBRARY_PATH \
    node ./build/node/index.js
