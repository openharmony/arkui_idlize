#!/bin/bash
set -e
shopt -s globstar

cur_test_case=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$SCRIPT_DIR/$cur_test_case"

LD_LIBRARY_PATH="$TARGET_DIR/build/kt:../../../external/koala_projects/interop/build" $TARGET_DIR/build/kt/app.kexe
