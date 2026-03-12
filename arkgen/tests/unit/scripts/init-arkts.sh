#!/bin/bash

set -e
set -x

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
GENERATED_DIR="${SCRIPT_DIR}/../generated"
SETUP_DIR="${SCRIPT_DIR}/../setup/arkts"

mkdir -p $GENERATED_DIR
cp -r "${SETUP_DIR}/sig" "$GENERATED_DIR"
cp -r "${SETUP_DIR}/libace" "$GENERATED_DIR"
cp -r "${SETUP_DIR}/modules" "$GENERATED_DIR"
