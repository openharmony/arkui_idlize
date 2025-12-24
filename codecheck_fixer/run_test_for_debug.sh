#!/bin/bash
set -e

rm -rf out
npm run build

# Repository path (current directory)
REPO_ROOT="$(pwd)"

# Paths for testing (relative paths from repository root)
TEST_PATHS=(
    "tests/fixtures/test_for_debug.ets"
    "tests/fixtures/ListModifier.ets"
    "tests/fixtures/lazyGridLayout.ets"
    "tests/fixtures/select.ets"
    "tests/fixtures/persistenceV2.ts"
    "tests/fixtures/observeWrappedArray.ts"
    "tests/fixtures/navigation.ets"
    "tests/fixtures/radio.ets"
    "tests/fixtures/richEditor.ets"
    "tests/fixtures/CallbackDeserializeCall.ets"
)

/bin/bash run.sh line-length \
    -c config.json \
    --repo "$REPO_ROOT" \
    --paths "${TEST_PATHS[@]}" \
    --fix \
    --output out/fixed \
    --verbose

# Check long lines before fix
scripts/check_long_lines.sh -x ets \
    -p "tests/fixtures/test_for_debug.ets" \
    -p "tests/fixtures/ListModifier.ets" \
    -p "tests/fixtures/lazyGridLayout.ets" \
    -p "tests/fixtures/select.ets" \
    -p "tests/fixtures/persistenceV2.ts" \
    -p "tests/fixtures/observeWrappedArray.ts" \
    -p "tests/fixtures/navigation.ets" \
    -p "tests/fixtures/radio.ets" \
    -p "tests/fixtures/richEditor.ets" \
    -p "tests/fixtures/CallbackDeserializeCall.ets" \
    -o out/fixed/debug_before_fix.csv

# Check long lines after fix
scripts/check_long_lines.sh -x ets -p out/fixed -o out/fixed/debug_after_fix.csv
