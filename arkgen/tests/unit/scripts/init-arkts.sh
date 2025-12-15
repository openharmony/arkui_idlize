#!/bin/bash

set -e
set -x

pwd

ARKGEN_DIR=../..
EXTERNAL_DIR=$ARKGEN_DIR/external-subset
GENERATED_DIR=$ARKGEN_DIR/out/unit-arkts/generated

mkdir -p $EXTERNAL_DIR
cp -r ./setup/arkts/sig/* $EXTERNAL_DIR

mkdir -p $GENERATED_DIR/idl
cp -r ./idl/* $GENERATED_DIR/idl

cp -r ./setup/arkts/modules $GENERATED_DIR
