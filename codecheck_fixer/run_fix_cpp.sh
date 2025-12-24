#!/bin/bash
set -e

rm -rf out
npm run build

REPO_ROOT="$(pwd)"
CPP_PATHS=(
  "tests/fixtures/input/cpp"
)

# Path to clang-format (if not in PATH)
CLANG_FORMAT_PATH="/data/home/mlobakh/.local/clang.tmp/bin/clang-format"

if [ -f "$CLANG_FORMAT_PATH" ]; then
  echo "Using clang-format: $CLANG_FORMAT_PATH"
  /bin/bash run.sh cpp-format \
    -c config.json \
    --repo "$REPO_ROOT" \
    --cpp "${CPP_PATHS[@]}" \
    --output out/fixed \
    --verbose \
    --clang-format="$CLANG_FORMAT_PATH"
else
  echo "Using clang-format from PATH"
  /bin/bash run.sh cpp-format \
    -c config.json \
    --repo "$REPO_ROOT" \
    --cpp "${CPP_PATHS[@]}" \
    --output out/fixed \
    --verbose
fi

scripts/check_long_lines.sh -x cpp \
    -p "$REPO_ROOT/tests/fixtures/input/cpp" \
    -o out/fixed/long_lines_cpp_before_fix.csv

scripts/check_long_lines.sh -x cpp -p out/fixed -o out/fixed/long_lines_cpp_after_fix.csv
