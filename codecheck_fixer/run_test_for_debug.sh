#!/bin/bash
set -e

rm -rf out
npm run build
/bin/bash run.sh line-length -c tests/test_for_debug.json --fix --output out/fixed --verbose

scripts/check_long_lines.sh -x ets\
    -p "tests/fixtures/test_for_debug.ets"\
    -p "tests/fixtures/ListModifier.ets"\
    -p "tests/fixtures/lazyGridLayout.ets"\
    -p "tests/fixtures/select.ets"\
    -p "tests/fixtures/persistenceV2.ts"\
    -p "tests/fixtures/observeWrappedArray.ts"\
    -p "tests/fixtures/navigation.ets"\
    -p "tests/fixtures/radio.ets"\
    -p "tests/fixtures/richEditor.ets"\
    -p "tests/fixtures/CallbackDeserializeCall.ets"\
    -o out/fixed/debug_before_fix.csv

scripts/check_long_lines.sh -x ets -p out/fixed -o out/fixed/debug_after_fix.csv
