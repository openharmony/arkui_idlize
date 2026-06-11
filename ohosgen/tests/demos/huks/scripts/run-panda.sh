#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

LD_LIBRARY_PATH=$SCRIPT_DIR/../build/panda:$LD_LIBRARY_PATH npx smart-arkts run