#!/bin/bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

node_modules_dir=../../../node_modules

LD_LIBRARY_PATH=build/node:$node_modules_dir/@koalaui/interop/build:$LD_LIBRARY_PATH \
    node build/node/src/node/main.js
