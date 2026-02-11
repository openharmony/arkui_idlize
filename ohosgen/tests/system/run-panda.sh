#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive


cur_test_case=$1

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_MODULES_DIR="$SCRIPT_DIR/../../../node_modules"
TARGET_DIR="$SCRIPT_DIR/$cur_test_case"

cd $SCRIPT_DIR
LD_LIBRARY_PATH=$TARGET_DIR/build/panda:${NODE_MODULES_DIR}/@koalaui/interop/build:$LD_LIBRARY_PATH \
    npx smart-arkts run --entry-file $TARGET_DIR/build/panda/app.abc --entry-point @${cur_test_case//_/-}.src.panda.main.ETSGLOBAL::main --log-level error
