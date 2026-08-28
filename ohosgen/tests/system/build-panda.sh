#!/bin/bash
set -e
shopt -s globstar # to make **/*.abc recursive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="$SCRIPT_DIR/$1"

npx smart-arkts build "${TARGET_DIR}:main"
