#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

node_modules_dir=../../../node_modules

LD_LIBRARY_PATH=build/panda:$node_modules_dir/@koalaui/interop/build:$LD_LIBRARY_PATH \
    npx smart-arkts run
