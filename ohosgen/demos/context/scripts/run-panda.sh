#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

node_modules_dir=../../../node_modules

LD_LIBRARY_PATH=$node_modules_dir/@koalaui/interop/build:./build/panda:$LD_LIBRARY_PATH \
    npx smart-arkts run
