#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$SCRIPT_DIR/$1"

npx smart-arkts compile --config $TARGET_DIR/arktsconfig.json --link-name $TARGET_DIR/build/panda/app.abc
