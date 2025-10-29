#!/bin/bash

set -e
set -x

pwd

GENERATED_DIR=./generated

mkdir -p $GENERATED_DIR
cp -r ./setup/arkts/sig $GENERATED_DIR
cp -r ./setup/arkts/libace $GENERATED_DIR
cp -r ./setup/arkts/modules $GENERATED_DIR
