#!/bin/bash
set -e

node_modules_dir=../../../../node_modules

LD_LIBRARY_PATH=$(realpath $node_modules_dir/@koalaui/interop/build):$(realpath ./build/panda)${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH} \
    npx smart-arkts run --project launcher
