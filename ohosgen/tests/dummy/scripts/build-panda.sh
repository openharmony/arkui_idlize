#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd $SCRIPT_DIR/..
npx smart-arkts compile --simultaneous