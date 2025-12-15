#!/bin/bash

set -e
set -x

pwd

GENERATED_DIR=./generated

mkdir -p $GENERATED_DIR
cp -r ./setup/kotlin/sig $GENERATED_DIR
cp -r ./setup/kotlin/modules $GENERATED_DIR
